import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db';
import { recordInvoicePayment, createStudentInvoice } from '@/lib/services/finance-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('Finance Invoicing, Partial Payments & Idempotency Engine', () => {
  const actor: SessionUser = {
    id: 'USR-ACCOUNTANT',
    email: 'accountant@dims.edu.bd',
    name: 'Chief Accountant Kamal',
    role: 'ACCOUNTANT',
    tenantId: 'dhaka-ideal-school',
    status: UserStatus.ACTIVE,
    isPlatformAdmin: false
  };

  it('handles partial payment allocations and enforces transaction idempotency', async () => {
    const student = await db.student.findFirst({
      where: { campus: { institution: { tenant: { slug: 'dhaka-ideal-school' } } } }
    });

    if (!student) {
      throw new Error('Seed data missing student');
    }

    // 1. Create Invoice for 10,000 BDT
    const invoice = await createStudentInvoice(
      'dhaka-ideal-school',
      {
        studentId: student.id,
        title: 'Term 2 Tuition & Development Fee',
        subTotal: 10000,
        discountAmount: 0,
        fineAmount: 0,
        dueDate: '2026-09-30'
      },
      actor
    );

    expect(invoice.totalAmount).toBe(10000);
    expect(invoice.status).toBe('UNPAID');

    // 2. Partial Payment: 4,000 BDT
    const txRef1 = `TXN-BKASH-${Date.now()}-A`;
    const payment1 = await recordInvoicePayment(
      'dhaka-ideal-school',
      {
        invoiceId: invoice.id,
        amount: 4000,
        gateway: 'BKASH',
        transactionRef: txRef1
      },
      actor
    );

    expect(payment1.paidAmount).toBe(4000);
    expect(payment1.dueAmount).toBe(6000);
    expect(payment1.status).toBe('PARTIALLY_PAID');
    expect(payment1.journalEntryNumber).toMatch(/^JV-REC-\d{6}$/);

    // 3. Idempotency Check: Submitting same transactionRef must fail
    await expect(
      recordInvoicePayment(
        'dhaka-ideal-school',
        {
          invoiceId: invoice.id,
          amount: 4000,
          gateway: 'BKASH',
          transactionRef: txRef1
        },
        actor
      )
    ).rejects.toThrow(/Duplicate payment reference/);

    // 4. Settle remaining 6,000 BDT
    const txRef2 = `TXN-NAGAD-${Date.now()}-B`;
    const payment2 = await recordInvoicePayment(
      'dhaka-ideal-school',
      {
        invoiceId: invoice.id,
        amount: 6000,
        gateway: 'NAGAD',
        transactionRef: txRef2
      },
      actor
    );

    expect(payment2.paidAmount).toBe(10000);
    expect(payment2.dueAmount).toBe(0);
    expect(payment2.status).toBe('PAID');
  });
});
