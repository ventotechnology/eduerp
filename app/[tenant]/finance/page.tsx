'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/lib/tenant-context';
import {
  DollarSign,
  CreditCard,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Printer,
  Sparkles,
  Receipt,
  Building2,
  TrendingUp,
  Scale,
  BookOpen,
  Users,
  Award,
  Wallet,
  PieChart,
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function FinancePage() {
  const { branding, tenantSlug } = useTenant();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'invoices'
    | 'scholarships'
    | 'accounts'
    | 'journals'
    | 'trial_balance'
    | 'statements'
    | 'payroll'
  >('overview');

  const [loading, setLoading] = useState(false);
  const [financeData, setFinanceData] = useState<any>(null);
  const [trialBalanceData, setTrialBalanceData] = useState<any>(null);
  const [incomeStatementData, setIncomeStatementData] = useState<any>(null);
  const [balanceSheetData, setBalanceSheetData] = useState<any>(null);

  // Modals & form state
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<'BKASH' | 'NAGAD' | 'ROCKET' | 'CARDS' | 'CASH'>('BKASH');
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Journal form state
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalDesc, setJournalDesc] = useState('');
  const [journalLines, setJournalLines] = useState<any[]>([
    { accountId: '', debitAmount: 0, creditAmount: 0, memo: '' },
    { accountId: '', debitAmount: 0, creditAmount: 0, memo: '' },
  ]);

  // Fetch overview bundle
  const loadFinanceOverview = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/finance?tenantId=${tenantSlug || 'dhaka-national-school'}&tab=overview`);
      const json = await res.json();
      if (json.success) {
        setFinanceData(json.data);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to load live finance records.');
    } finally {
      setLoading(false);
    }
  };

  const loadTrialBalance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance?tenantId=${tenantSlug || 'dhaka-national-school'}&tab=trial_balance`);
      const json = await res.json();
      if (json.success) {
        setTrialBalanceData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatements = async () => {
    setLoading(true);
    try {
      const [isRes, bsRes] = await Promise.all([
        fetch(`/api/finance?tenantId=${tenantSlug || 'dhaka-national-school'}&tab=income_statement`),
        fetch(`/api/finance?tenantId=${tenantSlug || 'dhaka-national-school'}&tab=balance_sheet`),
      ]);
      const isJson = await isRes.json();
      const bsJson = await bsRes.json();
      if (isJson.success) setIncomeStatementData(isJson.data);
      if (bsJson.success) setBalanceSheetData(bsJson.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceOverview();
  }, [tenantSlug]);

  useEffect(() => {
    if (activeTab === 'trial_balance') loadTrialBalance();
    if (activeTab === 'statements') loadStatements();
  }, [activeTab]);

  const handlePayOnline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECORD_PAYMENT',
          tenantId: tenantSlug || 'dhaka-national-school',
          invoiceId: selectedInvoice.id,
          amount: selectedInvoice.dueAmount || selectedInvoice.totalAmount,
          gateway: selectedGateway,
          transactionRef: `TRX-${selectedGateway}-${Date.now().toString().slice(-6)}`,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Payment recording failed.');
      }

      setPaymentSuccessReceipt({
        receiptNumber: json.data.receiptNumber,
        transactionRef: `TRX-${selectedGateway}-${Date.now().toString().slice(-6)}`,
        invoiceNumber: selectedInvoice.invoiceNumber,
        studentName: selectedInvoice.student ? `${selectedInvoice.student.firstName} ${selectedInvoice.student.lastName}` : 'Student',
        amount: selectedInvoice.dueAmount || selectedInvoice.totalAmount,
        gateway: selectedGateway,
        paidAt: new Date().toLocaleString(),
        journalEntryNumber: json.data.journalEntryNumber,
      });

      setSelectedInvoice(null);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      loadFinanceOverview();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment processing error.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'POST_JOURNAL_VOUCHER',
          tenantId: tenantSlug || 'dhaka-national-school',
          description: journalDesc,
          lines: journalLines.map((l) => ({
            accountId: l.accountId,
            debitAmount: Number(l.debitAmount) || 0,
            creditAmount: Number(l.creditAmount) || 0,
            memo: l.memo || journalDesc,
          })),
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to post journal entry.');
      }

      setShowJournalModal(false);
      setJournalDesc('');
      setJournalLines([
        { accountId: '', debitAmount: 0, creditAmount: 0, memo: '' },
        { accountId: '', debitAmount: 0, creditAmount: 0, memo: '' },
      ]);
      loadFinanceOverview();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const currencySymbol = (branding as any)?.currencySymbol || '৳';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Institutional Finance, Accounting & Payroll Engine
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Double-Entry Guaranteed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real PostgreSQL persistence • Strict Chart of Accounts hierarchy • Multi-Gateway reconciliation • Automated Scholarships & Payroll
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'invoices', label: 'Invoices & Billing' },
            { key: 'scholarships', label: 'Scholarships' },
            { key: 'accounts', label: 'Chart of Accounts' },
            { key: 'journals', label: 'General Ledger' },
            { key: 'trial_balance', label: 'Trial Balance' },
            { key: 'statements', label: 'Financial Statements' },
            { key: 'payroll', label: 'Payroll' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Collected</span>
                <span className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {currencySymbol} {(financeData?.summary?.totalCollected || 0).toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-600 font-medium mt-1 inline-block">
                ✓ Balanced Double-Entry Recognized
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Outstanding Receivables</span>
                <span className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl">
                  <Receipt className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {currencySymbol} {(financeData?.summary?.totalDue || 0).toLocaleString()}
              </p>
              <span className="text-[10px] text-amber-600 font-medium mt-1 inline-block">
                Active Student Invoices
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Chart of Accounts</span>
                <span className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
                  <BookOpen className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {financeData?.accounts?.length || 0}
              </p>
              <span className="text-[10px] text-blue-600 font-medium mt-1 inline-block">
                Assets, Liabilities, Revenue & Expenses
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Scholarship Grants</span>
                <span className="p-2 bg-purple-50 dark:bg-purple-950/50 text-purple-600 rounded-xl">
                  <Award className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {financeData?.scholarships?.length || 0}
              </p>
              <span className="text-[10px] text-purple-600 font-medium mt-1 inline-block">
                Merit & Need-Based Programs
              </span>
            </div>
          </div>

          {/* Recent Invoices & Journals Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" /> Recent Student Invoices
                </h3>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {financeData?.invoices?.slice(0, 5).map((inv: any) => (
                  <div key={inv.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {inv.title} ({inv.invoiceNumber})
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        Student: {inv.student?.firstName} {inv.student?.lastName} ({inv.student?.studentIdNumber})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {currencySymbol} {inv.totalAmount.toLocaleString()}
                      </p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Recent Posted Journals
                </h3>
                <button
                  onClick={() => setActiveTab('journals')}
                  className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {financeData?.journalEntries?.slice(0, 5).map((jv: any) => (
                  <div key={jv.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {jv.entryNumber}
                      </p>
                      <p className="text-slate-500 text-[11px] truncate max-w-[280px]">
                        {jv.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(jv.entryDate).toLocaleDateString()}
                      </span>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                        POSTED
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INVOICES & BILLING TAB */}
      {activeTab === 'invoices' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Student Invoices & Online Collection</h2>
              <p className="text-xs text-slate-500">Live invoices with scholarship, discount, waiver, and fine breakdown</p>
            </div>
            <button
              onClick={() => loadFinanceOverview()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Gross</th>
                  <th className="p-3">Scholarship/Discount</th>
                  <th className="p-3">Net Total</th>
                  <th className="p-3">Paid</th>
                  <th className="p-3">Due</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {financeData?.invoices?.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-blue-600">{inv.invoiceNumber}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {inv.student?.firstName} {inv.student?.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400">{inv.student?.studentIdNumber}</div>
                    </td>
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{inv.title}</td>
                    <td className="p-3 font-mono">{currencySymbol} {inv.subTotal.toLocaleString()}</td>
                    <td className="p-3 font-mono text-purple-600">
                      {inv.scholarshipAmount > 0 && `-${currencySymbol}${inv.scholarshipAmount} `}
                      {inv.discountAmount > 0 && `-${currencySymbol}${inv.discountAmount}`}
                      {inv.scholarshipAmount === 0 && inv.discountAmount === 0 && '—'}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                      {currencySymbol} {inv.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-emerald-600">{currencySymbol} {inv.paidAmount.toLocaleString()}</td>
                    <td className="p-3 font-mono font-bold text-amber-600">{currencySymbol} {inv.dueAmount.toLocaleString()}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {inv.status !== 'PAID' && (
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] shadow-xs"
                        >
                          Pay Online
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CHART OF ACCOUNTS TAB */}
      {activeTab === 'accounts' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Hierarchical Chart of Accounts (COA)</h2>
              <p className="text-xs text-slate-500">Assets, Liabilities, Equity, Revenue, and Expense accounts</p>
            </div>
            <button
              onClick={() => setActiveTab('journals')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Post Journal Entry
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Account Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Subtype</th>
                  <th className="p-3">Postable</th>
                  <th className="p-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {financeData?.accounts?.map((acc: any) => (
                  <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-blue-600">{acc.code}</td>
                    <td className="p-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                      {acc.name}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {acc.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-[11px] font-sans">{acc.subtype || 'GENERAL'}</td>
                    <td className="p-3 font-sans">
                      {acc.isHeader ? (
                        <span className="text-amber-600 font-semibold text-[10px]">Header (Non-Postable)</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-[10px]">Postable Account</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                      {currencySymbol} {acc.balance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GENERAL LEDGER & JOURNALS TAB */}
      {activeTab === 'journals' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">General Ledger & Posted Journal Vouchers</h2>
              <p className="text-xs text-slate-500">Immutable double-entry journal vouchers with audit verification</p>
            </div>
            <button
              onClick={() => setShowJournalModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Post Manual Journal
            </button>
          </div>

          <div className="space-y-4">
            {financeData?.journalEntries?.map((jv: any) => (
              <div
                key={jv.id}
                className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 bg-slate-50/40 dark:bg-slate-800/20"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                  <div>
                    <span className="font-mono font-bold text-blue-600 text-sm">{jv.entryNumber}</span>
                    <span className="text-slate-400 ml-2">({new Date(jv.entryDate).toLocaleDateString()})</span>
                    <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">{jv.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {jv.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Posted by: {jv.postedBy}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/60 dark:bg-slate-800/60 text-[10px] uppercase text-slate-500 font-bold">
                      <tr>
                        <th className="p-2.5">Account</th>
                        <th className="p-2.5">Memo</th>
                        <th className="p-2.5 text-right">Debit</th>
                        <th className="p-2.5 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                      {jv.lines?.map((line: any) => (
                        <tr key={line.id}>
                          <td className="p-2.5 font-sans">
                            <span className="font-mono text-blue-600 font-bold mr-1">[{line.account?.code}]</span>
                            {line.account?.name}
                          </td>
                          <td className="p-2.5 font-sans text-slate-500">{line.memo || '—'}</td>
                          <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                            {line.debitAmount > 0 ? `${currencySymbol} ${line.debitAmount.toLocaleString()}` : '—'}
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                            {line.creditAmount > 0 ? `${currencySymbol} ${line.creditAmount.toLocaleString()}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRIAL BALANCE TAB */}
      {activeTab === 'trial_balance' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Trial Balance Statement</h2>
              <p className="text-xs text-slate-500">Real-time debit and credit equality verification across all active accounts</p>
            </div>
            {trialBalanceData && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                  trialBalanceData.isBalanced
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                {trialBalanceData.isBalanced ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Total Debits = Total Credits (Balanced)
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" /> Unbalanced Trial Balance
                  </>
                )}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3">Account Code</th>
                  <th className="p-3">Account Title</th>
                  <th className="p-3">Classification</th>
                  <th className="p-3 text-right">Debit Balance</th>
                  <th className="p-3 text-right">Credit Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {trialBalanceData?.rows?.map((r: any) => (
                  <tr key={r.accountId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-blue-600">{r.code}</td>
                    <td className="p-3 font-sans font-semibold text-slate-800 dark:text-slate-200">{r.name}</td>
                    <td className="p-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {r.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold">
                      {r.debit > 0 ? `${currencySymbol} ${r.debit.toLocaleString()}` : '—'}
                    </td>
                    <td className="p-3 text-right font-bold">
                      {r.credit > 0 ? `${currencySymbol} ${r.credit.toLocaleString()}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100/80 dark:bg-slate-800/80 font-mono font-bold text-sm">
                <tr>
                  <td colSpan={3} className="p-3 text-right uppercase text-xs">
                    Total
                  </td>
                  <td className="p-3 text-right text-emerald-600">
                    {currencySymbol} {(trialBalanceData?.totalDebits || 0).toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-emerald-600">
                    {currencySymbol} {(trialBalanceData?.totalCredits || 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* STATEMENTS TAB */}
      {activeTab === 'statements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Statement */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Income Statement / Profit & Loss
            </h2>
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-500 uppercase text-[10px] mb-2">Revenues</h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {incomeStatementData?.revenues?.map((rev: any) => (
                    <div key={rev.id} className="py-2 flex justify-between">
                      <span className="font-sans text-slate-700 dark:text-slate-300">
                        {rev.code} - {rev.name}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {currencySymbol} {rev.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="py-2 flex justify-between font-bold text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 rounded">
                    <span>Total Revenue</span>
                    <span>{currencySymbol} {(incomeStatementData?.totalRevenue || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-500 uppercase text-[10px] mb-2">Expenses</h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {incomeStatementData?.expenses?.map((exp: any) => (
                    <div key={exp.id} className="py-2 flex justify-between">
                      <span className="font-sans text-slate-700 dark:text-slate-300">
                        {exp.code} - {exp.name}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {currencySymbol} {exp.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="py-2 flex justify-between font-bold text-rose-600 bg-rose-50/50 dark:bg-rose-950/20 px-2 rounded">
                    <span>Total Expenses</span>
                    <span>{currencySymbol} {(incomeStatementData?.totalExpense || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t-2 border-slate-300 dark:border-slate-700 flex justify-between text-sm font-bold">
                <span className="text-slate-900 dark:text-white">Net Operating Surplus / (Deficit)</span>
                <span className={incomeStatementData?.netSurplus >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {currencySymbol} {(incomeStatementData?.netSurplus || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Balance Sheet */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" /> Balance Sheet Statement
            </h2>
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-500 uppercase text-[10px] mb-2">Assets</h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {balanceSheetData?.assets?.map((a: any) => (
                    <div key={a.accountId} className="py-2 flex justify-between">
                      <span className="font-sans text-slate-700 dark:text-slate-300">
                        {a.code} - {a.name}
                      </span>
                      <span className="font-bold">{currencySymbol} {a.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="py-2 flex justify-between font-bold text-blue-600 bg-blue-50/50 dark:bg-blue-950/20 px-2 rounded">
                    <span>Total Assets</span>
                    <span>{currencySymbol} {(balanceSheetData?.totalAssets || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-500 uppercase text-[10px] mb-2">Liabilities & Equity</h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {balanceSheetData?.liabilities?.map((l: any) => (
                    <div key={l.accountId} className="py-2 flex justify-between">
                      <span className="font-sans text-slate-700 dark:text-slate-300">
                        {l.code} - {l.name}
                      </span>
                      <span className="font-bold">{currencySymbol} {l.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  {balanceSheetData?.equity?.map((e: any, idx: number) => (
                    <div key={idx} className="py-2 flex justify-between">
                      <span className="font-sans text-slate-700 dark:text-slate-300">
                        {e.code} - {e.name}
                      </span>
                      <span className="font-bold">{currencySymbol} {e.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="py-2 flex justify-between font-bold text-blue-600 bg-blue-50/50 dark:bg-blue-950/20 px-2 rounded">
                    <span>Total Liabilities & Equity</span>
                    <span>{currencySymbol} {(balanceSheetData?.totalLiabilitiesAndEquity || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHOLARSHIPS TAB */}
      {activeTab === 'scholarships' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Scholarship Programs & Financial Aid</h2>
              <p className="text-xs text-slate-500">Merit scholarships, need-based aid, and automated billing deductions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {financeData?.scholarships?.map((sch: any) => (
              <div
                key={sch.id}
                className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 bg-slate-50/40 dark:bg-slate-800/30"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-purple-600">{sch.code}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                    {sch.type}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{sch.name}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Benefit: {sch.benefitType === 'PERCENTAGE' ? `${sch.benefitValue}% Tuition Waiver` : `${currencySymbol} ${sch.benefitValue} Fixed`}
                </p>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-[11px] text-slate-400">
                  <span>Active Beneficiaries: {sch.awards?.length || 0}</span>
                  <span className="text-emerald-600 font-semibold">Active Policy</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAYROLL TAB */}
      {activeTab === 'payroll' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Employee Payroll & Salary Disbursement</h2>
              <p className="text-xs text-slate-500">Gross salary, PF, Tax withholding, and automatic General Ledger posting</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3">Period</th>
                  <th className="p-3">Gross Payroll</th>
                  <th className="p-3">Deductions (Tax + PF)</th>
                  <th className="p-3">Net Disbursable</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Accounting Posting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {financeData?.payrollPeriods?.map((pp: any) => (
                  <tr key={pp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-sans font-bold text-slate-900 dark:text-white">{pp.name}</td>
                    <td className="p-3">{currencySymbol} {pp.totalGrossPay.toLocaleString()}</td>
                    <td className="p-3 text-rose-600">-{currencySymbol} {pp.totalDeductions.toLocaleString()}</td>
                    <td className="p-3 font-bold text-emerald-600">{currencySymbol} {pp.totalNetPay.toLocaleString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                        {pp.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans text-[11px] text-slate-500">
                      {pp.journalEntryId ? 'Posted to GL ✓' : 'Pending Approval'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" /> Multi-Gateway Online Checkout
              </h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {selectedInvoice.invoiceNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedInvoice.student?.firstName} {selectedInvoice.student?.lastName}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Amount Due:</span>
                <span className="text-blue-600 font-mono">
                  {currencySymbol} {(selectedInvoice.dueAmount || selectedInvoice.totalAmount).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Select Payment Channel
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'BKASH', label: 'bKash Wallet', color: 'border-pink-500 text-pink-600' },
                  { id: 'NAGAD', label: 'Nagad Wallet', color: 'border-orange-500 text-orange-600' },
                  { id: 'ROCKET', label: 'Rocket (DBBL)', color: 'border-purple-500 text-purple-600' },
                  { id: 'CARDS', label: 'Debit/Credit Card', color: 'border-blue-500 text-blue-600' },
                ].map((gw) => (
                  <button
                    key={gw.id}
                    type="button"
                    onClick={() => setSelectedGateway(gw.id as any)}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      selectedGateway === gw.id
                        ? `${gw.color} bg-slate-50 dark:bg-slate-800 ring-2 ring-blue-500`
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {gw.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handlePayOnline}
              disabled={isProcessing}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              {isProcessing ? 'Processing Transaction...' : `Confirm & Pay ${currencySymbol} ${(selectedInvoice.dueAmount || selectedInvoice.totalAmount).toLocaleString()}`}
            </button>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {paymentSuccessReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Payment Recorded Successfully</h3>
              <p className="text-xs text-slate-500 mt-0.5">Authoritative Double-Entry General Ledger Voucher Created</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-xs text-left font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Receipt #:</span>
                <span className="font-bold text-blue-600">{paymentSuccessReceipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Transaction Ref:</span>
                <span>{paymentSuccessReceipt.transactionRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Student:</span>
                <span className="font-sans font-semibold">{paymentSuccessReceipt.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Amount Paid:</span>
                <span className="font-bold text-emerald-600">
                  {currencySymbol} {paymentSuccessReceipt.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                <span className="text-slate-500 font-sans">GL Voucher:</span>
                <span className="font-bold text-purple-600">{paymentSuccessReceipt.journalEntryNumber}</span>
              </div>
            </div>

            <button
              onClick={() => setPaymentSuccessReceipt(null)}
              className="w-full py-2 bg-slate-900 dark:bg-slate-800 text-white font-bold rounded-xl text-xs"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

      {/* MANUAL JOURNAL MODAL */}
      {showJournalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Post Manual Journal Voucher
              </h3>
              <button onClick={() => setShowJournalModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJournal} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Voucher Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office supplies purchase reimbursement"
                  value={journalDesc}
                  onChange={(e) => setJournalDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Journal Lines (Double-Entry)</span>
                  <button
                    type="button"
                    onClick={() =>
                      setJournalLines([
                        ...journalLines,
                        { accountId: '', debitAmount: 0, creditAmount: 0, memo: '' },
                      ])
                    }
                    className="text-blue-600 font-bold hover:underline flex items-center gap-0.5 text-[11px]"
                  >
                    <Plus className="w-3 h-3" /> Add Line
                  </button>
                </div>

                {journalLines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="col-span-5">
                      <select
                        required
                        value={line.accountId}
                        onChange={(e) => {
                          const updated = [...journalLines];
                          updated[idx].accountId = e.target.value;
                          setJournalLines(updated);
                        }}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                      >
                        <option value="">Select Account...</option>
                        {financeData?.accounts
                          ?.filter((a: any) => !a.isHeader)
                          .map((a: any) => (
                            <option key={a.id} value={a.id}>
                              {a.code} - {a.name} ({a.type})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Debit"
                        value={line.debitAmount || ''}
                        onChange={(e) => {
                          const updated = [...journalLines];
                          updated[idx].debitAmount = parseFloat(e.target.value) || 0;
                          setJournalLines(updated);
                        }}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[11px]"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Credit"
                        value={line.creditAmount || ''}
                        onChange={(e) => {
                          const updated = [...journalLines];
                          updated[idx].creditAmount = parseFloat(e.target.value) || 0;
                          setJournalLines(updated);
                        }}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[11px]"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      {journalLines.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setJournalLines(journalLines.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 font-bold"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowJournalModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs"
                >
                  {isProcessing ? 'Posting...' : 'Post to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
