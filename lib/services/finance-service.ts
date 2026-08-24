import { db } from '../db';
import { AppError } from '../errors/app-error';
import { logAuditEvent } from '../audit/audit-logger';
import {
  InvoiceCreateSchema,
  PaymentRecordSchema,
  FiscalYearCreateSchema,
  FiscalPeriodCreateSchema,
  FiscalPeriodReopenSchema,
  ChartOfAccountCreateSchema,
  CostCenterCreateSchema,
  FundCreateSchema,
  JournalVoucherCreateSchema,
  JournalReversalSchema,
  FeeTypeCreateSchema,
  FeeStructureCreateSchema,
  BatchBillingGenerateSchema,
  LateFeeRuleCreateSchema,
  ScholarshipMasterCreateSchema,
  ScholarshipApplicationCreateSchema,
  ScholarshipReviewSchema,
  ScholarshipAwardCreateSchema,
  FeeWaiverCreateSchema,
  RefundRequestCreateSchema,
  RefundProcessSchema,
  InstitutionBankAccountCreateSchema,
  ChequeRecordCreateSchema,
  ChequeStatusUpdateSchema,
  VendorCreateSchema,
  VendorBillCreateSchema,
  ExpenseRequestCreateSchema,
  BudgetCreateSchema,
  BudgetRevisionSchema,
  SalaryStructureCreateSchema,
  EmployeeSalaryAssignmentSchema,
  PayrollPeriodCreateSchema,
  EmployeeLoanCreateSchema,
  SalaryAdvanceCreateSchema,
} from '../validations/schemas';
import { SessionUser } from '../auth/types';
import { requireTenant } from '../tenant/tenant-guard';
import {
  toMinorUnits,
  fromMinorUnits,
  roundMoney,
  addMoney,
  subtractMoney,
  calculatePercentage,
  areAmountsBalanced,
  calculateNetInvoiceAmount,
  calculateNetPayrollBreakdown,
  formatMoney,
  DEFAULT_CURRENCY,
  CurrencyConfig,
} from '../utils/money';

// ============================================================================
// 1. Double-Entry Balance Validation & Helpers
// ============================================================================

export interface JournalLineInput {
  accountId: string;
  costCenterId?: string;
  fundId?: string;
  debitAmount: number;
  creditAmount: number;
  memo?: string;
}

export interface JournalValidationResult {
  isValid: boolean;
  totalDebits: number;
  totalCredits: number;
  difference: number;
  errorMessage?: string;
}

/**
 * Validates strict double-entry balance using integer minor units.
 * Sum(Debits) MUST equal Sum(Credits).
 */
export function validateJournalEntryBalance(lines: JournalLineInput[], precision: number = 2): JournalValidationResult {
  if (!lines || lines.length < 2) {
    return {
      isValid: false,
      totalDebits: 0,
      totalCredits: 0,
      difference: 0,
      errorMessage: 'Double-entry journal voucher must contain at least 2 lines (at least one Debit and one Credit).',
    };
  }

  let debitsMinor = 0;
  let creditsMinor = 0;

  for (const line of lines) {
    if (line.debitAmount < 0 || line.creditAmount < 0) {
      return {
        isValid: false,
        totalDebits: 0,
        totalCredits: 0,
        difference: 0,
        errorMessage: 'Debit and Credit amounts cannot be negative.',
      };
    }
    debitsMinor += toMinorUnits(line.debitAmount, precision);
    creditsMinor += toMinorUnits(line.creditAmount, precision);
  }

  const diffMinor = Math.abs(debitsMinor - creditsMinor);
  const totalDebits = fromMinorUnits(debitsMinor, precision);
  const totalCredits = fromMinorUnits(creditsMinor, precision);
  const difference = fromMinorUnits(diffMinor, precision);

  if (diffMinor !== 0) {
    return {
      isValid: false,
      totalDebits,
      totalCredits,
      difference,
      errorMessage: `Unbalanced Journal Entry: Total Debits (${totalDebits}) does not match Total Credits (${totalCredits}). Difference: ${difference}`,
    };
  }

  return {
    isValid: true,
    totalDebits,
    totalCredits,
    difference: 0,
  };
}

/**
 * Helper to ensure a date is not in a closed period and is after the financial lock date.
 */
async function validatePostingDate(institutionId: string, entryDate: Date) {
  const institution = await db.institution.findUnique({
    where: { id: institutionId },
    select: { financialLockDate: true },
  });

  if (institution?.financialLockDate && entryDate <= institution.financialLockDate) {
    throw AppError.conflict(
      `Transaction date (${entryDate.toISOString().split('T')[0]}) is on or before the institution's financial lock date (${institution.financialLockDate.toISOString().split('T')[0]}).`
    );
  }

  const closedPeriod = await db.fiscalPeriod.findFirst({
    where: {
      institutionId,
      isClosed: true,
      startDate: { lte: entryDate },
      endDate: { gte: entryDate },
    },
  });

  if (closedPeriod) {
    throw AppError.conflict(
      `Cannot post transaction into closed accounting period '${closedPeriod.name}' (${closedPeriod.startDate.toISOString().split('T')[0]} to ${closedPeriod.endDate.toISOString().split('T')[0]}).`
    );
  }
}

// ============================================================================
// 2. Fiscal Year & Fiscal Periods Management
// ============================================================================

export async function createFiscalYear(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = FiscalYearCreateSchema.parse(rawData);

  const startDate = new Date(validated.startDate);
  const endDate = new Date(validated.endDate);

  if (endDate <= startDate) {
    throw AppError.validation('End date must be after start date.');
  }

  const existing = await db.fiscalYear.findFirst({
    where: { institutionId: tenant.institutionId, name: validated.name },
  });
  if (existing) {
    throw AppError.conflict(`Fiscal Year '${validated.name}' already exists.`);
  }

  return db.$transaction(async (tx) => {
    if (validated.isCurrent) {
      await tx.fiscalYear.updateMany({
        where: { institutionId: tenant.institutionId },
        data: { isCurrent: false },
      });
    }

    const fiscalYear = await tx.fiscalYear.create({
      data: {
        institutionId: tenant.institutionId,
        name: validated.name,
        startDate,
        endDate,
        status: validated.status,
        isCurrent: validated.isCurrent,
      },
    });

    // Auto-generate 12 monthly periods
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    let curStart = new Date(startDate);
    while (curStart < endDate) {
      const curEnd = new Date(curStart.getFullYear(), curStart.getMonth() + 1, 0, 23, 59, 59);
      const periodEnd = curEnd > endDate ? endDate : curEnd;
      const periodName = `${monthNames[curStart.getMonth()]} ${curStart.getFullYear()}`;

      await tx.fiscalPeriod.create({
        data: {
          institutionId: tenant.institutionId,
          fiscalYearId: fiscalYear.id,
          name: periodName,
          startDate: new Date(curStart),
          endDate: periodEnd,
          isClosed: false,
        },
      });

      curStart = new Date(curStart.getFullYear(), curStart.getMonth() + 1, 1);
    }

    await logAuditEvent({
      tenantId: tenant.tenantId,
      actor,
      action: 'FISCAL_YEAR_CREATED',
      resourceType: 'FiscalYear',
      resourceId: fiscalYear.id,
      newState: { name: fiscalYear.name, startDate, endDate },
    });

    return fiscalYear;
  });
}

export async function closeFiscalPeriod(tenantIdentifier: string, periodId: string, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);

  const period = await db.fiscalPeriod.findFirst({
    where: { id: periodId, institutionId: tenant.institutionId },
  });
  if (!period) throw AppError.notFound('Fiscal period not found.');
  if (period.isClosed) throw AppError.conflict('Fiscal period is already closed.');

  const updated = await db.fiscalPeriod.update({
    where: { id: period.id },
    data: {
      isClosed: true,
      closedAt: new Date(),
      closedBy: actor.name || actor.email,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'FISCAL_PERIOD_CLOSED',
    resourceType: 'FiscalPeriod',
    resourceId: period.id,
    newState: { isClosed: true, closedBy: actor.name },
  });

  return updated;
}

