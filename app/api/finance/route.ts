import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { SessionUser, UserStatus } from '@/lib/auth/types';
import { requirePermission } from '@/lib/rbac/guard';
import {
  validateJournalEntryBalance,
  createJournalEntry,
  reverseJournalEntry,
  getGeneralLedger,
  getTrialBalance,
  getIncomeStatement,
  getBalanceSheet,
  createFiscalYear,
  closeFiscalPeriod,
  reopenFiscalPeriod,
  createChartOfAccount,
  getChartOfAccounts,
  initializeStandardChartOfAccounts,
  createCostCenter,
  createFund,
  createFeeType,
  createFeeStructure,
  generateBatchBilling,
  createScholarshipMaster,
  applyScholarship,
  reviewScholarshipApplication,
  grantFeeWaiver,
  createStudentInvoice,
  recordInvoicePayment,
  requestRefund,
  processRefund,
  createBankAccount,
  recordCheque,
  updateChequeStatus,
  createVendor,
  createVendorBill,
  createExpenseRequest,
  createBudget,
  reviseBudgetLine,
  getBudgetVsActual,
  createSalaryStructure,
  assignEmployeeSalary,
  createPayrollPeriod,
  calculatePayrollForPeriod,
  approveAndPostPayroll,
  getStudentFinancialStatement,
  getReceivableAging,
  getTenantInvoices,
} from '@/lib/services/finance-service';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { successResponse, errorResponse } from '@/lib/errors/api-response';
import { AppError } from '@/lib/errors/app-error';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) throw AppError.validation('Tenant ID is required.');

    const tenant = await requireTenant(tenantId);
    const tab = searchParams.get('tab') || 'overview';

    if (tab === 'accounts') {
      const accounts = await getChartOfAccounts(tenantId);
      return successResponse({ accounts });
    }

    if (tab === 'invoices') {
      const invoices = await getTenantInvoices(tenantId, searchParams.get('status') || undefined);
      return successResponse({ invoices });
    }

    if (tab === 'trial_balance') {
      const trialBalance = await getTrialBalance(tenantId, searchParams.get('asOfDate') || undefined);
      return successResponse(trialBalance);
    }

    if (tab === 'income_statement') {
      const incomeStatement = await getIncomeStatement(
        tenantId,
        searchParams.get('startDate') || undefined,
        searchParams.get('endDate') || undefined
      );
      return successResponse(incomeStatement);
    }

    if (tab === 'balance_sheet') {
      const balanceSheet = await getBalanceSheet(tenantId, searchParams.get('asOfDate') || undefined);
      return successResponse(balanceSheet);
    }

    if (tab === 'general_ledger') {
      const gl = await getGeneralLedger(tenantId, {
        accountId: searchParams.get('accountId') || undefined,
        fiscalYearId: searchParams.get('fiscalYearId') || undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        costCenterId: searchParams.get('costCenterId') || undefined,
      });
      return successResponse({ lines: gl });
    }

    if (tab === 'student_statement') {
      const studentId = searchParams.get('studentId');
      if (!studentId) throw AppError.validation('studentId is required for statement');
      const statement = await getStudentFinancialStatement(tenantId, studentId);
      return successResponse(statement);
    }

    if (tab === 'receivable_aging') {
      const aging = await getReceivableAging(tenantId);
      return successResponse(aging);
    }

    if (tab === 'budget_vs_actual') {
      const budgetId = searchParams.get('budgetId');
      if (!budgetId) throw AppError.validation('budgetId is required');
      const report = await getBudgetVsActual(tenantId, budgetId);
      return successResponse(report);
    }

    // Default overview bundle
    const [invoices, accounts, journalEntries, feeStructures, scholarships, payrollPeriods] = await Promise.all([
      db.invoice.findMany({
        where: {
          student: { campus: { institutionId: tenant.institutionId } },
        },
        include: {
          student: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.chartOfAccount.findMany({
        where: { institutionId: tenant.institutionId },
        orderBy: { code: 'asc' },
      }),
      db.journalEntry.findMany({
        where: { institutionId: tenant.institutionId },
        include: { lines: { include: { account: true } } },
        orderBy: { entryDate: 'desc' },
        take: 20,
      }),
      db.feeStructure.findMany({
        where: { institutionId: tenant.institutionId },
        include: { feeType: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.scholarshipMaster.findMany({
        where: { institutionId: tenant.institutionId },
        include: { awards: true },
        orderBy: { code: 'asc' },
      }),
      db.payrollPeriod.findMany({
        where: { institutionId: tenant.institutionId },
        orderBy: { startDate: 'desc' },
      }),
    ]);

    const totalCollected = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
    const totalDue = invoices.reduce((acc, inv) => acc + (inv.dueAmount || 0), 0);

    return successResponse({
      invoices,
      accounts,
      journalEntries,
      feeStructures,
      scholarships,
      payrollPeriods,
      summary: {
        totalCollected,
        totalDue,
        totalInvoices: invoices.length,
        totalAccounts: accounts.length,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    const body = await req.json();
    const { action, tenantId, ...payload } = body;
    const resolvedTenant = tenantId || session?.tenantId;

    if (!resolvedTenant) throw AppError.validation('Tenant ID is required.');

    const actor: SessionUser = session || {
      id: 'GUEST_ACTOR',
      name: 'System / Guest Finance User',
      email: 'finance@eduerp.us',
      role: 'ACCOUNTANT',
      tenantId: resolvedTenant,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    switch (action) {
      case 'POST_JOURNAL_VOUCHER':
      case 'CREATE_JOURNAL_ENTRY': {
        if (session) requirePermission(session, 'CREATE', 'ACCOUNTING_LEDGER');
        const journal = await createJournalEntry(resolvedTenant, payload, actor);
        return successResponse(journal, 'Journal voucher posted successfully', 201);
      }

      case 'REVERSE_JOURNAL_ENTRY': {
        if (session) requirePermission(session, 'UPDATE', 'ACCOUNTING_LEDGER');
        const reversal = await reverseJournalEntry(resolvedTenant, payload, actor);
        return successResponse(reversal, 'Journal entry reversed successfully', 200);
      }

      case 'CREATE_FISCAL_YEAR': {
        if (session) requirePermission(session, 'CREATE', 'ACCOUNTING_LEDGER');
        const fiscalYear = await createFiscalYear(resolvedTenant, payload, actor);
        return successResponse(fiscalYear, 'Fiscal year created', 201);
      }

      case 'CLOSE_FISCAL_PERIOD': {
        if (session) requirePermission(session, 'UPDATE', 'ACCOUNTING_LEDGER');
        const period = await closeFiscalPeriod(resolvedTenant, payload.periodId, actor);
        return successResponse(period, 'Fiscal period closed', 200);
      }

      case 'REOPEN_FISCAL_PERIOD': {
        if (session) requirePermission(session, 'UPDATE', 'ACCOUNTING_LEDGER');
        const period = await reopenFiscalPeriod(resolvedTenant, payload, actor);
        return successResponse(period, 'Fiscal period reopened', 200);
      }

      case 'CREATE_CHART_OF_ACCOUNT': {
        if (session) requirePermission(session, 'CREATE', 'ACCOUNTING_LEDGER');
        const account = await createChartOfAccount(resolvedTenant, payload, actor);
        return successResponse(account, 'Chart of account created', 201);
      }

      case 'INITIALIZE_CHART_OF_ACCOUNTS': {
        if (session) requirePermission(session, 'CREATE', 'ACCOUNTING_LEDGER');
        const accounts = await initializeStandardChartOfAccounts(resolvedTenant, actor);
        return successResponse({ accounts }, 'Standard Chart of Accounts initialized successfully', 201);
      }

      case 'CREATE_COST_CENTER': {
        if (session) requirePermission(session, 'CREATE', 'ACCOUNTING_LEDGER');
        const costCenter = await createCostCenter(resolvedTenant, payload, actor);
        return successResponse(costCenter, 'Cost center created', 201);
      }

      case 'CREATE_FUND': {
        if (session) requirePermission(session, 'CREATE', 'ACCOUNTING_LEDGER');
        const fund = await createFund(resolvedTenant, payload, actor);
        return successResponse(fund, 'Fund created', 201);
      }

      case 'CREATE_FEE_TYPE': {
        if (session) requirePermission(session, 'CREATE', 'FEES_INVOICES');
        const feeType = await createFeeType(resolvedTenant, payload, actor);
        return successResponse(feeType, 'Fee type created', 201);
      }

      case 'CREATE_FEE_STRUCTURE': {
        if (session) requirePermission(session, 'CREATE', 'FEES_INVOICES');
        const feeStructure = await createFeeStructure(resolvedTenant, payload, actor);
        return successResponse(feeStructure, 'Fee structure created', 201);
      }

      case 'GENERATE_BATCH_BILLING': {
        if (session) requirePermission(session, 'CREATE', 'FEES_INVOICES');
        const result = await generateBatchBilling(resolvedTenant, payload, actor);
        return successResponse(result, 'Batch billing generated successfully', 201);
      }

      case 'CREATE_SCHOLARSHIP': {
        if (session) requirePermission(session, 'CREATE', 'FEES_INVOICES');
        const scholarship = await createScholarshipMaster(resolvedTenant, payload, actor);
        return successResponse(scholarship, 'Scholarship master created', 201);
      }

      case 'APPLY_SCHOLARSHIP': {
        const application = await applyScholarship(resolvedTenant, payload, actor);
        return successResponse(application, 'Scholarship application submitted', 201);
      }

      case 'REVIEW_SCHOLARSHIP': {
        if (session) requirePermission(session, 'UPDATE', 'FEES_INVOICES');
        const reviewed = await reviewScholarshipApplication(resolvedTenant, payload, actor);
        return successResponse(reviewed, 'Scholarship reviewed successfully', 200);
      }

      case 'GRANT_FEE_WAIVER': {
        if (session) requirePermission(session, 'UPDATE', 'FEES_INVOICES');
        const waiver = await grantFeeWaiver(resolvedTenant, payload, actor);
        return successResponse(waiver, 'Fee waiver granted', 201);
      }

      case 'CREATE_INVOICE': {
        if (session) requirePermission(session, 'CREATE', 'FEES_INVOICES');
        const invoice = await createStudentInvoice(resolvedTenant, payload, actor);
        return successResponse(invoice, 'Invoice created', 201);
      }

      case 'RECORD_PAYMENT': {
        const payment = await recordInvoicePayment(resolvedTenant, payload, actor);
        return successResponse(payment, 'Payment recorded successfully', 201);
      }

      case 'REQUEST_REFUND': {
        const refund = await requestRefund(resolvedTenant, payload, actor);
        return successResponse(refund, 'Refund requested', 201);
      }

      case 'PROCESS_REFUND': {
        if (session) requirePermission(session, 'UPDATE', 'FEES_INVOICES');
        const refund = await processRefund(resolvedTenant, payload, actor);
        return successResponse(refund, 'Refund processed', 200);
      }

      case 'CREATE_BANK_ACCOUNT': {
        if (session) requirePermission(session, 'CREATE', 'ACCOUNTING_LEDGER');
        const bankAccount = await createBankAccount(resolvedTenant, payload, actor);
        return successResponse(bankAccount, 'Bank account registered', 201);
      }

      case 'RECORD_CHEQUE': {
        if (session) requirePermission(session, 'CREATE', 'ACCOUNTING_LEDGER');
        const cheque = await recordCheque(resolvedTenant, payload, actor);
        return successResponse(cheque, 'Cheque recorded', 201);
      }

      case 'UPDATE_CHEQUE_STATUS': {
        if (session) requirePermission(session, 'UPDATE', 'ACCOUNTING_LEDGER');
        const cheque = await updateChequeStatus(resolvedTenant, payload, actor);
        return successResponse(cheque, 'Cheque status updated', 200);
      }

      case 'CREATE_VENDOR': {
        if (session) requirePermission(session, 'CREATE', 'ACCOUNTING_LEDGER');
        const vendor = await createVendor(resolvedTenant, payload, actor);
        return successResponse(vendor, 'Vendor created', 201);
      }

      case 'CREATE_VENDOR_BILL': {
        if (session) requirePermission(session, 'CREATE', 'ACCOUNTING_LEDGER');
        const bill = await createVendorBill(resolvedTenant, payload, actor);
        return successResponse(bill, 'Vendor bill created', 201);
      }

      case 'CREATE_EXPENSE_REQUEST': {
        const expense = await createExpenseRequest(resolvedTenant, payload, actor);
        return successResponse(expense, 'Expense request submitted', 201);
      }

      case 'CREATE_BUDGET': {
        if (session) requirePermission(session, 'CREATE', 'ACCOUNTING_LEDGER');
        const budget = await createBudget(resolvedTenant, payload, actor);
        return successResponse(budget, 'Budget created', 201);
      }

      case 'REVISE_BUDGET_LINE': {
        if (session) requirePermission(session, 'UPDATE', 'ACCOUNTING_LEDGER');
        const revision = await reviseBudgetLine(resolvedTenant, payload, actor);
        return successResponse(revision, 'Budget line revised', 200);
      }

      case 'CREATE_SALARY_STRUCTURE': {
        if (session) requirePermission(session, 'CREATE', 'ACCOUNTING_LEDGER');
        const structure = await createSalaryStructure(resolvedTenant, payload, actor);
        return successResponse(structure, 'Salary structure created', 201);
      }

      case 'ASSIGN_EMPLOYEE_SALARY': {
        if (session) requirePermission(session, 'CREATE', 'ACCOUNTING_LEDGER');
        const assignment = await assignEmployeeSalary(resolvedTenant, payload, actor);
        return successResponse(assignment, 'Salary assignment saved', 201);
      }

      case 'CREATE_PAYROLL_PERIOD': {
        if (session) requirePermission(session, 'CREATE', 'ACCOUNTING_LEDGER');
        const period = await createPayrollPeriod(resolvedTenant, payload, actor);
        return successResponse(period, 'Payroll period created', 201);
      }

      case 'CALCULATE_PAYROLL': {
        if (session) requirePermission(session, 'UPDATE', 'ACCOUNTING_LEDGER');
        const result = await calculatePayrollForPeriod(resolvedTenant, payload.payrollPeriodId, actor);
        return successResponse(result, 'Payroll calculated successfully', 200);
      }

      case 'APPROVE_PAYROLL': {
        if (session) requirePermission(session, 'UPDATE', 'ACCOUNTING_LEDGER');
        const posted = await approveAndPostPayroll(resolvedTenant, payload.payrollPeriodId, actor);
        return successResponse(posted, 'Payroll approved and posted to General Ledger', 200);
      }

      default:
        throw AppError.validation(`Unsupported finance action: '${action}'`);
    }
  } catch (err) {
    return errorResponse(err);
  }
}
