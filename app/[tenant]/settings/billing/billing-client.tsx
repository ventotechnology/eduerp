'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Zap,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  FileText,
  Download,
  Building2,
  Users,
  HardDrive,
  MessageSquare,
  AlertCircle,
  Sparkles,
  Check,
  X,
  Clock,
  ArrowDownCircle,
  HelpCircle,
  Smartphone,
  Landmark,
  FileCheck
} from 'lucide-react';

interface Props {
  tenantSlug: string;
  initialData: any;
}

export default function BillingClient({ tenantSlug, initialData }: Props) {
  const { tenant, subscription, usage, invoices, availablePlans } = initialData;

  const currentPlan = subscription?.plan || {
    id: 'starter',
    tier: 'STARTER',
    name: 'Starter Tier',
    monthlyPrice: 4500,
    annualPrice: 45000,
    currency: 'BDT',
    maxStudents: 250,
    maxCampuses: 1
  };

  const isActive = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING';
  const periodEnd = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : new Date(Date.now() + 30 * 86400000);
  const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  // Billing Cycle Toggle for Plan Selector
  const [selectedCycle, setSelectedCycle] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL');

  // Modals & Flows
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'BKASH' | 'BANK_TRANSFER'>('BKASH');
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Bank Transfer Form
  const [bankForm, setBankForm] = useState({
    bankName: 'City Bank',
    accountNumber: '1102345678001',
    transactionRef: '',
    depositDate: new Date().toISOString().slice(0, 10),
    notes: '',
    amount: 0
  });

  // Downgrade Guard State
  const [downgradeBlocked, setDowngradeBlocked] = useState<{ planName: string; reason: string } | null>(null);

  // Default Plans Matrix if none returned from API
  const plans = availablePlans?.length > 0 ? availablePlans : [
    {
      id: 'plan_starter',
      tier: 'STARTER',
      name: 'Starter Tier',
      monthlyPrice: 4500,
      annualPrice: 45000,
      maxStudents: 250,
      maxCampuses: 1,
      maxTeachers: 20,
      maxUsers: 5,
      features: ['Core Student Information', 'Basic Fee Management', 'Single Campus', 'Basic Reports']
    },
    {
      id: 'plan_standard',
      tier: 'STANDARD',
      name: 'Standard Tier',
      monthlyPrice: 9500,
      annualPrice: 95000,
      maxStudents: 750,
      maxCampuses: 2,
      maxTeachers: 50,
      maxUsers: 15,
      features: ['Full Academics & Classes', 'Online Admissions', 'Dual Campuses', 'Accounting & Payroll', 'SMS Notifications']
    },
    {
      id: 'plan_pro',
      tier: 'PROFESSIONAL',
      name: 'Professional Tier',
      monthlyPrice: 18500,
      annualPrice: 185000,
      maxStudents: 2000,
      maxCampuses: 5,
      maxTeachers: 150,
      maxUsers: 50,
      features: ['Examinations & Grading', 'Parent & Student Portals', 'Multi-Campus Context', 'HR & Facilities', 'Custom Certificates']
    },
    {
      id: 'plan_enterprise',
      tier: 'ENTERPRISE',
      name: 'Enterprise Tier',
      monthlyPrice: 35000,
      annualPrice: 350000,
      maxStudents: 10000,
      maxCampuses: 20,
      maxTeachers: 500,
      maxUsers: 200,
      features: ['Unlimited Student Capacity', 'Unlimited Campuses', 'Dedicated SLA Support', 'AI Copilot Engine', 'Custom Integrations']
    }
  ];

  const handleSelectPlan = (plan: any) => {
    setErrorMsg(null);
    setDowngradeBlocked(null);

    // Check if downgrade
    const currentStudents = usage?.students?.current || 0;
    if (plan.maxStudents < (currentPlan.maxStudents || 99999)) {
      if (currentStudents > plan.maxStudents) {
        setDowngradeBlocked({
          planName: plan.name,
          reason: `Cannot downgrade to ${plan.name}. Your institution currently has ${currentStudents} active students, which exceeds the limit of ${plan.maxStudents.toLocaleString()} for this plan. Please archive or graduate students before requesting this plan.`
        });
        return;
      }
    }

    const price = selectedCycle === 'ANNUAL' ? plan.annualPrice : plan.monthlyPrice;
    setBankForm((p) => ({ ...p, amount: price }));
    setSelectedPlanForUpgrade(plan);
  };

  const handleInitiateOrder = async () => {
    if (!selectedPlanForUpgrade) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Create order
      const orderRes = await fetch('/api/subscriptions/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          planId: selectedPlanForUpgrade.id,
          billingCycle: selectedCycle,
          gateway: paymentMethod
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create subscription order.');
      }

      const order = orderData.order;

      // 2. Handle bKash
      if (paymentMethod === 'BKASH') {
        const bkashRes = await fetch('/api/subscriptions/checkout/bkash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id })
        });
        const bkashData = await bkashRes.json();
        if (bkashData.bkashUrl) {
          window.location.href = bkashData.bkashUrl;
          return;
        }
        setOrderResult({ ...order, bkashSession: bkashData });
      } else {
        // Bank transfer
        setOrderResult(order);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitBankTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderResult?.id) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/subscriptions/bank-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderResult.id,
          bankName: bankForm.bankName,
          accountNumber: bankForm.accountNumber,
          transactionRef: bankForm.transactionRef,
          depositDate: bankForm.depositDate,
          notes: bankForm.notes
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit bank transfer verification.');
      }

      setSuccessMsg('Offline bank transfer proof submitted successfully! Status: PENDING REVIEW. Our billing team will verify and activate your subscription.');
      setSelectedPlanForUpgrade(null);
      setOrderResult(null);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 text-emerald-200 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {downgradeBlocked && (
        <div className="p-4 bg-amber-950/80 border border-amber-800 text-amber-200 rounded-2xl text-xs flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-300">Downgrade Usage Guard Triggered</h4>
            <p>{downgradeBlocked.reason}</p>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Plan Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Package</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
              isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500'
            }`}>
              {subscription?.status || 'ACTIVE_TRIAL'}
            </span>
          </div>

          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            {currentPlan.name}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Billing Cycle: <span className="font-semibold text-slate-700 dark:text-slate-200">{subscription?.billingCycle || 'ANNUAL'}</span>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">Next Renewal:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {periodEnd.toLocaleDateString()} ({daysRemaining} days left)
            </span>
          </div>
        </div>

        {/* Total Storage Quota */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Storage Consumption</span>
            <HardDrive className="w-4 h-4 text-slate-400" />
          </div>

          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            {usage?.storageGb?.current || 0} / {usage?.storageGb?.max || 50} GB
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 mb-2">
            <div
              className="bg-emerald-500 h-2 rounded-full"
              style={{ width: `${Math.min(100, ((usage?.storageGb?.current || 0) / (usage?.storageGb?.max || 50)) * 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400">
            {Math.round(((usage?.storageGb?.current || 0) / (usage?.storageGb?.max || 50)) * 100)}% used of total cloud storage
          </div>
        </div>

        {/* SMS Credits */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Monthly SMS Quota</span>
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </div>

          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            {usage?.sms?.current || 0} / {(usage?.sms?.max || 5000).toLocaleString()}
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 mb-2">
            <div
              className="bg-teal-500 h-2 rounded-full"
              style={{ width: `${Math.min(100, ((usage?.sms?.current || 0) / (usage?.sms?.max || 5000)) * 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400">
            {(usage?.sms?.max || 5000) - (usage?.sms?.current || 0)} SMS messages remaining this period
          </div>
        </div>
      </div>

      {/* Plan Comparison & Self-Service Upgrade/Downgrade Matrix */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Available Subscription Packages & Upgrades</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select a tier that matches your student capacity and operational requirements.
            </p>
          </div>

          {/* Billing Cycle Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
            <button
              onClick={() => setSelectedCycle('MONTHLY')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedCycle === 'MONTHLY' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setSelectedCycle('ANNUAL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                selectedCycle === 'ANNUAL' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black">SAVE 15%</span>
            </button>
          </div>
        </div>

        {/* 4 Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p: any) => {
            const isCurrent = (currentPlan.tier === p.tier) || (currentPlan.id === p.id);
            const price = selectedCycle === 'ANNUAL' ? p.annualPrice : p.monthlyPrice;

            return (
              <div
                key={p.id}
                className={`rounded-2xl p-5 flex flex-col justify-between border transition relative ${
                  isCurrent
                    ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500 shadow-md'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-[10px] font-black uppercase rounded-full shadow-sm">
                    Current Active Plan
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{p.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        BDT {price.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400">/{selectedCycle === 'ANNUAL' ? 'year' : 'month'}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Student Quota:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{p.maxStudents.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Campuses:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{p.maxCampuses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Staff Limit:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{p.maxTeachers || 50}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider block">Features:</span>
                    <ul className="space-y-1.5 text-slate-500 dark:text-slate-400">
                      {(p.features || ['Core Modules', 'Portal Access']).map((f: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold cursor-not-allowed"
                    >
                      Active Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan(p)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                        p.maxStudents > (currentPlan.maxStudents || 0)
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {p.maxStudents > (currentPlan.maxStudents || 0) ? `Upgrade to ${p.name}` : `Switch to ${p.name}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: Upgrade / Checkout Selection */}
      {selectedPlanForUpgrade && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-w-lg w-full p-6 space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Upgrade Subscription: {selectedPlanForUpgrade.name}</h3>
                <span className="text-xs text-slate-400">Review pricing & payment method</span>
              </div>
              <button
                onClick={() => {
                  setSelectedPlanForUpgrade(null);
                  setOrderResult(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {!orderResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Package:</span>
                    <span className="font-bold text-white">{selectedPlanForUpgrade.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Billing Cycle:</span>
                    <span className="font-bold text-emerald-400 uppercase">{selectedCycle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Student Capacity:</span>
                    <span className="font-bold text-white">{selectedPlanForUpgrade.maxStudents.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between text-sm">
                    <span className="font-bold text-slate-300">Total Payable:</span>
                    <span className="font-black text-emerald-400">
                      BDT {(selectedCycle === 'ANNUAL' ? selectedPlanForUpgrade.annualPrice : selectedPlanForUpgrade.monthlyPrice).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-300 block">Select Payment Gateway:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('BKASH')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                        paymentMethod === 'BKASH'
                          ? 'bg-pink-950/40 border-pink-500 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 text-pink-400" />
                      <span className="font-bold text-xs">bKash Online</span>
                      <span className="text-[10px] text-slate-400">Instant Verification</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('BANK_TRANSFER')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                        paymentMethod === 'BANK_TRANSFER'
                          ? 'bg-blue-950/40 border-blue-500 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Landmark className="w-5 h-5 text-blue-400" />
                      <span className="font-bold text-xs">Offline Bank Transfer</span>
                      <span className="text-[10px] text-slate-400">Admin Review</span>
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlanForUpgrade(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleInitiateOrder}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md"
                  >
                    {submitting ? 'Creating Order...' : 'Proceed to Payment'}
                  </button>
                </div>
              </div>
            ) : (
              /* Offline Bank Transfer Proof Form */
              <form onSubmit={handleSubmitBankTransfer} className="space-y-4 text-xs">
                <div className="p-3 bg-blue-950/60 border border-blue-800 rounded-xl space-y-1 text-slate-300">
                  <div className="font-bold text-blue-300">Official Beneficiary Account:</div>
                  <div>Bank: <strong className="text-white">The City Bank Limited</strong></div>
                  <div>Account Name: <strong className="text-white">Vento Technology Limited</strong></div>
                  <div>Account Number: <strong className="font-mono text-emerald-400">1102345678001</strong></div>
                  <div>Branch: <strong>Dhanmondi, Dhaka</strong> | Routing: <strong>225271234</strong></div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Order / Reference #</label>
                    <input
                      type="text"
                      disabled
                      value={orderResult.orderNumber}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Depositor Bank Name *</label>
                      <input
                        type="text"
                        required
                        value={bankForm.bankName}
                        onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                        className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Deposit Date *</label>
                      <input
                        type="date"
                        required
                        value={bankForm.depositDate}
                        onChange={(e) => setBankForm({ ...bankForm, depositDate: e.target.value })}
                        className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Transaction Ref / TrxID *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. TR-2026-XXXXX"
                        value={bankForm.transactionRef}
                        onChange={(e) => setBankForm({ ...bankForm, transactionRef: e.target.value })}
                        className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Amount Paid (BDT) *</label>
                      <input
                        type="number"
                        required
                        value={bankForm.amount}
                        onChange={(e) => setBankForm({ ...bankForm, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Deposit Notes / Branch Info</label>
                    <input
                      type="text"
                      placeholder="e.g. Deposited from Principal account"
                      value={bankForm.notes}
                      onChange={(e) => setBankForm({ ...bankForm, notes: e.target.value })}
                      className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlanForUpgrade(null);
                      setOrderResult(null);
                    }}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                  >
                    {submitting ? 'Submitting...' : 'Submit Offline Payment Proof'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Plan Entitlement Usage Breakdown */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Institutional Capacity & Entitlements
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">Active Students</span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {usage?.students?.current || 0} <span className="text-xs font-normal text-slate-400">/ {(usage?.students?.max || 250).toLocaleString()}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">Authorized Campuses</span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {usage?.campuses?.current || 1} <span className="text-xs font-normal text-slate-400">/ {usage?.campuses?.max || 1}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">Faculty & Teachers</span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {usage?.teachers?.current || 0} <span className="text-xs font-normal text-slate-400">/ {usage?.teachers?.max || 20}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">Admin Staff Users</span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {usage?.users?.current || 1} <span className="text-xs font-normal text-slate-400">/ {usage?.users?.max || 5}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Platform Invoices & Payment Receipts
        </h2>

        {!invoices || invoices.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No invoices recorded for this institution yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Invoice #</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Period</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Gateway</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="py-3">{inv.billingPeriod}</td>
                    <td className="py-3 font-bold text-slate-900 dark:text-white">
                      BDT {inv.totalAmount?.toLocaleString()}
                    </td>
                    <td className="py-3 font-medium uppercase">{inv.paymentMethod || 'BKASH'}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
