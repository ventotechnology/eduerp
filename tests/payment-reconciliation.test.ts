import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../lib/db';
import { PaymentReconciliationService } from '../lib/services/payment-reconciliation.service';

describe('Command 12A.5E — Payment Reconciliation Engine & Exception Handling Suite', () => {
  let orderId1: string;
  let orderId2: string;
  const trxId1 = `TRX-REC-MATCH-${Date.now()}`;
  const trxId2 = `TRX-REC-MISMATCH-${Date.now()}`;

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

    // Create Order 1 (Expected BDT 4,500)
    const order1 = await db.subscriptionOrder.create({
      data: {
        orderNumber: `EDU-ORD-REC-1-${Date.now()}`,
        planId: plan.id,
        billingCycle: 'MONTHLY',
        subtotal: 4500,
        discount: 0,
        taxAmount: 0,
        totalAmount: 4500,
        currency: 'BDT',
        status: 'FULFILLED',
        gateway: 'BKASH',
        trxId: trxId1,
        expiresAt: new Date(Date.now() + 86400000)
      }
    });
    orderId1 = order1.id;

    await db.subscriptionPaymentTransaction.create({
      data: {
        orderId: order1.id,
        gateway: 'BKASH',
        trxId: trxId1,
        amount: 4500,
        currency: 'BDT',
        status: 'SUCCESS'
      }
    });

    // Create Order 2 (Expected BDT 4,500)
    const order2 = await db.subscriptionOrder.create({
      data: {
        orderNumber: `EDU-ORD-REC-2-${Date.now()}`,
        planId: plan.id,
        billingCycle: 'MONTHLY',
        subtotal: 4500,
        discount: 0,
        taxAmount: 0,
        totalAmount: 4500,
        currency: 'BDT',
        status: 'FULFILLED',
        gateway: 'BKASH',
        trxId: trxId2,
        expiresAt: new Date(Date.now() + 86400000)
      }
    });
    orderId2 = order2.id;

    await db.subscriptionPaymentTransaction.create({
      data: {
        orderId: order2.id,
        gateway: 'BKASH',
        trxId: trxId2,
        amount: 4500,
        currency: 'BDT',
        status: 'SUCCESS'
      }
    });
  });

  afterEach(async () => {
    await db.paymentReconciliationRecord.deleteMany({
      where: {
        transactionRef: { in: [trxId1, trxId2, 'TRX-MISSING-LOCAL'] }
      }
    });
    await db.subscriptionPaymentTransaction.deleteMany({
      where: { orderId: { in: [orderId1, orderId2] } }
    });
    await db.subscriptionOrder.deleteMany({
      where: { id: { in: [orderId1, orderId2] } }
    });
  });

  it('1. Reconciliation Run: accurately categorizes MATCHED, AMOUNT_MISMATCH, and MISSING_LOCAL', async () => {
    const externalSettlementFeed = [
      {
        trxId: trxId1,
        amount: 4500, // Exact Match
        fee: 67.5,
        settlementRef: 'SETTLE-BKASH-001'
      },
      {
        trxId: trxId2,
        amount: 4000, // Mismatch (expected 4500)
        fee: 60,
        settlementRef: 'SETTLE-BKASH-002'
      },
      {
        trxId: 'TRX-MISSING-LOCAL',
        amount: 9500, // Provider record that does not exist in local DB
        fee: 142.5,
        settlementRef: 'SETTLE-BKASH-003'
      }
    ];

    const result = await PaymentReconciliationService.runReconciliation({
      scope: 'PLATFORM',
      gateway: 'BKASH',
      externalSettlements: externalSettlementFeed
    });

    expect(result.success).toBe(true);
    expect(result.totalProcessed).toBeGreaterThanOrEqual(3);

    const matchRecord = result.records.find(r => r.transactionRef === trxId1);
    expect(matchRecord?.status).toBe('MATCHED');
    expect(matchRecord?.feeAmount).toBe(67.5);

    const mismatchRecord = result.records.find(r => r.transactionRef === trxId2);
    expect(mismatchRecord?.status).toBe('AMOUNT_MISMATCH');

    const missingLocalRecord = result.records.find(r => r.transactionRef === 'TRX-MISSING-LOCAL');
    expect(missingLocalRecord?.status).toBe('MISSING_LOCAL');
  });

  it('2. Manual Discrepancy Resolution: updates status, logs audit notes, and marks resolved', async () => {
    const recRecord = await db.paymentReconciliationRecord.create({
      data: {
        scope: 'PLATFORM',
        gateway: 'BKASH',
        transactionRef: `TRX-MANUAL-${Date.now()}`,
        localAmount: 4500,
        providerAmount: 4000,
        status: 'AMOUNT_MISMATCH',
        currency: 'BDT'
      }
    });

    const resolved = await PaymentReconciliationService.resolveDiscrepancy(recRecord.id, {
      status: 'MATCHED',
      notes: 'Fee difference accounted for by promo refund subsidy.',
      resolvedBy: 'superadmin@eduerp.us'
    });

    expect(resolved.status).toBe('MATCHED');
    expect(resolved.resolvedBy).toBe('superadmin@eduerp.us');
    expect(resolved.settlementStatus).toBe('SETTLED');

    // Clean up
    await db.paymentReconciliationRecord.delete({ where: { id: recRecord.id } });
  });
});
