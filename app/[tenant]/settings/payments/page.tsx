'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Lock,
  Key,
  DollarSign,
  Shield,
  Eye,
  Sliders,
  Check,
  FileText,
  Clock,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { safeFetchJson } from '@/lib/api/safe-response';

export default function TenantPaymentsPage() {
  const params = useParams();
  const tenantSlug = params?.tenant as string;

  const [loading, setLoading] = useState(true);
  const [gateways, setGateways] = useState<any[]>([]);
  const [offlinePayments, setOfflinePayments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Edit Gateway Modal
  const [editingGw, setEditingGw] = useState<any | null>(null);
  const [newCredentials, setNewCredentials] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Verify/Reject Modal
  const [verifyingRecord, setVerifyingRecord] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const fetchTenantGateways = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await safeFetchJson<{ gateways: any[]; offlinePayments: any[] }>(
        `/api/tenant/payment-gateways?tenantSlug=${tenantSlug}`
      );
      if (res.success && res.data) {
        setGateways(res.data.gateways || []);
        setOfflinePayments(res.data.offlinePayments || []);
      } else {
        setError(res.error || 'Failed to load payment settings.');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching payment settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchTenantGateways();
    }
  }, [tenantSlug]);

  const handleSaveTenantGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGw) return;
    setSaving(true);

    try {
      const payload: any = {
        tenantSlug,
        gateway: editingGw.gateway,
        data: {
          isEnabled: editingGw.isEnabled,
          isSandbox: editingGw.isSandbox,
          instructions: editingGw.instructions,
          bankName: editingGw.bankName,
          bankAccountName: editingGw.bankAccountName,
          bankAccountNumber: editingGw.bankAccountNumber,
          bankBranch: editingGw.bankBranch,
          bankRouting: editingGw.bankRouting,
          credentials: Object.keys(newCredentials).length > 0 ? newCredentials : undefined
        }
      };

      const res = await safeFetchJson<any>('/api/tenant/payment-gateways', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setEditingGw(null);
        await fetchTenantGateways();
      } else {
        alert(res.error || 'Failed to save gateway settings');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyOfflinePayment = async (action: 'VERIFY' | 'REJECT') => {
    if (!verifyingRecord) return;
    setProcessingAction(true);

    try {
      const res = await safeFetchJson<any>('/api/tenant/payment-gateways/offline-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: verifyingRecord.id,
          action,
          rejectionReason: action === 'REJECT' ? rejectionReason : undefined
        })
      });

      if (res.success) {
        setVerifyingRecord(null);
        setRejectionReason('');
        await fetchTenantGateways();
      } else {
        alert(res.error || 'Failed to process offline payment');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span>Institution Payment Gateway & Offline Collections</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage student fee collection methods, shared platform gateways, direct merchant overrides, and offline banking review.
          </p>
        </div>

        <button
          onClick={fetchTenantGateways}
          disabled={loading}
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-2 border border-slate-700 w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
          <span>Refresh Settings</span>
        </button>
      </div>

      {/* Payment Gateways Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gateways.map((gw) => (
          <div key={gw.gateway} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                    gw.gateway === 'BKASH' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' :
                    gw.gateway === 'NAGAD' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                    gw.gateway === 'ROCKET' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                    gw.gateway === 'SSLCOMMERZ' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    gw.gateway === 'BANK_TRANSFER' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-slate-800 text-white'
                  }`}>
                    {gw.gateway === 'BANK_TRANSFER' ? <Building className="w-5 h-5" /> : gw.displayName?.slice(0, 4)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{gw.displayName}</h3>
                    <span className="text-[11px] text-slate-400">{gw.provider}</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  gw.isEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {gw.isEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div className="mt-3 p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Operation Mode:</span>
                  <span className="font-bold text-emerald-400">
                    {gw.isShared ? 'EduERP Shared Gateway' : 'Institution Merchant Account'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Limits:</span>
                  <span className="text-slate-300 font-mono">৳ {gw.minAmount} – ৳ {gw.maxAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Platform Surcharge:</span>
                  <span className="text-slate-300">{gw.percentageFee}%</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingGw({ ...gw });
                setNewCredentials({});
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Configure Account</span>
            </button>
          </div>
        ))}
      </div>

      {/* Offline Payment Submissions / Verification Queue */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>Offline Payment Verification Queue</span>
            </h2>
            <p className="text-xs text-slate-400">
              Review and reconcile bank wire, deposit slip, cheque, and cash payments submitted by students or guardians.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-bold text-xs">
            {offlinePayments.length} Total Submissions
          </span>
        </div>

        {offlinePayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Reference / Slip</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Submitted By</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {offlinePayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3 font-mono font-bold text-white">{p.referenceNumber}</td>
                    <td className="p-3">{p.paymentMethod}</td>
                    <td className="p-3 font-black text-white">৳ {p.amount?.toLocaleString()}</td>
                    <td className="p-3 text-slate-400">{p.submittedBy || 'Guardian/Student'}</td>
                    <td className="p-3 text-slate-400">{new Date(p.paymentDate).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        p.status === 'VERIFIED' || p.status === 'PAID'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : p.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {p.status === 'UNDER_REVIEW' || p.status === 'SUBMITTED' ? (
                        <button
                          onClick={() => setVerifyingRecord(p)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition"
                        >
                          Review & Verify
                        </button>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs">
            No offline payment submissions awaiting verification.
          </div>
        )}
      </div>

      {/* Edit Gateway Settings Modal */}
      {editingGw && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Configure {editingGw.displayName}</h3>
                <p className="text-xs text-slate-400">Manage institution fees and merchant settings.</p>
              </div>
              <button onClick={() => setEditingGw(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTenantGateway} className="space-y-4 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingGw.isEnabled}
                  onChange={(e) => setEditingGw({ ...editingGw, isEnabled: e.target.checked })}
                  className="rounded text-emerald-500"
                />
                <span className="font-bold text-white">Enable Payment Option for Students</span>
              </label>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Student Instructions</label>
                <textarea
                  rows={2}
                  value={editingGw.instructions || ''}
                  onChange={(e) => setEditingGw({ ...editingGw, instructions: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              {editingGw.gateway === 'BANK_TRANSFER' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <h4 className="font-bold text-amber-400">Institution Bank Account Details</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={editingGw.bankName || ''}
                        onChange={(e) => setEditingGw({ ...editingGw, bankName: e.target.value })}
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Account Name</label>
                      <input
                        type="text"
                        value={editingGw.bankAccountName || ''}
                        onChange={(e) => setEditingGw({ ...editingGw, bankAccountName: e.target.value })}
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={editingGw.bankAccountNumber || ''}
                        onChange={(e) => setEditingGw({ ...editingGw, bankAccountNumber: e.target.value })}
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Branch Name</label>
                      <input
                        type="text"
                        value={editingGw.bankBranch || ''}
                        onChange={(e) => setEditingGw({ ...editingGw, bankBranch: e.target.value })}
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingGw(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Offline Payment Modal */}
      {verifyingRecord && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Review Offline Payment</h3>
                <p className="text-xs text-slate-400 font-mono">Ref: {verifyingRecord.referenceNumber}</p>
              </div>
              <button onClick={() => setVerifyingRecord(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-bold text-emerald-400 text-sm">৳ {verifyingRecord.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span className="text-white font-medium">{verifyingRecord.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted By:</span>
                <span className="text-white">{verifyingRecord.submittedBy || 'Guardian'}</span>
              </div>
              {verifyingRecord.notes && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-500 block mb-1">Notes:</span>
                  <p className="text-slate-300 italic">{verifyingRecord.notes}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-400 text-xs mb-1">Rejection Reason (If rejecting)</label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                placeholder="e.g. Deposit slip reference not matched in bank statement"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                disabled={processingAction}
                onClick={() => handleVerifyOfflinePayment('REJECT')}
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={processingAction}
                onClick={() => handleVerifyOfflinePayment('VERIFY')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
              >
                Approve & Mark Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
