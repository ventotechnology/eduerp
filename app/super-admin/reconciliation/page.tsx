'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  DollarSign,
  Layers,
  ArrowUpRight,
  Clock,
  Eye,
  Check,
  Zap,
  Play
} from 'lucide-react';

export default function PaymentReconciliationPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    metrics: {
      totalRecords: 0,
      totalGross: 0,
      totalFees: 0,
      totalNet: 0,
      matchedCount: 0,
      unmatchedCount: 0,
      mismatchCount: 0,
      exceptionsCount: 0,
      matchRatePercent: 100
    },
    records: []
  });

  const [selectedScope, setSelectedScope] = useState<string>('PLATFORM');
  const [selectedGateway, setSelectedGateway] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [runningBatch, setRunningBatch] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Detail / Resolve Modal
  const [inspectRecord, setInspectRecord] = useState<any | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<string>('MATCHED');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [resolving, setResolving] = useState(false);

  const fetchReconciliationData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        scope: selectedScope,
        gateway: selectedGateway,
        status: selectedStatus
      });
      const res = await fetch(`/api/super-admin/reconciliation?${params.toString()}`);
      const resData = await res.json();
      if (resData.success) {
        setData(resData);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliationData();
  }, [selectedScope, selectedGateway, selectedStatus]);

  const handleRunReconciliation = async () => {
    try {
      setRunningBatch(true);
      setActionMsg(null);
      const res = await fetch('/api/super-admin/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RUN_RECONCILIATION',
          scope: selectedScope,
          gateway: selectedGateway
        })
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) throw new Error(resData.error || 'Failed to run reconciliation batch.');

      setActionMsg({
        type: 'success',
        text: `Reconciliation batch completed! Processed: ${resData.totalProcessed}, Matched: ${resData.matchedCount}, Exceptions: ${resData.discrepancyCount}`
      });
      fetchReconciliationData();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message });
    } finally {
      setRunningBatch(false);
    }
  };

  const handleResolveDiscrepancy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectRecord) return;
    try {
      setResolving(true);
      const res = await fetch('/api/super-admin/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESOLVE_DISCREPANCY',
          recordId: inspectRecord.id,
          status: resolutionStatus,
          notes: resolutionNotes
        })
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) throw new Error(resData.error || 'Failed to resolve discrepancy.');

      setActionMsg({ type: 'success', text: `Transaction ${inspectRecord.transactionRef} resolved as ${resolutionStatus}.` });
      setInspectRecord(null);
      fetchReconciliationData();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message });
    } finally {
      setResolving(false);
    }
  };

  const filteredRecords = data.records.filter((r: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.transactionRef?.toLowerCase().includes(q) ||
      r.gateway?.toLowerCase().includes(q) ||
      r.batchReference?.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'MATCHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Matched
          </span>
        );
      case 'AMOUNT_MISMATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> Amount Mismatch
          </span>
        );
      case 'MISSING_PROVIDER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> Missing at Provider
          </span>
        );
      case 'MISSING_LOCAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <AlertTriangle className="w-3 h-3" /> Missing Locally
          </span>
        );
      case 'MANUAL_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Clock className="w-3 h-3" /> Manual Review
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
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Payment Reconciliation Engine</h1>
              <p className="text-sm text-slate-400">
                Automated multi-gateway transaction matching, settlement auditing, and ledger integrity
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReconciliationData}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleRunReconciliation}
            disabled={runningBatch}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 text-sm font-semibold transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            {runningBatch ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            Run Reconciliation
          </button>
        </div>
      </div>

      {actionMsg && (
        <div
          className={`p-4 rounded-xl border text-sm font-medium ${
            actionMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {actionMsg.text}
        </div>
      )}

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Match Rate</div>
          <div className="text-2xl font-black text-emerald-400">{data.metrics.matchRatePercent}%</div>
          <div className="text-xs text-slate-500 mt-1">{data.metrics.matchedCount} of {data.metrics.totalRecords} matched</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Reconciled Volume</div>
          <div className="text-2xl font-black text-white">৳ {data.metrics.totalGross.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Net: ৳ {data.metrics.totalNet.toLocaleString()}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Gateway Fees</div>
          <div className="text-2xl font-black text-amber-400">৳ {data.metrics.totalFees.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Computed provider fees</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Amount Mismatches</div>
          <div className="text-2xl font-black text-rose-400">{data.metrics.mismatchCount}</div>
          <div className="text-xs text-slate-500 mt-1">Variance alerts</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Pending Exceptions</div>
          <div className="text-2xl font-black text-sky-400">{data.metrics.exceptionsCount + data.metrics.unmatchedCount}</div>
          <div className="text-xs text-slate-500 mt-1">Requiring resolution</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Scope Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-slate-800/80 border border-slate-700">
            <button
              onClick={() => setSelectedScope('PLATFORM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedScope === 'PLATFORM' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Platform SaaS
            </button>
            <button
              onClick={() => setSelectedScope('TENANT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedScope === 'TENANT' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Institution Fees
            </button>
          </div>

          {/* Gateway Filter */}
          <select
            value={selectedGateway}
            onChange={(e) => setSelectedGateway(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Gateways</option>
            <option value="BKASH">bKash Checkout</option>
            <option value="NAGAD">Nagad Direct</option>
            <option value="ROCKET">Rocket</option>
            <option value="BANK_TRANSFER">Bank Wire</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="MATCHED">Matched</option>
            <option value="AMOUNT_MISMATCH">Amount Mismatch</option>
            <option value="MISSING_PROVIDER">Missing at Provider</option>
            <option value="MISSING_LOCAL">Missing Locally</option>
            <option value="MANUAL_REVIEW">Manual Review</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search trx ID, batch, ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Transaction Ref</th>
                <th className="px-4 py-3.5 font-semibold">Gateway</th>
                <th className="px-4 py-3.5 font-semibold">Local Amount</th>
                <th className="px-4 py-3.5 font-semibold">Provider Amount</th>
                <th className="px-4 py-3.5 font-semibold">Fee / Net</th>
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
                    Loading reconciliation ledger...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                    No reconciliation discrepancies or records found for current filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5 font-mono text-slate-200">
                      <div>{r.transactionRef}</div>
                      {r.batchReference && <div className="text-[10px] text-slate-500">{r.batchReference}</div>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[11px]">
                        {r.gateway}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-200">
                      {r.localAmount !== null ? `৳ ${r.localAmount.toLocaleString()}` : <span className="text-slate-500">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-200">
                      {r.providerAmount !== null ? `৳ ${r.providerAmount.toLocaleString()}` : <span className="text-slate-500">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-amber-400/90">Fee: ৳ {r.feeAmount || 0}</div>
                      <div className="text-[11px] text-emerald-400">Net: ৳ {(r.netAmount || 0).toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(r.status)}</td>
                    <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                      {new Date(r.reconciliationDate).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setInspectRecord(r);
                          setResolutionStatus(r.status === 'MATCHED' ? 'MATCHED' : 'MATCHED');
                          setResolutionNotes(r.notes || '');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition font-medium text-[11px]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect & Resolve Modal */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Reconciliation Record Details
              </h3>
              <button
                onClick={() => setInspectRecord(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <div>
                <span className="text-slate-400">Transaction Ref:</span>
                <p className="font-mono text-white font-semibold mt-0.5">{inspectRecord.transactionRef}</p>
              </div>
              <div>
                <span className="text-slate-400">Gateway:</span>
                <p className="text-white font-semibold mt-0.5">{inspectRecord.gateway}</p>
              </div>
              <div>
                <span className="text-slate-400">Local Amount:</span>
                <p className="text-white font-semibold mt-0.5">
                  {inspectRecord.localAmount !== null ? `৳ ${inspectRecord.localAmount}` : 'None'}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Provider Amount:</span>
                <p className="text-white font-semibold mt-0.5">
                  {inspectRecord.providerAmount !== null ? `৳ ${inspectRecord.providerAmount}` : 'None'}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Fee Amount:</span>
                <p className="text-amber-400 font-semibold mt-0.5">৳ {inspectRecord.feeAmount}</p>
              </div>
              <div>
                <span className="text-slate-400">Net Amount:</span>
                <p className="text-emerald-400 font-semibold mt-0.5">৳ {inspectRecord.netAmount}</p>
              </div>
            </div>

            <form onSubmit={handleResolveDiscrepancy} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Override Resolution Status
                </label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="MATCHED">MATCHED (Verified)</option>
                  <option value="AMOUNT_MISMATCH">AMOUNT_MISMATCH (Flag variance)</option>
                  <option value="MISSING_PROVIDER">MISSING_PROVIDER (Disputed)</option>
                  <option value="MANUAL_REVIEW">MANUAL_REVIEW (Under investigation)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Audit Notes & Rationale
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter reason for manual resolution or bank verification reference..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInspectRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition disabled:opacity-50"
                >
                  {resolving ? 'Saving...' : 'Apply Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
