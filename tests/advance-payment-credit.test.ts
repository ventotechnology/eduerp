import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import {
  createStudentInvoice,
  recordInvoicePayment,
  generateBatchBilling,
  createFeeStructure,
} from '@/lib/services/finance-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('Command 5: Student Overpayment, Advance Credit & Drawdown Engine', () => {
  let tenantSlug: string;
  let institutionId: string;
  let campusId: string;
  let studentId: string;
  let classId: string;
  let adminUser: SessionUser;

  beforeAll(async () => {
    const timestamp = Date.now();
    tenantSlug = `ata-${timestamp}`;

    const tenant = await db.tenant.create({
      data: {
        slug: tenantSlug,
        institutionType: 'SCHOOL',
        subscriptionTier: 'PROFESSIONAL',
        isActive: true,
      },
    });

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: `Advance Test Academy ${timestamp}`,
        shortName: `ATA${timestamp.toString().slice(-4)}`,
        eiin: `EIIN-${timestamp.toString().slice(-5)}`,
        boardAffiliation: 'RAJSHAHI',
        address: 'Rajshahi City',
        district: 'Rajshahi',
        division: 'Rajshahi',
        upazilaThana: 'Boalia',
        phone: '01722222222',
        email: `advance-${timestamp}@eduerp.us`,
      },
    });

    institutionId = inst.id;

    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Main Branch',
        code: `BRN-${timestamp.toString().slice(-4)}`,
        address: 'Boalia, Rajshahi',
      },
    });
    campusId = campus.id;

    const cls = await db.class.create({
      data: {
        institutionId: inst.id,
        name: 'Class 8',
        numericValue: 8,
      },
    });
    classId = cls.id;

    const section = await db.section.create({
      data: {
        classId: cls.id,
        name: 'Section Rose',
        capacity: 40,
      },
    });

    const student = await db.student.create({
      data: {
        campusId: campus.id,
        sectionId: section.id,
        studentIdNumber: `STU-ATA-${timestamp.toString().slice(-5)}`,
        admissionNumber: `ADM-${timestamp.toString().slice(-5)}`,
        firstName: 'Fahim',
        lastName: 'Ahmed',
        gender: 'Male',
        dateOfBirth: new Date('2011-03-20'),
        presentAddress: 'Kazla, Rajshahi',
        permanentAddress: 'Kazla, Rajshahi',
        status: UserStatus.ACTIVE,
      },
    });
    studentId = student.id;

    adminUser = {
      id: `USR-ADV-${timestamp}`,
      name: 'Accounts Incharge',
      email: `advance-officer-${timestamp}@eduerp.us`,
      role: 'ACCOUNTANT',
      tenantId: tenantSlug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };
  });

  it('records overpayment, settles invoice, and deposits surplus into student advance credit', async () => {
    // 1. Create Invoice: 30,000 BDT
    const invoice = await createStudentInvoice(
      tenantSlug,
      {
        studentId,
        title: 'Annual Session & Tuition Fee',
        subTotal: 30000,
        dueDate: '2026-09-01',
      },
      adminUser
    );
    expect(invoice.totalAmount).toBe(30000);
    expect(invoice.dueAmount).toBe(30000);

    // 2. Parent pays 50,000 BDT (20,000 overpayment)
    const paymentResult = await recordInvoicePayment(
      tenantSlug,
      {
        invoiceId: invoice.id,
        amount: 50000,
        gateway: 'BANK_TRANSFER',
        transactionRef: `TRX-OVERPAY-${Date.now()}`,
      },
      adminUser
    );

    // 3. Verify invoice is fully paid
    expect(paymentResult.paidAmount).toBe(30000);
    expect(paymentResult.dueAmount).toBe(0);
    expect(paymentResult.status).toBe('PAID');
    expect(paymentResult.overpaymentCredit).toBe(20000);

    // 4. Verify Student Credit Balance persisted
    const creditRecord = await db.studentCreditBalance.findUnique({
      where: { studentId },
    });
    expect(creditRecord?.availableCredit).toBe(20000);
  });

  it('automatically applies available student advance credit to subsequent batch invoice', async () => {
    // 1. Create monthly fee structure: 15,000 BDT
    const feeStructure = await createFeeStructure(
      tenantSlug,
      {
        name: 'October 2026 Tuition',
        amount: 15000,
        frequency: 'MONTHLY',
        targetClassId: classId,
      },
      adminUser
    );

    // 2. Run batch billing for Class 8
    const batchResult = await generateBatchBilling(
      tenantSlug,
      {
        feeStructureId: feeStructure.id,
        billingPeriod: 'October 2026',
        dueDate: '2026-10-10',
        classId,
      },
      adminUser
    );

    expect(batchResult.totalGenerated).toBe(1);
    const invoice = batchResult.invoices[0];

    // Invoice total is 15,000, entire 15,000 covered by advance credit
    expect(invoice.totalAmount).toBe(15000);
    expect(invoice.advanceApplied).toBe(15000);
    expect(invoice.paidAmount).toBe(15000);
    expect(invoice.dueAmount).toBe(0);
    expect(invoice.status).toBe('PAID');

    // Remaining advance credit should be 20,000 - 15,000 = 5,000
    const updatedCredit = await db.studentCreditBalance.findUnique({
      where: { studentId },
    });
    expect(updatedCredit?.availableCredit).toBe(5000);
  });
});