export async function reopenFiscalPeriod(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = FiscalPeriodReopenSchema.parse(rawData);

  const period = await db.fiscalPeriod.findFirst({
    where: { id: validated.periodId, institutionId: tenant.institutionId },
  });
  if (!period) throw AppError.notFound('Fiscal period not found.');
  if (!period.isClosed) throw AppError.conflict('Fiscal period is not closed.');

  const updated = await db.fiscalPeriod.update({
    where: { id: period.id },
    data: {
      isClosed: false,
      reopenedAt: new Date(),
      reopenedBy: actor.name || actor.email,
      reopenedReason: validated.reason,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'FISCAL_PERIOD_REOPENED',
    resourceType: 'FiscalPeriod',
    resourceId: period.id,
    newState: { isClosed: false, reopenedReason: validated.reason },
  });

  return updated;
}

// ============================================================================
// 3. Chart of Accounts (COA) Hierarchy & Opening Balances
// ============================================================================

export async function createChartOfAccount(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = ChartOfAccountCreateSchema.parse(rawData);

  const existing = await db.chartOfAccount.findUnique({
    where: {
      institutionId_code: {
        institutionId: tenant.institutionId,
        code: validated.code,
      },
    },
  });

  if (existing) {
    throw AppError.conflict(`Account code '${validated.code}' already exists in this institution.`);
  }

  if (validated.parentId) {
    const parent = await db.chartOfAccount.findFirst({
      where: { id: validated.parentId, institutionId: tenant.institutionId },
    });
    if (!parent) throw AppError.notFound('Parent account not found.');
  }

  const account = await db.chartOfAccount.create({
    data: {
      institutionId: tenant.institutionId,
      code: validated.code,
      name: validated.name,
      type: validated.type,
      subtype: validated.subtype,
      parentId: validated.parentId,
      isHeader: validated.isHeader,
      currency: validated.currency,
      balance: 0,
      isActive: true,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CHART_OF_ACCOUNT_CREATED',
    resourceType: 'ChartOfAccount',
    resourceId: account.id,
    newState: { code: account.code, name: account.name, type: account.type },
  });

  return account;
}

export async function getChartOfAccounts(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);
  return db.chartOfAccount.findMany({
    where: { institutionId: tenant.institutionId },
    include: {
      parent: true,
      children: true,
    },
    orderBy: { code: 'asc' },
  });
}

export async function initializeStandardChartOfAccounts(tenantIdentifier: string, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);

  const standardAccounts = [
    // 1. Assets
    { code: '1000', name: 'Assets', type: 'ASSET', subtype: 'CURRENT_ASSET', isHeader: true },
    { code: '1010', name: 'Cash on Hand', type: 'ASSET', subtype: 'CURRENT_ASSET', parentCode: '1000', isHeader: false },
    { code: '1020', name: 'Bank Accounts', type: 'ASSET', subtype: 'CURRENT_ASSET', parentCode: '1000', isHeader: false },
    { code: '1030', name: 'Student Fees Receivable', type: 'ASSET', subtype: 'ACCOUNTS_RECEIVABLE', parentCode: '1000', isHeader: false },
    { code: '1040', name: 'Inventory & Academic Supplies', type: 'ASSET', subtype: 'CURRENT_ASSET', parentCode: '1000', isHeader: false },
    { code: '1050', name: 'Campus Fixed Assets & Equipment', type: 'ASSET', subtype: 'FIXED_ASSET', parentCode: '1000', isHeader: false },
    { code: '1060', name: 'Accumulated Depreciation', type: 'ASSET', subtype: 'ACCUMULATED_DEPRECIATION', parentCode: '1000', isHeader: false },

    // 2. Liabilities
    { code: '2000', name: 'Liabilities', type: 'LIABILITY', subtype: 'CURRENT_LIABILITY', isHeader: true },
    { code: '2010', name: 'Accounts Payable & Vendors', type: 'LIABILITY', subtype: 'ACCOUNTS_PAYABLE', parentCode: '2000', isHeader: false },
    { code: '2020', name: 'Staff Salaries & Benefits Payable', type: 'LIABILITY', subtype: 'CURRENT_LIABILITY', parentCode: '2000', isHeader: false },
    { code: '2030', name: 'Tax, VAT & Govt. Levies Payable', type: 'LIABILITY', subtype: 'CURRENT_LIABILITY', parentCode: '2000', isHeader: false },
    { code: '2040', name: 'Unearned / Advance Tuition Fees', type: 'LIABILITY', subtype: 'CURRENT_LIABILITY', parentCode: '2000', isHeader: false },

    // 3. Equity / Institutional Fund
    { code: '3000', name: 'Institutional Equity & Funds', type: 'EQUITY', subtype: 'RETAINED_EARNINGS', isHeader: true },
    { code: '3010', name: 'Institutional Capital & Waqf Fund', type: 'EQUITY', subtype: 'RETAINED_EARNINGS', parentCode: '3000', isHeader: false },
    { code: '3020', name: 'Retained Operating Surplus', type: 'EQUITY', subtype: 'RETAINED_EARNINGS', parentCode: '3000', isHeader: false },

    // 4. Revenue / Income
    { code: '4000', name: 'Academic & Institutional Revenue', type: 'REVENUE', subtype: 'OPERATING_REVENUE', isHeader: true },
    { code: '4010', name: 'Tuition & Academic Fees Income', type: 'REVENUE', subtype: 'OPERATING_REVENUE', parentCode: '4000', isHeader: false },
    { code: '4020', name: 'Admission & Registration Fees', type: 'REVENUE', subtype: 'OPERATING_REVENUE', parentCode: '4000', isHeader: false },
    { code: '4030', name: 'Examination & Evaluation Fees', type: 'REVENUE', subtype: 'OPERATING_REVENUE', parentCode: '4000', isHeader: false },
    { code: '4040', name: 'Tahfiz / Specialized Program Fees', type: 'REVENUE', subtype: 'OPERATING_REVENUE', parentCode: '4000', isHeader: false },
    { code: '4050', name: 'Hostel, Transport & Facility Fees', type: 'REVENUE', subtype: 'OPERATING_REVENUE', parentCode: '4000', isHeader: false },
    { code: '4090', name: 'Institutional Donations & Grants', type: 'REVENUE', subtype: 'NON_OPERATING_REVENUE', parentCode: '4000', isHeader: false },

    // 5. Operating Expenses
    { code: '5000', name: 'Operating & Administrative Expenses', type: 'EXPENSE', subtype: 'OPERATING_EXPENSE', isHeader: true },
    { code: '5010', name: 'Faculty & Academic Salaries', type: 'EXPENSE', subtype: 'OPERATING_EXPENSE', parentCode: '5000', isHeader: false },
    { code: '5020', name: 'Administrative & Support Staff Wages', type: 'EXPENSE', subtype: 'OPERATING_EXPENSE', parentCode: '5000', isHeader: false },
    { code: '5030', name: 'Campus Rent, Electricity & Utilities', type: 'EXPENSE', subtype: 'OPERATING_EXPENSE', parentCode: '5000', isHeader: false },
    { code: '5040', name: 'Curriculum & Educational Supplies', type: 'EXPENSE', subtype: 'OPERATING_EXPENSE', parentCode: '5000', isHeader: false },
    { code: '5050', name: 'Campus Facility Maintenance & Repairs', type: 'EXPENSE', subtype: 'OPERATING_EXPENSE', parentCode: '5000', isHeader: false },
    { code: '5060', name: 'IT, Software & Communication', type: 'EXPENSE', subtype: 'OPERATING_EXPENSE', parentCode: '5000', isHeader: false },
  ];

  const createdAccounts = [];
  // 1. Create Headers first
  for (const item of standardAccounts.filter((a) => a.isHeader)) {
    const existing = await db.chartOfAccount.findUnique({
      where: {
        institutionId_code: {
          institutionId: tenant.institutionId,
          code: item.code,
        },
      },
    });
    if (!existing) {
      const created = await db.chartOfAccount.create({
        data: {
          institutionId: tenant.institutionId,
          code: item.code,
          name: item.name,
          type: item.type as any,
          subtype: item.subtype as any,
          isHeader: true,
          currency: 'BDT',
          balance: 0,
          isActive: true,
        },
      });
      createdAccounts.push(created);
    }
  }

  // 2. Create Child Accounts
  for (const item of standardAccounts.filter((a) => !a.isHeader)) {
    const existing = await db.chartOfAccount.findUnique({
      where: {
        institutionId_code: {
          institutionId: tenant.institutionId,
          code: item.code,
        },
      },
    });
    if (!existing) {
      const parent = item.parentCode
        ? await db.chartOfAccount.findUnique({
            where: {
              institutionId_code: {
                institutionId: tenant.institutionId,
                code: item.parentCode,
              },
            },
          })
        : null;

      const created = await db.chartOfAccount.create({
        data: {
          institutionId: tenant.institutionId,
          code: item.code,
          name: item.name,
          type: item.type as any,
          subtype: item.subtype as any,
          parentId: parent?.id || null,
          isHeader: false,
          currency: 'BDT',
          balance: 0,
          isActive: true,
        },
      });
      createdAccounts.push(created);
    }
  }

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CHART_OF_ACCOUNT_INITIALIZED',
    resourceType: 'ChartOfAccount',
    resourceId: tenant.institutionId,
    newState: { createdCount: createdAccounts.length },
  });

  return getChartOfAccounts(tenantIdentifier);
}

