import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/db';
import { SaasProvisioningService } from '../lib/services/saas-provisioning.service';

describe('Command 12A.5D — Payment Webhook & Idempotent Order Fulfillment', () => {
  let testOrder: any;

  beforeEach(async () => {
    // Create an isolated dummy tenant for webhook testing
    const tenant = await db.tenant.upsert({
      where: { slug: 'test-webhook-fulfillment-tenant' },
      update: {},
      create: {
        slug: 'test-webhook-fulfillment-tenant',
        institutionType: 'MADRASHA',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
        institution: {
          create: {
            name: 'Test Webhook Institution',
            shortName: 'TWI',
            address: 'House 12, Road 4, Dhanmondi',
            district: 'Dhaka',
            division: 'Dhaka',
            upazilaThana: 'Dhanmondi',
            phone: '01700000099',
            email: 'admin@twi.edu.bd'
          }
        }
      }
    });

    const plan = await db.subscriptionPlan.findFirst({
      where: { tier: 'ENTERPRISE' }
    });

    testOrder = await db.subscriptionOrder.create({
      data: {
        orderNumber: `TEST-ORD-${Date.now()}`,
        tenantId: tenant.id,
        planId: plan?.id || 'default-plan',
        billingCycle: 'ANNUAL',
        subtotal: 50000,
        taxAmount: 0,
        discount: 0,
        totalAmount: 50000,
        currency: 'BDT',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000)
      }
    });
  });

  it('should fulfill order atomically on first fulfillment call', async () => {
    const fulfilled = await SaasProvisioningService.fulfillPaidOrder(testOrder.id, {
      gateway: 'BKASH',
      trxId: `TRX-${Date.now()}`,
      amount: 50000,
      providerReference: 'BKASH-MOCK-REF-1'
    });

    expect(fulfilled.success).toBe(true);

    const checkOrder = await db.subscriptionOrder.findUnique({
      where: { id: testOrder.id }
    });
    expect(checkOrder?.status).toBe('FULFILLED');
    expect(checkOrder?.paidAt).toBeDefined();
  });

  it('should remain strictly idempotent when duplicate fulfillment requests are made', async () => {
    const trxId = `IDEMP-TRX-${Date.now()}`;

    // First call
    const firstCall = await SaasProvisioningService.fulfillPaidOrder(testOrder.id, {
      gateway: 'BKASH',
      trxId,
      amount: 50000
    });
    expect(firstCall.success).toBe(true);

    // Duplicate call (simulating network retry or duplicate webhook)
    const duplicateCall = await SaasProvisioningService.fulfillPaidOrder(testOrder.id, {
      gateway: 'BKASH',
      trxId,
      amount: 50000
    });

    expect(duplicateCall.alreadyFulfilled).toBe(true);

    const checkOrder = await db.subscriptionOrder.findUnique({
      where: { id: testOrder.id }
    });
    expect(checkOrder?.status).toBe('FULFILLED');
  });
});
