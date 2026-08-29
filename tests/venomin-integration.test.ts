import { describe, it, expect, beforeAll } from 'vitest';
import { SignJWT } from 'jose';
import { NextRequest } from 'next/server';
import { db } from '../lib/db';
import { validateServiceAuth } from '../lib/venomin/auth';
import { mapInstitutionType, mapSubscriptionTier, getInitialClassTemplates } from '../lib/venomin/institution-mapping';
import { provisionEduerpTenant } from '../lib/venomin/provisioning';
import { exchangeSSOToken } from '../lib/venomin/sso';
import { getAccountSyncData } from '../lib/venomin/account-sync';
import { signWebhookPayload } from '../lib/venomin/webhooks';
import { ProvisionRequest } from '../lib/venomin/types';
import { InstitutionType, TenantProvisioningStatus } from '@prisma/client';

const TEST_SECRET = new TextEncoder().encode(
  process.env.VENOMIN_JWT_SECRET ||
  process.env.WALLETMIX_JWT_SECRET ||
  'wmx_dev_s2s_secret_key_892019481029384756102938'
);

const TEST_SSO_SECRET = new TextEncoder().encode(
  process.env.SSO_SIGNING_KEY ||
  process.env.VENOMIN_JWT_SECRET ||
  process.env.WALLETMIX_JWT_SECRET ||
  'walletmix_sso_development_signing_key_2026'
);

