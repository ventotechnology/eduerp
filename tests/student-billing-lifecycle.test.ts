import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import {
  createFeeStructure,
  createScholarshipMaster,
  createStudentInvoice,
  generateBatchBilling,
  recordInvoicePayment,
  getStudentFinancialStatement,
} from '@/lib/services/finance-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('Command 5: Student Billing, Scholarship Impact & Multi-Installment Payment Lifecycle', () => {
  let tenantSlug: string;
  let institutionId: string;
  let campusId: string;
  let classId: string;
  let studentId: string;
  let adminUser: SessionUser;

  beforeAll(async () => {
    const timestamp = Date.now();
    tenantSlug = `btu-${timestamp}`;

    const tenant = await db.tenant.create({
      data: {
        slug: tenantSlug,
        institutionType: 'UNIVERSITY',
        subscriptionTier: 'PROFESSIONAL',
        isActive: true,
      },
    });

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: `Billing Test University ${timestamp}`,
        shortName: `BTU${timestamp.toString().slice(-4)}`,
        eiin: `EIIN-${timestamp.toString().slice(-5)}`,
        boardAffiliation: 'UGC',
        address: 'Uttara, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Uttara',
        phone: '01711111111',
        email: `billing-${timestamp}@eduerp.us`,
      },
    });

    institutionId = inst.id;

    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Main Campus',
        code: `CMP-${timestamp.toString().slice(-4)}`,
        address: 'Uttara, Dhaka',
      },
    });
    campusId = campus.id;

    const cls = await db.class.create({
      data: {
        institutionId: inst.id,
        name: 'CSE Batch 2026',
        numericValue: 1,
      },
    });
    classId = cls.id;

    const section = await db.section.create({
      data: {
        classId: cls.id,
        name: 'Section A',
        capacity: 50,
      },
    });

    const student = await db.student.create({
      data: {
        campusId: campus.id,
        sectionId: section.id,
        studentIdNumber: `STU-BTU-${timestamp.toString().slice(-5)}`,
        admissionNumber: `ADM-${timestamp.toString().slice(-5)}`,
        firstName: 'Anika',
        lastName: 'Rahman',
        gender: 'Female',
        dateOfBirth: new Date('2004-05-15'),
        presentAddress: 'Sector 4, Uttara',
        permanentAddress: 'Sector 4, Uttara',
        status: UserStatus.ACTIVE,
      },
    });
    studentId = student.id;

    adminUser = {
      id: `USR-BILL-${timestamp}`,
      name: 'Billing Officer',
      email: `billing-officer-${timestamp}@eduerp.us`,
      role: 'ACCOUNTANT',
      tenantId: tenantSlug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };
  });

  it('creates fee structure and applies automated scholarship deduction in bulk billing', async () => {
    // 1. Create Fee Structure: Semester Tuition 20,000 BDT
    const feeStructure = await createFeeStructure(
      tenantSlug,
      {
        name: 'Fall 2026 Semester Tuition',
        amount: 20000,
        frequency: 'SEMESTER',
        targetClassId: classId,
      },
      adminUser
    );
    expect(feeStructure.amount).toBe(20000);

    // 2. Create Scholarship Master: 50% Merit Waiver
    const scholarship = await createScholarshipMaster(
      tenantSlug,
      {
        name: 'Dean Merit Scholarship',
        code: 'DEAN-50',
        type: 'MERIT',
        benefitType: 'PERCENTAGE',
        benefitValue: 50,
      },
      adminUser
    );

    // 3. Award Scholarship to Student
    await db.scholarshipAward.create({
      data: {
        institutionId,
        scholarshipId: scholarship.id,
        studentId,
        awardType: 'PERCENTAGE',
        awardValue: 50,
        effectiveStartDate: new Date('2026-01-01'),
        effectiveEndDate: new Date('2026-12-31'),
        status: UserStatus.ACTIVE,
        approvedBy: adminUser.name,
      },
    });

    // 4. Generate Batch Billing for Class
    const batchResult = await generateBatchBilling(
      tenantSlug,
      {
        feeStructureId: feeStructure.id,
        billingPeriod: 'Fall 2026',
        dueDate: '2026-09-15',
        classId,
      },
      adminUser
    );

    expect(batchResult.totalGenerated).toBe(1);
    const invoice = batchResult.invoices[0];

    expect(invoice.subTotal).toBe(20000);
    expect(invoice.scholarshipAmount).toBe(10000); // 50% of 20000
    expect(invoice.totalAmount).toBe(10000);
    expect(invoice.dueAmount).toBe(10000);
    expect(invoice.status).toBe('UNPAID');
  });

  it('records partial payment and recalculates invoice balance correctly', async () => {
    const invoice = await db.invoice.findFirst({
      where: { studentId, title: 'Fall 2026 Semester Tuition' },
    });
    expect(invoice).toBeDefined();

    // Partial Payment: 4,000 BDT
    const p1 = await recordInvoicePayment(
      tenantSlug,
      {
        invoiceId: invoice!.id,
        amount: 4000,
        gateway: 'BKASH',
        transactionRef: `TRX-P1-${Date.now()}`,
      },
      adminUser
    );

    expect(p1.paidAmount).toBe(4000);
    expect(p1.dueAmount).toBe(6000);
    expect(p1.status).toBe('PARTIALLY_PAID');
    expect(p1.receiptNumber).toMatch(/^REC-/);
  });

  it('records final payment to achieve zero outstanding receivable and updates student statement', async () => {
    const invoice = await db.invoice.findFirst({
      where: { studentId, title: 'Fall 2026 Semester Tuition' },
    });

    // Final Payment: 6,000 BDT
    const p2 = await recordInvoicePayment(
      tenantSlug,
      {
        invoiceId: invoice!.id,
        amount: 6000,
        gateway: 'NAGAD',
        transactionRef: `TRX-P2-${Date.now()}`,
      },
      adminUser
    );

    expect(p2.paidAmount).toBe(10000);
    expect(p2.dueAmount).toBe(0);
    expect(p2.status).toBe('PAID');

    // Verify Student Statement
    const statement = await getStudentFinancialStatement(tenantSlug, studentId);
    expect(statement.summary.totalBilled).toBe(20000);
    expect(statement.summary.totalScholarships).toBe(10000);
    expect(statement.summary.totalPaid).toBe(10000);
    expect(statement.summary.totalOutstanding).toBe(0);
  });
});
