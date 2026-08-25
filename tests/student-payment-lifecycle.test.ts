import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../lib/db';
import { recordInvoicePayment } from '../lib/services/finance-service';
import { UserRole } from '@prisma/client';
import { UserStatus } from '../lib/auth/types';

describe('Command 12A.5E — Student Fee Payment, Partial Allocation & GL Double-Entry Suite', () => {
  let tenantSlug: string;
  let institutionId: string;
  let studentId: string;
  let academicYearId: string;

  const mockActor = {
    id: 'user-accountant-001',
    name: 'Chief Accountant',
    email: 'accountant@test-fee.eduerp.us',
    role: UserRole.ACCOUNTANT,
    status: UserStatus.ACTIVE,
    tenantId: 'temp',
    isSuperAdmin: false,
    isPlatformAdmin: false
  };

  beforeEach(async () => {
    tenantSlug = `test-fee-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Create Isolated Test Tenant
    const tenant = await db.tenant.create({
      data: {
        slug: tenantSlug,
        institutionType: 'SCHOOL',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
        isTestTenant: true
      }
    });

    mockActor.tenantId = tenant.id;

    // 2. Create Institution
    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Model Test Academy',
        shortName: 'MTA',
        address: 'Dhanmondi, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '01700000099',
        email: `info@${tenantSlug}.eduerp.us`
      }
    });
    institutionId = inst.id;

    // 3. Create Campus
    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Main Campus',
        code: 'MAIN',
        address: 'Dhanmondi, Dhaka',
        phone: '01700000099',
        email: `campus@${tenantSlug}.eduerp.us`,
        isMain: true
      }
    });

    // 4. Create Academic Year
    const ay = await db.academicYear.create({
      data: {
        institutionId: inst.id,
        name: 'Academic Year 2026',
        code: `AY-2026-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        isCurrent: true
      }
    });
    academicYearId = ay.id;

    // 5. Create Student
    const student = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `STU-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        admissionNumber: `ADM-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        firstName: 'Zayd',
        lastName: 'Ahmed',
        gender: 'MALE',
        dateOfBirth: new Date('2012-05-15'),
        presentAddress: 'Dhanmondi, Dhaka',
        permanentAddress: 'Dhanmondi, Dhaka',
        status: 'ACTIVE' as any
      }
    });
    studentId = student.id;
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

  it('1. Partial Fee Payment: correctly updates paid amount, due balance, and sets PARTIALLY_PAID status', async () => {
    // Create Invoice for BDT 10,000
    const invoice = await db.invoice.create({
      data: {
        studentId,
        invoiceNumber: `INV-TEST-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        title: 'Monthly Tuition & Activities Fee',
        subTotal: 10000,
        totalAmount: 10000,
        paidAmount: 0,
        dueAmount: 10000,
        status: 'UNPAID',
        dueDate: new Date(Date.now() + 7 * 86400000)
      }
    });

    // Make partial payment of BDT 4,000
    const payResult1 = await recordInvoicePayment(
      tenantSlug,
      {
        invoiceId: invoice.id,
        amount: 4000,
        paymentDate: new Date(),
        gateway: 'BKASH',
        transactionRef: `TRX-PART-1-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
      },
      mockActor
    );

    expect(payResult1.paidAmount).toBe(4000);
    expect(payResult1.dueAmount).toBe(6000);
    expect(payResult1.status).toBe('PARTIALLY_PAID');
    expect(payResult1.overpaymentCredit).toBe(0);

    // Pay remaining BDT 6,000
    const payResult2 = await recordInvoicePayment(
      tenantSlug,
      {
        invoiceId: invoice.id,
        amount: 6000,
        paymentDate: new Date(),
        gateway: 'BKASH',
        transactionRef: `TRX-PART-2-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
      },
      mockActor
    );

    expect(payResult2.paidAmount).toBe(10000);
    expect(payResult2.dueAmount).toBe(0);
    expect(payResult2.status).toBe('PAID');

    // Check payment allocations
    const allocations = await db.paymentAllocation.findMany({
      where: { invoiceId: invoice.id }
    });
    expect(allocations.length).toBe(2);
    expect(allocations[0].allocatedAmount + allocations[1].allocatedAmount).toBe(10000);
  });

  it('2. Overpayment Advance Credit: excess amount is routed to StudentCreditBalance', async () => {
    const invoice = await db.invoice.create({
      data: {
        studentId,
        invoiceNumber: `INV-OVER-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        title: 'Exam Registration Fee',
        subTotal: 5000,
        totalAmount: 5000,
        paidAmount: 0,
        dueAmount: 5000,
        status: 'UNPAID',
        dueDate: new Date(Date.now() + 7 * 86400000)
      }
    });

    // Pay BDT 6,000 for a BDT 5,000 invoice
    const result = await recordInvoicePayment(
      tenantSlug,
      {
        invoiceId: invoice.id,
        amount: 6000,
        paymentDate: new Date(),
        gateway: 'NAGAD',
        transactionRef: `TRX-OVER-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
      },
      mockActor
    );

    expect(result.paidAmount).toBe(5000);
    expect(result.dueAmount).toBe(0);
    expect(result.status).toBe('PAID');
    expect(result.overpaymentCredit).toBe(1000);

    // Verify credit balance
    const credit = await db.studentCreditBalance.findUnique({
      where: { studentId }
    });
    expect(credit?.availableCredit).toBe(1000);
  });

  it('3. Double-Entry Invariant: every payment creates balanced General Ledger journal entry (Sum(Debits) === Sum(Credits))', async () => {
    const invoice = await db.invoice.create({
      data: {
        studentId,
        invoiceNumber: `INV-GL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        title: 'Quarterly Development Fee',
        subTotal: 7500,
        totalAmount: 7500,
        paidAmount: 0,
        dueAmount: 7500,
        status: 'UNPAID',
        dueDate: new Date(Date.now() + 7 * 86400000)
      }
    });

    const result = await recordInvoicePayment(
      tenantSlug,
      {
        invoiceId: invoice.id,
        amount: 7500,
        paymentDate: new Date(),
        gateway: 'BANK_TRANSFER',
        transactionRef: `TRX-GL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
      },
      mockActor
    );

    // Retrieve created Journal Entry and Lines
    const journalEntry = await db.journalEntry.findUnique({
      where: {
        entryNumber: result.journalEntryNumber
      },
      include: { lines: true }
    });

    expect(journalEntry).not.toBeNull();
    expect(journalEntry?.lines.length).toBeGreaterThanOrEqual(2);

    const totalDebits = journalEntry?.lines.reduce((sum, l) => sum + l.debitAmount, 0) || 0;
    const totalCredits = journalEntry?.lines.reduce((sum, l) => sum + l.creditAmount, 0) || 0;

    expect(totalDebits).toBe(7500);
    expect(totalCredits).toBe(7500);
    expect(totalDebits).toBe(totalCredits); // Exact double-entry balance
  });
});
