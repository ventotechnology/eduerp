import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '../lib/db';
import { SaasCheckoutService } from '../lib/services/saas-checkout.service';
import { BkashPaymentProvider } from '../lib/payments/providers/bkash-provider';

describe('Command 12A.5E — Payment Callback Idempotency & Replay Protection Suite', () => {
  const testSlug = `idempotent-slug-${Date.now()}`;
  let planId: string;
  let orderId: string;
  const paymentId = `BKASH-REPLAY-${Date.now()}`;
  const trxId = `TRX-REPLAY-${Date.now()}`;

  beforeEach(async () => {
    let plan = await db.subscriptionPlan.findFirst({ where: { code: 'STARTER' } });
    if (!plan) {
      plan = await db.subscriptionPlan.create({
        data: {
          code: 'STARTER',
          name: 'Starter Plan',
          slug: 'starter-plan',
          tier: 'STARTER',
          description: 'Starter tier',
          monthlyPrice: 4500,
          annualPrice: 45000,
          currency: 'BDT',
          maxStudents: 500,
          maxCampuses: 1,
          maxUsers: 25,
          maxTeachers: 25,
          maxStorageGb: 20,
          includedSms: 1000,
          isActive: true
        }
      });
    }
    planId = plan.id;

    const signup = await db.signupApplication.create({
      data: {
        institutionName: 'Idempotent Replay Academy',
        institutionType: 'MADRASHA',
        contactPerson: 'Mufti Imran',
        email: `replay-${Date.now()}@eduerp.us`,
        phone: '01711999888',
        address: 'Dhaka',
        desiredSlug: testSlug,
        passwordHash: 'hash-xyz',
        planId,
        billingCycle: 'MONTHLY',
        amount: 4500,
        currency: 'BDT',
        status: 'PENDING_PAYMENT',
        expiresAt: new Date(Date.now() + 86400000)
      }
    });

    const order = await db.subscriptionOrder.create({
      data: {
        orderNumber: `EDU-ORD-REPLAY-${Date.now()}`,
        signupId: signup.id,
        planId,
        billingCycle: 'MONTHLY',
        subtotal: 4500,
        discount: 0,
        taxAmount: 0,
        totalAmount: 4500,
        currency: 'BDT',
        status: 'PROCESSING',
        paymentId,
        expiresAt: new Date(Date.now() + 86400000)
      }
    });

    orderId = order.id;

    vi.spyOn(BkashPaymentProvider, 'executePayment').mockResolvedValue({
      success: true,
      paymentId,
      trxId,
      amount: 4500,
      currency: 'BDT'
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    const t = await db.tenant.findUnique({ where: { slug: testSlug } });
    if (t) await db.tenant.delete({ where: { id: t.id } });
  });

  it('1. Replaying identical success callback 5 times results in exactly 1 fulfillment, 1 invoice, and 1 active subscription', async () => {
    const callbackPayload = {
      paymentId,
      status: 'success',
      orderId
    };

    // Replay 1
    const res1 = await SaasCheckoutService.handleBkashCallback(callbackPayload);
    expect(res1.success).toBe(true);

    // Replay 2
    const res2 = await SaasCheckoutService.handleBkashCallback(callbackPayload);
    expect(res2.success).toBe(true);
    expect(res2.alreadyProcessed).toBe(true);

    // Replay 3
    const res3 = await SaasCheckoutService.handleBkashCallback(callbackPayload);
    expect(res3.success).toBe(true);
    expect(res3.alreadyProcessed).toBe(true);

    // Replay 4
    const res4 = await SaasCheckoutService.handleBkashCallback(callbackPayload);
    expect(res4.success).toBe(true);
    expect(res4.alreadyProcessed).toBe(true);

    // Replay 5
    const res5 = await SaasCheckoutService.handleBkashCallback(callbackPayload);
    expect(res5.success).toBe(true);
    expect(res5.alreadyProcessed).toBe(true);

    // Assert database counts
    const tenant = await db.tenant.findUnique({
      where: { slug: testSlug },
      include: {
        subscriptions: true,
        subscriptionInvoices: true
      }
    });

    expect(tenant).not.toBeNull();
    expect(tenant?.subscriptions.length).toBe(1);
    expect(tenant?.subscriptionInvoices.length).toBe(1);
  });
});
