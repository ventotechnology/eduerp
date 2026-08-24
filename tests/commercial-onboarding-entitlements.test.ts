import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../lib/db';
import { SaasPlanService } from '../lib/services/saas-plan.service';
import { SaasSignupService } from '../lib/services/saas-signup.service';
import { SubscriptionEntitlementService } from '../lib/services/subscription-entitlement-service';
import { TenantOnboardingService, ONBOARDING_STEPS } from '../lib/services/tenant-onboarding.service';
import { seedPilotTenant } from '../lib/saas/seed-pilot-tenant';

describe('Command 12 — Commercial Tenant Onboarding & Entitlement Verification Suite', () => {
  beforeAll(async () => {
    await SaasPlanService.seedDefaultPlans();
    await seedPilotTenant();
  });

  describe('1. SaaS Subscription Plans & Database Pricing', () => {
    it('should have all 4 commercial subscription plans in PostgreSQL', async () => {
      const plans = await SaasPlanService.getPublicPlans();
      expect(plans.length).toBeGreaterThanOrEqual(4);

      const starter = plans.find(p => p.code === 'STARTER');
      const standard = plans.find(p => p.code === 'STANDARD');
      const professional = plans.find(p => p.code === 'PROFESSIONAL');
      const enterprise = plans.find(p => p.code === 'ENTERPRISE');

      expect(starter).toBeDefined();
      expect(standard).toBeDefined();
      expect(professional).toBeDefined();
      expect(enterprise).toBeDefined();

      expect(starter?.monthlyPrice).toBeGreaterThan(0);
      expect(professional?.maxStudents).toBeGreaterThan(standard?.maxStudents || 0);
    });
  });

  describe('2. Slug Validation & Reserved Slug Protection', () => {
    it('should reject reserved system slugs', async () => {
      const checkAdmin = await SaasSignupService.validateSlug('admin');
      const checkSuperAdmin = await SaasSignupService.validateSlug('super-admin');
      const checkApi = await SaasSignupService.validateSlug('api');
      const checkLogin = await SaasSignupService.validateSlug('login');

      expect(checkAdmin.valid).toBe(false);
      expect(checkSuperAdmin.valid).toBe(false);
      expect(checkApi.valid).toBe(false);
      expect(checkLogin.valid).toBe(false);
    });

    it('should accept valid and unique slugs', async () => {
      const uniqueSlug = `test-school-${Date.now()}`;
      const result = await SaasSignupService.validateSlug(uniqueSlug);
      expect(result.valid).toBe(true);
      expect(result.slug).toBe(uniqueSlug);
    });
  });

  describe('3. Public Commercial Signup — Free Trial & Paid Flows', () => {
    it('should provision an instant 14-day free trial tenant', async () => {
      const trialSlug = `trial-inst-${Date.now()}`;
      const trialEmail = `principal-${Date.now()}@trial-inst.test`;

      const result = await SaasSignupService.createSignupApplication({
        institutionName: 'Dhaka Pilot Test Academy',
        institutionType: 'SCHOOL',
        contactPerson: 'Principal Test',
        email: trialEmail,
        phone: '+8801700000001',
        address: '10 Gulshan Avenue, Dhaka',
        desiredSlug: trialSlug,
        password: 'SecurePassword123!',
        planIdOrCode: 'STARTER',
        billingCycle: 'TRIAL',
        isTrial: true
      });

      expect(result.success).toBe(true);
      expect(result.isTrial).toBe(true);
      expect(result.tenantSlug).toBe(trialSlug);

      // Verify DB records
      const tenant = await db.tenant.findUnique({
        where: { slug: trialSlug },
        include: {
          institution: true,
          subscriptions: { include: { plan: true } },
          users: true,
          onboardingProgress: true
        }
      });

      expect(tenant).toBeDefined();
      expect(tenant?.status).toBe('ACTIVE_TRIAL');
      expect(tenant?.subscriptions[0].status).toBe('TRIALING');
      expect(tenant?.users.length).toBe(1);
      expect(tenant?.users[0].email).toBe(trialEmail);
      expect(tenant?.onboardingProgress).toBeDefined();
    });

    it('should prevent signup with already registered email', async () => {
      const email = 'owner@pilot-academy.qa';

      await expect(
        SaasSignupService.createSignupApplication({
          institutionName: 'Duplicate Academy',
          institutionType: 'SCHOOL',
          contactPerson: 'Duplicate Contact',
          email,
          phone: '+8801700000002',
          address: 'Dhaka',
          desiredSlug: `dup-slug-${Date.now()}`,
          password: 'SecurePassword123!',
          planIdOrCode: 'STARTER',
          billingCycle: 'MONTHLY'
        })
      ).rejects.toThrow(/already exists/i);
    });
  });

  describe('4. Entitlement Engine & Feature Overrides', () => {
    it('should check plan feature entitlement accurately', async () => {
      const pilot = await db.tenant.findUnique({
        where: { slug: 'pilot-academy-qa' }
      });
      expect(pilot).toBeDefined();

      const hasAttendance = await SubscriptionEntitlementService.hasFeature(pilot!.id, 'ATTENDANCE');
      expect(hasAttendance).toBe(true);
    });

    it('should support granting and removing temporary feature overrides for pilot institutions', async () => {
      const pilot = await db.tenant.findUnique({
        where: { slug: 'pilot-academy-qa' }
      });
      expect(pilot).toBeDefined();

      // Set override for custom AI feature
      await SubscriptionEntitlementService.setFeatureOverride(
        pilot!.id,
        'CUSTOM_AI_REPORTS',
        true,
        new Date(Date.now() + 30 * 86400000),
        'Pilot customer trial bonus',
        'Super Admin'
      );

      const hasOverride = await SubscriptionEntitlementService.hasFeature(pilot!.id, 'CUSTOM_AI_REPORTS');
      expect(hasOverride).toBe(true);

      // Remove override
      await SubscriptionEntitlementService.removeFeatureOverride(pilot!.id, 'CUSTOM_AI_REPORTS', 'Super Admin');
      const hasAfterRemoval = await SubscriptionEntitlementService.hasFeature(pilot!.id, 'CUSTOM_AI_REPORTS');
      expect(hasAfterRemoval).toBe(false);
    });
  });

  describe('5. Downgrade Eligibility Verification', () => {
    it('should validate downgrade eligibility against resource limits', async () => {
      const starterPlan = await db.subscriptionPlan.findFirst({ where: { code: 'STARTER' } });
      const pilot = await db.tenant.findUnique({ where: { slug: 'pilot-academy-qa' } });

      const check = await SubscriptionEntitlementService.checkDowngradeEligibility(pilot!.id, starterPlan!.id);
      expect(check).toBeDefined();
      expect(Array.isArray(check.blockers)).toBe(true);
    });
  });

  describe('6. 14-Step Tenant Onboarding Wizard & Academic Starter Templates', () => {
    it('should define exactly 14 persistent onboarding steps', () => {
      expect(ONBOARDING_STEPS.length).toBe(14);
      expect(ONBOARDING_STEPS[0].key).toBe('INSTITUTION_PROFILE');
      expect(ONBOARDING_STEPS[13].key).toBe('GO_LIVE');
    });

    it('should advance onboarding steps and persist progress', async () => {
      const pilot = await db.tenant.findUnique({ where: { slug: 'pilot-academy-qa' } });
      expect(pilot).toBeDefined();

      await TenantOnboardingService.completeStep(pilot!.id, 2);
      const data = await TenantOnboardingService.getOnboardingProgress(pilot!.id);

      expect(data.progress.completedSteps).toContain(2);
      expect(data.progress.completionPercent).toBeGreaterThan(0);
    });

    it('should apply academic starter template with classes and sections', async () => {
      const testSlug = `template-test-${Date.now()}`;
      const trial = await SaasSignupService.createSignupApplication({
        institutionName: 'Academic Template Test School',
        institutionType: 'SCHOOL',
        contactPerson: 'Principal Template',
        email: `principal-${Date.now()}@template-test.edu`,
        phone: '+8801700000009',
        address: 'Dhanmondi, Dhaka',
        desiredSlug: testSlug,
        password: 'SecurePassword123!',
        planIdOrCode: 'STARTER',
        billingCycle: 'TRIAL',
        isTrial: true
      });

      const tenant = await db.tenant.findUnique({ where: { slug: testSlug } });
      expect(tenant).toBeDefined();

      const result = await TenantOnboardingService.applyAcademicTemplate(tenant!.id, 'BANGLADESH_SCHOOL');
      expect(result.success).toBe(true);

      const classes = await db.class.findMany({
        where: { institution: { tenantId: tenant!.id } },
        include: { sections: true }
      });

      expect(classes.length).toBe(10); // Classes 1 through 10
      expect(classes[0].sections.length).toBeGreaterThanOrEqual(2); // Section A & B
    });
  });
});
