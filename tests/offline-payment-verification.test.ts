import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentGatewayService } from '../lib/services/payment-gateway.service';
import { db } from '../lib/db';

describe('Command 12A.5D — Offline Payment Review & Verification Workflow', () => {
  let sitaTenant: any;

  beforeEach(async () => {
    sitaTenant = await db.tenant.upsert({
      where: { slug: 'test-offline-verify-tenant' },
      update: {},
      create: {
        slug: 'test-offline-verify-tenant',
        institutionType: 'MADRASHA',
        subscriptionTier: 'PROFESSIONAL',
        isActive: true,
        institution: {
          create: {
            name: 'Test Offline Verify Madrasah',
            shortName: 'TOVM',
            address: 'House 12, Road 4, Dhanmondi',
            district: 'Dhaka',
            division: 'Dhaka',
            upazilaThana: 'Dhanmondi',
            phone: '01700000001',
            email: 'admin@tovm.edu.bd'
          }
        }
      }
    });
  });

  it('should submit an offline payment and transition from SUBMITTED to UNDER_REVIEW', async () => {
    const submission = await PaymentGatewayService.submitOfflinePayment({
      tenantId: sitaTenant.id,
      paymentMethod: 'BANK_TRANSFER',
      amount: 15000,
      referenceNumber: `CITY-DEP-${Date.now()}`,
      proofDocumentUrl: 'https://eduerp.us/uploads/deposit-slip-1.pdf',
      notes: 'Paid tuition for Term 1 via City Bank deposit',
      submittedBy: 'guardian@tovm.edu.bd'
    });

    expect(submission.id).toBeDefined();
    expect(submission.status).toBe('UNDER_REVIEW');
    expect(submission.amount).toBe(15000);
    expect(submission.referenceNumber).toContain('CITY-DEP-');
  });

  it('should allow accountant to approve and verify an offline payment', async () => {
    const submission = await PaymentGatewayService.submitOfflinePayment({
      tenantId: sitaTenant.id,
      paymentMethod: 'BANK_TRANSFER',
      amount: 25000,
      referenceNumber: `VERIFY-REF-${Date.now()}`,
      submittedBy: 'guardian@tovm.edu.bd'
    });

    const verifyResult = await PaymentGatewayService.verifyOfflinePayment({
      recordId: submission.id,
      action: 'VERIFY',
      actor: {
        userId: 'accountant-1',
        email: 'accountant@tovm.edu.bd',
        role: 'ACCOUNTANT'
      }
    });

    expect(verifyResult.success).toBe(true);
    expect(verifyResult.status).toBe('VERIFIED');
    expect(verifyResult.record.verifiedBy).toBe('accountant@tovm.edu.bd');
    expect(verifyResult.record.verifiedAt).toBeDefined();
  });

  it('should allow accountant to reject an offline payment with a specific reason', async () => {
    const submission = await PaymentGatewayService.submitOfflinePayment({
      tenantId: sitaTenant.id,
      paymentMethod: 'CHEQUE',
      amount: 5000,
      referenceNumber: `BOUNCED-CHQ-${Date.now()}`,
      submittedBy: 'guardian@tovm.edu.bd'
    });

    const rejectResult = await PaymentGatewayService.verifyOfflinePayment({
      recordId: submission.id,
      action: 'REJECT',
      rejectionReason: 'Cheque bounced due to signature mismatch.',
      actor: {
        userId: 'accountant-1',
        email: 'accountant@tovm.edu.bd',
        role: 'ACCOUNTANT'
      }
    });

    expect(rejectResult.success).toBe(true);
    expect(rejectResult.status).toBe('REJECTED');
    expect(rejectResult.record.rejectionReason).toBe('Cheque bounced due to signature mismatch.');
  });
});
