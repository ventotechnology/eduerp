import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '../lib/db';
import { SaasCheckoutService } from '../lib/services/saas-checkout.service';
import { SaasProvisioningService } from '../lib/services/saas-provisioning.service';
import { BkashPaymentProvider } from '../lib/payments/providers/bkash-provider';
import { SubscriptionTier } from '@prisma/client';

describe('Command 12A.5E — SaaS Payment & Subscription Lifecycle Suite', () => {
  const testSlug = `test-saas-org-${Date.now()}`;
  let testPlanId: string;

  beforeEach(async () => {
    // Ensure test plan in database
    let plan = await db.subscriptionPlan.findFirst({
      where: { code: 'STARTER' }
    });

    if (!plan) {
      plan = await db.subscriptionPlan.create({
        data: {
          code: 'STARTER',
          name: 'Starter Plan',
          slug: 'starter-plan',
          tier: SubscriptionTier.STARTER,
          description: 'Starter tier for small institutions',
          monthlyPrice: 4500,
          annualPrice: 45000,
          currency: 'BDT',
          maxStudents: 500,
          maxCampuses: 1,
          maxUsers: 25,
          maxTeachers: 25,
          maxStorageGb: 20,
          includedSms: 1000,
          isActive: true,
          isPublic: true
        }
      });
    }

    testPlanId = plan.id;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    // Clean up test data
    const testTenant = await db.tenant.findUnique({ where: { slug: testSlug } });
    if (testTenant) {
      await db.tenant.delete({ where: { id: testTenant.id } });
    }
  });

  it('1. Server-Side Price Authority: independently calculates payable amount from DB', async () => {
    const pricing = await SaasCheckoutService.recalculateOrderPricing({
      planId: testPlanId,
      billingCycle: 'MONTHLY'
    });

    expect(pricing.planId).toBe(testPlanId);
    expect(pricing.basePrice).toBe(4500);
    expect(pricing.totalAmount).toBe(4500);
    expect(pricing.currency).toBe('BDT');

    const annualPricing = await SaasCheckoutService.recalculateOrderPricing({
      planId: testPlanId,
      billingCycle: 'ANNUAL'
    });

    expect(annualPricing.basePrice).toBe(45000);
    expect(annualPricing.totalAmount).toBe(45000);
  });

  it('2. Checkout Initiation: creates order, checkoutSessionId, and initial attempt record', async () => {
    const signupApp = await db.signupApplication.create({
      data: {
        institutionName: 'Greenwood International',
        institutionType: 'SCHOOL',
        contactPerson: 'Director Rahman',
        email: `greenwood-${Date.now()}@eduerp.us`,
        phone: '01711000001',
        address: 'Dhanmondi, Dhaka',
        desiredSlug: testSlug,
        passwordHash: 'hash-xyz',
        planId: testPlanId,
        billingCycle: 'MONTHLY',
        amount: 4500,
        currency: 'BDT',
        status: 'PENDING_PAYMENT',
        expiresAt: new Date(Date.now() + 86400000)
      }
    });

    const order = await db.subscriptionOrder.create({
      data: {
        orderNumber: `EDU-ORD-${Date.now()}`,
        signupId: signupApp.id,
        planId: testPlanId,
        billingCycle: 'MONTHLY',
        subtotal: 4500,
        discount: 0,
        taxAmount: 0,
        totalAmount: 4500,
        currency: 'BDT',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000)
      }
    });

    // Mock bKash createPayment
    vi.spyOn(BkashPaymentProvider, 'createPayment').mockResolvedValueOnce({
      success: true,
      paymentId: 'BKASH-PAY-123456',
      bkashUrl: 'https://checkout.sandbox.bka.sh/payment/BKASH-PAY-123456'
    });

    const session = await SaasCheckoutService.initiateBkashCheckout(order.id, 'https://eduerp.us');

    expect(session.success).toBe(true);
    expect(session.paymentId).toBe('BKASH-PAY-123456');
    expect(session.checkoutSessionId).toMatch(/^cs_edu_/);

    const updatedOrder = await db.subscriptionOrder.findUnique({
      where: { id: order.id },
      include: { payments: true }
    });

    expect(updatedOrder?.status).toBe('PROCESSING');
    expect(updatedOrder?.payments.length).toBe(1);
    expect(updatedOrder?.payments[0].status).toBe('INITIATED');
    expect(updatedOrder?.payments[0].attemptNumber).toBe(1);

    // Clean up
    await db.subscriptionPaymentTransaction.deleteMany({ where: { orderId: order.id } });
    await db.subscriptionOrder.delete({ where: { id: order.id } });
    await db.signupApplication.delete({ where: { id: signupApp.id } });
  });

  it('3. Amount Mismatch Protection: rejects fulfillment when provider executes different amount', async () => {
    const signupApp = await db.signupApplication.create({
      data: {
        institutionName: 'Mismatch High',
        institutionType: 'SCHOOL',
        contactPerson: 'Admin Mismatch',
        email: `mismatch-${Date.now()}@eduerp.us`,
        phone: '01711000002',
        address: 'Mirpur, Dhaka',
        desiredSlug: `${testSlug}-mismatch`,
        passwordHash: 'hash-xyz',
        planId: testPlanId,
        billingCycle: 'MONTHLY',
        amount: 4500,
        currency: 'BDT',
        status: 'PENDING_PAYMENT',
        expiresAt: new Date(Date.now() + 86400000)
      }
    });

    const order = await db.subscriptionOrder.create({
      data: {
        orderNumber: `EDU-ORD-${Date.now()}-MIS`,
        signupId: signupApp.id,
        planId: testPlanId,
        billingCycle: 'MONTHLY',
        subtotal: 4500,
        discount: 0,
        taxAmount: 0,
        totalAmount: 4500,
        currency: 'BDT',
        status: 'PROCESSING',
        paymentId: 'BKASH-PAY-MISMATCH',
        expiresAt: new Date(Date.now() + 86400000)
      }
    });

    // Mock bKash execute payment returning ONLY BDT 4000 instead of BDT 4500
    vi.spyOn(BkashPaymentProvider, 'executePayment').mockResolvedValueOnce({
      success: true,
      paymentId: 'BKASH-PAY-MISMATCH',
      trxId: 'TRX-MISMATCH-999',
      amount: 4000, // Amount mismatch!
      currency: 'BDT'
    });

    const result = await SaasCheckoutService.handleBkashCallback({
      paymentId: 'BKASH-PAY-MISMATCH',
      status: 'success',
      orderId: order.id
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe('PAYMENT_AMOUNT_MISMATCH');

    const updatedOrder = await db.subscriptionOrder.findUnique({
      where: { id: order.id },
      include: { payments: true }
    });

    expect(updatedOrder?.status).toBe('PAYMENT_AMOUNT_MISMATCH');
    expect(updatedOrder?.payments[0].status).toBe('PAYMENT_AMOUNT_MISMATCH');

    // Ensure tenant was NOT provisioned
    const tenant = await db.tenant.findUnique({ where: { slug: `${testSlug}-mismatch` } });
    expect(tenant).toBeNull();

    // Clean up
    await db.subscriptionPaymentTransaction.deleteMany({ where: { orderId: order.id } });
    await db.subscriptionOrder.delete({ where: { id: order.id } });
    await db.signupApplication.delete({ where: { id: signupApp.id } });
  });

  it('4. Full Lifecycle Success: verified payment provisions tenant, activates subscription, and creates invoice', async () => {
    const signupApp = await db.signupApplication.create({
      data: {
        institutionName: 'Apex International School',
        institutionType: 'SCHOOL',
        contactPerson: 'Principal Apex',
        email: `apex-${Date.now()}@eduerp.us`,
        phone: '01711000003',
        address: 'Uttara, Dhaka',
        desiredSlug: testSlug,
        passwordHash: 'hash-xyz',
        planId: testPlanId,
        billingCycle: 'MONTHLY',
        amount: 4500,
        currency: 'BDT',
        status: 'PENDING_PAYMENT',
        expiresAt: new Date(Date.now() + 86400000)
      }
    });

    const paymentIdApex = `BKASH-PAY-APEX-${Date.now()}`;
    const trxIdApex = `TRX-APEX-SUCCESS-${Date.now()}`;

    const order = await db.subscriptionOrder.create({
      data: {
        orderNumber: `EDU-ORD-${Date.now()}-APEX`,
        signupId: signupApp.id,
        planId: testPlanId,
        billingCycle: 'MONTHLY',
        subtotal: 4500,
        discount: 0,
        taxAmount: 0,
        totalAmount: 4500,
        currency: 'BDT',
        status: 'PROCESSING',
        paymentId: paymentIdApex,
        expiresAt: new Date(Date.now() + 86400000)
      }
    });

    vi.spyOn(BkashPaymentProvider, 'executePayment').mockResolvedValueOnce({
      success: true,
      paymentId: paymentIdApex,
      trxId: trxIdApex,
      amount: 4500,
      currency: 'BDT'
    });

    const result = await SaasCheckoutService.handleBkashCallback({
      paymentId: paymentIdApex,
      status: 'success',
      orderId: order.id
    });

    expect(result.success).toBe(true);
    expect(result.tenantSlug).toBe(testSlug);

    // Verify Tenant, Subscription, and Invoice
    const tenant = await db.tenant.findUnique({
      where: { slug: testSlug },
      include: {
        subscriptions: { where: { status: 'ACTIVE' }, include: { plan: true } },
        subscriptionInvoices: true
      }
    });

    expect(tenant).not.toBeNull();
    expect(tenant?.isActive).toBe(true);
    expect(tenant?.subscriptions.length).toBe(1);
    expect(tenant?.subscriptions[0].plan.id).toBe(testPlanId);
    expect(tenant?.subscriptionInvoices.length).toBe(1);
    expect(tenant?.subscriptionInvoices[0].totalAmount).toBe(4500);
    expect(tenant?.subscriptionInvoices[0].status).toBe('PAID');
  });
});
