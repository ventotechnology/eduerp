import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '../lib/db';
import { SaasProvisioningService } from '../lib/services/saas-provisioning.service';

describe('Command 12A.5E — Payment Webhook Idempotency Suite', () => {
  const testSlug = `webhook-slug-${Date.now()}`;
  let planId: string;
  let orderId: string;

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
        institutionName: 'Webhook Test School',
        institutionType: 'SCHOOL',
        contactPerson: 'Headmaster Tareq',
        email: `webhook-${Date.now()}@eduerp.us`,
        phone: '01711777666',
        address: 'Chittagong',
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
        orderNumber: `EDU-ORD-WH-${Date.now()}`,
        signupId: signup.id,
        planId,
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

    orderId = order.id;
  });

  afterEach(async () => {
    const t = await db.tenant.findUnique({ where: { slug: testSlug } });
    if (t) await db.tenant.delete({ where: { id: t.id } });
  });

  it('1. Webhook fulfillment idempotency: 5 identical webhook deliveries yield single provisioning', async () => {
    const paymentPayload = {
      gateway: 'BKASH',
      paymentId: `PAY-WH-${Date.now()}`,
      trxId: `TRX-WH-${Date.now()}`,
      amount: 4500,
      providerReference: 'WH-DELIVERY-TEST'
    };

    // Delivery 1
    const res1 = await SaasProvisioningService.fulfillPaidOrder(orderId, paymentPayload);
    expect(res1.success).toBe(true);

    // Delivery 2
    const res2 = await SaasProvisioningService.fulfillPaidOrder(orderId, paymentPayload);
    expect(res2.alreadyFulfilled).toBe(true);

    // Delivery 3
    const res3 = await SaasProvisioningService.fulfillPaidOrder(orderId, paymentPayload);
    expect(res3.alreadyFulfilled).toBe(true);

    // Delivery 4
    const res4 = await SaasProvisioningService.fulfillPaidOrder(orderId, paymentPayload);
    expect(res4.alreadyFulfilled).toBe(true);

    // Delivery 5
    const res5 = await SaasProvisioningService.fulfillPaidOrder(orderId, paymentPayload);
    expect(res5.alreadyFulfilled).toBe(true);

    // Check database
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
