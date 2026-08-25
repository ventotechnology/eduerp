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
  Ban,
  Search,
  Filter,
  Eye,
  Clock,
  RotateCw,
  ShieldCheck,
  FileText,
  Calendar,
  Layers
} from 'lucide-react';

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [gatewayFilter, setGatewayFilter] = useState('ALL');

  // Detail Drawer
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

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
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: 'FULFILLED' }));
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetryFulfillment = async (orderId: string, orderNumber: string) => {
    try {
      setActionLoading(orderId);
      setMsg(null);
      const res = await fetch('/api/super-admin/saas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RETRY_FULFILLMENT', orderId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to retry fulfillment');

      setMsg({ type: 'success', text: `Order ${orderNumber} fulfillment retried successfully!` });
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: 'FULFILLED' }));
      }
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
      if (selectedOrder?.id === rejectOrderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: 'CANCELLED' }));
      }
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
        body: JSON.stringify({ action: 'MARK_OFFLINE_PAYMENT_FAILED', orderId, reason: 'Payment could not be verified' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to mark payment as failed');

      setMsg({ type: 'success', text: `Order marked as FAILED.` });
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: 'FAILED' }));
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (gatewayFilter !== 'ALL' && o.gateway !== gatewayFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const institutionName = o.tenant?.name || o.signup?.institutionName || '';
      return (
        o.orderNumber?.toLowerCase().includes(q) ||
        o.trxId?.toLowerCase().includes(q) ||
        o.paymentId?.toLowerCase().includes(q) ||
        institutionName.toLowerCase().includes(q) ||
        o.plan?.name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'FULFILLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> {status}
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3 animate-spin" /> PROCESSING
          </span>
        );
      case 'PAYMENT_SUCCESS_FULFILLMENT_PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <AlertTriangle className="w-3 h-3" /> FULFILLMENT PENDING
          </span>
        );
      case 'PAYMENT_AMOUNT_MISMATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" /> AMOUNT MISMATCH
          </span>
        );
      case 'FAILED':
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Ban className="w-3 h-3" /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">SaaS Orders & Revenue</h1>
              <p className="text-sm text-slate-400">
                Institutional subscription purchases, online gateway transactions, and manual wire verification
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl border text-sm font-medium ${
            msg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Order Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="FULFILLED">FULFILLED / PAID</option>
            <option value="PAYMENT_SUCCESS_FULFILLMENT_PENDING">FULFILLMENT PENDING</option>
            <option value="PAYMENT_AMOUNT_MISMATCH">AMOUNT MISMATCH</option>
            <option value="FAILED">FAILED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          {/* Gateway Filter */}
          <select
            value={gatewayFilter}
            onChange={(e) => setGatewayFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Gateways</option>
            <option value="BKASH">bKash</option>
            <option value="NAGAD">Nagad</option>
            <option value="ROCKET">Rocket</option>
            <option value="BANK_TRANSFER">Bank Wire</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search order #, trx, institution..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Order #</th>
                <th className="px-4 py-3.5 font-semibold">Institution / Client</th>
                <th className="px-4 py-3.5 font-semibold">Plan & Cycle</th>
                <th className="px-4 py-3.5 font-semibold">Amount</th>
                <th className="px-4 py-3.5 font-semibold">Gateway / Trx</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 font-semibold">Date</th>
                <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5 font-mono text-slate-200">
                      <div>{o.orderNumber}</div>
                      {o.checkoutSessionId && <div className="text-[10px] text-slate-500">{o.checkoutSessionId}</div>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white">
                        {o.tenant?.name || o.signup?.institutionName || 'Self-Service Order'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {o.tenant?.slug || o.signup?.desiredSlug || o.signup?.email || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-white font-semibold">{o.plan?.name}</div>
                      <div className="text-[11px] text-slate-400">{o.billingCycle}</div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-white">
                      ৳ {o.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[11px]">
                        {o.gateway || 'UNSELECTED'}
                      </span>
                      {o.trxId && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Trx: {o.trxId}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(o.status)}</td>
                    <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                      {new Date(o.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition font-medium text-[11px] flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>

                        {o.status === 'PROCESSING' && o.gateway === 'BANK_TRANSFER' && (
                          <button
                            onClick={() => handleVerifyPayment(o.id, o.orderNumber)}
                            disabled={actionLoading === o.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition font-semibold text-[11px]"
                          >
                            Verify
                          </button>
                        )}

                        {o.status === 'PAYMENT_SUCCESS_FULFILLMENT_PENDING' && (
                          <button
                            onClick={() => handleRetryFulfillment(o.id, o.orderNumber)}
                            disabled={actionLoading === o.id}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition font-semibold text-[11px] flex items-center gap-1"
                          >
                            <RotateCw className="w-3 h-3" /> Retry
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                  Order #{selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Created {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Amount Banner */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Total Payable Amount</div>
                <div className="text-2xl font-black text-white">৳ {selectedOrder.totalAmount.toLocaleString()}</div>
                <div className="text-[11px] text-slate-500">{selectedOrder.currency} • {selectedOrder.billingCycle}</div>
              </div>
              <div>{getStatusBadge(selectedOrder.status)}</div>
            </div>

            {/* Institution & Plan Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client & Package</h4>
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Institution:</span>
                  <span className="font-semibold text-white">
                    {selectedOrder.tenant?.name || selectedOrder.signup?.institutionName || 'New Signup'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tenant Slug:</span>
                  <span className="font-mono text-emerald-400">
                    {selectedOrder.tenant?.slug || selectedOrder.signup?.desiredSlug || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Package:</span>
                  <span className="font-semibold text-white">{selectedOrder.plan?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Setup Fee / Discount:</span>
                  <span className="text-slate-300">
                    ৳ {selectedOrder.setupFee || 0} / -৳ {selectedOrder.discount || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Attempts History */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Payment Attempts History</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  {selectedOrder.payments?.length || 0} attempts recorded
                </span>
              </h4>

              {selectedOrder.payments && selectedOrder.payments.length > 0 ? (
                <div className="space-y-2">
                  {selectedOrder.payments.map((p: any, idx: number) => (
                    <div
                      key={p.id || idx}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">
                          Attempt #{p.attemptNumber || idx + 1} ({p.gateway})
                        </span>
                        {getStatusBadge(p.status)}
                      </div>
                      <div className="text-[11px] text-slate-400 flex justify-between">
                        <span>Trx ID: <span className="font-mono text-slate-300">{p.trxId || p.paymentId || 'None'}</span></span>
                        <span>৳ {p.amount}</span>
                      </div>
                      {p.errorMessage && (
                        <div className="text-[11px] text-rose-400 bg-rose-500/10 p-1.5 rounded border border-rose-500/20 mt-1">
                          {p.errorMessage}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 pt-0.5">
                        {new Date(p.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                  No payment attempts initiated yet.
                </div>
              )}
            </div>

            {/* Action Bar inside Drawer */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-3">
              {selectedOrder.status === 'PROCESSING' && selectedOrder.gateway === 'BANK_TRANSFER' && (
                <>
                  <button
                    onClick={() => handleVerifyPayment(selectedOrder.id, selectedOrder.orderNumber)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
                  >
                    Verify & Activate Subscription
                  </button>
                  <button
                    onClick={() => setRejectOrderId(selectedOrder.id)}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition"
                  >
                    Reject
                  </button>
                </>
              )}

              {selectedOrder.status === 'PAYMENT_SUCCESS_FULFILLMENT_PENDING' && (
                <button
                  onClick={() => handleRetryFulfillment(selectedOrder.id, selectedOrder.orderNumber)}
                  className="w-full px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2"
                >
                  <RotateCw className="w-4 h-4" /> Retry Atomic Fulfillment
                </button>
              )}

              {selectedOrder.status === 'PENDING' && (
                <button
                  onClick={() => handleMarkFailed(selectedOrder.id, selectedOrder.orderNumber)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 font-semibold text-xs transition"
                >
                  Cancel / Mark Failed
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Reject Bank Wire Payment</h3>
            <p className="text-xs text-slate-400">
              Please enter the audit reason for rejecting this payment reference.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectOrderId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPayment}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
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