export async function createCostCenter(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = CostCenterCreateSchema.parse(rawData);

  const costCenter = await db.costCenter.create({
    data: {
      institutionId: tenant.institutionId,
      code: validated.code,
      name: validated.name,
      departmentId: validated.departmentId,
      campusId: validated.campusId,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'COST_CENTER_CREATED',
    resourceType: 'CostCenter',
    resourceId: costCenter.id,
    newState: { code: costCenter.code, name: costCenter.name },
  });

  return costCenter;
}

export async function createFund(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = FundCreateSchema.parse(rawData);

  const fund = await db.fund.create({
    data: {
      institutionId: tenant.institutionId,
      code: validated.code,
      name: validated.name,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'FUND_CREATED',
    resourceType: 'Fund',
    resourceId: fund.id,
    newState: { code: fund.code, name: fund.name },
  });

  return fund;
}

// ============================================================================
// 4. Double-Entry Journal Engine & General Ledger Posting
// ============================================================================

export async function createJournalEntry(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = JournalVoucherCreateSchema.parse(rawData);

  const entryDate = validated.entryDate ? new Date(validated.entryDate) : new Date();

  // 1. Validate posting date against lock date and closed fiscal periods
  await validatePostingDate(tenant.institutionId, entryDate);

  // 2. Validate double-entry balance
  const balanceCheck = validateJournalEntryBalance(validated.lines);
  if (!balanceCheck.isValid) {
    throw AppError.validation(balanceCheck.errorMessage || 'Journal entry is not balanced.');
  }

  // 3. Validate accounts exist and are postable (not headers)
  const accountIds = validated.lines.map((l) => l.accountId);
  const accounts = await db.chartOfAccount.findMany({
    where: {
      id: { in: accountIds },
      institutionId: tenant.institutionId,
    },
  });

  if (accounts.length !== accountIds.length) {
    throw AppError.notFound('One or more selected accounts do not exist in this institution.');
  }

  const headerAccount = accounts.find((a) => a.isHeader);
  if (headerAccount) {
    throw AppError.validation(`Cannot post to header account '${headerAccount.name}' (${headerAccount.code}).`);
  }

  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const entryNumber = `JV-${entryDate.getFullYear()}-${Date.now().toString().slice(-6)}`;

  return db.$transaction(async (tx) => {
    const journalEntry = await tx.journalEntry.create({
      data: {
        institutionId: tenant.institutionId,
        fiscalYearId: validated.fiscalYearId,
        fiscalPeriodId: validated.fiscalPeriodId,
        entryNumber,
        entryDate,
        description: validated.description,
        reference: validated.reference,
        sourceType: validated.sourceType,
        sourceId: validated.sourceId,
        status: 'POSTED',
        postedBy: actor.name || actor.email,
        isPosted: true,
        lines: {
          create: validated.lines.map((l) => ({
            accountId: l.accountId,
            costCenterId: l.costCenterId,
            fundId: l.fundId,
            debitAmount: roundMoney(l.debitAmount),
            creditAmount: roundMoney(l.creditAmount),
            memo: l.memo,
          })),
        },
      },
      include: {
        lines: {
          include: { account: true },
        },
      },
    });

    // Update account balances
    for (const line of validated.lines) {
      const acc = accountMap.get(line.accountId)!;
      let balanceChange = 0;

      // Normal balance: ASSET/EXPENSE debit increases balance, LIABILITY/EQUITY/REVENUE credit increases balance
      if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
        balanceChange = line.debitAmount - line.creditAmount;
      } else {
        balanceChange = line.creditAmount - line.debitAmount;
      }

      await tx.chartOfAccount.update({
        where: { id: acc.id },
        data: {
          balance: { increment: roundMoney(balanceChange) },
        },
      });
    }

    await logAuditEvent({
      tenantId: tenant.tenantId,
      actor,
      action: 'JOURNAL_ENTRY_POSTED',
      resourceType: 'JournalEntry',
      resourceId: journalEntry.id,
      newState: {
        entryNumber: journalEntry.entryNumber,
        totalDebits: balanceCheck.totalDebits,
        totalCredits: balanceCheck.totalCredits,
      },
    });

    return journalEntry;
  });
}

export async function reverseJournalEntry(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = JournalReversalSchema.parse(rawData);

  const original = await db.journalEntry.findFirst({
    where: { id: validated.journalEntryId, institutionId: tenant.institutionId },
    include: { lines: true },
  });

  if (!original) throw AppError.notFound('Journal entry not found.');
  if (original.isReversed) throw AppError.conflict('Journal entry has already been reversed.');

  const reversalDate = new Date();
  await validatePostingDate(tenant.institutionId, reversalDate);

  const reversalNumber = `REV-${Date.now().toString().slice(-6)}`;

  // Reversal lines invert debits and credits
  const reversalLines = original.lines.map((l) => ({
    accountId: l.accountId,
    costCenterId: l.costCenterId || undefined,
    fundId: l.fundId || undefined,
    debitAmount: l.creditAmount,
    creditAmount: l.debitAmount,
    memo: `Reversal of ${original.entryNumber}: ${l.memo || ''}`,
  }));

  const accounts = await db.chartOfAccount.findMany({
    where: {
      id: { in: original.lines.map((l) => l.accountId) },
    },
  });
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  return db.$transaction(async (tx) => {
    // 1. Create reversal journal
    const reversalEntry = await tx.journalEntry.create({
      data: {
        institutionId: tenant.institutionId,
        entryNumber: reversalNumber,
        entryDate: reversalDate,
        description: `REVERSAL of ${original.entryNumber}: ${validated.reason}`,
        reference: original.entryNumber,
        sourceType: original.sourceType,
        sourceId: original.id,
        status: 'POSTED',
        postedBy: actor.name || actor.email,
        isPosted: true,
        reversalOfId: original.id,
        reversalReason: validated.reason,
        lines: {
          create: reversalLines,
        },
      },
    });

    // 2. Mark original entry as reversed
    await tx.journalEntry.update({
      where: { id: original.id },
      data: {
        isReversed: true,
        status: 'REVERSED',
      },
    });

    // 3. Revert COA balances
    for (const line of reversalLines) {
      const acc = accountMap.get(line.accountId)!;
      let balanceChange = 0;
      if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
        balanceChange = line.debitAmount - line.creditAmount;
      } else {
        balanceChange = line.creditAmount - line.debitAmount;
      }

      await tx.chartOfAccount.update({
        where: { id: acc.id },
        data: {
          balance: { increment: roundMoney(balanceChange) },
        },
      });
    }

    await logAuditEvent({
      tenantId: tenant.tenantId,
      actor,
      action: 'JOURNAL_ENTRY_REVERSED',
      resourceType: 'JournalEntry',
      resourceId: original.id,
      newState: { reversalNumber, reason: validated.reason },
    });

    return reversalEntry;
  });
}

// ============================================================================
// 5. Financial Reporting & Statements
// ============================================================================

export async function getGeneralLedger(
  tenantIdentifier: string,
  params: {
    accountId?: string;
    fiscalYearId?: string;
    startDate?: string;
    endDate?: string;
    costCenterId?: string;
  }
) {
  const tenant = await requireTenant(tenantIdentifier);

  const whereClause: any = {
    journalEntry: {
      institutionId: tenant.institutionId,
      isPosted: true,
    },
  };

  if (params.accountId) whereClause.accountId = params.accountId;
  if (params.costCenterId) whereClause.costCenterId = params.costCenterId;
  if (params.fiscalYearId) whereClause.journalEntry.fiscalYearId = params.fiscalYearId;

  if (params.startDate || params.endDate) {
    whereClause.journalEntry.entryDate = {};
    if (params.startDate) whereClause.journalEntry.entryDate.gte = new Date(params.startDate);
    if (params.endDate) whereClause.journalEntry.entryDate.lte = new Date(params.endDate);
  }

  const lines = await db.journalLine.findMany({
    where: whereClause,
    include: {
      account: true,
      journalEntry: true,
      costCenter: true,
      fund: true,
    },
    orderBy: {
      journalEntry: { entryDate: 'asc' },
    },
  });

  return lines;
}

export async function getTrialBalance(tenantIdentifier: string, asOfDate?: string) {
  const tenant = await requireTenant(tenantIdentifier);

  const accounts = await db.chartOfAccount.findMany({
    where: {
      institutionId: tenant.institutionId,
      isHeader: false,
    },
    include: {
      journalLines: {
        where: {
          journalEntry: {
            isPosted: true,
            ...(asOfDate ? { entryDate: { lte: new Date(asOfDate) } } : {}),
          },
        },
      },
    },
    orderBy: { code: 'asc' },
  });

  let totalDebits = 0;
  let totalCredits = 0;

  const rows = accounts.map((acc) => {
    let debitSum = 0;
    let creditSum = 0;

    for (const l of acc.journalLines) {
      debitSum += l.debitAmount;
      creditSum += l.creditAmount;
    }

    let netDebit = 0;
    let netCredit = 0;

    if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
      const net = debitSum - creditSum;
      if (net >= 0) netDebit = roundMoney(net);
      else netCredit = roundMoney(Math.abs(net));
    } else {
      const net = creditSum - debitSum;
      if (net >= 0) netCredit = roundMoney(net);
      else netDebit = roundMoney(Math.abs(net));
    }

    totalDebits += netDebit;
    totalCredits += netCredit;

    return {
      accountId: acc.id,
      code: acc.code,
      name: acc.name,
      type: acc.type,
      debit: netDebit,
      credit: netCredit,
    };
  });

  const balanced = areAmountsBalanced(totalDebits, totalCredits);

  return {
    rows,
    totalDebits: roundMoney(totalDebits),
    totalCredits: roundMoney(totalCredits),
    difference: roundMoney(Math.abs(totalDebits - totalCredits)),
    isBalanced: balanced,
  };
}

export async function getIncomeStatement(tenantIdentifier: string, startDate?: string, endDate?: string) {
  const tenant = await requireTenant(tenantIdentifier);

  const accounts = await db.chartOfAccount.findMany({
    where: {
      institutionId: tenant.institutionId,
      type: { in: ['REVENUE', 'EXPENSE'] },
      isHeader: false,
    },
    include: {
      journalLines: {
        where: {
          journalEntry: {
            isPosted: true,
            ...(startDate || endDate
              ? {
                  entryDate: {
                    ...(startDate ? { gte: new Date(startDate) } : {}),
                    ...(endDate ? { lte: new Date(endDate) } : {}),
                  },
                }
              : {}),
          },
        },
      },
    },
  });

  let totalRevenue = 0;
  let totalExpense = 0;

  const revenueAccounts: any[] = [];
  const expenseAccounts: any[] = [];

  for (const acc of accounts) {
    let debits = 0;
    let credits = 0;
    for (const l of acc.journalLines) {
      debits += l.debitAmount;
      credits += l.creditAmount;
    }

    if (acc.type === 'REVENUE') {
      const amount = roundMoney(credits - debits);
      totalRevenue += amount;
      revenueAccounts.push({ id: acc.id, code: acc.code, name: acc.name, amount });
    } else {
      const amount = roundMoney(debits - credits);
      totalExpense += amount;
      expenseAccounts.push({ id: acc.id, code: acc.code, name: acc.name, amount });
    }
  }

  const netSurplus = roundMoney(totalRevenue - totalExpense);

  return {
    revenues: revenueAccounts,
    totalRevenue: roundMoney(totalRevenue),
    expenses: expenseAccounts,
    totalExpense: roundMoney(totalExpense),
    netSurplus,
  };
}

