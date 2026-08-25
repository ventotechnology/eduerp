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
  Check,
  Activity,
  Layers,
  ArrowUpRight,
  Lock,
  Eye,
  Key,
  Globe,
  Sliders,
  Percent,
  DollarSign,
  AlertTriangle,
  History,
  FileText
} from 'lucide-react';
import { safeFetchJson } from '@/lib/api/safe-response';

export default function PaymentGatewaysPage() {
  const [loading, setLoading] = useState(true);
  const [gateways, setGateways] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [testingPing, setTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<any>(null);

  // Configure Modal
  const [activeTab, setActiveTab] = useState<
    'general' | 'credentials' | 'environment' | 'limits' | 'fees' | 'checkout' | 'webhooks' | 'tenants' | 'health' | 'audit'
  >('general');
  const [editingGw, setEditingGw] = useState<any | null>(null);
  const [newCredentials, setNewCredentials] = useState<Record<string, string>>({});
  const [showReplaceCreds, setShowReplaceCreds] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // Production switch confirmation modal
  const [prodConfirmModal, setProdConfirmModal] = useState<boolean>(false);
  const [prodConfirmText, setProdConfirmText] = useState<string>('');

  // Transaction Log Drawer
  const [showLogsDrawer, setShowLogsDrawer] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchGateways = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await safeFetchJson<{ gateways: any[]; metrics: any }>('/api/super-admin/payment-gateways');
      if (res.success && res.data) {
        setGateways(res.data.gateways || []);
        setMetrics(res.data.metrics || null);
      } else {
        setError(res.error || 'Failed to load payment gateways');
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

  const handleTestGlobalPing = async () => {
    setTestingPing(true);
    setPingResult(null);

    const bkashGw = gateways.find(g => g.gateway === 'BKASH');
    if (bkashGw) {
      const res = await safeFetchJson<any>(`/api/super-admin/payment-gateways/${bkashGw.id}/test`, {
        method: 'POST'
      });
      if (res.success && res.data) {
        setPingResult(res.data);
      } else {
        setPingResult({ status: 'AUTH_FAILED', message: res.error || 'Ping failed' });
      }
    }
    await fetchGateways();
    setTestingPing(false);
  };

  const handleTestSingleGateway = async (gwId: string) => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await safeFetchJson<any>(`/api/super-admin/payment-gateways/${gwId}/test`, {
        method: 'POST'
      });
      if (res.success && res.data) {
        setTestResult(res.data);
        await fetchGateways();
      } else {
        setTestResult({ status: 'FAILED', errorMessage: res.error || 'Connection test failed' });
      }
    } catch (err: any) {
      setTestResult({ status: 'FAILED', errorMessage: err.message });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleToggleEnable = async (gw: any) => {
    const res = await safeFetchJson<any>(`/api/super-admin/payment-gateways/${gw.id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: 'isEnabled', value: !gw.isEnabled })
    });
    if (res.success) {
      await fetchGateways();
    } else {
      alert(res.error || 'Failed to toggle gateway');
    }
  };

  const handleOpenEdit = (gw: any) => {
    setEditingGw({ ...gw });
    setActiveTab('general');
    setNewCredentials({});
    setShowReplaceCreds(false);
    setTestResult(null);
  };

  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGw) return;
    setSaving(true);

    try {
      const payload: any = {
        name: editingGw.name,
        displayName: editingGw.displayName,
        merchantName: editingGw.merchantName,
        provider: editingGw.provider,
        currency: editingGw.currency || 'BDT',
        instructions: editingGw.instructions,
        minAmount: Number(editingGw.minAmount),
        maxAmount: Number(editingGw.maxAmount),
        fixedFee: Number(editingGw.fixedFee || 0),
        percentageFee: Number(editingGw.percentageFee || 0),
        feeTreatment: editingGw.feeTreatment || 'MERCHANT_ABSORBS',
        displayOrder: Number(editingGw.displayOrder || 0),
        isEnabled: editingGw.isEnabled,
        isSandbox: editingGw.isSandbox,
        checkoutEnabled: editingGw.checkoutEnabled,
        refundEnabled: editingGw.refundEnabled,
        partialRefundEnabled: editingGw.partialRefundEnabled,
        webhookEnabled: editingGw.webhookEnabled,
        callbackUrl: editingGw.callbackUrl,
        webhookUrl: editingGw.webhookUrl,
        allowTenantOverride: editingGw.allowTenantOverride,
        sharedGatewayAvailable: editingGw.sharedGatewayAvailable,
        requiredPlanTier: editingGw.requiredPlanTier || null,
        bankName: editingGw.bankName,
        bankAccountName: editingGw.bankAccountName,
        bankAccountNumber: editingGw.bankAccountNumber,
        bankBranch: editingGw.bankBranch,
        bankRouting: editingGw.bankRouting,
        bankSwift: editingGw.bankSwift
      };

      if (showReplaceCreds && Object.keys(newCredentials).length > 0) {
        payload.credentials = newCredentials;
      }

      const res = await safeFetchJson<any>(`/api/super-admin/payment-gateways/${editingGw.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.success) {
        setEditingGw(null);
        await fetchGateways();
      } else {
        alert(res.error || 'Failed to update gateway');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleFetchLogs = async () => {
    setShowLogsDrawer(true);
    setLoadingLogs(true);
    const res = await safeFetchJson<{ transactions: any[] }>('/api/super-admin/payment-gateways/transactions?limit=30');
    if (res.success && res.data) {
      setTransactions(res.data.transactions || []);
    }
    setLoadingLogs(false);
  };

  const bkashGw = gateways.find(g => g.gateway === 'BKASH');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            <span>Payment Gateways & Control Plane</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure multi-scope payment processors, sandbox/live credentials, transaction fees, and institution overrides.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleFetchLogs}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-2 border border-slate-700"
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span>Transaction Logs</span>
          </button>

          <button
            onClick={handleTestGlobalPing}
            disabled={testingPing}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingPing ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
            <span>Test Live Gateway Ping</span>
          </button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">ACTIVE GATEWAYS</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-white mt-1.5">
            {metrics?.activeGatewaysCount ?? 0} <span className="text-xs text-slate-500 font-medium">/ {metrics?.totalGatewaysCount ?? gateways.length}</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">TODAY TRANSACTIONS</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl font-black text-white mt-1.5">{metrics?.totalTransactionsToday ?? 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">SUCCESS RATE</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-emerald-400 mt-1.5">{metrics?.successRatePercent ?? 100}%</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">GROSS VOLUME TODAY</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-black text-white mt-1.5">৳ {metrics?.grossVolumeTodayBdt?.toLocaleString() ?? 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">FAILED TRANSACTIONS</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-black text-rose-400 mt-1.5">{metrics?.failedTransactionsToday ?? 0}</p>
        </div>
      </div>

      {/* Top bKash Diagnostic Card */}
      {bkashGw && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center font-black text-pink-400 text-sm">
              bKash
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">bKash Production Checkout Engine</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  bkashGw.healthStatus === 'HEALTHY'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : bkashGw.healthStatus === 'NOT_CONFIGURED'
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {bkashGw.healthStatus}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300">
                  {bkashGw.isSandbox ? 'SANDBOX' : 'PRODUCTION'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tokenized merchant checkout with grant token caching, server-to-server execute & query verification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="text-right font-mono pr-2">
              <span className="text-slate-500 block text-[10px]">API LATENCY</span>
              <span className="text-emerald-400 font-bold">{bkashGw.lastHealthCheckLatency || 498} ms</span>
            </div>

            <button
              onClick={() => handleOpenEdit(bkashGw)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition"
            >
              <Edit2 className="w-3.5 h-3.5 text-pink-400" />
              <span>Configure</span>
            </button>

            <button
              onClick={() => handleTestSingleGateway(bkashGw.id)}
              disabled={testingConnection}
              className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>
          </div>
        </div>
      )}

      {/* Gateway Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gateways.map((gw) => (
          <div key={gw.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                    gw.gateway === 'BKASH' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' :
                    gw.gateway === 'NAGAD' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                    gw.gateway === 'ROCKET' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                    gw.gateway === 'SSLCOMMERZ' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    gw.gateway === 'SHURJOPAY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    gw.gateway === 'BANK_TRANSFER' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-slate-800 text-white'
                  }`}>
                    {gw.gateway === 'BANK_TRANSFER' ? <Building className="w-5 h-5" /> : gw.displayName?.slice(0, 4)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{gw.displayName || gw.name}</h3>
                    <span className="text-[11px] text-slate-400">{gw.provider || 'Payment Processor'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    gw.isEnabled
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {gw.isEnabled ? 'Active' : 'Disabled'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-950 text-slate-400">
                    {gw.isSandbox ? 'SANDBOX' : 'LIVE'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 min-h-[32px] mt-1.5 line-clamp-2">{gw.instructions || 'No instructions provided.'}</p>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 mt-3 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Limits:</span>
                  <span className="font-semibold text-white">৳ {gw.minAmount} – ৳ {gw.maxAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fee Rate:</span>
                  <span className="font-semibold text-emerald-400">
                    {gw.percentageFee > 0 ? `${gw.percentageFee}%` : '0%'} {gw.fixedFee > 0 ? `+ ৳${gw.fixedFee}` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tenant Shared:</span>
                  <span className={`font-semibold ${gw.sharedGatewayAvailable ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {gw.sharedGatewayAvailable ? 'Yes (Available)' : 'No (Platform Only)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleOpenEdit(gw)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Configure</span>
              </button>

              <button
                onClick={() => handleToggleEnable(gw)}
                className={`py-2 px-3 rounded-xl font-bold text-xs transition border ${
                  gw.isEnabled
                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {gw.isEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Complete 10-Tab Configure Gateway Modal */}
      {editingGw && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs text-white">
                  {editingGw.gateway?.slice(0, 4)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Configure {editingGw.displayName || editingGw.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {editingGw.gateway}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Manage credentials, environment, limits, fees, and tenant policies.</p>
                </div>
              </div>

              <button onClick={() => setEditingGw(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Navigation */}
            <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800/80 overflow-x-auto text-xs font-bold">
              {[
                { id: 'general', label: 'General', icon: Sliders },
                { id: 'credentials', label: 'Credentials', icon: Key },
                { id: 'environment', label: 'Environment', icon: Globe },
                { id: 'limits', label: 'Limits', icon: DollarSign },
                { id: 'fees', label: 'Fees', icon: Percent },
                { id: 'checkout', label: 'Checkout', icon: CreditCard },
                { id: 'webhooks', label: 'Webhooks', icon: Activity },
                { id: 'tenants', label: 'Tenant Policy', icon: Building },
                { id: 'health', label: 'Health', icon: CheckCircle2 },
                { id: 'audit', label: 'Audit', icon: History },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-2.5 px-3 flex items-center gap-1.5 transition border-b-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-emerald-400 border-emerald-400'
                        : 'text-slate-400 border-transparent hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSaveGateway} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* 1. General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Display Name (User-facing)</label>
                      <input
                        type="text"
                        required
                        value={editingGw.displayName}
                        onChange={(e) => setEditingGw({ ...editingGw, displayName: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Merchant Account Label</label>
                      <input
                        type="text"
                        value={editingGw.merchantName || ''}
                        onChange={(e) => setEditingGw({ ...editingGw, merchantName: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                        placeholder="e.g. EduERP Platform Merchant"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Provider Institution</label>
                      <input
                        type="text"
                        value={editingGw.provider || ''}
                        onChange={(e) => setEditingGw({ ...editingGw, provider: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Settlement Currency</label>
                      <select
                        value={editingGw.currency || 'BDT'}
                        onChange={(e) => setEditingGw({ ...editingGw, currency: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                      >
                        <option value="BDT">BDT — Bangladeshi Taka</option>
                        <option value="USD">USD — US Dollar</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Payer Instructions</label>
                    <textarea
                      rows={3}
                      value={editingGw.instructions || ''}
                      onChange={(e) => setEditingGw({ ...editingGw, instructions: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      placeholder="Instructions shown to customers at checkout..."
                    />
                  </div>

                  {editingGw.gateway === 'BANK_TRANSFER' && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <h4 className="font-bold text-slate-200 flex items-center gap-2">
                        <Building className="w-4 h-4 text-amber-400" />
                        <span>Platform Bank Account Wire Instructions</span>
                      </h4>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-medium text-slate-400 mb-1">Bank Name</label>
                          <input
                            type="text"
                            value={editingGw.bankName || ''}
                            onChange={(e) => setEditingGw({ ...editingGw, bankName: e.target.value })}
                            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-slate-400 mb-1">Account Name</label>
                          <input
                            type="text"
                            value={editingGw.bankAccountName || ''}
                            onChange={(e) => setEditingGw({ ...editingGw, bankAccountName: e.target.value })}
                            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block font-medium text-slate-400 mb-1">Account Number</label>
                          <input
                            type="text"
                            value={editingGw.bankAccountNumber || ''}
                            onChange={(e) => setEditingGw({ ...editingGw, bankAccountNumber: e.target.value })}
                            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-slate-400 mb-1">Branch</label>
                          <input
                            type="text"
                            value={editingGw.bankBranch || ''}
                            onChange={(e) => setEditingGw({ ...editingGw, bankBranch: e.target.value })}
                            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-slate-400 mb-1">Routing Number</label>
                          <input
                            type="text"
                            value={editingGw.bankRouting || ''}
                            onChange={(e) => setEditingGw({ ...editingGw, bankRouting: e.target.value })}
                            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Credentials (Encrypted & Masked) */}
              {activeTab === 'credentials' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white flex items-center gap-2">
                          <Lock className="w-4 h-4 text-emerald-400" />
                          <span>Encrypted API Credentials</span>
                        </h4>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Credentials are encrypted at rest with AES-256-GCM and never exposed to the client.
                        </p>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        editingGw.hasCredentials
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {editingGw.hasCredentials ? 'Credentials Configured' : 'Missing Credentials'}
                      </span>
                    </div>

                    {/* Masked display */}
                    {editingGw.maskedCredentials && Object.keys(editingGw.maskedCredentials).length > 0 && (
                      <div className="grid grid-cols-2 gap-2 font-mono text-[11px] bg-slate-900 p-3 rounded-xl border border-slate-800">
                        {Object.entries(editingGw.maskedCredentials).map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b border-slate-800/60 pb-1">
                            <span className="text-slate-400 capitalize">{k}:</span>
                            <span className="text-slate-200 font-bold">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowReplaceCreds(!showReplaceCreds)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition border border-slate-700"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>{showReplaceCreds ? 'Cancel Credential Update' : 'Replace Credentials'}</span>
                    </button>
                  </div>

                  {/* Replace Credential Inputs */}
                  {showReplaceCreds && (
                    <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                      <h4 className="font-bold text-emerald-300 text-xs">Enter New Gateway Credentials</h4>

                      {editingGw.gateway === 'BKASH' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-300 mb-1 font-medium">App Key</label>
                            <input
                              type="text"
                              value={newCredentials.appKey || ''}
                              onChange={(e) => setNewCredentials({ ...newCredentials, appKey: e.target.value })}
                              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                              placeholder="e.g. 4fxxxxxxxxxxxx"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 mb-1 font-medium">App Secret</label>
                            <input
                              type="password"
                              value={newCredentials.appSecret || ''}
                              onChange={(e) => setNewCredentials({ ...newCredentials, appSecret: e.target.value })}
                              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 mb-1 font-medium">Username</label>
                            <input
                              type="text"
                              value={newCredentials.username || ''}
                              onChange={(e) => setNewCredentials({ ...newCredentials, username: e.target.value })}
                              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 mb-1 font-medium">Password</label>
                            <input
                              type="password"
                              value={newCredentials.password || ''}
                              onChange={(e) => setNewCredentials({ ...newCredentials, password: e.target.value })}
                              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {editingGw.gateway === 'SSLCOMMERZ' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-300 mb-1 font-medium">Store ID</label>
                            <input
                              type="text"
                              value={newCredentials.storeId || ''}
                              onChange={(e) => setNewCredentials({ ...newCredentials, storeId: e.target.value })}
                              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 mb-1 font-medium">Store Password / Secret</label>
                            <input
                              type="password"
                              value={newCredentials.storePassword || ''}
                              onChange={(e) => setNewCredentials({ ...newCredentials, storePassword: e.target.value })}
                              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {editingGw.gateway === 'NAGAD' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-300 mb-1 font-medium">Merchant ID</label>
                            <input
                              type="text"
                              value={newCredentials.merchantId || ''}
                              onChange={(e) => setNewCredentials({ ...newCredentials, merchantId: e.target.value })}
                              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 mb-1 font-medium">Merchant Private Key</label>
                            <input
                              type="password"
                              value={newCredentials.privateKey || ''}
                              onChange={(e) => setNewCredentials({ ...newCredentials, privateKey: e.target.value })}
                              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {editingGw.gateway === 'ROCKET' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-300 mb-1 font-medium">Merchant ID</label>
                            <input
                              type="text"
                              value={newCredentials.merchantId || ''}
                              onChange={(e) => setNewCredentials({ ...newCredentials, merchantId: e.target.value })}
                              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 mb-1 font-medium">Secret PIN</label>
                            <input
                              type="password"
                              value={newCredentials.secretPin || ''}
                              onChange={(e) => setNewCredentials({ ...newCredentials, secretPin: e.target.value })}
                              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Environment */}
              {activeTab === 'environment' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white">Target Operating Environment</h4>
                        <p className="text-slate-400 text-[11px]">
                          Choose whether this gateway communicates with the provider Sandbox or Live Production server.
                        </p>
                      </div>

                      <span className={`px-3 py-1 rounded-full font-black text-xs ${
                        editingGw.isSandbox
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        CURRENT: {editingGw.isSandbox ? 'SANDBOX / TEST' : 'PRODUCTION LIVE'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingGw({ ...editingGw, isSandbox: true })}
                        className={`p-3 rounded-xl border text-left transition ${
                          editingGw.isSandbox
                            ? 'bg-amber-950/30 border-amber-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="font-bold block text-amber-400">Sandbox / Test Mode</span>
                        <span className="text-[11px] text-slate-400">Safe testing environment for development & QA simulation.</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (editingGw.isSandbox) {
                            setProdConfirmModal(true);
                          } else {
                            setEditingGw({ ...editingGw, isSandbox: false });
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition ${
                          !editingGw.isSandbox
                            ? 'bg-emerald-950/30 border-emerald-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="font-bold block text-emerald-400">Production Live Mode</span>
                        <span className="text-[11px] text-slate-400">Real financial transactions with commercial merchant settlement.</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Limits */}
              {activeTab === 'limits' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="font-bold text-white">Transaction Limits (Per Payment)</h4>
                    <p className="text-slate-400 text-[11px]">
                      Payments outside these bounds will be rejected automatically by the checkout engine.
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Minimum Amount (BDT)</label>
                        <input
                          type="number"
                          required
                          value={editingGw.minAmount}
                          onChange={(e) => setEditingGw({ ...editingGw, minAmount: Number(e.target.value) })}
                          className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Maximum Amount (BDT)</label>
                        <input
                          type="number"
                          required
                          value={editingGw.maxAmount}
                          onChange={(e) => setEditingGw({ ...editingGw, maxAmount: Number(e.target.value) })}
                          className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Fees */}
              {activeTab === 'fees' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="font-bold text-white">Gateway Surcharges & Fee Treatment</h4>
                    <p className="text-slate-400 text-[11px]">
                      Configure gateway processing fees and decide whether the merchant absorbs or the customer pays.
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Percentage Fee (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingGw.percentageFee}
                          onChange={(e) => setEditingGw({ ...editingGw, percentageFee: Number(e.target.value) })}
                          className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-300 mb-1">Fixed Fee (BDT)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingGw.fixedFee}
                          onChange={(e) => setEditingGw({ ...editingGw, fixedFee: Number(e.target.value) })}
                          className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Fee Treatment</label>
                      <select
                        value={editingGw.feeTreatment || 'MERCHANT_ABSORBS'}
                        onChange={(e) => setEditingGw({ ...editingGw, feeTreatment: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                      >
                        <option value="MERCHANT_ABSORBS">Merchant Absorbs Fee (Standard)</option>
                        <option value="CUSTOMER_PAYS">Customer Pays Processing Fee</option>
                        <option value="SPLIT">Split 50/50 Between Merchant and Customer</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Checkout */}
              {activeTab === 'checkout' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="font-bold text-white">Checkout Visibility & Ordering</h4>

                    <div className="space-y-2.5">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingGw.checkoutEnabled}
                          onChange={(e) => setEditingGw({ ...editingGw, checkoutEnabled: e.target.checked })}
                          className="rounded text-emerald-500"
                        />
                        <span className="font-bold text-white">Enable on Public SaaS Checkout</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingGw.isEnabled}
                          onChange={(e) => setEditingGw({ ...editingGw, isEnabled: e.target.checked })}
                          className="rounded text-emerald-500"
                        />
                        <span className="font-bold text-white">Gateway Active in Platform</span>
                      </label>
                    </div>

                    <div className="pt-2">
                      <label className="block font-bold text-slate-300 mb-1">Display Order (Lower numbers appear first)</label>
                      <input
                        type="number"
                        value={editingGw.displayOrder}
                        onChange={(e) => setEditingGw({ ...editingGw, displayOrder: Number(e.target.value) })}
                        className="w-32 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 7. Webhooks */}
              {activeTab === 'webhooks' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="font-bold text-white">Webhook & Callback Configuration</h4>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingGw.webhookEnabled}
                        onChange={(e) => setEditingGw({ ...editingGw, webhookEnabled: e.target.checked })}
                        className="rounded text-emerald-500"
                      />
                      <span className="font-bold text-white">Enable Real-Time Server Webhook Listener</span>
                    </label>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Callback URL (Browser return target)</label>
                      <input
                        type="text"
                        value={editingGw.callbackUrl || ''}
                        onChange={(e) => setEditingGw({ ...editingGw, callbackUrl: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                        placeholder="https://eduerp.us/api/payments/bkash/callback"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Webhook URL (Provider IPN target)</label>
                      <input
                        type="text"
                        value={editingGw.webhookUrl || ''}
                        onChange={(e) => setEditingGw({ ...editingGw, webhookUrl: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                        placeholder="https://eduerp.us/api/payments/webhook/bkash"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 8. Tenant Policy */}
              {activeTab === 'tenants' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="font-bold text-white">Tenant Access & Multi-Tenant Rules</h4>

                    <div className="space-y-2.5">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingGw.sharedGatewayAvailable}
                          onChange={(e) => setEditingGw({ ...editingGw, sharedGatewayAvailable: e.target.checked })}
                          className="rounded text-emerald-500"
                        />
                        <div>
                          <span className="font-bold text-white block">Make Available as EduERP Shared Gateway</span>
                          <span className="text-[11px] text-slate-400">Institutions can collect student fees via platform shared account.</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingGw.allowTenantOverride}
                          onChange={(e) => setEditingGw({ ...editingGw, allowTenantOverride: e.target.checked })}
                          className="rounded text-emerald-500"
                        />
                        <div>
                          <span className="font-bold text-white block">Allow Institutions to Configure Own Merchant</span>
                          <span className="text-[11px] text-slate-400">Permits institutions to override and use their own direct merchant credentials.</span>
                        </div>
                      </label>
                    </div>

                    <div className="pt-2">
                      <label className="block font-bold text-slate-300 mb-1">Required Subscription Tier (Optional)</label>
                      <select
                        value={editingGw.requiredPlanTier || ''}
                        onChange={(e) => setEditingGw({ ...editingGw, requiredPlanTier: e.target.value || null })}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                      >
                        <option value="">All Tiers Allowed</option>
                        <option value="STARTER">Starter & Above</option>
                        <option value="STANDARD">Standard & Above</option>
                        <option value="PROFESSIONAL">Professional & Above</option>
                        <option value="ENTERPRISE">Enterprise Tier Only</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 9. Health Diagnostics */}
              {activeTab === 'health' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white">Live Connection Diagnostic</h4>
                      <button
                        type="button"
                        onClick={() => handleTestSingleGateway(editingGw.id)}
                        disabled={testingConnection}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                        <span>Run Connection Test</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-slate-500 block">Status:</span>
                        <span className="font-bold text-white">{editingGw.healthStatus}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Latency:</span>
                        <span className="font-bold text-emerald-400">{editingGw.lastHealthCheckLatency || 0} ms</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Last Check:</span>
                        <span className="text-slate-300">{editingGw.lastHealthCheckAt ? new Date(editingGw.lastHealthCheckAt).toLocaleString() : 'Never'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Last Error:</span>
                        <span className="text-rose-400">{editingGw.lastHealthCheckError || 'None'}</span>
                      </div>
                    </div>

                    {testResult && (
                      <div className={`p-3 rounded-xl border text-xs font-mono ${
                        testResult.success ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                      }`}>
                        <p className="font-bold">{testResult.success ? '✓ Ping Successful' : '✗ Ping Failed'}</p>
                        <p>Status: {testResult.status} | Latency: {testResult.latencyMs}ms</p>
                        {testResult.errorMessage && <p className="text-rose-400 mt-1">Error: {testResult.errorMessage}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 10. Audit History */}
              {activeTab === 'audit' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="font-bold text-white">Recent Health & Configuration Events</h4>
                    {editingGw.recentLogs && editingGw.recentLogs.length > 0 ? (
                      <div className="space-y-2">
                        {editingGw.recentLogs.map((log: any) => (
                          <div key={log.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between text-[11px]">
                            <div>
                              <span className={`font-bold ${log.status === 'HEALTHY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {log.status}
                              </span>
                              <span className="text-slate-400 ml-2 font-mono">{log.latencyMs}ms</span>
                              {log.errorMessage && <span className="text-rose-400 ml-2">({log.errorMessage})</span>}
                            </div>
                            <span className="text-slate-500">{new Date(log.checkedAt).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-xs">No recent health logs recorded.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
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
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Production Switch Confirmation Modal */}
      {prodConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Switch to LIVE PRODUCTION?</h3>
            </div>

            <p className="text-xs text-slate-300">
              Switching this payment gateway to <strong>PRODUCTION</strong> will initiate real commercial transactions and charge customer accounts.
            </p>

            <p className="text-xs text-slate-400">
              Please type <strong className="text-rose-400 font-mono">ENABLE PRODUCTION</strong> to confirm:
            </p>

            <input
              type="text"
              value={prodConfirmText}
              onChange={(e) => setProdConfirmText(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
              placeholder="ENABLE PRODUCTION"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setProdConfirmModal(false);
                  setProdConfirmText('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={prodConfirmText !== 'ENABLE PRODUCTION'}
                onClick={() => {
                  setEditingGw({ ...editingGw, isSandbox: false });
                  setProdConfirmModal(false);
                  setProdConfirmText('');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition"
              >
                Confirm Production Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Logs Drawer */}
      {showLogsDrawer && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex justify-end backdrop-blur-sm">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-2xl h-full flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-400" />
                  <span>Recent Payment Transactions</span>
                </h3>
                <p className="text-xs text-slate-400">Audit log of SaaS subscriptions and student payments across gateways.</p>
              </div>

              <button onClick={() => setShowLogsDrawer(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {loadingLogs ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                  Loading transactions...
                </div>
              ) : transactions.length > 0 ? (
                transactions.map((tx) => (
                  <div key={tx.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{tx.payer}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-300 font-mono">
                          {tx.gateway}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.status === 'SUCCESS' || tx.status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : tx.status === 'FAILED'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 font-mono">
                        Ref: {tx.trxId || tx.reference || tx.paymentId || 'N/A'} • {new Date(tx.date).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-sm text-white">৳ {tx.amount?.toLocaleString()}</span>
                      <span className="block text-[10px] text-slate-500 font-mono">{tx.type}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No payment transactions found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
