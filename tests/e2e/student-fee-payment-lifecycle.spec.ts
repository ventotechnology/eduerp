import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../../lib/db';
import { recordInvoicePayment } from '../../lib/services/finance-service';
import { UserRole } from '@prisma/client';
import { UserStatus } from '../../lib/auth/types';

describe('E2E Spec: Student Fee Billing, Payment Allocation & Receipt Lifecycle', () => {
  let tenantSlug: string;
  let institutionId: string;
  let studentId: string;
  let academicYearId: string;

  const cashierActor = {
    id: 'user-cashier-001',
    name: 'Accounts Officer',
    email: 'accounts@e2e-fee.eduerp.us',
    role: UserRole.ACCOUNTANT,
    status: UserStatus.ACTIVE,
    tenantId: 'temp',
    isSuperAdmin: false,
    isPlatformAdmin: false
  };

  beforeEach(async () => {
    tenantSlug = `e2e-fee-tenant-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const tenant = await db.tenant.create({
      data: { slug: tenantSlug, institutionType: 'SCHOOL', subscriptionTier: 'ENTERPRISE', isTestTenant: true }
    });
    cashierActor.tenantId = tenant.id;

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Dhaka Scholars Academy',
        shortName: 'DSA',
        address: 'Dhanmondi, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '01711333444',
        email: `info@${tenantSlug}.eduerp.us`
      }
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: { institutionId: inst.id, name: 'Main Campus', code: 'MAIN', address: 'Dhaka', phone: '01711333444', email: 'c@dsa.us', isMain: true }
    });

    const ay = await db.academicYear.create({
      data: { institutionId: inst.id, name: 'AY 2026', code: `AY-2026-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31') }
    });
    academicYearId = ay.id;

    const student = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `STU-E2E-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        admissionNumber: `ADM-E2E-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        firstName: 'Saad',
        lastName: 'Mahmud',
        gender: 'MALE',
        dateOfBirth: new Date('2013-08-10'),
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

  it('E2E Flow: Student Invoice -> Partial Online Payment -> Final Offline Settlement -> Receipt & GL Audit', async () => {
    // 1. Generate Monthly Tuition Invoice of BDT 8,000
    const invoice = await db.invoice.create({
      data: {
        studentId,
        invoiceNumber: `INV-E2E-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        title: 'Tuition and Term Exam Fee',
        subTotal: 8000,
        totalAmount: 8000,
        paidAmount: 0,
        dueAmount: 8000,
        status: 'UNPAID',
        dueDate: new Date(Date.now() + 10 * 86400000)
      }
    });

    // 2. Partial Payment BDT 3,000 via bKash
    const p1 = await recordInvoicePayment(
      tenantSlug,
      {
        invoiceId: invoice.id,
        amount: 3000,
        paymentDate: new Date(),
        gateway: 'BKASH',
        transactionRef: `TRX-BKASH-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
      },
      cashierActor
    );

    expect(p1.paidAmount).toBe(3000);
    expect(p1.dueAmount).toBe(5000);
    expect(p1.status).toBe('PARTIALLY_PAID');
    expect(p1.receiptNumber).toMatch(/^REC-/);

    // 3. Final Settlement of BDT 5,000 via Bank Wire
    const p2 = await recordInvoicePayment(
      tenantSlug,
      {
        invoiceId: invoice.id,
        amount: 5000,
        paymentDate: new Date(),
        gateway: 'BANK_TRANSFER',
        transactionRef: `TRX-BANK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
      },
      cashierActor
    );

    expect(p2.paidAmount).toBe(8000);
    expect(p2.dueAmount).toBe(0);
    expect(p2.status).toBe('PAID');

    // 4. Verify Database Integrity & Double-Entry Balanced GL Vouchers
    const updatedInvoice = await db.invoice.findUnique({
      where: { id: invoice.id },
      include: { allocations: true, payments: true }
    });

    expect(updatedInvoice?.status).toBe('PAID');
    expect(updatedInvoice?.dueAmount).toBe(0);
    expect(updatedInvoice?.paidAmount).toBe(8000);
    expect(updatedInvoice?.allocations.length).toBe(2);

    // Check Journal Vouchers
    const jvs = await db.journalEntry.findMany({
      where: { institutionId },
      include: { lines: true }
    });

    expect(jvs.length).toBe(2);
    for (const jv of jvs) {
      const d = jv.lines.reduce((sum, l) => sum + l.debitAmount, 0);
      const c = jv.lines.reduce((sum, l) => sum + l.creditAmount, 0);
      expect(d).toBe(c); // Strict double-entry balance
    }
  });
});
