'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CreditCard, Zap, ShieldCheck, CheckCircle2, ArrowUpRight, FileText, Download, Building2, Users, HardDrive, MessageSquare, AlertCircle } from 'lucide-react';

interface Props {
  tenantSlug: string;
  initialData: any;
}

export default function BillingClient({ tenantSlug, initialData }: Props) {
  const { tenant, subscription, usage, invoices, availablePlans } = initialData;

  const plan = subscription?.plan || {
    name: 'Standard Tier',
    monthlyPrice: 9500,
    annualPrice: 95000,
    currency: 'BDT'
  };

  const isActive = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING';
  const periodEnd = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : new Date(Date.now() + 30 * 86400000);
  const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Plan Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Package</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
              isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500'
            }`}>
              {subscription?.status || 'ACTIVE'}
            </span>
          </div>

          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            {plan.name}
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
            {usage.storageGb.current} / {usage.storageGb.max} GB
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 mb-2">
            <div
              className="bg-emerald-500 h-2 rounded-full"
              style={{ width: `${Math.min(100, (usage.storageGb.current / usage.storageGb.max) * 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400">
            {Math.round((usage.storageGb.current / usage.storageGb.max) * 100)}% used of total cloud storage
          </div>
        </div>

        {/* SMS Credits */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Monthly SMS Quota</span>
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </div>

          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
            {usage.sms.current} / {usage.sms.max.toLocaleString()}
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 mb-2">
            <div
              className="bg-teal-500 h-2 rounded-full"
              style={{ width: `${Math.min(100, (usage.sms.current / usage.sms.max) * 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400">
            {usage.sms.max - usage.sms.current} SMS messages remaining this period
          </div>
        </div>
      </div>

      {/* Plan Entitlement Usage Breakdown */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Institutional Capacity & Entitlements
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">Active Students</span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {usage.students.current} <span className="text-xs font-normal text-slate-400">/ {usage.students.max.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">Authorized Campuses</span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {usage.campuses.current} <span className="text-xs font-normal text-slate-400">/ {usage.campuses.max}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">Faculty & Teachers</span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {usage.teachers.current} <span className="text-xs font-normal text-slate-400">/ {usage.teachers.max}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">Admin Staff Users</span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {usage.users.current} <span className="text-xs font-normal text-slate-400">/ {usage.users.max}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Platform Invoices & Payment Receipts
        </h2>

        {invoices.length === 0 ? (
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
                      BDT {inv.totalAmount.toLocaleString()}
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
