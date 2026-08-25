'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Building2, ShieldCheck, Download, RefreshCw } from 'lucide-react';

interface Props {
  orderId: string;
  queryStatus?: string;
  queryReason?: string;
  initialData?: any;
}

export default function StatusClient({ orderId, queryStatus, queryReason, initialData }: Props) {
  const [data, setData] = useState<any>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const router = useRouter();

  // Polling for status if processing
  useEffect(() => {
    if (data?.order?.status === 'FULFILLED' || data?.order?.status === 'PAID') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/subscriptions/orders/${orderId}`);
        const resData = await res.json();
        if (resData.success && resData.order) {
          setData(resData);
          if (resData.order.status === 'FULFILLED' || resData.order.status === 'PAID') {
            clearInterval(interval);
          }
        }
      } catch (err) {
        // silent
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [orderId, data?.order?.status]);

  const isSuccess =
    queryStatus === 'success' ||
    data?.order?.status === 'FULFILLED' ||
    data?.order?.status === 'PAID';

  const isFailed =
    queryStatus === 'failed' ||
    queryStatus === 'cancel' ||
    data?.order?.status === 'FAILED';

  const tenantSlug =
    data?.order?.tenant?.slug ||
    data?.order?.signup?.desiredSlug ||
    '';

  const invoice = data?.order?.invoices?.[0];

  if (loading) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center w-full">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-white mb-1">Verifying Payment with bKash...</h2>
        <p className="text-xs text-slate-400">Please wait while our server finalizes your subscription.</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-2xl text-center w-full">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Payment Verified & Instance Active
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-4 mb-2">
          Welcome to EduERP!
        </h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-8">
          Your institution workspace is provisioned. Your subscription is active and ready for use.
        </p>

        {/* Details Card */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3 text-xs text-slate-300 mb-8 text-left">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-500">Institution:</span>
            <span className="font-bold text-white">{data?.order?.signup?.institutionName || 'Your Institution'}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-500">Workspace URL:</span>
            <span className="font-mono font-bold text-emerald-400">
              https://{tenantSlug}.eduerp.us
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-500">Plan:</span>
            <span className="font-semibold text-white">{data?.order?.plan?.name} ({data?.order?.billingCycle})</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-500">Amount Paid:</span>
            <span className="font-extrabold text-emerald-400">BDT {data?.order?.totalAmount?.toLocaleString()}</span>
          </div>
          {data?.order?.trxId && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500">bKash TrxID:</span>
              <span className="font-mono text-white">{data?.order?.trxId}</span>
            </div>
          )}
        </div>

        {/* Action CTAs */}
        <div className="space-y-3">
          <button
            onClick={() => window.print()}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Print Official Payment Receipt</span>
          </button>

          <Link
            href={tenantSlug ? `/${tenantSlug}/dashboard` : '/login'}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
          >
            <span>Enter Your EduERP Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-400 hover:text-white transition-all flex items-center justify-center"
          >
            <span>Sign In with Administrator Credentials</span>
          </Link>
        </div>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border border-rose-500/30 shadow-2xl text-center w-full">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10" />
        </div>

        <h1 className="text-2xl font-extrabold text-white mb-2">Payment Was Not Completed</h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          {queryReason || 'The transaction was cancelled or declined by bKash. No charges were made.'}
        </p>

        <div className="space-y-3">
          <Link
            href={`/checkout/${orderId}`}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Payment Again</span>
          </Link>

          <Link
            href="/pricing"
            className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition-colors block"
          >
            Choose a Different Plan
          </Link>
        </div>
      </div>
    );
  }

  // Processing Fallback
  return (
    <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center w-full">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-4" />
      <h2 className="text-lg font-bold text-white mb-1">Awaiting Payment Confirmation</h2>
      <p className="text-xs text-slate-400 mb-6">
        Order {data?.order?.orderNumber} is pending payment verification.
      </p>
      <Link
        href={`/checkout/${orderId}`}
        className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700"
      >
        Return to Checkout
      </Link>
    </div>
  );
}