export async function getBalanceSheet(tenantIdentifier: string, asOfDate?: string) {
  const tenant = await requireTenant(tenantIdentifier);

  const trialBalance = await getTrialBalance(tenantIdentifier, asOfDate);
  const incomeStatement = await getIncomeStatement(tenantIdentifier, undefined, asOfDate);

  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  const assets: any[] = [];
  const liabilities: any[] = [];
  const equity: any[] = [];

  for (const r of trialBalance.rows) {
    if (r.type === 'ASSET') {
      const amt = roundMoney(r.debit - r.credit);
      totalAssets += amt;
      assets.push({ ...r, amount: amt });
    } else if (r.type === 'LIABILITY') {
      const amt = roundMoney(r.credit - r.debit);
      totalLiabilities += amt;
      liabilities.push({ ...r, amount: amt });
    } else if (r.type === 'EQUITY') {
      const amt = roundMoney(r.credit - r.debit);
      totalEquity += amt;
      equity.push({ ...r, amount: amt });
    }
  }

  // Retained earnings includes current period surplus
  totalEquity += incomeStatement.netSurplus;
  equity.push({
    code: 'RE-CURR',
    name: 'Current Period Surplus / (Deficit)',
    type: 'EQUITY',
    amount: incomeStatement.netSurplus,
  });

  const isBalanced = areAmountsBalanced(totalAssets, totalLiabilities + totalEquity);

  return {
    assets,
    totalAssets: roundMoney(totalAssets),
    liabilities,
    totalLiabilities: roundMoney(totalLiabilities),
    equity,
    totalEquity: roundMoney(totalEquity),
    totalLiabilitiesAndEquity: roundMoney(totalLiabilities + totalEquity),
    isBalanced,
  };
}

// ============================================================================
// 6. Fee Master, Fee Structures & Automated Bulk Billing
// ============================================================================