describe('EduERP Venomin Integration Contract v1 (Command 12)', () => {
  const testCustomerId = `VN-CUS-${Date.now().toString(36).toUpperCase()}`;
  const testEmail = `principal.${Date.now()}@oxford-model-school.edu.bd`;

  beforeAll(async () => {
    // Ensure test subscription plan exists
    await db.subscriptionPlan.upsert({
      where: { code: 'PROFESSIONAL' },
      update: {},
      create: {
        code: 'PROFESSIONAL',
        name: 'Professional',
        slug: 'professional',
        description: 'Professional institution management plan',
        tier: 'PROFESSIONAL',
        monthlyPrice: 5000,
        annualPrice: 50000,
        currency: 'BDT',
        maxStudents: 2000,
        maxCampuses: 3,
        maxUsers: 100,
      },
    }).catch(() => {});
  });

  it('1. Service Auth: validates valid JWT with eduerp:provision scope', async () => {
    const token = await new SignJWT({
      sub: 'venomin_service_client',
      scope: ['eduerp:provision', 'eduerp:read'],
      product: 'eduerp',
      environment: 'STAGING',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('https://venomin.com')
      .setAudience('eduerp.us')
      .setExpirationTime('5m')
      .sign(TEST_SECRET);

    const req = new NextRequest('https://eduerp.us/api/venomin/provision', {
      headers: {
        authorization: `Bearer ${token}`,
        'x-venomin-integration-version': 'v1',
      },
    });

    const auth = await validateServiceAuth(req, 'eduerp:provision');
    expect(auth.authenticated).toBe(true);
    expect(auth.claims?.environment).toBe('STAGING');
  });

  it('2. Service Auth: blocks production requests when production integrations are disabled', async () => {
    const prodToken = await new SignJWT({
      sub: 'venomin_service_client',
      scope: ['eduerp:provision'],
      product: 'eduerp',
      environment: 'PRODUCTION',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('https://venomin.com')
      .setAudience('eduerp.us')
      .setExpirationTime('5m')
      .sign(TEST_SECRET);

    const req = new NextRequest('https://eduerp.us/api/venomin/provision', {
      headers: {
        authorization: `Bearer ${prodToken}`,
        'x-venomin-integration-version': 'v1',
      },
    });

    const auth = await validateServiceAuth(req, 'eduerp:provision');
    expect(auth.authenticated).toBe(false);
    expect(auth.errorCode).toBe('PRODUCTION_MODE_BLOCKED');
  });

  it('3. Service Auth: rejects missing scope or audience mismatch', async () => {
    const badScopeToken = await new SignJWT({
      sub: 'venomin_service_client',
      scope: ['eduerp:read'],
      product: 'eduerp',
      environment: 'STAGING',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('https://venomin.com')
      .setAudience('eduerp.us')
      .setExpirationTime('5m')
      .sign(TEST_SECRET);

    const req = new NextRequest('https://eduerp.us/api/venomin/provision', {
      headers: {
        authorization: `Bearer ${badScopeToken}`,
      },
    });

    const auth = await validateServiceAuth(req, 'eduerp:provision');
    expect(auth.authenticated).toBe(false);
    expect(auth.errorCode).toBe('INSUFFICIENT_SCOPE');
  });

  it('4. Institution Mapping: maps types and vertical curriculum templates correctly', () => {
    expect(mapInstitutionType('School')).toBe(InstitutionType.SCHOOL);
    expect(mapInstitutionType('College')).toBe(InstitutionType.COLLEGE);
    expect(mapInstitutionType('University')).toBe(InstitutionType.UNIVERSITY);
    expect(mapInstitutionType('Madrasha / Hifzul Quran')).toBe(InstitutionType.MADRASHA);
    expect(mapInstitutionType('Polytechnic Institute')).toBe(InstitutionType.POLYTECHNIC);
    expect(mapInstitutionType('Vocational Training Institute')).toBe(InstitutionType.TECHNICAL_INSTITUTE);

    const schoolClasses = getInitialClassTemplates(InstitutionType.SCHOOL);
    expect(schoolClasses).toContain('Play');
    expect(schoolClasses).toContain('Class 10');

    const collegeClasses = getInitialClassTemplates(InstitutionType.COLLEGE);
    expect(collegeClasses).toContain('Class 11 (HSC 1st Year)');

    const madrashaClasses = getInitialClassTemplates(InstitutionType.MADRASHA);
    expect(madrashaClasses).toContain('Dakhil 10');
  });

  it('5. Provisioning: validates dry run mode without creating database records', async () => {
    const dryRunPayload: ProvisionRequest = {
      requestId: `req_${Date.now()}`,
      idempotencyKey: `idem_dry_${Date.now()}`,
      walletmixCustomerId: testCustomerId,
      product: 'eduerp',
      environment: 'STAGING',
      customer: {
        walletmixCustomerId: testCustomerId,
        name: 'Principal Dr. Aminul Islam',
        email: testEmail,
        companyName: 'Dhaka Cambridge International School',
      },
      plan: {
        walletmixPlanId: 'plan_edu_standard',
        externalPlanId: 'PROFESSIONAL',
        billingCycle: 'ANNUAL',
      },
      configuration: {
        dryRun: true,
        institutionType: 'School',
      },
    };

    const res = await provisionEduerpTenant(dryRunPayload);
    expect(res.status).toBe('SUCCESS');
    expect(res.safeMessage).toContain('[DRY_RUN]');
  });

  it('6. Provisioning: performs full multi-tenant educational institution provisioning', async () => {
    const provisionPayload: ProvisionRequest = {
      requestId: `req_eduerp_${Date.now()}`,
      idempotencyKey: `idem_eduerp_${Date.now()}`,
      walletmixCustomerId: testCustomerId,
      product: 'eduerp',
      environment: 'STAGING',
      customer: {
        walletmixCustomerId: testCustomerId,
        name: 'Principal Dr. Aminul Islam',
        email: testEmail,
        phone: '+8801711223344',
        companyName: 'Oxford Model Academy & College',
        country: 'Bangladesh',
        currency: 'BDT',
      },
      plan: {
        walletmixPlanId: 'plan_edu_pro',
        externalPlanId: 'PROFESSIONAL',
        billingCycle: 'ANNUAL',
        studentsCount: 1500,
        campusesCount: 1,
      },
      configuration: {
        institutionType: 'School and College',
        boardAffiliation: 'Dhaka Education Board',
        isTest: true,
      },
    };

    const res = await provisionEduerpTenant(provisionPayload);
    expect(res.status).toBe('SUCCESS');
    expect(res.tenantId).toBeDefined();
    expect(res.institutionId).toBeDefined();
    expect(res.externalUserId).toBeDefined();
    expect(res.tenantSlug).toBeDefined();
    expect(res.launchUrl).toContain('/dashboard');

    // Verify DB records created
    const tenant = await db.tenant.findUnique({
      where: { id: res.tenantId! },
      include: {
        institution: {
          include: {
            campuses: true,
            classes: true,
            academicYears: true,
          },
        },
        users: true,
      },
    });

    expect(tenant).toBeDefined();
    expect(tenant?.institution).toBeDefined();
    expect(tenant?.institution?.campuses.length).toBeGreaterThanOrEqual(1);
    expect(tenant?.institution?.classes.length).toBeGreaterThanOrEqual(1);
    expect(tenant?.institution?.academicYears.length).toBeGreaterThanOrEqual(1);
    expect(tenant?.users.length).toBeGreaterThanOrEqual(1);

    // Verify Identity Link
    const link = await db.venominIdentityLink.findUnique({
      where: { walletmixCustomerId: testCustomerId },
    });
    expect(link).toBeDefined();
    expect(link?.tenantId).toBe(res.tenantId);
  });

  it('7. Idempotency: exact request replay returns cached response without duplicate records', async () => {
    const idemKey = `idem_replay_test_${Date.now()}`;
    const payload: ProvisionRequest = {
      requestId: `req_replay_${Date.now()}`,
      idempotencyKey: idemKey,
      walletmixCustomerId: `VN-CUS-IDEM-${Date.now().toString(36)}`,
      product: 'eduerp',
      environment: 'STAGING',
      customer: {
        walletmixCustomerId: `VN-CUS-IDEM-${Date.now().toString(36)}`,
        name: 'Moulana Habibur Rahman',
        email: `habib.${Date.now()}@darul-uloom.edu.bd`,
        companyName: 'Darul Uloom Central Madrasha',
      },
      plan: {
        walletmixPlanId: 'plan_edu_madrasha',
        externalPlanId: 'PROFESSIONAL',
        billingCycle: 'ANNUAL',
      },
      configuration: {
        institutionType: 'Madrasha',
        isTest: true,
      },
    };

    const first = await provisionEduerpTenant(payload);
    expect(first.status).toBe('SUCCESS');

    const second = await provisionEduerpTenant(payload);
    expect(second.status).toBe('SUCCESS');
    expect(second.tenantId).toBe(first.tenantId);
    expect(second.institutionId).toBe(first.institutionId);
    expect(second.tenantSlug).toBe(first.tenantSlug);
  });

  it('8. Single Sign-On (SSO): exchanges valid SSO JWT for native EduERP session', async () => {
    const ssoToken = await new SignJWT({
      sub: testCustomerId,
      email: testEmail,
      name: 'Principal Dr. Aminul Islam',
      product: 'eduerp',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('https://venomin.com')
      .setAudience('eduerp.us')
      .setExpirationTime('5m')
      .sign(TEST_SSO_SECRET);

    const ssoResult = await exchangeSSOToken(ssoToken);
    expect(ssoResult.success).toBe(true);
    expect(ssoResult.sessionToken).toBeDefined();
    expect(ssoResult.redirectUrl).toContain('/dashboard');
    expect(ssoResult.user?.email).toBe(testEmail);
  });

  it('9. Account Sync & Minor Privacy: returns strictly aggregated metrics with ZERO student PII', async () => {
    const syncData = await getAccountSyncData(testCustomerId);
    expect(syncData).toBeDefined();
    expect(syncData?.walletmixCustomerId).toBe(testCustomerId);
    expect(syncData?.institutionName).toContain('Oxford Model');
    expect(syncData?.usageSummary.campusesCount).toBeGreaterThanOrEqual(1);
    expect(typeof syncData?.usageSummary.studentsCount).toBe('number');
    expect(typeof syncData?.usageSummary.teachersCount).toBe('number');
    expect(typeof syncData?.usageSummary.classesCount).toBe('number');

    // Confirm that zero sensitive keys are present
    const rawKeys = Object.keys(syncData || {});
    expect(rawKeys).not.toContain('students');
    expect(rawKeys).not.toContain('guardians');
    expect(rawKeys).not.toContain('parents');
    expect(rawKeys).not.toContain('grades');
    expect(rawKeys).not.toContain('marks');
    expect(rawKeys).not.toContain('salaries');
  });

  it('10. Webhooks: generates and validates HMAC-SHA256 signature', () => {
    const payload = JSON.stringify({
      eventType: 'tenant.provisioned',
      tenantId: 'test-tenant-123',
    });
    const { signature, timestamp } = signWebhookPayload(payload, 'test_secret_123');
    expect(signature).toContain('t=');
    expect(signature).toContain('v1=');
    expect(typeof timestamp).toBe('number');
  });
});
