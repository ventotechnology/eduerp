import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import {
  createChartOfAccount,
  createJournalEntry,
  createStudentInvoice,
  getTenantInvoices,
} from '@/lib/services/finance-service';
import { requirePermission } from '@/lib/rbac/guard';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('Command 5: Financial Governance, Lock Date & Cross-Tenant Isolation', () => {
  let tenantA: string;
  let institutionAId: string;
  let tenantB: string;
  let institutionBId: string;
  let accountantA: SessionUser;
  let teacherUser: SessionUser;

  beforeAll(async () => {
    const ts = Date.now();

    // Tenant A
    tenantA = `gsa-${ts}`;
    const tA = await db.tenant.create({
      data: {
        slug: tenantA,
        institutionType: 'SCHOOL',
        subscriptionTier: 'PROFESSIONAL',
        isActive: true,
      },
    });

    const instA = await db.institution.create({
      data: {
        tenantId: tA.id,
        name: `Gov School Alpha ${ts}`,
        shortName: `GSA${ts.toString().slice(-4)}`,
        eiin: `EIIN-${ts.toString().slice(-5)}`,
        boardAffiliation: 'DHAKA',
        address: 'Dhanmondi',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '01755555551',
        email: `gsa-${ts}@eduerp.us`,
      },
    });
    institutionAId = instA.id;

    // Tenant B
    tenantB = `gsb-${ts}`;
    const tB = await db.tenant.create({
      data: {
        slug: tenantB,
        institutionType: 'SCHOOL',
        subscriptionTier: 'PROFESSIONAL',
        isActive: true,
      },
    });

    const instB = await db.institution.create({
      data: {
        tenantId: tB.id,
        name: `Gov School Beta ${ts}`,
        shortName: `GSB${ts.toString().slice(-4)}`,
        eiin: `EIIN-${ts.toString().slice(-5)}`,
        boardAffiliation: 'DHAKA',
        address: 'Gulshan',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Gulshan',
        phone: '01755555552',
        email: `gsb-${ts}@eduerp.us`,
      },
    });
    institutionBId = instB.id;

    accountantA = {
      id: `USR-ACC-A-${ts}`,
      name: 'Accountant Alpha',
      email: `acc-a-${ts}@eduerp.us`,
      role: 'ACCOUNTANT',
      tenantId: tenantA,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    teacherUser = {
      id: `USR-TCH-A-${ts}`,
      name: 'Teacher John',
      email: `teacher-${ts}@eduerp.us`,
      role: 'TEACHER',
      tenantId: tenantA,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };
  });

  it('strictly enforces financial lock date to prevent backdated modifications after audit', async () => {
    // Set financial lock date to June 30, 2026
    await db.institution.update({
      where: { id: institutionAId },
      data: { financialLockDate: new Date('2026-06-30') },
    });

    const cash = await createChartOfAccount(
      tenantA,
      { code: '1001', name: 'Cash', type: 'ASSET' },
      accountantA
    );
    const rev = await createChartOfAccount(
      tenantA,
      { code: '4001', name: 'Revenue', type: 'REVENUE' },
      accountantA
    );

    // Attempting to post transaction on May 15, 2026 (before lock date)
    await expect(
      createJournalEntry(
        tenantA,
        {
          entryDate: '2026-05-15',
          description: 'Backdated prior year entry',
          lines: [
            { accountId: cash.id, debitAmount: 5000, creditAmount: 0 },
            { accountId: rev.id, debitAmount: 0, creditAmount: 5000 },
          ],
        },
        accountantA
      )
    ).rejects.toThrow(/financial lock date/);
  });

  it('guarantees strict cross-tenant isolation for all financial records', async () => {
    // Create student and invoice in Tenant A
    const campusA = await db.campus.create({
      data: { institutionId: institutionAId, name: 'Campus A', code: `CA-${Date.now().toString().slice(-4)}`, address: 'Dhaka' },
    });
    const studentA = await db.student.create({
      data: {
        campusId: campusA.id,
        studentIdNumber: `STU-A-${Date.now().toString().slice(-4)}`,
        admissionNumber: `ADM-A-${Date.now().toString().slice(-4)}`,
        firstName: 'Rahim',
        lastName: 'Uddin',
        gender: 'Male',
        dateOfBirth: new Date('2012-01-01'),
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        status: UserStatus.ACTIVE,
      },
    });

    await createStudentInvoice(
      tenantA,
      {
        studentId: studentA.id,
        title: 'Tuition Fee Alpha',
        subTotal: 5000,
        dueDate: '2026-10-01',
      },
      accountantA
    );

    // Tenant B querying invoices should see 0 records from Tenant A
    const invoicesB = await getTenantInvoices(tenantB);
    expect(invoicesB.length).toBe(0);

    // Attempting to post journal in Tenant B using Tenant A's account ID must be rejected
    const cashA = await db.chartOfAccount.findFirst({ where: { institutionId: institutionAId, code: '1001' } });
    await expect(
      createJournalEntry(
        tenantB,
        {
          description: 'Cross-tenant breach attempt',
          lines: [
            { accountId: cashA!.id, debitAmount: 1000, creditAmount: 0 },
            { accountId: cashA!.id, debitAmount: 0, creditAmount: 1000 },
          ],
        },
        accountantA
      )
    ).rejects.toThrow(/do not exist in this institution/);
  });

  it('enforces RBAC preventing unauthorized roles from posting general ledger journals', () => {
    expect(() => {
      requirePermission(teacherUser, 'CREATE', 'ACCOUNTING_LEDGER');
    }).toThrow(/FORBIDDEN/i);
  });
});
