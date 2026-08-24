import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db';
import { SaasPlanService } from '@/lib/services/saas-plan.service';
import { SaasSignupService, RESERVED_TENANT_SLUGS } from '@/lib/services/saas-signup.service';
import { SaasCheckoutService } from '@/lib/services/saas-checkout.service';
import { SaasProvisioningService } from '@/lib/services/saas-provisioning.service';
import { SubscriptionEntitlementService } from '@/lib/services/subscription-entitlement-service';
import { BkashPaymentProvider } from '@/lib/payments/providers/bkash-provider';
import { SubscriptionTier, UserRole, InstitutionType } from '@prisma/client';
import crypto from 'crypto';

describe('COMMAND 11 — SaaS Commercial Billing, Signup & bKash Provisioning Engine', () => {
  beforeAll(async () => {
    // Ensure initial plans are seeded
    await SaasPlanService.seedInitialPlans();
  });

  describe('1. SaaS Packages & Database-Driven Pricing', () => {
    it('should return all 4 active public plans from database', async () => {
      const publicPlans = await SaasPlanService.getPublicPlans();
      expect(publicPlans.length).toBeGreaterThanOrEqual(4);

      const codes = publicPlans.map(p => p.code);
      expect(codes).toContain('STARTER');
      expect(codes).toContain('STANDARD');
      expect(codes).toContain('PROFESSIONAL');
      expect(codes).toContain('ENTERPRISE');

      const starter = publicPlans.find(p => p.code === 'STARTER');
      expect(starter).toBeDefined();
      expect(starter?.monthlyPrice).toBe(4500);
      expect(starter?.annualPrice).toBe(45000);
      expect(starter?.maxStudents).toBe(500);
      expect(starter?.features.length).toBeGreaterThan(0);
    });

    it('should allow Super Admin to update a plan and reflect immediately on public pricing', async () => {
      const standard = await db.subscriptionPlan.findUnique({ where: { code: 'STANDARD' } });
      expect(standard).toBeDefined();

      const originalPrice = standard!.monthlyPrice;
      const testUpdatedPrice = 9800;

      await SaasPlanService.updatePlan(standard!.id, {
        monthlyPrice: testUpdatedPrice
      });

      const updatedPublicPlans = await SaasPlanService.getPublicPlans();
      const updatedStandard = updatedPublicPlans.find(p => p.code === 'STANDARD');
      expect(updatedStandard?.monthlyPrice).toBe(testUpdatedPrice);

      // Revert back to canonical baseline
      await SaasPlanService.updatePlan(standard!.id, {
        monthlyPrice: originalPrice
      });
    });
  });

  describe('2. Tenant Slug Validation & Security', () => {
    it('should reject all reserved system routes as tenant slugs', async () => {
      const testReserved = ['admin', 'super-admin', 'login', 'signup', 'pricing', 'api', 'dashboard', 'billing'];
      for (const slug of testReserved) {
        const check = await SaasSignupService.validateSlug(slug);
        expect(check.valid).toBe(false);
        expect(check.message).toContain('reserved');
      }
    });

    it('should reject slugs that are too short, too long, or contain invalid characters', async () => {
      const invalidSlugs = ['ab', 'a'.repeat(51), 'school@dhaka', 'dhaka_school', '-invalid-', 'inv--alid'];
      for (const slug of invalidSlugs) {
        const check = await SaasSignupService.validateSlug(slug);
        expect(check.valid).toBe(false);
      }
    });

    it('should reject existing registered tenant slugs', async () => {
      const check = await SaasSignupService.validateSlug('demo-school');
      expect(check.valid).toBe(false);
      expect(check.message).toContain('already registered');
    });

    it('should accept valid and unique institution slugs', async () => {
      const novelSlug = `test-academy-${Date.now().toString().slice(-6)}`;
      const check = await SaasSignupService.validateSlug(novelSlug);
      expect(check.valid).toBe(true);
      expect(check.slug).toBe(novelSlug);
    });
  });

  describe('3. Commercial Public Signup Application Flow', () => {
    it('should create pending SignupApplication and SubscriptionOrder without activating tenant yet', async () => {
      const novelSlug = `sylhet-model-${Date.now().toString().slice(-6)}`;
      const plan = await db.subscriptionPlan.findUnique({ where: { code: 'STARTER' } });
      expect(plan).toBeDefined();

      const signup = await SaasSignupService.createSignupApplication({
        institutionName: 'Sylhet Model High School',
        institutionType: InstitutionType.SCHOOL,
        contactPerson: 'Principal M. Rahman',
        email: `principal.${novelSlug}@example.com`,
        phone: '01711998877',
        address: 'Zindabazar, Sylhet',
        desiredSlug: novelSlug,
        password: 'Password@123456',
        planIdOrCode: plan!.id,
        billingCycle: 'ANNUAL'
      });

      expect(signup.orderId).toBeDefined();
      expect(signup.desiredSlug).toBe(novelSlug);
      expect(signup.totalAmount).toBe(plan!.annualPrice);

      // Verify DB state: Signup is PENDING_PAYMENT, Tenant does NOT exist yet!
      const dbSignup = await db.signupApplication.findUnique({ where: { id: signup.signupId } });
      expect(dbSignup?.status).toBe('PENDING_PAYMENT');
      expect(dbSignup?.tenantId).toBeNull();

      const nonExistentTenant = await db.tenant.findUnique({ where: { slug: novelSlug } });
      expect(nonExistentTenant).toBeNull();

      const dbOrder = await db.subscriptionOrder.findUnique({ where: { id: signup.orderId } });
      expect(dbOrder?.status).toBe('PENDING');
      expect(dbOrder?.totalAmount).toBe(plan!.annualPrice);
    });
  });

  describe('4. Atomic Tenant Provisioning & Payment Fulfillment', () => {
    it('should atomically fulfill order, create Tenant, Institution, Campus, Owner User, Subscription and Invoice', async () => {
      const testSlug = `dhaka-prep-${Date.now().toString().slice(-6)}`;
      const plan = await db.subscriptionPlan.findUnique({ where: { code: 'PROFESSIONAL' } });

      const signup = await SaasSignupService.createSignupApplication({
        institutionName: 'Dhaka Preparatory College',
        institutionType: InstitutionType.COLLEGE,
        contactPerson: 'Dr. Shahabuddin',
        email: `principal.${testSlug}@example.com`,
        phone: '01811223344',
        address: 'Uttara Sector 7, Dhaka',
        desiredSlug: testSlug,
        password: 'SecurePassword@2026',
        planIdOrCode: plan!.id,
        billingCycle: 'MONTHLY'
      });

      const fakeTrxId = `BKASH-TRX-${Date.now()}`;

      // Fulfill Paid Order
      const fulfillment = await SaasProvisioningService.fulfillPaidOrder(signup.orderId!, {
        gateway: 'BKASH',
        paymentId: `BKASH-PAY-${Date.now()}`,
        trxId: fakeTrxId,
        amount: plan!.monthlyPrice
      });

      expect(fulfillment.success).toBe(true);
      expect(fulfillment.tenantSlug).toBe(testSlug);

      // Verify all database records created atomically:
      // 1. Tenant
      const tenant = await db.tenant.findUnique({
        where: { slug: testSlug },
        include: {
          institution: {
            include: { campuses: true }
          },
          users: true,
          subscriptions: {
            include: { plan: true }
          }
        }
      });

      expect(tenant).toBeDefined();
      expect(tenant?.isActive).toBe(true);
      expect(tenant?.institution?.name).toBe('Dhaka Preparatory College');
      expect(tenant?.institution?.campuses.length).toBeGreaterThanOrEqual(1);

      // 2. Owner User
      const ownerUser = tenant?.users.find(u => u.role === UserRole.OWNER);
      expect(ownerUser).toBeDefined();
      expect(ownerUser?.email).toBe(`principal.${testSlug}@example.com`);

      // 3. Subscription
      const sub = tenant?.subscriptions[0];
      expect(sub).toBeDefined();
      expect(sub?.status).toBe('ACTIVE');
      expect(sub?.billingCycle).toBe('MONTHLY');
      expect(sub?.plan.code).toBe('PROFESSIONAL');

      // 4. Platform SaaS Invoice
      const invoice = await db.subscriptionInvoice.findFirst({
        where: { tenantId: tenant!.id }
      });
      expect(invoice).toBeDefined();
      expect(invoice?.status).toBe('PAID');
      expect(invoice?.paymentMethod).toBe('BKASH');
      expect(invoice?.totalAmount).toBe(plan!.monthlyPrice);

      // 5. Order is FULFILLED
      const updatedOrder = await db.subscriptionOrder.findUnique({ where: { id: signup.orderId } });
      expect(updatedOrder?.status).toBe('FULFILLED');
      expect(updatedOrder?.trxId).toBe(fakeTrxId);
    });

    it('should be idempotent and not re-provision if callback fires multiple times', async () => {
      const testSlug = `ctg-academy-${Date.now().toString().slice(-6)}`;
      const plan = await db.subscriptionPlan.findUnique({ where: { code: 'STANDARD' } });

      const signup = await SaasSignupService.createSignupApplication({
        institutionName: 'Chittagong Academic School',
        institutionType: InstitutionType.SCHOOL,
        contactPerson: 'Nasir Uddin',
        email: `nasir.${testSlug}@example.com`,
        phone: '01911334455',
        address: 'Agrabad, Chattogram',
        desiredSlug: testSlug,
        password: 'Password@123456',
        planIdOrCode: plan!.id,
        billingCycle: 'ANNUAL'
      });

      const fakeTrxId = `BKASH-DUP-${Date.now()}`;

      // First fulfillment
      const first = await SaasProvisioningService.fulfillPaidOrder(signup.orderId!, {
        gateway: 'BKASH',
        paymentId: `BKASH-PID-${Date.now()}`,
        trxId: fakeTrxId,
        amount: plan!.annualPrice
      });
      expect(first.success).toBe(true);

      // Second identical fulfillment (duplicate callback simulation)
      const second = await SaasProvisioningService.fulfillPaidOrder(signup.orderId!, {
        gateway: 'BKASH',
        trxId: fakeTrxId,
        amount: plan!.annualPrice
      });
      expect(second.alreadyFulfilled).toBe(true);
      expect(second.tenantSlug).toBe(testSlug);

      // Check tenant count is 1 (not duplicated)
      const tenantCount = await db.tenant.count({ where: { slug: testSlug } });
      expect(tenantCount).toBe(1);
    });
  });

  describe('5. Plan Entitlement & Limit Enforcement Service', () => {
    it('should check student and campus limits against tenant plan', async () => {
      const demoTenant = await db.tenant.findUnique({ where: { slug: 'demo-school' } });
      expect(demoTenant).toBeDefined();

      const studentLimitCheck = await SubscriptionEntitlementService.checkLimit(demoTenant!.id, 'STUDENTS');
      expect(studentLimitCheck.metric).toBe('STUDENTS');
      expect(studentLimitCheck.maxLimit).toBeGreaterThan(0);

      const campusLimitCheck = await SubscriptionEntitlementService.checkLimit(demoTenant!.id, 'CAMPUSES');
      expect(campusLimitCheck.metric).toBe('CAMPUSES');
      expect(campusLimitCheck.maxLimit).toBeGreaterThan(0);
    });

    it('should check feature flags and entitlements per plan', async () => {
      const enterpriseTenant = await db.tenant.findUnique({ where: { slug: 'demo-university' } });
      expect(enterpriseTenant).toBeDefined();

      const hasCredit = await SubscriptionEntitlementService.hasFeature(enterpriseTenant!.id, 'UNIVERSITY_CREDIT');
      expect(typeof hasCredit).toBe('boolean');
    });
  });

  describe('6. bKash Provider Architecture & Health Check', () => {
    it('should safely test connection without throwing uncaught exceptions', async () => {
      const testResult = await BkashPaymentProvider.testConnection();
      expect(testResult).toBeDefined();
      expect(['CONNECTED', 'AUTHENTICATION_FAILED', 'NOT_CONFIGURED', 'NETWORK_ERROR']).toContain(testResult.status);
    });
  });
});
