'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  CreditCard,
  Building2,
  DollarSign,
  CheckCircle2,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  FileCheck,
  Ban
} from 'lucide-react';

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reject Modal
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Payment reference could not be verified with the bank.');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/super-admin/saas');
      const data = await res.json();
      if (data.success) {
        setOrders(data.recentOrders || []);
        setInvoices(data.recentInvoices || []);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleVerifyPayment = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to VERIFY payment for order ${orderNumber}? This will activate the subscription and mark the invoice as PAID.`)) {
      return;
    }

    try {
      setActionLoading(orderId);
      setMsg(null);
      const res = await fetch('/api/super-admin/saas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'VERIFY_OFFLINE_PAYMENT', orderId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to verify payment');

      setMsg({ type: 'success', text: `Order ${orderNumber} verified and subscription activated successfully.` });
      fetchOrders();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectOrderId) return;
    try {
      setActionLoading(rejectOrderId);
      setMsg(null);
      const res = await fetch('/api/super-admin/saas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT_OFFLINE_PAYMENT', orderId: rejectOrderId, reason: rejectReason })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to reject payment');

      setMsg({ type: 'success', text: `Order marked as REJECTED with stated reason.` });
      setRejectOrderId(null);
      fetchOrders();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkFailed = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to mark order ${orderNumber} as FAILED?`)) return;
    try {
      setActionLoading(orderId);
      setMsg(null);
      const res = await fetch('/api/super-admin/saas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_OFFLINE_PAYMENT_FAILED', orderId, reason: 'Payment transaction failed or timed out.' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to mark as failed');

      setMsg({ type: 'success', text: `Order ${orderNumber} marked as FAILED.` });
      fetchOrders();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <span>SaaS Orders & Revenue Billing Verification</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit subscription orders, verify manual bank deposits, and fulfill customer subscriptions.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          msg.type === 'success' ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300' : 'bg-rose-950/80 border border-rose-800 text-rose-300'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-white mb-4">Subscription Checkout & Offline Payment Orders</h2>
        {orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No subscription orders recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Order Number</th>
                  <th className="pb-3 font-semibold">Institution / Lead</th>
                  <th className="pb-3 font-semibold">Package Tier</th>
                  <th className="pb-3 font-semibold">Billing Cycle</th>
                  <th className="pb-3 font-semibold">Total Amount</th>
                  <th className="pb-3 font-semibold">Gateway</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {orders.map((ord) => {
                  const isPendingReview = ord.status === 'PROCESSING' || ord.status === 'PENDING' || ord.gateway === 'BANK_TRANSFER';
                  const isFulfilled = ord.status === 'PAID' || ord.status === 'FULFILLED';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 font-mono font-bold text-emerald-400">{ord.orderNumber}</td>
                      <td className="py-3 font-medium text-white">{ord.signup?.institutionName || ord.tenant?.slug || 'New Lead'}</td>
                      <td className="py-3">{ord.plan?.name}</td>
                      <td className="py-3 uppercase text-[11px]">{ord.billingCycle}</td>
                      <td className="py-3 font-extrabold text-white">BDT {ord.totalAmount?.toLocaleString()}</td>
                      <td className="py-3 uppercase">{ord.gateway || 'BKASH'}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isFulfilled
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : ord.status === 'CANCELLED' || ord.status === 'FAILED'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{new Date(ord.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 text-right">
                        {isPendingReview && !isFulfilled && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleVerifyPayment(ord.id, ord.orderNumber)}
                              disabled={actionLoading === ord.id}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-xs transition"
                              title="Verify Payment & Fulfill"
                            >
                              <Check className="w-3 h-3" />
                              <span>Verify</span>
                            </button>
                            <button
                              onClick={() => setRejectOrderId(ord.id)}
                              disabled={actionLoading === ord.id}
                              className="px-2 py-1 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 font-bold rounded-lg text-[11px] transition"
                              title="Reject Payment"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        {isFulfilled && (
                          <span className="text-emerald-400 text-[11px] font-bold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Fulfilled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REJECT MODAL */}
      {rejectOrderId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full text-white space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold flex items-center gap-2 text-rose-400">
              <Ban className="w-4 h-4" />
              <span>Reject Offline Payment Record</span>
            </h3>
            <p className="text-xs text-slate-300">
              Please enter the official reason for rejecting this payment reference. The customer will be informed.
            </p>
            <textarea
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRejectOrderId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectPayment}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