export async function createFeeType(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = FeeTypeCreateSchema.parse(rawData);

  const feeType = await db.feeType.create({
    data: {
      institutionId: tenant.institutionId,
      name: validated.name,
      code: validated.code,
      description: validated.description,
      isTaxable: validated.isTaxable,
      taxRate: validated.taxRate,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'FEE_TYPE_CREATED',
    resourceType: 'FeeType',
    resourceId: feeType.id,
    newState: { code: feeType.code, name: feeType.name },
  });

  return feeType;
}

export async function createFeeStructure(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = FeeStructureCreateSchema.parse(rawData);

  const feeStructure = await db.feeStructure.create({
    data: {
      institutionId: tenant.institutionId,
      feeTypeId: validated.feeTypeId,
      name: validated.name,
      amount: roundMoney(validated.amount),
      frequency: validated.frequency,
      academicYearId: validated.academicYearId,
      targetClassId: validated.targetClassId,
      targetProgramId: validated.targetProgramId,
      targetClass: validated.targetClass,
      targetProgram: validated.targetProgram,
      dueDayOfMonth: validated.dueDayOfMonth,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'FEE_STRUCTURE_CREATED',
    resourceType: 'FeeStructure',
    resourceId: feeStructure.id,
    newState: { name: feeStructure.name, amount: feeStructure.amount },
  });

  return feeStructure;
}

export async function generateBatchBilling(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = BatchBillingGenerateSchema.parse(rawData);

  const feeStructure = await db.feeStructure.findFirst({
    where: { id: validated.feeStructureId, institutionId: tenant.institutionId },
    include: { feeType: true },
  });
  if (!feeStructure) throw AppError.notFound('Fee structure not found.');

  // Find target students
  const studentWhere: any = {
    status: 'ACTIVE',
    campus: { institutionId: tenant.institutionId },
  };

  if (validated.classId) {
    studentWhere.section = { classId: validated.classId };
  } else if (validated.programId) {
    studentWhere.batch = { programId: validated.programId };
  }

  const students = await db.student.findMany({
    where: studentWhere,
    include: {
      scholarshipAwards: {
        where: {
          status: 'ACTIVE',
          effectiveStartDate: { lte: new Date(validated.dueDate) },
          effectiveEndDate: { gte: new Date(validated.dueDate) },
        },
      },
      feeWaivers: {
        where: { status: 'APPROVED' },
      },
      creditBalance: true,
    },
  });

  if (students.length === 0) {
    throw AppError.notFound('No eligible active students found for batch billing.');
  }

  const dueDate = new Date(validated.dueDate);
  const baseAmount = validated.applyProration
    ? roundMoney(feeStructure.amount * validated.prorationFactor)
    : roundMoney(feeStructure.amount);

  return db.$transaction(async (tx) => {
    const generatedInvoices = [];

    for (const student of students) {
      // 1. Prevent duplicate billing for exact period
      const existing = await tx.invoice.findFirst({
        where: {
          studentId: student.id,
          title: feeStructure.name,
          billingPeriod: validated.billingPeriod,
        },
      });

      if (existing) continue;

      // 2. Calculate scholarships
      let scholarshipAmount = 0;
      for (const award of student.scholarshipAwards) {
        if (award.awardType === 'PERCENTAGE') {
          scholarshipAmount += calculatePercentage(baseAmount, award.awardValue);
        } else {
          scholarshipAmount += award.awardValue;
        }
      }
      scholarshipAmount = Math.min(baseAmount, roundMoney(scholarshipAmount));

      // 3. Tax calculation if applicable
      let taxAmount = 0;
      if (feeStructure.feeType?.isTaxable && feeStructure.feeType.taxRate > 0) {
        taxAmount = calculatePercentage(baseAmount - scholarshipAmount, feeStructure.feeType.taxRate);
      }

      const calculated = calculateNetInvoiceAmount({
        subTotal: baseAmount,
        scholarshipAmount,
        taxAmount,
      });

      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      // 4. Check advance student credit
      let paidAmount = 0;
      let advanceApplied = 0;
      let dueAmount = calculated.totalAmount;
      let status = 'UNPAID';

      if (student.creditBalance && student.creditBalance.availableCredit > 0) {
        const creditToApply = Math.min(student.creditBalance.availableCredit, calculated.totalAmount);
        advanceApplied = roundMoney(creditToApply);
        paidAmount = advanceApplied;
        dueAmount = roundMoney(calculated.totalAmount - advanceApplied);
        status = dueAmount === 0 ? 'PAID' : 'PARTIALLY_PAID';

        // Deduct student credit
        await tx.studentCreditBalance.update({
          where: { id: student.creditBalance.id },
          data: {
            availableCredit: { decrement: advanceApplied },
          },
        });

        await tx.studentCreditTransaction.create({
          data: {
            studentId: student.id,
            amount: -advanceApplied,
            type: 'ALLOCATED_TO_INVOICE',
            reference: invoiceNumber,
          },
        });
      }

      const invoice = await tx.invoice.create({
        data: {
          studentId: student.id,
          invoiceNumber,
          title: feeStructure.name,
          billingPeriod: validated.billingPeriod,
          subTotal: calculated.subTotal,
          scholarshipAmount: calculated.scholarshipAmount,
          discountAmount: 0,
          waiverAmount: 0,
          fineAmount: 0,
          taxAmount: calculated.taxAmount,
          totalAmount: calculated.totalAmount,
          paidAmount,
          dueAmount,
          advanceApplied,
          dueDate,
          status,
        },
      });

      generatedInvoices.push(invoice);
    }

    await logAuditEvent({
      tenantId: tenant.tenantId,
      actor,
      action: 'BATCH_BILLING_GENERATED',
      resourceType: 'Invoice',
      resourceId: feeStructure.id,
      newState: {
        billingPeriod: validated.billingPeriod,
        count: generatedInvoices.length,
        feeStructureName: feeStructure.name,
      },
    });

    return {
      totalGenerated: generatedInvoices.length,
      invoices: generatedInvoices,
    };
  });
}

// ============================================================================
// 7. Scholarship Management Engine
// ============================================================================

export async function createScholarshipMaster(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = ScholarshipMasterCreateSchema.parse(rawData);

  const scholarship = await db.scholarshipMaster.create({
    data: {
      institutionId: tenant.institutionId,
      name: validated.name,
      code: validated.code,
      type: validated.type,
      benefitType: validated.benefitType,
      benefitValue: validated.benefitValue,
      criteria: validated.criteria,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'SCHOLARSHIP_CREATED',
    resourceType: 'ScholarshipMaster',
    resourceId: scholarship.id,
    newState: { code: scholarship.code, name: scholarship.name },
  });

  return scholarship;
}

export async function applyScholarship(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = ScholarshipApplicationCreateSchema.parse(rawData);

  const student = await db.student.findFirst({
    where: { id: validated.studentId, campus: { institutionId: tenant.institutionId } },
  });
  if (!student) throw AppError.notFound('Student not found.');

  const application = await db.scholarshipApplication.create({
    data: {
      institutionId: tenant.institutionId,
      scholarshipId: validated.scholarshipId,
      studentId: validated.studentId,
      requestedAmount: validated.requestedAmount,
      reason: validated.reason,
      documentsUrl: validated.documentsUrl,
      status: 'PENDING',
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'SCHOLARSHIP_APPLICATION_SUBMITTED',
    resourceType: 'ScholarshipApplication',
    resourceId: application.id,
    newState: { studentId: student.id, scholarshipId: validated.scholarshipId },
  });

  return application;
}

export async function reviewScholarshipApplication(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = ScholarshipReviewSchema.parse(rawData);

  const application = await db.scholarshipApplication.findFirst({
    where: { id: validated.applicationId, institutionId: tenant.institutionId },
    include: { scholarship: true },
  });
  if (!application) throw AppError.notFound('Application not found.');

  return db.$transaction(async (tx) => {
    const updated = await tx.scholarshipApplication.update({
      where: { id: application.id },
      data: {
        status: validated.status,
        reviewRemarks: validated.remarks,
        reviewedBy: actor.name || actor.email,
        ...(validated.status === 'APPROVED' ? { approvedBy: actor.name || actor.email, approvedAt: new Date() } : {}),
      },
    });

    let award = null;
    if (validated.status === 'APPROVED') {
      const awardValue = validated.awardValue || application.scholarship.benefitValue;
      const startDate = validated.effectiveStartDate ? new Date(validated.effectiveStartDate) : new Date();
      const endDate = validated.effectiveEndDate
        ? new Date(validated.effectiveEndDate)
        : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());

      award = await tx.scholarshipAward.create({
        data: {
          institutionId: tenant.institutionId,
          scholarshipId: application.scholarshipId,
          studentId: application.studentId,
          applicationId: application.id,
          awardType: application.scholarship.benefitType,
          awardValue,
          effectiveStartDate: startDate,
          effectiveEndDate: endDate,
          status: 'ACTIVE',
          approvedBy: actor.name || actor.email,
        },
      });
    }

    await logAuditEvent({
      tenantId: tenant.tenantId,
      actor,
      action: 'SCHOLARSHIP_APPLICATION_REVIEWED',
      resourceType: 'ScholarshipApplication',
      resourceId: application.id,
      newState: { status: validated.status, awardId: award?.id },
    });

    return { application: updated, award };
  });
}

export async function grantFeeWaiver(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = FeeWaiverCreateSchema.parse(rawData);

  const student = await db.student.findFirst({
    where: { id: validated.studentId, campus: { institutionId: tenant.institutionId } },
  });
  if (!student) throw AppError.notFound('Student not found.');

  const waiver = await db.feeWaiver.create({
    data: {
      institutionId: tenant.institutionId,
      studentId: validated.studentId,
      invoiceId: validated.invoiceId,
      waiverType: validated.waiverType,
      amount: roundMoney(validated.amount),
      reason: validated.reason,
      approvedBy: actor.name || actor.email,
      status: 'APPROVED',
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'FEE_WAIVER_GRANTED',
    resourceType: 'FeeWaiver',
    resourceId: waiver.id,
    newState: { amount: waiver.amount, reason: waiver.reason, studentId: student.id },
  });

  return waiver;
}

// ============================================================================
// 8. Payment, Partial Allocation, Advance Balance & Double-Entry Posting
// ============================================================================

export async function createStudentInvoice(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = InvoiceCreateSchema.parse(rawData);

  const student = await db.student.findFirst({
    where: {
      id: validated.studentId,
      campus: { institutionId: tenant.institutionId },
    },
  });

  if (!student) throw AppError.notFound('Student not found in this institution.');

  const calculated = calculateNetInvoiceAmount({
    subTotal: validated.subTotal,
    discountAmount: validated.discountAmount,
    fineAmount: validated.fineAmount,
  });

  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

  const invoice = await db.invoice.create({
    data: {
      studentId: student.id,
      invoiceNumber,
      title: validated.title,
      subTotal: calculated.subTotal,
      discountAmount: calculated.discountAmount,
      fineAmount: calculated.fineAmount,
      totalAmount: calculated.totalAmount,
      paidAmount: 0,
      dueAmount: calculated.totalAmount,
      dueDate: new Date(validated.dueDate),
      status: 'UNPAID',
    },
    include: {
      student: true,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'FEE_INVOICE_CREATED',
    resourceType: 'Invoice',
    resourceId: invoice.id,
    newState: {
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.totalAmount,
      studentId: student.id,
    },
  });

  return invoice;
}

export async function recordInvoicePayment(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = PaymentRecordSchema.parse(rawData);

  // 1. Idempotency Check
  const existingTransaction = await db.paymentTransaction.findUnique({
    where: { transactionRef: validated.transactionRef },
  });
  if (existingTransaction) {
    throw AppError.conflict(`Duplicate payment reference '${validated.transactionRef}'. Transaction already exists.`);
  }

  // 2. Fetch Invoice
  const invoice = await db.invoice.findFirst({
    where: {
      id: validated.invoiceId,
      student: { campus: { institutionId: tenant.institutionId } },
    },
    include: {
      student: true,
    },
  });

  if (!invoice) throw AppError.notFound('Invoice not found.');
  if (invoice.status === 'PAID') throw AppError.conflict('Invoice has already been fully paid.');

  const institutionId = tenant.institutionId;
  const paymentAmount = roundMoney(validated.amount);
  const dueAmount = roundMoney(invoice.dueAmount);

  return db.$transaction(async (tx) => {
    let allocatedToInvoice = paymentAmount;
    let overpaymentCredit = 0;

    if (paymentAmount > dueAmount) {
      allocatedToInvoice = dueAmount;
      overpaymentCredit = roundMoney(paymentAmount - dueAmount);
    }

    const newPaidAmount = roundMoney(invoice.paidAmount + allocatedToInvoice);
    const newDueAmount = Math.max(0, roundMoney(invoice.totalAmount - newPaidAmount));
    const newStatus = newDueAmount === 0 ? 'PAID' : 'PARTIALLY_PAID';

    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;

    // A. Create Payment Transaction
    const payment = await tx.paymentTransaction.create({
      data: {
        invoiceId: invoice.id,
        transactionRef: validated.transactionRef,
        gateway: validated.gateway,
        amount: paymentAmount,
        receiptNumber,
        status: 'SUCCESS',
      },
    });

    // B. Create Allocation
    await tx.paymentAllocation.create({
      data: {
        paymentId: payment.id,
        invoiceId: invoice.id,
        allocatedAmount: allocatedToInvoice,
      },
    });

    // C. Update Invoice
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        status: newStatus,
      },
    });

    // D. If overpayment, record in StudentCreditBalance
    if (overpaymentCredit > 0) {
      await tx.studentCreditBalance.upsert({
        where: { studentId: invoice.studentId },
        update: {
          availableCredit: { increment: overpaymentCredit },
        },
        create: {
          institutionId,
          studentId: invoice.studentId,
          availableCredit: overpaymentCredit,
        },
      });

      await tx.studentCreditTransaction.create({
        data: {
          studentId: invoice.studentId,
          amount: overpaymentCredit,
          type: 'ADVANCE_PAYMENT',
          reference: receiptNumber,
        },
      });
    }

    // E. Double-Entry Journal Posting
    let cashAccount = await tx.chartOfAccount.findFirst({
      where: { institutionId, code: '1001' },
    });
    if (!cashAccount) {
      cashAccount = await tx.chartOfAccount.create({
        data: { institutionId, code: '1001', name: 'Cash / Bank Gateway Clearing', type: 'ASSET' },
      });
    }

    let revenueAccount = await tx.chartOfAccount.findFirst({
      where: { institutionId, code: '4001' },
    });
    if (!revenueAccount) {
      revenueAccount = await tx.chartOfAccount.create({
        data: { institutionId, code: '4001', name: 'Student Tuition & Fee Revenue', type: 'REVENUE' },
      });
    }

    let creditLiabilityAccount = null;
    if (overpaymentCredit > 0) {
      creditLiabilityAccount = await tx.chartOfAccount.findFirst({
        where: { institutionId, code: '2005' },
      });
      if (!creditLiabilityAccount) {
        creditLiabilityAccount = await tx.chartOfAccount.create({
          data: { institutionId, code: '2005', name: 'Student Advance Credit Payable', type: 'LIABILITY' },
        });
      }
    }

    const journalLines: any[] = [
      {
        accountId: cashAccount.id,
        debitAmount: paymentAmount,
        creditAmount: 0,
        memo: `Payment Collection (${validated.gateway})`,
      },
      {
        accountId: revenueAccount.id,
        debitAmount: 0,
        creditAmount: allocatedToInvoice,
        memo: `Revenue recognized for Invoice ${invoice.invoiceNumber}`,
      },
    ];

    if (overpaymentCredit > 0 && creditLiabilityAccount) {
      journalLines.push({
        accountId: creditLiabilityAccount.id,
        debitAmount: 0,
        creditAmount: overpaymentCredit,
        memo: `Advance credit liability for Student ${invoice.student.studentIdNumber}`,
      });
    }

    const journalEntry = await tx.journalEntry.create({
      data: {
        institutionId,
        entryNumber: `JV-${receiptNumber}`,
        description: `Payment receipt ${receiptNumber} for Invoice ${invoice.invoiceNumber} (${validated.gateway})`,
        postedBy: actor.name || actor.email,
        isPosted: true,
        lines: {
          create: journalLines,
        },
      },
    });

    // Update COA balances
    await tx.chartOfAccount.update({
      where: { id: cashAccount.id },
      data: { balance: { increment: paymentAmount } },
    });
    await tx.chartOfAccount.update({
      where: { id: revenueAccount.id },
      data: { balance: { increment: allocatedToInvoice } },
    });
    if (overpaymentCredit > 0 && creditLiabilityAccount) {
      await tx.chartOfAccount.update({
        where: { id: creditLiabilityAccount.id },
        data: { balance: { increment: overpaymentCredit } },
      });
    }

    await logAuditEvent({
      tenantId: tenant.tenantId,
      actor,
      action: 'PAYMENT_RECORDED',
      resourceType: 'PaymentTransaction',
      resourceId: payment.id,
      newState: {
        receiptNumber,
        paymentAmount,
        allocatedToInvoice,
        overpaymentCredit,
        journalEntryNumber: journalEntry.entryNumber,
      },
    });

    return {
      paymentId: payment.id,
      receiptNumber,
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
      overpaymentCredit,
      status: newStatus,
      journalEntryNumber: journalEntry.entryNumber,
    };
  });
}

// ============================================================================
// 9. Controlled Refund Workflow
// ============================================================================

export async function requestRefund(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = RefundRequestCreateSchema.parse(rawData);

  const student = await db.student.findFirst({
    where: { id: validated.studentId, campus: { institutionId: tenant.institutionId } },
  });
  if (!student) throw AppError.notFound('Student not found.');

  const refund = await db.refundRequest.create({
    data: {
      institutionId: tenant.institutionId,
      studentId: validated.studentId,
      paymentId: validated.paymentId,
      invoiceId: validated.invoiceId,
      amount: roundMoney(validated.amount),
      reason: validated.reason,
      requestedBy: actor.name || actor.email,
      status: 'REQUESTED',
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'REFUND_REQUESTED',
    resourceType: 'RefundRequest',
    resourceId: refund.id,
    newState: { amount: refund.amount, reason: refund.reason },
  });

  return refund;
}

export async function processRefund(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = RefundProcessSchema.parse(rawData);

  const refund = await db.refundRequest.findFirst({
    where: { id: validated.refundRequestId, institutionId: tenant.institutionId },
    include: { student: true },
  });

  if (!refund) throw AppError.notFound('Refund request not found.');
  if (refund.status === 'PROCESSED' || refund.status === 'REJECTED') {
    throw AppError.conflict(`Refund request is already in status '${refund.status}'.`);
  }

  if (validated.action === 'REJECT') {
    const updated = await db.refundRequest.update({
      where: { id: refund.id },
      data: {
        status: 'REJECTED',
        reason: `${refund.reason} [Rejection Note: ${validated.rejectionReason || 'None'}]`,
      },
    });
    return updated;
  }

  // Action is APPROVE or PROCESS
  const institutionId = tenant.institutionId;

  return db.$transaction(async (tx) => {
    let refundJournal = null;

    if (validated.action === 'PROCESS') {
      // 1. Double-Entry Posting: Debit Fee Refund / Revenue, Credit Cash/Bank
      let refundExpenseAccount = await tx.chartOfAccount.findFirst({
        where: { institutionId, code: '5001' },
      });
      if (!refundExpenseAccount) {
        refundExpenseAccount = await tx.chartOfAccount.create({
          data: { institutionId, code: '5001', name: 'Student Fee Refunds & Adjustments', type: 'EXPENSE' },
        });
      }

      let cashAccount = await tx.chartOfAccount.findFirst({
        where: { institutionId, code: '1001' },
      });
      if (!cashAccount) {
        cashAccount = await tx.chartOfAccount.create({
          data: { institutionId, code: '1001', name: 'Cash / Bank Clearing', type: 'ASSET' },
        });
      }

      refundJournal = await tx.journalEntry.create({
        data: {
          institutionId,
          entryNumber: `REF-${Date.now().toString().slice(-6)}`,
          description: `Fee refund of ${refund.amount} for student ${refund.student.studentIdNumber}: ${refund.reason}`,
          postedBy: actor.name || actor.email,
          isPosted: true,
          lines: {
            create: [
              {
                accountId: refundExpenseAccount.id,
                debitAmount: refund.amount,
                creditAmount: 0,
                memo: `Refund to student ${refund.student.firstName} ${refund.student.lastName}`,
              },
              {
                accountId: cashAccount.id,
                debitAmount: 0,
                creditAmount: refund.amount,
                memo: `Payout via ${validated.refundMethod}`,
              },
            ],
          },
        },
      });

      await tx.chartOfAccount.update({
        where: { id: refundExpenseAccount.id },
        data: { balance: { increment: refund.amount } },
      });
      await tx.chartOfAccount.update({
        where: { id: cashAccount.id },
        data: { balance: { decrement: refund.amount } },
      });
    }

    const updated = await tx.refundRequest.update({
      where: { id: refund.id },
      data: {
        status: validated.action === 'PROCESS' ? 'PROCESSED' : 'APPROVED',
        approvedBy: actor.name || actor.email,
        approvedAt: new Date(),
        ...(validated.action === 'PROCESS'
          ? {
              processedBy: actor.name || actor.email,
              processedAt: new Date(),
              journalEntryId: refundJournal?.id,
            }
          : {}),
      },
    });

    await logAuditEvent({
      tenantId: tenant.tenantId,
      actor,
      action: validated.action === 'PROCESS' ? 'REFUND_PROCESSED' : 'REFUND_APPROVED',
      resourceType: 'RefundRequest',
      resourceId: refund.id,
      newState: { status: updated.status, amount: refund.amount },
    });

    return updated;
  });
}

// ============================================================================
// 10. Cash & Bank Management
// ============================================================================

export async function createBankAccount(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = InstitutionBankAccountCreateSchema.parse(rawData);

  const account = await db.institutionBankAccount.create({
    data: {
      institutionId: tenant.institutionId,
      bankName: validated.bankName,
      branchName: validated.branchName,
      accountName: validated.accountName,
      accountNumberMasked: validated.accountNumberMasked,
      currency: validated.currency,
      ledgerAccountId: validated.ledgerAccountId,
      openingBalance: roundMoney(validated.openingBalance),
      currentBalance: roundMoney(validated.openingBalance),
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'BANK_ACCOUNT_CREATED',
    resourceType: 'InstitutionBankAccount',
    resourceId: account.id,
    newState: { bankName: account.bankName, accountName: account.accountName },
  });

  return account;
}

export async function recordCheque(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = ChequeRecordCreateSchema.parse(rawData);

  const cheque = await db.chequeRecord.create({
    data: {
      institutionId: tenant.institutionId,
      bankAccountId: validated.bankAccountId,
      studentId: validated.studentId,
      vendorId: validated.vendorId,
      chequeNumber: validated.chequeNumber,
      bankName: validated.bankName,
      chequeDate: new Date(validated.chequeDate),
      amount: roundMoney(validated.amount),
      type: validated.type,
      status: 'RECEIVED',
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CHEQUE_RECORDED',
    resourceType: 'ChequeRecord',
    resourceId: cheque.id,
    newState: { chequeNumber: cheque.chequeNumber, amount: cheque.amount },
  });

  return cheque;
}

export async function updateChequeStatus(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = ChequeStatusUpdateSchema.parse(rawData);

  const cheque = await db.chequeRecord.findFirst({
    where: { id: validated.chequeId, institutionId: tenant.institutionId },
  });
  if (!cheque) throw AppError.notFound('Cheque record not found.');

  const updated = await db.chequeRecord.update({
    where: { id: cheque.id },
    data: {
      status: validated.status,
      bounceReason: validated.bounceReason,
      ...(validated.status === 'CLEARED' ? { clearanceDate: new Date() } : {}),
      ...(validated.status === 'DEPOSITED' ? { depositDate: new Date() } : {}),
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CHEQUE_STATUS_UPDATED',
    resourceType: 'ChequeRecord',
    resourceId: cheque.id,
    newState: { status: validated.status, bounceReason: validated.bounceReason },
  });

  return updated;
}

// ============================================================================
// 11. Vendors, Accounts Payable & Expense Management
// ============================================================================

export async function createVendor(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = VendorCreateSchema.parse(rawData);

  const vendor = await db.vendor.create({
    data: {
      institutionId: tenant.institutionId,
      vendorCode: validated.vendorCode,
      name: validated.name,
      contactPerson: validated.contactPerson,
      email: validated.email,
      phone: validated.phone,
      address: validated.address,
      taxIdNumber: validated.taxIdNumber,
      paymentTermsDays: validated.paymentTermsDays,
      ledgerAccountId: validated.ledgerAccountId,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'VENDOR_CREATED',
    resourceType: 'Vendor',
    resourceId: vendor.id,
    newState: { vendorCode: vendor.vendorCode, name: vendor.name },
  });

  return vendor;
}

export async function createVendorBill(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = VendorBillCreateSchema.parse(rawData);

  const vendor = await db.vendor.findFirst({
    where: { id: validated.vendorId, institutionId: tenant.institutionId },
  });
  if (!vendor) throw AppError.notFound('Vendor not found.');

  const subTotal = roundMoney(validated.subTotal);
  const taxAmount = roundMoney(validated.taxAmount);
  const totalAmount = roundMoney(subTotal + taxAmount);

  const bill = await db.vendorBill.create({
    data: {
      institutionId: tenant.institutionId,
      vendorId: validated.vendorId,
      billNumber: validated.billNumber,
      billDate: new Date(validated.billDate),
      dueDate: new Date(validated.dueDate),
      subTotal,
      taxAmount,
      totalAmount,
      paidAmount: 0,
      dueAmount: totalAmount,
      status: 'UNPAID',
      expenseAccountId: validated.expenseAccountId,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'VENDOR_BILL_CREATED',
    resourceType: 'VendorBill',
    resourceId: bill.id,
    newState: { billNumber: bill.billNumber, totalAmount: bill.totalAmount },
  });

  return bill;
}

export async function createExpenseRequest(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = ExpenseRequestCreateSchema.parse(rawData);

  const expense = await db.expenseRequest.create({
    data: {
      institutionId: tenant.institutionId,
      category: validated.category,
      title: validated.title,
      amount: roundMoney(validated.amount),
      requestedBy: actor.name || actor.email,
      department: validated.department,
      vendorId: validated.vendorId,
      paymentMethod: validated.paymentMethod,
      receiptUrl: validated.receiptUrl,
      status: 'PENDING',
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'EXPENSE_REQUESTED',
    resourceType: 'ExpenseRequest',
    resourceId: expense.id,
    newState: { title: expense.title, amount: expense.amount, category: expense.category },
  });

  return expense;
}

// ============================================================================
// 12. Budgets & Budget Controls
// ============================================================================

export async function createBudget(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = BudgetCreateSchema.parse(rawData);

  let totalBudget = 0;
  for (const line of validated.lines) {
    totalBudget += line.allocatedAmount;
  }
  totalBudget = roundMoney(totalBudget);

  return db.$transaction(async (tx) => {
    const budget = await tx.budget.create({
      data: {
        institutionId: tenant.institutionId,
        fiscalYearId: validated.fiscalYearId,
        name: validated.name,
        description: validated.description,
        totalBudget,
        status: 'APPROVED',
        approvedBy: actor.name || actor.email,
        lines: {
          create: validated.lines.map((l) => ({
            accountId: l.accountId,
            departmentId: l.departmentId,
            campusId: l.campusId,
            costCenterId: l.costCenterId,
            allocatedAmount: roundMoney(l.allocatedAmount),
          })),
        },
      },
      include: { lines: true },
    });

    await logAuditEvent({
      tenantId: tenant.tenantId,
      actor,
      action: 'BUDGET_CREATED',
      resourceType: 'Budget',
      resourceId: budget.id,
      newState: { name: budget.name, totalBudget },
    });

    return budget;
  });
}

export async function reviseBudgetLine(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = BudgetRevisionSchema.parse(rawData);

  const budget = await db.budget.findFirst({
    where: { id: validated.budgetId, institutionId: tenant.institutionId },
  });
  if (!budget) throw AppError.notFound('Budget not found.');

  const budgetLine = await db.budgetLine.findFirst({
    where: { id: validated.budgetLineId, budgetId: budget.id },
  });
  if (!budgetLine) throw AppError.notFound('Budget line not found.');

  const previousAmount = budgetLine.revisedAmount !== null ? budgetLine.revisedAmount : budgetLine.allocatedAmount;
  const newAmount = roundMoney(validated.newAmount);

  return db.$transaction(async (tx) => {
    await tx.budgetLine.update({
      where: { id: budgetLine.id },
      data: {
        revisedAmount: newAmount,
      },
    });

    await tx.budgetRevisionLog.create({
      data: {
        budgetId: budget.id,
        budgetLineId: budgetLine.id,
        previousAmount,
        newAmount,
        reason: validated.reason,
        revisedBy: actor.name || actor.email,
      },
    });

    await logAuditEvent({
      tenantId: tenant.tenantId,
      actor,
      action: 'BUDGET_LINE_REVISED',
      resourceType: 'BudgetLine',
      resourceId: budgetLine.id,
      newState: { previousAmount, newAmount, reason: validated.reason },
    });

    return { budgetId: budget.id, budgetLineId: budgetLine.id, previousAmount, newAmount };
  });
}

export async function getBudgetVsActual(tenantIdentifier: string, budgetId: string) {
  const tenant = await requireTenant(tenantIdentifier);

  const budget = await db.budget.findFirst({
    where: { id: budgetId, institutionId: tenant.institutionId },
    include: {
      fiscalYear: true,
      lines: {
        include: {
          account: {
            include: {
              journalLines: {
                where: {
                  journalEntry: { isPosted: true },
                },
              },
            },
          },
          costCenter: true,
        },
      },
    },
  });

  if (!budget) throw AppError.notFound('Budget not found.');

  const reportLines = budget.lines.map((line) => {
    const allocated = line.allocatedAmount;
    const revised = line.revisedAmount !== null ? line.revisedAmount : allocated;

    let actualSpent = 0;
    for (const jl of line.account.journalLines) {
      actualSpent += jl.debitAmount;
    }
    actualSpent = roundMoney(actualSpent);

    const variance = roundMoney(revised - actualSpent);
    const utilizationPct = revised > 0 ? roundMoney((actualSpent / revised) * 100) : 0;

    return {
      lineId: line.id,
      accountCode: line.account.code,
      accountName: line.account.name,
      allocatedAmount: allocated,
      revisedAmount: revised,
      actualSpent,
      variance,
      utilizationPercentage: utilizationPct,
    };
  });

  return {
    budgetId: budget.id,
    budgetName: budget.name,
    fiscalYear: budget.fiscalYear.name,
    lines: reportLines,
  };
}

// ============================================================================
// 13. Payroll Engine & Double-Entry Integration
// ============================================================================

export async function createSalaryStructure(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = SalaryStructureCreateSchema.parse(rawData);

  const structure = await db.salaryStructure.create({
    data: {
      institutionId: tenant.institutionId,
      name: validated.name,
      basicPercentage: validated.basicPercentage,
      houseRentPercentage: validated.houseRentPercentage,
      medicalPercentage: validated.medicalPercentage,
      transportAllowance: roundMoney(validated.transportAllowance),
      pfEmployeePercentage: validated.pfEmployeePercentage,
      pfEmployerPercentage: validated.pfEmployerPercentage,
      taxDeductionPercentage: validated.taxDeductionPercentage,
      isActive: true,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'SALARY_STRUCTURE_CREATED',
    resourceType: 'SalaryStructure',
    resourceId: structure.id,
    newState: { name: structure.name },
  });

  return structure;
}

export async function assignEmployeeSalary(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = EmployeeSalaryAssignmentSchema.parse(rawData);

  const employee = await db.employee.findFirst({
    where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!employee) throw AppError.notFound('Employee not found.');

  const assignment = await db.employeeSalaryAssignment.create({
    data: {
      employeeId: validated.employeeId,
      salaryStructureId: validated.salaryStructureId,
      grossSalary: roundMoney(validated.grossSalary),
      effectiveDate: new Date(validated.effectiveDate),
      status: 'ACTIVE',
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'SALARY_ASSIGNMENT_CREATED',
    resourceType: 'EmployeeSalaryAssignment',
    resourceId: assignment.id,
    newState: { employeeId: employee.id, grossSalary: assignment.grossSalary },
  });

  return assignment;
}

export async function createPayrollPeriod(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = PayrollPeriodCreateSchema.parse(rawData);

  const period = await db.payrollPeriod.create({
    data: {
      institutionId: tenant.institutionId,
      name: validated.name,
      startDate: new Date(validated.startDate),
      endDate: new Date(validated.endDate),
      status: 'DRAFT',
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'PAYROLL_PERIOD_CREATED',
    resourceType: 'PayrollPeriod',
    resourceId: period.id,
    newState: { name: period.name },
  });

  return period;
}

export async function calculatePayrollForPeriod(tenantIdentifier: string, periodId: string, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);

  const period = await db.payrollPeriod.findFirst({
    where: { id: periodId, institutionId: tenant.institutionId },
  });
  if (!period) throw AppError.notFound('Payroll period not found.');
  if (period.status === 'POSTED' || period.status === 'PAID') {
    throw AppError.conflict(`Cannot recalculate payroll in '${period.status}' status.`);
  }

  // Fetch active employees in this institution
  const employees = await db.employee.findMany({
    where: {
      campus: { institutionId: tenant.institutionId },
    },
    include: {
      salaryAssignments: {
        where: { status: 'ACTIVE' },
        include: { salaryStructure: true },
        orderBy: { effectiveDate: 'desc' },
        take: 1,
      },
      loans: {
        where: { status: 'ACTIVE', remainingBalance: { gt: 0 } },
      },
      salaryAdvances: {
        where: { status: 'ACTIVE', remainingAmount: { gt: 0 } },
      },
    },
  });

  return db.$transaction(async (tx) => {
    // Clear draft records for this period if any
    await tx.payrollRecord.deleteMany({
      where: { payrollPeriodId: period.id },
    });

    let totalGrossPay = 0;
    let totalDeductions = 0;
    let totalNetPay = 0;

    const records = [];

    for (const emp of employees) {
      const assignment = emp.salaryAssignments[0];
      const structure = assignment?.salaryStructure;

      const gross = assignment ? assignment.grossSalary : emp.basicSalary;
      const basicSalary = structure
        ? calculatePercentage(gross, structure.basicPercentage)
        : roundMoney(gross * 0.5);
      const houseRent = structure
        ? calculatePercentage(gross, structure.houseRentPercentage)
        : roundMoney(gross * 0.3);
      const medical = structure
        ? calculatePercentage(gross, structure.medicalPercentage)
        : roundMoney(gross * 0.1);
      const transport = structure ? structure.transportAllowance : 0;

      const pf = structure ? calculatePercentage(basicSalary, structure.pfEmployeePercentage) : 0;
      const tax = structure ? calculatePercentage(gross, structure.taxDeductionPercentage) : 0;

      // Loans
      let loanDeduction = 0;
      for (const loan of emp.loans) {
        const inst = Math.min(loan.monthlyInstallment, loan.remainingBalance);
        loanDeduction += inst;
      }

      // Advances
      let advanceDeduction = 0;
      for (const adv of emp.salaryAdvances) {
        advanceDeduction += adv.remainingAmount;
      }

      const otherAllowance = Math.max(0, roundMoney(gross - (basicSalary + houseRent + medical + transport)));

      const breakdown = calculateNetPayrollBreakdown({
        basicSalary,
        houseRent,
        medicalAllowance: medical,
        transportAllowance: transport,
        otherAllowance,
        providentFundDeduction: pf,
        taxDeduction: tax,
        loanDeduction,
        advanceDeduction,
      });

      const payslipNumber = `SLIP-${period.name.replace(/\s+/g, '')}-${emp.employeeCode}`;

      const rec = await tx.payrollRecord.create({
        data: {
          employeeId: emp.id,
          payrollPeriodId: period.id,
          monthYear: period.name,
          basicSalary: breakdown.basicSalary,
          houseRent: breakdown.houseRent,
          medicalAllowance: breakdown.medicalAllowance,
          transportAllowance: breakdown.transportAllowance,
          otherAllowance: breakdown.otherAllowance,
          grossSalary: breakdown.grossSalary,
          providentFundDeduction: breakdown.providentFundDeduction,
          taxDeduction: breakdown.taxDeduction,
          loanDeduction: breakdown.loanDeduction,
          advanceDeduction: breakdown.advanceDeduction,
          totalDeduction: breakdown.totalDeduction,
          netSalary: breakdown.netSalary,
          paymentStatus: 'UNPAID',
          payslipNumber,
        },
      });

      records.push(rec);
      totalGrossPay += breakdown.grossSalary;
      totalDeductions += breakdown.totalDeduction;
      totalNetPay += breakdown.netSalary;
    }

    const updatedPeriod = await tx.payrollPeriod.update({
      where: { id: period.id },
      data: {
        totalGrossPay: roundMoney(totalGrossPay),
        totalDeductions: roundMoney(totalDeductions),
        totalNetPay: roundMoney(totalNetPay),
        status: 'CALCULATED',
      },
    });

    await logAuditEvent({
      tenantId: tenant.tenantId,
      actor,
      action: 'PAYROLL_CALCULATED',
      resourceType: 'PayrollPeriod',
      resourceId: period.id,
      newState: { totalGrossPay, totalNetPay, recordCount: records.length },
    });

    return { period: updatedPeriod, recordsCount: records.length };
  });
}

export async function approveAndPostPayroll(tenantIdentifier: string, periodId: string, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);

  const period = await db.payrollPeriod.findFirst({
    where: { id: periodId, institutionId: tenant.institutionId },
    include: { records: true },
  });

  if (!period) throw AppError.notFound('Payroll period not found.');
  if (period.status === 'POSTED' || period.status === 'PAID') {
    throw AppError.conflict('Payroll period has already been posted to General Ledger.');
  }

  const institutionId = tenant.institutionId;

  return db.$transaction(async (tx) => {
    // 1. Double-Entry General Ledger Posting
    // Debit: Salary Expense (Gross)
    // Credit: Salary Payable (Net)
    // Credit: Tax Payable (Tax)
    // Credit: PF Payable (PF)
    // Credit: Employee Loan Receivable (Loan Deductions)
    // Credit: Salary Advance Receivable (Advance Deductions)

    let salaryExpenseAccount = await tx.chartOfAccount.findFirst({
      where: { institutionId, code: '6001' },
    });
    if (!salaryExpenseAccount) {
      salaryExpenseAccount = await tx.chartOfAccount.create({
        data: { institutionId, code: '6001', name: 'Employee Salary & Wages Expense', type: 'EXPENSE' },
      });
    }

    let salaryPayableAccount = await tx.chartOfAccount.findFirst({
      where: { institutionId, code: '2001' },
    });
    if (!salaryPayableAccount) {
      salaryPayableAccount = await tx.chartOfAccount.create({
        data: { institutionId, code: '2001', name: 'Accrued Salary & Wages Payable', type: 'LIABILITY' },
      });
    }

    let taxPayableAccount = await tx.chartOfAccount.findFirst({
      where: { institutionId, code: '2002' },
    });
    if (!taxPayableAccount) {
      taxPayableAccount = await tx.chartOfAccount.create({
        data: { institutionId, code: '2002', name: 'Tax Deductions Payable', type: 'LIABILITY' },
      });
    }

    let pfPayableAccount = await tx.chartOfAccount.findFirst({
      where: { institutionId, code: '2003' },
    });
    if (!pfPayableAccount) {
      pfPayableAccount = await tx.chartOfAccount.create({
        data: { institutionId, code: '2003', name: 'Provident Fund Payable', type: 'LIABILITY' },
      });
    }

    let totalTax = 0;
    let totalPf = 0;
    let totalLoan = 0;
    let totalAdvance = 0;

    for (const r of period.records) {
      totalTax += r.taxDeduction;
      totalPf += r.providentFundDeduction;
      totalLoan += r.loanDeduction;
      totalAdvance += r.advanceDeduction;
    }

    const grossSalary = roundMoney(period.totalGrossPay);
    const netSalary = roundMoney(period.totalNetPay);
    totalTax = roundMoney(totalTax);
    totalPf = roundMoney(totalPf);
    const remainingDeductions = roundMoney(totalLoan + totalAdvance);

    const journalLines: any[] = [
      {
        accountId: salaryExpenseAccount.id,
        debitAmount: grossSalary,
        creditAmount: 0,
        memo: `Gross salary expense for ${period.name}`,
      },
      {
        accountId: salaryPayableAccount.id,
        debitAmount: 0,
        creditAmount: netSalary,
        memo: `Net salary payable to employees for ${period.name}`,
      },
    ];

    if (totalTax > 0) {
      journalLines.push({
        accountId: taxPayableAccount.id,
        debitAmount: 0,
        creditAmount: totalTax,
        memo: `Income tax withheld for ${period.name}`,
      });
    }

    if (totalPf > 0) {
      journalLines.push({
        accountId: pfPayableAccount.id,
        debitAmount: 0,
        creditAmount: totalPf,
        memo: `Employee PF contribution for ${period.name}`,
      });
    }

    if (remainingDeductions > 0) {
      let loanRecAccount = await tx.chartOfAccount.findFirst({
        where: { institutionId, code: '1005' },
      });
      if (!loanRecAccount) {
        loanRecAccount = await tx.chartOfAccount.create({
          data: { institutionId, code: '1005', name: 'Employee Loans & Advances Receivable', type: 'ASSET' },
        });
      }
      journalLines.push({
        accountId: loanRecAccount.id,
        debitAmount: 0,
        creditAmount: remainingDeductions,
        memo: `Loan & Advance recovery for ${period.name}`,
      });
    }

    const journalEntry = await tx.journalEntry.create({
      data: {
        institutionId,
        entryNumber: `PAY-JV-${Date.now().toString().slice(-6)}`,
        description: `Payroll accrual and posting for ${period.name}`,
        sourceType: 'PAYROLL',
        sourceId: period.id,
        status: 'POSTED',
        postedBy: actor.name || actor.email,
        isPosted: true,
        lines: {
          create: journalLines,
        },
      },
    });

    // Update balances
    await tx.chartOfAccount.update({
      where: { id: salaryExpenseAccount.id },
      data: { balance: { increment: grossSalary } },
    });
    await tx.chartOfAccount.update({
      where: { id: salaryPayableAccount.id },
      data: { balance: { increment: netSalary } },
    });

    const updatedPeriod = await tx.payrollPeriod.update({
      where: { id: period.id },
      data: {
        status: 'POSTED',
        approvedBy: actor.name || actor.email,
        journalEntryId: journalEntry.id,
      },
    });

    await logAuditEvent({
      tenantId: tenant.tenantId,
      actor,
      action: 'PAYROLL_POSTED',
      resourceType: 'PayrollPeriod',
      resourceId: period.id,
      newState: { status: 'POSTED', journalEntryNumber: journalEntry.entryNumber },
    });

    return updatedPeriod;
  });
}

// ============================================================================
// 14. Student Statement & Receivable Aging
// ============================================================================

export async function getStudentFinancialStatement(tenantIdentifier: string, studentId: string) {
  const tenant = await requireTenant(tenantIdentifier);

  const student = await db.student.findFirst({
    where: { id: studentId, campus: { institutionId: tenant.institutionId } },
    include: {
      invoices: {
        include: { payments: true },
        orderBy: { createdAt: 'asc' },
      },
      scholarshipAwards: true,
      feeWaivers: true,
      creditTransactions: true,
      creditBalance: true,
    },
  });

  if (!student) throw AppError.notFound('Student not found.');

  let totalBilled = 0;
  let totalScholarships = 0;
  let totalDiscounts = 0;
  let totalWaivers = 0;
  let totalFines = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;

  const ledgerTransactions: any[] = [];

  for (const inv of student.invoices) {
    totalBilled += inv.subTotal;
    totalScholarships += inv.scholarshipAmount;
    totalDiscounts += inv.discountAmount;
    totalWaivers += inv.waiverAmount;
    totalFines += inv.fineAmount;
    totalPaid += inv.paidAmount;
    totalOutstanding += inv.dueAmount;

    ledgerTransactions.push({
      date: inv.createdAt,
      type: 'INVOICE',
      reference: inv.invoiceNumber,
      description: inv.title,
      grossAmount: inv.subTotal,
      scholarship: inv.scholarshipAmount,
      discount: inv.discountAmount,
      waiver: inv.waiverAmount,
      fine: inv.fineAmount,
      netCharge: inv.totalAmount,
      paid: inv.paidAmount,
      due: inv.dueAmount,
      status: inv.status,
    });
  }

  return {
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    studentIdNumber: student.studentIdNumber,
    summary: {
      totalBilled: roundMoney(totalBilled),
      totalScholarships: roundMoney(totalScholarships),
      totalDiscounts: roundMoney(totalDiscounts),
      totalWaivers: roundMoney(totalWaivers),
      totalFines: roundMoney(totalFines),
      totalPaid: roundMoney(totalPaid),
      totalOutstanding: roundMoney(totalOutstanding),
      availableCredit: student.creditBalance?.availableCredit || 0,
    },
    transactions: ledgerTransactions,
  };
}

export async function getReceivableAging(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);

  const unpaidInvoices = await db.invoice.findMany({
    where: {
      student: { campus: { institutionId: tenant.institutionId } },
      status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] },
      dueAmount: { gt: 0 },
    },
    include: {
      student: true,
    },
  });

  const now = new Date();
  let current = 0;
  let days1_30 = 0;
  let days31_60 = 0;
  let days61_90 = 0;
  let days90Plus = 0;

  for (const inv of unpaidInvoices) {
    const diffTime = now.getTime() - new Date(inv.dueDate).getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      current += inv.dueAmount;
    } else if (diffDays <= 30) {
      days1_30 += inv.dueAmount;
    } else if (diffDays <= 60) {
      days31_60 += inv.dueAmount;
    } else if (diffDays <= 90) {
      days61_90 += inv.dueAmount;
    } else {
      days90Plus += inv.dueAmount;
    }
  }

  const totalReceivable = current + days1_30 + days31_60 + days61_90 + days90Plus;

  return {
    current: roundMoney(current),
    days1_30: roundMoney(days1_30),
    days31_60: roundMoney(days31_60),
    days61_90: roundMoney(days61_90),
    days90Plus: roundMoney(days90Plus),
    totalReceivable: roundMoney(totalReceivable),
  };
}

/**
 * Fetches tenant invoices with filters.
 */
export async function getTenantInvoices(tenantIdentifier: string, status?: string) {
  const tenant = await requireTenant(tenantIdentifier);

  const whereClause: any = {
    student: { campus: { institutionId: tenant.institutionId } },
  };

  if (status) {
    whereClause.status = status;
  }

  return db.invoice.findMany({
    where: whereClause,
    include: {
      student: true,
      payments: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}
