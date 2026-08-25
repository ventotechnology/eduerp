import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../../lib/db';
import { PaymentGatewayService } from '../../lib/services/payment-gateway.service';

describe('E2E Spec: Offline Payment Submission, Verification & Approval Flow', () => {
  let tenantSlug: string;
  let institutionId: string;
  let studentId: string;
  let academicYearId: string;
  let tenantId: string;

  beforeEach(async () => {
    tenantSlug = `e2e-offline-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const tenant = await db.tenant.create({
      data: { slug: tenantSlug, institutionType: 'SCHOOL', subscriptionTier: 'ENTERPRISE', isTestTenant: true }
    });
    tenantId = tenant.id;

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Offline Test Academy',
        shortName: 'OTA',
        address: 'Mirpur, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Mirpur',
        phone: '01711666555',
        email: `info@${tenantSlug}.eduerp.us`
      }
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: { institutionId: inst.id, name: 'Main Campus', code: 'MAIN', address: 'Dhaka', phone: '01711666555', email: 'c@ota.us', isMain: true }
    });

    const ay = await db.academicYear.create({
      data: { institutionId: inst.id, name: 'AY 2026', code: `AY-OFF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31') }
    });
    academicYearId = ay.id;

    const student = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `STU-OFF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        admissionNumber: `ADM-OFF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        firstName: 'Mustafa',
        lastName: 'Hossain',
        gender: 'MALE',
        dateOfBirth: new Date('2014-04-12'),
        presentAddress: 'Mirpur, Dhaka',
        permanentAddress: 'Mirpur, Dhaka',
        status: 'ACTIVE' as any
      }
    });
    studentId = student.id;
  });

  afterEach(async () => {
    const t = await db.tenant.findUnique({ where: { slug: tenantSlug } });
    if (t) {
      await db.offlinePaymentRecord.deleteMany({ where: { tenantId: t.id } });
      await db.paymentAllocation.deleteMany({ where: { invoice: { student: { campus: { institution: { tenantId: t.id } } } } } });
      await db.paymentTransaction.deleteMany({ where: { invoice: { student: { campus: { institution: { tenantId: t.id } } } } } });
      await db.invoice.deleteMany({ where: { student: { campus: { institution: { tenantId: t.id } } } } });
      await db.student.deleteMany({ where: { campus: { institution: { tenantId: t.id } } } });
      await db.academicYear.deleteMany({ where: { institutionId } });
      await db.campus.deleteMany({ where: { institutionId } });
      await db.institution.deleteMany({ where: { tenantId: t.id } });
      await db.tenant.delete({ where: { id: t.id } });
    }
  });

  it('1. Offline Flow: Submit Bank Slip -> Accountant Review -> Verified -> Paid', async () => {
    // 1. Create Invoice of BDT 6,000
    const invoice = await db.invoice.create({
      data: {
        studentId,
        invoiceNumber: `INV-OFFLINE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        title: 'Tuition Fee Offline',
        subTotal: 6000,
        totalAmount: 6000,
        paidAmount: 0,
        dueAmount: 6000,
        status: 'UNPAID',
        dueDate: new Date(Date.now() + 7 * 86400000)
      }
    });

    // 2. Student / Guardian submits bank deposit slip
    const submission = await PaymentGatewayService.submitOfflinePayment({
      tenantId,
      invoiceId: invoice.id,
      paymentMethod: 'BANK_TRANSFER',
      amount: 6000,
      referenceNumber: `SLIP-CITYBANK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      proofDocumentUrl: 'https://eduerp.us/uploads/slips/slip123.pdf',
      notes: 'Deposited at City Bank Dhanmondi Branch',
      submittedBy: 'Guardian - Kamal Hossain'
    });

    expect(submission.id).toBeDefined();
    expect(submission.status).toBe('SUBMITTED');

    // 3. Accountant Verifies & Approves Payment
    const verification = await PaymentGatewayService.verifyOfflinePayment({
      recordId: submission.id,
      action: 'VERIFY',
      actor: {
        userId: 'user-accountant-001',
        email: 'accountant@ota.us',
        role: 'ACCOUNTANT'
      }
    });

    expect(verification.status).toBe('PAID');

    // 4. Verify Invoice was Marked PAID and Balance Cleared
    const updatedInvoice = await db.invoice.findUnique({
      where: { id: invoice.id }
    });
    expect(updatedInvoice?.status).toBe('PAID');
    expect(updatedInvoice?.paidAmount).toBe(6000);
    expect(updatedInvoice?.dueAmount).toBe(0);
  });

  it('2. Offline Flow: Submit -> Accountant Rejection with Audit Reason', async () => {
    const invoice = await db.invoice.create({
      data: {
        studentId,
        invoiceNumber: `INV-REJ-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        title: 'Tuition Fee Reject Test',
        subTotal: 4000,
        totalAmount: 4000,
        paidAmount: 0,
        dueAmount: 4000,
        status: 'UNPAID',
        dueDate: new Date(Date.now() + 7 * 86400000)
      }
    });

    const submission = await PaymentGatewayService.submitOfflinePayment({
      tenantId,
      invoiceId: invoice.id,
      paymentMethod: 'BANK_TRANSFER',
      amount: 4000,
      referenceNumber: `INVALID-SLIP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      notes: 'Unclear bank seal',
      submittedBy: 'Guardian - Kamal Hossain'
    });

    const rejection = await PaymentGatewayService.verifyOfflinePayment({
      recordId: submission.id,
      action: 'REJECT',
      rejectionReason: 'Bank slip reference could not be verified in online banking statement.',
      actor: {
        userId: 'user-auditor-001',
        email: 'auditor@ota.us',
        role: 'ACCOUNTANT'
      }
    });

    expect(rejection.status).toBe('REJECTED');
    expect(rejection.record.rejectionReason).toContain('could not be verified');

    const updatedInvoice = await db.invoice.findUnique({
      where: { id: invoice.id }
    });
    expect(updatedInvoice?.status).toBe('UNPAID');
    expect(updatedInvoice?.paidAmount).toBe(0);
    expect(updatedInvoice?.dueAmount).toBe(4000);
  });
});
