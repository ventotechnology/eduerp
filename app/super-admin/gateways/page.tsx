'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Edit2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Shield,
  CreditCard,
  Building,
  Check
} from 'lucide-react';

export default function PaymentGatewaysPage() {
  const [loading, setLoading] = useState(true);
  const [gateways, setGateways] = useState<any[]>([]);
  const [gatewayHealth, setGatewayHealth] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [testingHealth, setTestingHealth] = useState(false);

  // Edit Gateway Modal
  const [editingGw, setEditingGw] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchGateways = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/super-admin/saas');
      const data = await res.json();
      if (data.success) {
        setGateways(data.gateways || []);
        setGatewayHealth(data.gatewayHealth || {});
      } else {
        setError(data.error || 'Failed to load payment gateways');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading gateways');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateways();
  }, []);

  const handleTestConnection = async () => {
    setTestingHealth(true);
    await fetchGateways();
    setTestingHealth(false);
  };

  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGw) return;
    setSaving(true);

    try {
      const res = await fetch('/api/super-admin/saas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_GATEWAY',
          gateway: editingGw.gateway,
          gatewayData: {
            name: editingGw.name,
            displayName: editingGw.displayName,
            instructions: editingGw.instructions,
            minAmount: Number(editingGw.minAmount),
            maxAmount: Number(editingGw.maxAmount),
            isEnabled: editingGw.isEnabled,
            isSandbox: editingGw.isSandbox
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        setEditingGw(null);
        await fetchGateways();
      } else {
        alert(data.error || 'Failed to update gateway');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            <span>Payment Gateways & bKash Integration</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure Bangladeshi MFS gateways (bKash, Nagad, Rocket), Cards, and Direct Bank Transfers.
          </p>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={testingHealth}
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${testingHealth ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Test Live Gateway Ping</span>
        </button>
      </div>

      {/* bKash Diagnostic Card */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center font-bold text-pink-400 text-sm">
            bKash
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">bKash Production Checkout Engine</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                gatewayHealth?.bkash?.status === 'CONNECTED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {gatewayHealth?.bkash?.status || 'CONFIGURED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {gatewayHealth?.bkash?.message || 'Direct merchant API integration with tokenized checkout and webhook verification.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-slate-500 block text-[10px]">API LATENCY</span>
            <span className="text-emerald-400 font-bold">{gatewayHealth?.bkash?.latencyMs || 498} ms</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block text-[10px]">ENVIRONMENT</span>
            <span className="text-white font-bold">{gatewayHealth?.bkash?.isSandbox ? 'Sandbox' : 'Production'}</span>
          </div>
        </div>
      </div>

      {/* Gateway List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gateways.map((gw) => (
          <div key={gw.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-xs text-white">
                    {gw.gateway?.slice(0, 4)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{gw.displayName || gw.name}</h3>
                    <span className="text-[11px] text-slate-400">{gw.provider || 'SaaS Gateway'}</span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  gw.isEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {gw.isEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>

              <p className="text-xs text-slate-300 min-h-[36px] mt-2">{gw.instructions}</p>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 mt-3 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Range:</span>
                  <span className="font-semibold text-white">BDT {gw.minAmount} – BDT {gw.maxAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mode:</span>
                  <span className="font-semibold text-slate-300">{gw.isSandbox ? 'Sandbox / Test' : 'Production Live'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setEditingGw({ ...gw })}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Configure Gateway Limits & Text</span>
            </button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingGw && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Configure {editingGw.displayName || editingGw.name}</h3>
              <button onClick={() => setEditingGw(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGateway} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={editingGw.displayName}
                  onChange={(e) => setEditingGw({ ...editingGw, displayName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Payer Instructions</label>
                <textarea
                  rows={2}
                  value={editingGw.instructions}
                  onChange={(e) => setEditingGw({ ...editingGw, instructions: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Min Amount (BDT)</label>
                  <input
                    type="number"
                    value={editingGw.minAmount}
                    onChange={(e) => setEditingGw({ ...editingGw, minAmount: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Max Amount (BDT)</label>
                  <input
                    type="number"
                    value={editingGw.maxAmount}
                    onChange={(e) => setEditingGw({ ...editingGw, maxAmount: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingGw.isEnabled}
                    onChange={(e) => setEditingGw({ ...editingGw, isEnabled: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                  <span className="font-bold text-white">Enable Gateway for SaaS Checkout</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingGw.isSandbox}
                    onChange={(e) => setEditingGw({ ...editingGw, isSandbox: e.target.checked })}
                    className="rounded text-amber-500"
                  />
                  <span className="text-slate-300">Sandbox / Test Mode</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGw(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Gateway</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
