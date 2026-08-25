import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '../../lib/db';
import { SaasPlanService } from '../../lib/services/saas-plan.service';
import { SaasSignupService } from '../../lib/services/saas-signup.service';
import { SaasCheckoutService } from '../../lib/services/saas-checkout.service';
import { BkashPaymentProvider } from '../../lib/payments/providers/bkash-provider';

describe('E2E Spec: SaaS Subscription Payment & Tenant Activation Workflow', () => {
  const testSlug = `e2e-saas-${Date.now()}`;
  let planId: string;

  beforeEach(async () => {
    const plans = await SaasPlanService.getPublicPlans();
    expect(plans.length).toBeGreaterThan(0);
    planId = plans[0].id;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    const t = await db.tenant.findUnique({ where: { slug: testSlug } });
    if (t) await db.tenant.delete({ where: { id: t.id } });
  });

  it('Flow: Pricing -> Plan Selection -> Signup -> Checkout -> bKash Success -> Active Tenant', async () => {
    // 1. Plan Selection & Signup Creation
    const signupResult = await SaasSignupService.createSignupApplication({
      institutionName: 'E2E Model High School',
      institutionType: 'SCHOOL',
      contactPerson: 'Headmaster E2E',
      email: `e2e-${Date.now()}@eduerp.us`,
      phone: '01711000888',
      address: 'Dhanmondi, Dhaka',
      desiredSlug: testSlug,
      password: 'SecurePassword123!',
      planIdOrCode: planId,
      billingCycle: 'MONTHLY'
    });

    expect(signupResult.success).toBe(true);
    expect(signupResult.orderId).toBeDefined();

    const orderId = signupResult.orderId!;

    // 2. Checkout Gateway Fetching
    const orderDetails = await SaasSignupService.getOrderDetails(orderId);
    expect(orderDetails).not.toBeNull();
    expect(orderDetails?.gateways.length).toBeGreaterThan(0);

    // 3. Initiate bKash Payment
    vi.spyOn(BkashPaymentProvider, 'createPayment').mockResolvedValueOnce({
      success: true,
      paymentId: `BKASH-E2E-PAY-${Date.now()}`,
      bkashUrl: 'https://checkout.sandbox.bka.sh/payment/demo'
    });

    const initResult = await SaasCheckoutService.initiateBkashCheckout(orderId, 'https://eduerp.us');
    expect(initResult.success).toBe(true);
    expect(initResult.paymentId).toBeDefined();

    // 4. Provider Payment Execution & Callback
    vi.spyOn(BkashPaymentProvider, 'executePayment').mockResolvedValueOnce({
      success: true,
      paymentId: initResult.paymentId,
      trxId: `TRX-E2E-${Date.now()}`,
      amount: initResult.amount,
      currency: 'BDT'
    });

    const callbackResult = await SaasCheckoutService.handleBkashCallback({
      paymentId: initResult.paymentId!,
      status: 'success',
      orderId
    });

    expect(callbackResult.success).toBe(true);
    expect(callbackResult.tenantSlug).toBe(testSlug);

    // 5. Assert Active Provisioned Tenant Stack
    const tenant = await db.tenant.findUnique({
      where: { slug: testSlug },
      include: {
        institution: { include: { campuses: true } },
        subscriptions: { where: { status: 'ACTIVE' }, include: { plan: true } },
        subscriptionInvoices: true,
        users: true
      }
    });

    expect(tenant).not.toBeNull();
    expect(tenant?.isActive).toBe(true);
    expect(tenant?.institution).not.toBeNull();
    expect(tenant?.institution?.campuses.length).toBe(1);
    expect(tenant?.subscriptions[0].status).toBe('ACTIVE');
    expect(tenant?.subscriptionInvoices[0].status).toBe('PAID');
    expect(tenant?.users[0].status).toBe('ACTIVE');
  });
});
