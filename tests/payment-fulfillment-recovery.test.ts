import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '../lib/db';
import { SaasCheckoutService } from '../lib/services/saas-checkout.service';
import { SaasProvisioningService } from '../lib/services/saas-provisioning.service';
import { BkashPaymentProvider } from '../lib/payments/providers/bkash-provider';

describe('Command 12A.5E — Payment Fulfillment Failure Recovery Suite', () => {
  let testSlug: string;
  let planId: string;
  let orderId: string;
  let paymentId: string;
  let trxId: string;

  beforeEach(async () => {
    testSlug = `recovery-slug-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    paymentId = `BKASH-REC-PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    trxId = `TRX-REC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

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
        institutionName: 'Recovery Test College',
        institutionType: 'COLLEGE',
        contactPerson: 'Dean Recovery',
        email: `recovery-${Date.now()}-${Math.floor(100 + Math.random() * 900)}@eduerp.us`,
        phone: '01711555444',
        address: 'Sylhet',
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
        orderNumber: `EDU-ORD-REC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
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
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    const t = await db.tenant.findUnique({ where: { slug: testSlug } });
    if (t) await db.tenant.delete({ where: { id: t.id } });
  });

  it('1. Enters PAYMENT_SUCCESS_FULFILLMENT_PENDING state if provider succeeds but internal provisioning throws', async () => {
    vi.spyOn(BkashPaymentProvider, 'executePayment').mockResolvedValue({
      success: true,
      paymentId,
      trxId,
      amount: 4500,
      currency: 'BDT'
    });

    // Mock SaasProvisioningService.fulfillPaidOrder to throw an unexpected database lock/error
    vi.spyOn(SaasProvisioningService, 'fulfillPaidOrder').mockRejectedValueOnce(
      new Error('Simulated transient DB deadlock')
    );

    const result = await SaasCheckoutService.handleBkashCallback({
      paymentId,
      status: 'success',
      orderId
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe('PAYMENT_SUCCESS_FULFILLMENT_PENDING');

    const updatedOrder = await db.subscriptionOrder.findUnique({
      where: { id: orderId },
      include: { payments: true }
    });

    expect(updatedOrder?.status).toBe('PAYMENT_SUCCESS_FULFILLMENT_PENDING');
    expect(updatedOrder?.trxId).toBe(trxId);
    expect(updatedOrder?.payments[0].status).toBe('PAYMENT_SUCCESS_FULFILLMENT_PENDING');
  });

  it('2. Retry Fulfillment succeeds idempotently without re-charging provider', async () => {
    // Put order in PAYMENT_SUCCESS_FULFILLMENT_PENDING
    await db.subscriptionOrder.update({
      where: { id: orderId },
      data: {
        status: 'PAYMENT_SUCCESS_FULFILLMENT_PENDING',
        trxId
      }
    });

    // Super Admin triggers retry fulfillment
    const retryResult = await SaasCheckoutService.retryOrderFulfillment(orderId, 'SUPER_ADMIN');

    expect(retryResult.success).toBe(true);

    const finalOrder = await db.subscriptionOrder.findUnique({
      where: { id: orderId }
    });

    expect(finalOrder?.status).toBe('FULFILLED');

    const tenant = await db.tenant.findUnique({
      where: { slug: testSlug },
      include: { subscriptions: true }
    });

    expect(tenant).not.toBeNull();
    expect(tenant?.subscriptions.length).toBe(1);
    expect(tenant?.subscriptions[0].status).toBe('ACTIVE');
  });
});
