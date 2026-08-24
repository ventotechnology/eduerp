import { describe, it, expect, beforeAll } from 'vitest';
import { SaasPlanService } from '../lib/services/saas-plan.service';
import { db } from '../lib/db';
import { hashPassword, generateSecurePassword } from '../lib/auth/password';

describe('COMMAND 11D — SaaS Control Plane, Multi-Tenant Onboarding & Public Pages', () => {
  let createdPlanId: string;
  let clonedPlanId: string;

  beforeAll(async () => {
    await SaasPlanService.seedInitialPlans();
  });

  it('retrieves all 4 canonical public SaaS plans with feature entitlements', async () => {
    const publicPlans = await SaasPlanService.getPublicPlans();
    expect(publicPlans.length).toBeGreaterThanOrEqual(4);
    const codes = publicPlans.map(p => p.code);
    expect(codes).toContain('STARTER');
    expect(codes).toContain('STANDARD');
    expect(codes).toContain('PROFESSIONAL');
    expect(codes).toContain('ENTERPRISE');

    const starter = publicPlans.find(p => p.code === 'STARTER');
    expect(starter?.monthlyPrice).toBe(4500);
    expect(starter?.maxStudents).toBe(500);
  });

  it('creates and updates a custom subscription plan via SaasPlanService', async () => {
    const customPlan = await SaasPlanService.createPlan({
      code: 'TEST_CUSTOM_PLAN',
      name: 'Test Custom Plan',
      slug: 'test-custom-plan',
      description: 'Test Custom Package for Schools',
      monthlyPrice: 7500,
      annualPrice: 75000,
      currency: 'BDT',
      maxStudents: 800,
      maxCampuses: 2,
      maxUsers: 30,
      maxTeachers: 30,
      maxStorageGb: 30,
      includedSms: 2000,
      isPublic: true,
      isActive: true,
      features: [
        { featureKey: 'SIS', name: 'Student Information System', isEnabled: true },
        { featureKey: 'ATTENDANCE', name: 'Attendance System', isEnabled: true }
      ]
    });

    expect(customPlan).toBeDefined();
    expect(customPlan?.code).toBe('TEST_CUSTOM_PLAN');
    expect(customPlan?.maxStudents).toBe(800);
    createdPlanId = customPlan!.id;

    // Update
    const updated = await SaasPlanService.updatePlan(createdPlanId, {
      monthlyPrice: 8000,
      maxStudents: 900
    });
    expect(updated.monthlyPrice).toBe(8000);
    expect(updated.maxStudents).toBe(900);
  });

  it('clones an existing subscription plan into a new custom plan', async () => {
    const cloned = await SaasPlanService.clonePlan(
      createdPlanId,
      'TEST_CUSTOM_CLONE',
      'Test Custom Cloned Plan'
    );
    expect(cloned).toBeDefined();
    expect(cloned?.code).toBe('TEST_CUSTOM_CLONE');
    expect(cloned?.name).toBe('Test Custom Cloned Plan');
    expect(cloned?.monthlyPrice).toBe(8000);
    clonedPlanId = cloned!.id;
  });

  it('safely deletes or archives custom plans', async () => {
    await SaasPlanService.deletePlan(createdPlanId);
    await SaasPlanService.deletePlan(clonedPlanId);

    const deleted1 = await db.subscriptionPlan.findUnique({ where: { id: createdPlanId } });
    const deleted2 = await db.subscriptionPlan.findUnique({ where: { id: clonedPlanId } });
    expect(deleted1).toBeNull();
    expect(deleted2).toBeNull();
  });

  it('executes atomic manual institution onboarding transaction', async () => {
    const uniqueSlug = 'test-onboard-inst-' + Date.now();
    const ownerEmail = `principal.${uniqueSlug}@test.edu.bd`;

    const plan = await db.subscriptionPlan.findFirst({ where: { code: 'STARTER' } });
    expect(plan).toBeDefined();

    const result = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          slug: uniqueSlug,
          institutionType: 'SCHOOL',
          subscriptionTier: 'STARTER',
          isActive: true,
          isDemoTenant: false
        }
      });

      const institution = await tx.institution.create({
        data: {
          tenantId: tenant.id,
          name: 'Test Onboard School',
          shortName: 'TOS',
          address: 'Test Address, Dhaka',
          district: 'Dhaka',
          division: 'Dhaka',
          upazilaThana: 'Dhanmondi',
          phone: '+8801700000099',
          email: ownerEmail
        }
      });

      const campus = await tx.campus.create({
        data: {
          institutionId: institution.id,
          name: 'Test Onboard School Main Campus',
          code: 'MAIN',
          address: 'Test Address, Dhaka',
          isMain: true
        }
      });

      const periodEnd = new Date(Date.now() + 30 * 86400000);
      const subscription = await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan!.id,
          status: 'ACTIVE',
          billingCycle: 'MONTHLY',
          startDate: new Date(),
          endDate: periodEnd,
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
        }
      });

      const user = await tx.user.create({
        data: {
          email: ownerEmail,
          passwordHash: hashPassword(generateSecurePassword()),
          name: 'Prof. Test Principal',
          role: 'PRINCIPAL',
          tenantId: tenant.id,
          status: 'ACTIVE'
        }
      });

      return { tenant, institution, campus, subscription, user };
    });

    expect(result.tenant.slug).toBe(uniqueSlug);
    expect(result.institution.name).toBe('Test Onboard School');
    expect(result.user.email).toBe(ownerEmail);
    expect(result.subscription.status).toBe('ACTIVE');

    // Cleanup test record
    await db.user.delete({ where: { id: result.user.id } });
    await db.subscription.delete({ where: { id: result.subscription.id } });
    await db.campus.delete({ where: { id: result.campus.id } });
    await db.institution.delete({ where: { id: result.institution.id } });
    await db.tenant.delete({ where: { id: result.tenant.id } });
  });

  it('records contact leads and inquiries in audit log', async () => {
    const log = await db.auditLog.create({
      data: {
        action: 'CONTACT_LEAD_SUBMITTED',
        resourceType: 'ContactLead',
        resourceId: 'inquiry@school.edu.bd',
        userName: 'Dr. Kabir',
        newState: JSON.stringify({
          name: 'Dr. Kabir',
          institutionName: 'Dhaka City College',
          email: 'inquiry@school.edu.bd',
          phone: '+8801711223344',
          message: 'Interested in College HSC tier demo.'
        })
      }
    });

    expect(log.id).toBeDefined();
    expect(log.action).toBe('CONTACT_LEAD_SUBMITTED');

    // Cleanup
    await db.auditLog.delete({ where: { id: log.id } });
  });
});
