import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import {
  createStudentInvoice,
  recordInvoicePayment,
  requestRefund,
  processRefund,
} from '@/lib/services/finance-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('Command 5: Controlled Refund Workflow & Accounting Reversal', () => {
  let tenantSlug: string;
  let institutionId: string;
  let studentId: string;
  let invoiceId: string;
  let paymentId: string;
  let adminUser: SessionUser;

  beforeAll(async () => {
    const timestamp = Date.now();
    tenantSlug = `rtp-${timestamp}`;

    const tenant = await db.tenant.create({
      data: {
        slug: tenantSlug,
        institutionType: 'POLYTECHNIC',
        subscriptionTier: 'PROFESSIONAL',
        isActive: true,
      },
    });

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: `Refund Test Polytechnic ${timestamp}`,
        shortName: `RTP${timestamp.toString().slice(-4)}`,
        eiin: `EIIN-${timestamp.toString().slice(-5)}`,
        boardAffiliation: 'BTEB',
        address: 'Mirpur, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Mirpur',
        phone: '01733333333',
        email: `refund-${timestamp}@eduerp.us`,
      },
    });

    institutionId = inst.id;

    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Technical Campus',
        code: `TC-${timestamp.toString().slice(-4)}`,
        address: 'Mirpur 10, Dhaka',
      },
    });

    const student = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `STU-RTP-${timestamp.toString().slice(-5)}`,
        admissionNumber: `ADM-${timestamp.toString().slice(-5)}`,
        firstName: 'Tanvir',
        lastName: 'Hasan',
        gender: 'Male',
        dateOfBirth: new Date('2003-08-10'),
        presentAddress: 'Mirpur, Dhaka',
        permanentAddress: 'Mirpur, Dhaka',
        status: UserStatus.ACTIVE,
      },
    });
    studentId = student.id;

    adminUser = {
      id: `USR-REF-${timestamp}`,
      name: 'Bursar',
      email: `bursar-${timestamp}@eduerp.us`,
      role: 'ACCOUNTANT',
      tenantId: tenantSlug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    // Create & pay invoice
    const inv = await createStudentInvoice(
      tenantSlug,
      {
        studentId,
        title: 'Laboratory Caution Money',
        subTotal: 8000,
        dueDate: '2026-09-01',
      },
      adminUser
    );
    invoiceId = inv.id;

    const pay = await recordInvoicePayment(
      tenantSlug,
      {
        invoiceId: inv.id,
        amount: 8000,
        gateway: 'BKASH',
        transactionRef: `TRX-REF-ORIG-${timestamp}`,
      },
      adminUser
    );
    paymentId = pay.paymentId;
  });

  it('creates refund request in REQUESTED state', async () => {
    const refund = await requestRefund(
      tenantSlug,
      {
        studentId,
        paymentId,
        invoiceId,
        amount: 8000,
        reason: 'Refund of Laboratory Caution Deposit upon course completion',
      },
      adminUser
    );

    expect(refund.amount).toBe(8000);
    expect(refund.status).toBe('REQUESTED');
    expect(refund.requestedBy).toBe(adminUser.name);
  });

  it('approves and processes refund creating balanced double-entry accounting reversal without deleting original payment', async () => {
    const refundReq = await db.refundRequest.findFirst({
      where: { studentId, invoiceId },
    });
    expect(refundReq).toBeDefined();

    const processed = await processRefund(
      tenantSlug,
      {
        refundRequestId: refundReq!.id,
        action: 'PROCESS',
        refundMethod: 'BANK_TRANSFER',
      },
      adminUser
    );

    expect(processed.status).toBe('PROCESSED');
    expect(processed.journalEntryId).toBeDefined();

    // 1. Verify original payment transaction remains untouched
    const originalPayment = await db.paymentTransaction.findUnique({
      where: { id: paymentId },
    });
    expect(originalPayment).toBeDefined();
    expect(originalPayment?.status).toBe('SUCCESS');
    expect(originalPayment?.amount).toBe(8000);

    // 2. Verify refund journal voucher posted
    const refundJournal = await db.journalEntry.findUnique({
      where: { id: processed.journalEntryId! },
      include: { lines: { include: { account: true } } },
    });
    expect(refundJournal).toBeDefined();
    expect(refundJournal?.lines.length).toBe(2);

    const debitLine = refundJournal?.lines.find((l) => l.debitAmount > 0);
    const creditLine = refundJournal?.lines.find((l) => l.creditAmount > 0);

    expect(debitLine?.account.type).toBe('EXPENSE');
    expect(debitLine?.debitAmount).toBe(8000);
    expect(creditLine?.account.type).toBe('ASSET');
    expect(creditLine?.creditAmount).toBe(8000);
  });
});
