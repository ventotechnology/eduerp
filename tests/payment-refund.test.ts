import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../lib/db';
import { requestRefund, processRefund, recordInvoicePayment } from '../lib/services/finance-service';
import { UserRole } from '@prisma/client';
import { UserStatus } from '../lib/auth/types';

describe('Command 12A.5E — Payment Refund, Approval & Accounting Reversal Suite', () => {
  let tenantSlug: string;
  let institutionId: string;
  let studentId: string;
  let invoiceId: string;
  let paymentId: string;

  const adminActor = {
    id: 'user-principal-001',
    name: 'Principal Khan',
    email: 'principal@test-refund.eduerp.us',
    role: UserRole.PRINCIPAL,
    status: UserStatus.ACTIVE,
    tenantId: 'temp',
    isSuperAdmin: false,
    isPlatformAdmin: false
  };

  beforeEach(async () => {
    tenantSlug = `refund-tenant-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const tenant = await db.tenant.create({
      data: {
        slug: tenantSlug,
        institutionType: 'SCHOOL',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
        isTestTenant: true
      }
    });

    adminActor.tenantId = tenant.id;

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Refund Test Academy',
        shortName: 'RTA',
        address: 'Gulshan, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Gulshan',
        phone: '01711223344',
        email: `info@${tenantSlug}.eduerp.us`
      }
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Main Campus',
        code: 'MAIN',
        address: 'Gulshan, Dhaka',
        phone: '01711223344',
        email: `campus@${tenantSlug}.eduerp.us`,
        isMain: true
      }
    });

    const ay = await db.academicYear.create({
      data: {
        institutionId: inst.id,
        name: 'Academic Year 2026',
        code: `AY-REF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        isCurrent: true
      }
    });

    const student = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `STU-REF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        admissionNumber: `ADM-REF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        firstName: 'Farhan',
        lastName: 'Kabir',
        gender: 'MALE',
        dateOfBirth: new Date('2011-03-20'),
        presentAddress: 'Gulshan, Dhaka',
        permanentAddress: 'Gulshan, Dhaka',
        status: 'ACTIVE' as any
      }
    });
    studentId = student.id;

    // Create Invoice & Record Payment
    const invoice = await db.invoice.create({
      data: {
        studentId,
        invoiceNumber: `INV-REF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        title: 'Tuition Fee Refundable',
        subTotal: 5000,
        totalAmount: 5000,
        paidAmount: 0,
        dueAmount: 5000,
        status: 'UNPAID',
        dueDate: new Date(Date.now() + 7 * 86400000)
      }
    });
    invoiceId = invoice.id;

    const payRes = await recordInvoicePayment(
      tenantSlug,
      {
        invoiceId: invoice.id,
        amount: 5000,
        paymentDate: new Date(),
        gateway: 'BKASH',
        transactionRef: `TRX-REF-INIT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
      },
      adminActor
    );
    paymentId = payRes.paymentId;
  });

  afterEach(async () => {
    const t = await db.tenant.findUnique({ where: { slug: tenantSlug } });
    if (t) {
      await db.paymentAllocation.deleteMany({ where: { invoice: { student: { campus: { institution: { tenantId: t.id } } } } } });
      await db.paymentTransaction.deleteMany({ where: { invoice: { student: { campus: { institution: { tenantId: t.id } } } } } });
      await db.refundRequest.deleteMany({ where: { institutionId } });
      await db.studentCreditTransaction.deleteMany({ where: { studentId } });
      await db.studentCreditBalance.deleteMany({ where: { institutionId } });
      await db.journalEntry.deleteMany({ where: { institutionId } });
      await db.chartOfAccount.deleteMany({ where: { institutionId } });
      await db.invoice.deleteMany({ where: { student: { campus: { institution: { tenantId: t.id } } } } });
      await db.student.deleteMany({ where: { campus: { institution: { tenantId: t.id } } } });
      await db.academicYear.deleteMany({ where: { institutionId } });
      await db.campus.deleteMany({ where: { institutionId } });
      await db.institution.deleteMany({ where: { tenantId: t.id } });
      await db.tenant.delete({ where: { id: t.id } });
    }
  });

  it('1. Refund Workflow: request, approval, and accounting reversal preserves historical ledger rows', async () => {
    // 1. Submit Refund Request
    const refund = await requestRefund(
      tenantSlug,
      {
        studentId,
        amount: 5000,
        reason: 'Duplicate payment made during online fee collection.',
        paymentId
      },
      adminActor
    );

    expect(refund.status).toBe('REQUESTED');
    expect(refund.amount).toBe(5000);

    // 2. Process Refund Approval
    const approveResult = await processRefund(
      tenantSlug,
      {
        refundRequestId: refund.id,
        action: 'APPROVE',
        notes: 'Verified against bank settlement and approved.'
      },
      adminActor
    );

    expect(approveResult.status).toBe('APPROVED');
    expect(approveResult.amount).toBe(5000);

    // 3. Process Refund Execution & Accounting Voucher
    const processResult = await processRefund(
      tenantSlug,
      {
        refundRequestId: refund.id,
        action: 'PROCESS',
        refundMethod: 'BANK_TRANSFER',
        notes: 'Processed electronic bank payout.'
      },
      adminActor
    );

    expect(processResult.status).toBe('PROCESSED');
    expect(processResult.journalEntryId).toBeDefined();

    // 4. Verify that original payment record was NOT deleted
    const originalPayment = await db.paymentTransaction.findUnique({
      where: { id: paymentId }
    });
    expect(originalPayment).not.toBeNull();

    // 5. Verify balanced reversal journal voucher
    const reversalVoucher = await db.journalEntry.findUnique({
      where: {
        id: processResult.journalEntryId!
      },
      include: { lines: true }
    });

    expect(reversalVoucher).not.toBeNull();
    const debits = reversalVoucher?.lines.reduce((s, l) => s + l.debitAmount, 0) || 0;
    const credits = reversalVoucher?.lines.reduce((s, l) => s + l.creditAmount, 0) || 0;
    expect(debits).toBe(5000);
    expect(credits).toBe(5000);
    expect(debits).toBe(credits);
  });
});
