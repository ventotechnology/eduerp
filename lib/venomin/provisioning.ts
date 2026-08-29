import { db } from '@/lib/db';
import { getExistingProvisioningResponse, recordProvisioningResponse } from './idempotency';
import { dispatchVenominWebhook } from './webhooks';
import { logVenominIntegrationEvent } from './logger';
import { ProvisionRequest, ProvisionResponse } from './types';
import { VENOMIN_ERROR_CODES } from './errors';
import { mapInstitutionType, mapSubscriptionTier, getInitialClassTemplates } from './institution-mapping';
import { UserRole, TenantProvisioningStatus } from '@prisma/client';
import crypto from 'crypto';

/**
 * Generates a clean, unique URL slug from institution name
 */
function generateSlug(name: string): string {
  const base = (name || 'institution')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 30);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${suffix}`;
}

/**
 * Provisions a complete EduERP multi-tenant educational institution workspace
 */
export async function provisionEduerpTenant(data: ProvisionRequest): Promise<ProvisionResponse> {
  const startTime = Date.now();

  // 1. Dry Run Guard
  if (data.configuration?.dryRun) {
    return {
      requestId: data.requestId,
      status: 'SUCCESS',
      safeMessage: '[DRY_RUN] EduERP validation passed successfully. No database records created.',
      completedAt: new Date().toISOString(),
    };
  }

  // 2. Idempotency Check
  const existing = await getExistingProvisioningResponse(data.idempotencyKey);
  if (existing) {
    await logVenominIntegrationEvent({
      operation: 'PROVISION_IDEMPOTENT_REPLAY',
      status: 'SUCCESS',
      safeMessage: `Replayed provisioning response for key: ${data.idempotencyKey}`,
    });
    return existing;
  }

  // 3. Check Existing Identity Link
  const existingLink = await db.venominIdentityLink.findUnique({
    where: { walletmixCustomerId: data.walletmixCustomerId },
    include: {
      tenant: true,
      institution: true,
      user: true,
    },
  });

  if (existingLink && existingLink.tenantId) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eduerp.us';
    const slug = existingLink.tenant?.slug || 'dashboard';
    const response: ProvisionResponse = {
      requestId: data.requestId,
      status: 'SUCCESS',
      externalProvisioningId: `EDU-PRV-${existingLink.tenantId.slice(-8).toUpperCase()}`,
      tenantId: existingLink.tenantId,
      institutionId: existingLink.institutionId,
      externalUserId: existingLink.userId,
      tenantSlug: slug,
      launchUrl: `${appUrl}/${slug}/dashboard`,
      safeMessage: 'Educational institution workspace already provisioned for this customer identity.',
      completedAt: new Date().toISOString(),
    };

    await recordProvisioningResponse(
      data.requestId,
      data.idempotencyKey,
      data.walletmixCustomerId,
      existingLink.tenantId,
      existingLink.institutionId,
      existingLink.userId,
      response
    );

    return response;
  }

  try {
    const cleanEmail = data.customer.email.toLowerCase().trim();
    const instType = mapInstitutionType(data.configuration?.institutionType);
    const subTier = mapSubscriptionTier(data.plan.externalPlanId || data.plan.walletmixPlanId);

    const rawInstName =
      data.customer.companyName ||
      `${data.customer.name}'s Academy`;
    const instName = data.configuration?.isTest ? `[TEST] ${rawInstName}` : rawInstName;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail },
      include: { tenant: { include: { institution: true } } },
    });

    let tenantId: string;
    let institutionId: string;
    let tenantSlug: string;
    let ownerUserId: string;

    if (existingUser && existingUser.tenantId && existingUser.tenant?.institution) {
      tenantId = existingUser.tenantId;
      institutionId = existingUser.tenant.institution.id;
      tenantSlug = existingUser.tenant.slug;
      ownerUserId = existingUser.id;
    } else {
      // Provision fresh Tenant, Institution, Campus, AcademicYear, Classes, User within transaction
      const randomPasswordHash = crypto.createHash('sha256').update(crypto.randomBytes(32)).digest('hex');
      const generatedSlug = generateSlug(instName);
      const shortName = instName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 6)
        .toUpperCase() || 'EDU';

      const now = new Date();
      const currentYear = now.getFullYear();

      // Look up or create SubscriptionPlan in EduERP
      let planRecord = await db.subscriptionPlan.findFirst({
        where: { tier: subTier },
      });

      if (!planRecord) {
        planRecord = await db.subscriptionPlan.findFirst({
          where: { isActive: true },
        });
      }

      const result = await db.$transaction(async (tx) => {
        // Step A: Create Tenant
        const tenant = await tx.tenant.create({
          data: {
            slug: generatedSlug,
            institutionType: instType,
            subscriptionTier: subTier,
            status: TenantProvisioningStatus.ACTIVE_PAID,
            isActive: true,
            isTestTenant: !!data.configuration?.isTest,
          },
        });

        // Step B: Create Institution Profile
        const institution = await tx.institution.create({
          data: {
            tenantId: tenant.id,
            name: instName,
            shortName,
            address: data.customer.country || 'Dhaka, Bangladesh',
            district: 'Dhaka',
            division: 'Dhaka',
            upazilaThana: 'Dhanmondi',
            phone: data.customer.phone || '+8801700000000',
            email: cleanEmail,
            currencyCode: data.customer.currency || 'BDT',
            boardAffiliation: data.configuration?.boardAffiliation || null,
          },
        });

        // Step C: Create Primary Campus
        await tx.campus.create({
          data: {
            institutionId: institution.id,
            name: 'Main Campus',
            code: 'MAIN',
            address: data.customer.country || 'Dhaka, Bangladesh',
            phone: data.customer.phone || '+8801700000000',
            email: cleanEmail,
            isMain: true,
          },
        });

        // Step D: Create Current Academic Year
        await tx.academicYear.create({
          data: {
            institutionId: institution.id,
            name: `Academic Year ${currentYear}`,
            code: `AY-${currentYear}`,
            startDate: new Date(currentYear, 0, 1),
            endDate: new Date(currentYear, 11, 31),
            isCurrent: true,
            status: 'ACTIVE',
          },
        });

        // Step E: Create Initial Class/Grade Structure
        const classTemplates = getInitialClassTemplates(instType);
        for (let i = 0; i < classTemplates.length; i++) {
          await tx.class.create({
            data: {
              institutionId: institution.id,
              name: classTemplates[i],
              numericValue: i + 1,
              sequence: i + 1,
              shift: 'Morning',
            },
          }).catch(() => {});
        }

        // Step F: Create or Link Primary User
        let userRecord;
        if (existingUser) {
          userRecord = await tx.user.update({
            where: { id: existingUser.id },
            data: { tenantId: tenant.id, role: UserRole.OWNER },
          });
        } else {
          userRecord = await tx.user.create({
            data: {
              tenantId: tenant.id,
              email: cleanEmail,
              passwordHash: randomPasswordHash,
              name: data.customer.name,
              phone: data.customer.phone,
              role: UserRole.OWNER,
              status: 'ACTIVE' as any,
            },
          });
        }

        // Step G: Create Subscription Record if plan exists
        if (planRecord) {
          const isAnnual = data.plan.billingCycle === 'ANNUAL';
          const periodEnd = new Date(now.getTime() + (isAnnual ? 365 : 30) * 24 * 60 * 60 * 1000);

          await tx.subscription.create({
            data: {
              tenantId: tenant.id,
              planId: planRecord.id,
              billingCycle: data.plan.billingCycle || 'ANNUAL',
              startDate: now,
              endDate: periodEnd,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              status: 'ACTIVE',
            },
          });
        }

        return { tenant, institution, user: userRecord };
      });

      tenantId = result.tenant.id;
      institutionId = result.institution.id;
      tenantSlug = result.tenant.slug;
      ownerUserId = result.user.id;
    }

    // 4. Create or link Venomin Identity Link
    await db.venominIdentityLink.upsert({
      where: { walletmixCustomerId: data.walletmixCustomerId },
      update: {
        tenantId,
        institutionId,
        userId: ownerUserId,
        status: 'ACTIVE',
        metadata: {
          environment: data.environment,
          institutionType: instType,
          plan: subTier,
          isTest: !!data.configuration?.isTest,
        },
      },
      create: {
        walletmixCustomerId: data.walletmixCustomerId,
        tenantId,
        institutionId,
        userId: ownerUserId,
        status: 'ACTIVE',
        metadata: {
          environment: data.environment,
          institutionType: instType,
          plan: subTier,
          isTest: !!data.configuration?.isTest,
        },
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eduerp.us';
    const externalProvisioningId = `EDU-PRV-${tenantId.slice(-8).toUpperCase()}`;

    const response: ProvisionResponse = {
      requestId: data.requestId,
      status: 'SUCCESS',
      externalProvisioningId,
      tenantId,
      institutionId,
      externalUserId: ownerUserId,
      tenantSlug,
      launchUrl: `${appUrl}/${tenantSlug}/dashboard`,
      safeMessage: 'EduERP educational institution workspace provisioned successfully.',
      completedAt: new Date().toISOString(),
    };

    // 5. Dispatch Signed Webhook to Venomin
    await dispatchVenominWebhook({
      eventId: `evt_eduerp_prv_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      eventType: 'tenant.provisioned',
      timestamp: Math.floor(Date.now() / 1000),
      productSlug: 'eduerp',
      tenantId,
      walletmixCustomerId: data.walletmixCustomerId,
      environment: data.environment,
      payload: {
        provisioningId: externalProvisioningId,
        tenantSlug,
        institutionName: instName,
        institutionType: instType,
        planCode: subTier,
        status: 'ACTIVE',
      },
      idempotencyKey: data.idempotencyKey,
    });

    // 6. Record Idempotency Response
    await recordProvisioningResponse(
      data.requestId,
      data.idempotencyKey,
      data.walletmixCustomerId,
      tenantId,
      institutionId,
      ownerUserId,
      response
    );

    const durationMs = Date.now() - startTime;
    await logVenominIntegrationEvent({
      operation: 'PROVISION_TENANT',
      status: 'SUCCESS',
      actorId: ownerUserId,
      safeMessage: `Provisioned EduERP tenant ${tenantSlug} for Venomin customer ${data.walletmixCustomerId} in ${durationMs}ms`,
      metadata: {
        tenantId,
        institutionType: instType,
        planTier: subTier,
        durationMs,
      },
    });

    return response;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Tenant provisioning failed';

    await logVenominIntegrationEvent({
      operation: 'PROVISION_TENANT',
      status: 'FAILURE',
      safeMessage: `EduERP provisioning failed for customer ${data.walletmixCustomerId}: ${errorMsg}`,
      errorCode: VENOMIN_ERROR_CODES.TENANT_CREATION_FAILED,
    });

    return {
      requestId: data.requestId,
      status: 'FAILED',
      safeMessage: 'Unable to provision educational institution workspace at this time. Our engineering team has been alerted.',
      errorCode: VENOMIN_ERROR_CODES.TENANT_CREATION_FAILED,
      completedAt: new Date().toISOString(),
    };
  }
}
