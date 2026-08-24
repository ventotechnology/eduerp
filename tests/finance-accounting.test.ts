import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import {
  createFiscalYear,
  closeFiscalPeriod,
  createChartOfAccount,
  createJournalEntry,
  reverseJournalEntry,
  getTrialBalance,
  getIncomeStatement,
  getBalanceSheet,
} from '@/lib/services/finance-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('Command 5: Finance & Full Accounting Engine Test Suite', () => {
  let tenantSlug: string;
  let institutionId: string;
  let adminUser: SessionUser;

  beforeAll(async () => {
    const timestamp = Date.now();
    tenantSlug = `fta-${timestamp}`;

    const tenant = await db.tenant.create({
      data: {
        slug: tenantSlug,
        institutionType: 'COLLEGE',
        subscriptionTier: 'PROFESSIONAL',
        isActive: true,
      },
    });

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: `Finance Test Academy ${timestamp}`,
        shortName: `FTA${timestamp.toString().slice(-4)}`,
        eiin: `EIIN-${timestamp.toString().slice(-5)}`,
        boardAffiliation: 'DHAKA',
        address: 'Dhanmondi, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '01700000000',
        email: `finance-${timestamp}@eduerp.us`,
        currencyCode: 'BDT',
        currencySymbol: '৳',
      },
    });

    institutionId = inst.id;

    adminUser = {
      id: `USR-FIN-ADMIN-${timestamp}`,
      name: 'Chief Accountant',
      email: `accountant-${timestamp}@eduerp.us`,
      role: 'ACCOUNTANT',
      tenantId: tenantSlug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };
  });

  it('creates hierarchical Chart of Accounts with header and leaf accounts', async () => {
    // 1. Header Assets Account
    const headerAsset = await createChartOfAccount(
      tenantSlug,
      {
        code: '1000',
        name: 'Current Assets',
        type: 'ASSET',
        isHeader: true,
      },
      adminUser
    );
    expect(headerAsset.isHeader).toBe(true);

    // 2. Leaf Postable Cash Account under Header
    const cashAccount = await createChartOfAccount(
      tenantSlug,
      {
        code: '1010',
        name: 'Petty Cash',
        type: 'ASSET',
        subtype: 'CASH',
        parentId: headerAsset.id,
        isHeader: false,
      },
      adminUser
    );
    expect(cashAccount.parentId).toBe(headerAsset.id);

    // 3. Postable Revenue Account
    const revenueAccount = await createChartOfAccount(
      tenantSlug,
      {
        code: '4010',
        name: 'Tuition Fee Revenue',
        type: 'REVENUE',
        subtype: 'TUITION_REVENUE',
        isHeader: false,
      },
      adminUser
    );
    expect(revenueAccount.type).toBe('REVENUE');
  });

  it('rejects posting journals to header (non-postable) accounts', async () => {
    const header = await db.chartOfAccount.findFirst({
      where: { institutionId, code: '1000' },
    });
    const rev = await db.chartOfAccount.findFirst({
      where: { institutionId, code: '4010' },
    });

    await expect(
      createJournalEntry(
        tenantSlug,
        {
          description: 'Invalid header posting attempt',
          lines: [
            { accountId: header!.id, debitAmount: 5000, creditAmount: 0 },
            { accountId: rev!.id, debitAmount: 0, creditAmount: 5000 },
          ],
        },
        adminUser
      )
    ).rejects.toThrow(/Cannot post to header account/);
  });

  it('creates balanced journal entry and updates General Ledger balances', async () => {
    const cash = await db.chartOfAccount.findFirst({
      where: { institutionId, code: '1010' },
    });
    const rev = await db.chartOfAccount.findFirst({
      where: { institutionId, code: '4010' },
    });

    const jv = await createJournalEntry(
      tenantSlug,
      {
        description: 'Tuition Fee Collection Receipt',
        lines: [
          { accountId: cash!.id, debitAmount: 25000, creditAmount: 0, memo: 'Cash Inflow' },
          { accountId: rev!.id, debitAmount: 0, creditAmount: 25000, memo: 'Tuition Revenue' },
        ],
      },
      adminUser
    );

    expect(jv.entryNumber).toMatch(/^JV-/);
    expect(jv.isPosted).toBe(true);

    const updatedCash = await db.chartOfAccount.findUnique({ where: { id: cash!.id } });
    const updatedRev = await db.chartOfAccount.findUnique({ where: { id: rev!.id } });

    expect(updatedCash?.balance).toBe(25000);
    expect(updatedRev?.balance).toBe(25000);
  });

  it('strictly rejects posting into closed accounting periods', async () => {
    const fy = await createFiscalYear(
      tenantSlug,
      {
        name: `FY 2025-2026 ${Date.now()}`,
        startDate: '2025-07-01',
        endDate: '2026-06-30',
        status: 'OPEN',
      },
      adminUser
    );

    const firstPeriod = await db.fiscalPeriod.findFirst({
      where: { fiscalYearId: fy.id },
    });

    // Close the period
    await closeFiscalPeriod(tenantSlug, firstPeriod!.id, adminUser);

    const cash = await db.chartOfAccount.findFirst({
      where: { institutionId, code: '1010' },
    });
    const rev = await db.chartOfAccount.findFirst({
      where: { institutionId, code: '4010' },
    });

    // Try posting inside the closed period dates
    await expect(
      createJournalEntry(
        tenantSlug,
        {
          entryDate: firstPeriod!.startDate,
          description: 'Backdated entry to closed period',
          lines: [
            { accountId: cash!.id, debitAmount: 1000, creditAmount: 0 },
            { accountId: rev!.id, debitAmount: 0, creditAmount: 1000 },
          ],
        },
        adminUser
      )
    ).rejects.toThrow(/closed accounting period/);
  });

  it('reverses journal entry preserving original record and adjusting ledger balances', async () => {
    const cash = await db.chartOfAccount.findFirst({
      where: { institutionId, code: '1010' },
    });
    const rev = await db.chartOfAccount.findFirst({
      where: { institutionId, code: '4010' },
    });

    const originalJv = await createJournalEntry(
      tenantSlug,
      {
        description: 'Erroneous fee deposit',
        lines: [
          { accountId: cash!.id, debitAmount: 5000, creditAmount: 0 },
          { accountId: rev!.id, debitAmount: 0, creditAmount: 5000 },
        ],
      },
      adminUser
    );

    const reversal = await reverseJournalEntry(
      tenantSlug,
      {
        journalEntryId: originalJv.id,
        reason: 'Duplicate deposit reversal requested by auditor',
      },
      adminUser
    );

    expect(reversal.entryNumber).toMatch(/^REV-/);

    const checkedOriginal = await db.journalEntry.findUnique({ where: { id: originalJv.id } });
    expect(checkedOriginal?.isReversed).toBe(true);
    expect(checkedOriginal?.status).toBe('REVERSED');
  });

  it('generates a balanced Trial Balance and accurate Income Statement', async () => {
    const trialBalance = await getTrialBalance(tenantSlug);
    expect(trialBalance.isBalanced).toBe(true);
    expect(trialBalance.totalDebits).toBe(trialBalance.totalCredits);

    const incomeStatement = await getIncomeStatement(tenantSlug);
    expect(incomeStatement.totalRevenue).toBe(25000);
    expect(incomeStatement.netSurplus).toBe(25000);

    const balanceSheet = await getBalanceSheet(tenantSlug);
    expect(balanceSheet.isBalanced).toBe(true);
    expect(balanceSheet.totalAssets).toBe(balanceSheet.totalLiabilitiesAndEquity);
  });
});
