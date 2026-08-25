'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Clock,
  Play,
  Layers,
  ArrowUpRight,
  TrendingUp,
  SlidersHorizontal,
  Info,
  Check,
  AlertCircle
} from 'lucide-react';

const DEFAULT_METRICS = {
  totalRecords: 0,
  totalGross: 0,
  totalFees: 0,
  totalNet: 0,
  matchedCount: 0,
  unmatchedCount: 0,
  mismatchCount: 0,
  exceptionsCount: 0,
  matchRatePercent: 100
};

export default function PaymentReconciliationPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    metrics: typeof DEFAULT_METRICS;
    records: any[];
    totalRecords: number;
  }>({
    metrics: DEFAULT_METRICS,
    records: [],
    totalRecords: 0
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

  const fetchReconciliationData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        scope: selectedScope,
        gateway: selectedGateway,
        status: selectedStatus
      });
      const res = await fetch(`/api/super-admin/reconciliation?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch reconciliation data`);
      }
      const resData = await res.json();
      if (resData && resData.success) {
        const records = Array.isArray(resData.records)
          ? resData.records
          : Array.isArray(resData.data?.records)
          ? resData.data.records
          : [];
        const metrics = resData.metrics || resData.data?.metrics || DEFAULT_METRICS;
        const total = resData.pagination?.total ?? resData.totalRecords ?? resData.data?.totalRecords ?? records.length;

        setData({
          metrics,
          records,
          totalRecords: total
        });
      }
    } catch (err: any) {
      console.error('Reconciliation fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedScope, selectedGateway, selectedStatus]);

  useEffect(() => {
    fetchReconciliationData();
  }, [fetchReconciliationData]);

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
        text: `Reconciliation batch completed! Processed: ${resData.totalProcessed || 0}, Matched: ${resData.matchedCount || 0}, Exceptions: ${resData.discrepancyCount || 0}`
      });
      fetchReconciliationData();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Batch run failed' });
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

      setActionMsg({
        type: 'success',
        text: `Transaction ${inspectRecord.transactionRef || inspectRecord.id} resolved as ${resolutionStatus}.`
      });
      setInspectRecord(null);
      fetchReconciliationData();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Resolution failed' });
    } finally {
      setResolving(false);
    }
  };

  const safeRecords = Array.isArray(data?.records) ? data.records : [];
  const safeMetrics = data?.metrics || DEFAULT_METRICS;

  const filteredRecords = safeRecords.filter((r: any) => {
    if (!r) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.transactionRef || '').toLowerCase().includes(q) ||
      (r.gateway || '').toLowerCase().includes(q) ||
      (r.batchReference || '').toLowerCase().includes(q) ||
      (r.status || '').toLowerCase().includes(q) ||
      (r.tenant?.slug || '').toLowerCase().includes(q) ||
      (r.tenant?.institution?.name || '').toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'MATCHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Matched
          </span>
        );
      case 'AMOUNT_MISMATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> Amount Mismatch
          </span>
        );
      case 'MISSING_PROVIDER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> Missing at Provider
          </span>
        );
      case 'MISSING_LOCAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <AlertCircle className="w-3 h-3" /> Missing Locally
          </span>
        );
      case 'MANUAL_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Clock className="w-3 h-3" /> Manual Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {status || 'UNKNOWN'}
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
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Payment Reconciliation Control Plane</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  REAL-TIME GL AUDIT
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated multi-gateway transaction matching, settlement auditing, and double-entry ledger balance verification
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReconciliationData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleRunReconciliation}
            disabled={runningBatch}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-bold transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            {runningBatch ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span>Run Reconciliation Batch</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            actionMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {actionMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Match Rate</div>
          <div className="text-xl font-black text-emerald-400">{safeMetrics.matchRatePercent ?? 100}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{safeMetrics.matchedCount} of {safeMetrics.totalRecords} matched</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Gross</div>
          <div className="text-xl font-black text-white">৳ {(safeMetrics.totalGross || 0).toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Net: ৳ {(safeMetrics.totalNet || 0).toLocaleString()}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gateway Fees</div>
          <div className="text-xl font-black text-amber-400">৳ {(safeMetrics.totalFees || 0).toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Computed provider fees</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Matched</div>
          <div className="text-xl font-black text-emerald-400">{safeMetrics.matchedCount || 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Perfect parity</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Amount Mismatch</div>
          <div className="text-xl font-black text-rose-400">{safeMetrics.mismatchCount || 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Variance exceptions</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Manual Review</div>
          <div className="text-xl font-black text-sky-400">{safeMetrics.exceptionsCount + safeMetrics.unmatchedCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Pending resolution</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Scope Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setSelectedScope('PLATFORM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedScope === 'PLATFORM' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Platform SaaS Orders
            </button>
            <button
              onClick={() => setSelectedScope('TENANT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedScope === 'TENANT' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Institution Student Fees
            </button>
          </div>

          {/* Gateway Filter */}
          <select
            value={selectedGateway}
            onChange={(e) => setSelectedGateway(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Gateways</option>
            <option value="BKASH">bKash</option>
            <option value="NAGAD">Nagad</option>
            <option value="ROCKET">Rocket</option>
            <option value="BANK_TRANSFER">Bank Wire</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
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
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search trx ID, batch, ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Transaction Ref</th>
                <th className="px-3 py-3 font-semibold">Gateway</th>
                <th className="px-3 py-3 font-semibold">Local Amount</th>
                <th className="px-3 py-3 font-semibold">Provider Amount</th>
                <th className="px-3 py-3 font-semibold">Variance / Fee</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Settlement</th>
                <th className="px-3 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                    <span>Loading reconciliation ledger...</span>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                    <span className="font-bold text-white block">No Reconciliation Exceptions</span>
                    <span className="text-xs text-slate-500 mt-1 block">All transactions are fully reconciled or matched with current filter criteria.</span>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r: any) => {
                  const variance = Math.abs((r.providerAmount ?? r.localAmount ?? 0) - (r.localAmount ?? 0));
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono text-slate-200">
                        <div className="font-semibold">{r.transactionRef || r.id}</div>
                        {r.batchReference && <div className="text-[10px] text-slate-500">{r.batchReference}</div>}
                      </td>
                      <td className="px-3 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">
                          {r.gateway || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-200">
                        {r.localAmount !== null && r.localAmount !== undefined
                          ? `৳ ${Number(r.localAmount).toLocaleString()}`
                          : <span className="text-slate-500">—</span>}
                      </td>
                      <td className="px-3 py-3 text-slate-200">
                        {r.providerAmount !== null && r.providerAmount !== undefined
                          ? `৳ ${Number(r.providerAmount).toLocaleString()}`
                          : <span className="text-slate-500">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        {variance > 0.01 ? (
                          <div className="text-rose-400 font-bold">Diff: ৳ {variance.toFixed(2)}</div>
                        ) : (
                          <div className="text-slate-400">Fee: ৳ {r.feeAmount || 0}</div>
                        )}
                        <div className="text-[10px] text-emerald-400">Net: ৳ {Number(r.netAmount || 0).toLocaleString()}</div>
                      </td>
                      <td className="px-3 py-3">{getStatusBadge(r.status)}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.settlementStatus === 'SETTLED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {r.settlementStatus || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-400 text-[10px]">
                        {r.reconciliationDate
                          ? new Date(r.reconciliationDate).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setInspectRecord(r);
                            setResolutionStatus(r.status === 'MATCHED' ? 'MATCHED' : 'MATCHED');
                            setResolutionNotes(r.notes || '');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition font-bold text-[11px] border border-slate-700"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect & Resolve Modal */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Reconciliation Record Audit</span>
              </h3>
              <button
                onClick={() => setInspectRecord(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <div>
                <span className="text-slate-400">Transaction Ref:</span>
                <p className="font-mono text-white font-bold mt-0.5">{inspectRecord.transactionRef || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400">Gateway Provider:</span>
                <p className="text-white font-bold mt-0.5">{inspectRecord.gateway || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400">Local Ledger Amount:</span>
                <p className="text-white font-bold mt-0.5">
                  {inspectRecord.localAmount !== null && inspectRecord.localAmount !== undefined
                    ? `৳ ${inspectRecord.localAmount}`
                    : 'None'}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Provider Settlement:</span>
                <p className="text-white font-bold mt-0.5">
                  {inspectRecord.providerAmount !== null && inspectRecord.providerAmount !== undefined
                    ? `৳ ${inspectRecord.providerAmount}`
                    : 'None'}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Gateway Fee:</span>
                <p className="text-amber-400 font-bold mt-0.5">৳ {inspectRecord.feeAmount || 0}</p>
              </div>
              <div>
                <span className="text-slate-400">Net Receivable:</span>
                <p className="text-emerald-400 font-bold mt-0.5">৳ {inspectRecord.netAmount || 0}</p>
              </div>
            </div>

            <form onSubmit={handleResolveDiscrepancy} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Override Resolution Status
                </label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="MATCHED">MATCHED (Verified & Settled)</option>
                  <option value="AMOUNT_MISMATCH">AMOUNT_MISMATCH (Variance flag)</option>
                  <option value="MISSING_PROVIDER">MISSING_PROVIDER (Disputed)</option>
                  <option value="MANUAL_REVIEW">MANUAL_REVIEW (Audit in progress)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Audit Notes & Reconciliation Rationale
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter reason for manual resolution or bank verification reference..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setInspectRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition disabled:opacity-50 shadow-md shadow-emerald-600/20"
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

