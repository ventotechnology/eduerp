'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Shield,
  Trash2,
  Edit2,
  Check,
  Send,
  Package,
  Activity,
  Layers,
  Radio
} from 'lucide-react';
import { listSupportedSmsAdapters } from '@/lib/services/sms/adapters';

export default function SuperAdminSmsPage() {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<any[]>([]);
  const [addonPackages, setAddonPackages] = useState<any[]>([]);
  const [recentBroadcasts, setRecentBroadcasts] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  // Provider Modal
  const [editingProvider, setEditingProvider] = useState<any | null>(null);
  const [savingProvider, setSavingProvider] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Add-on Modal
  const [editingAddon, setEditingAddon] = useState<any | null>(null);
  const [savingAddon, setSavingAddon] = useState(false);

  const supportedAdapters = listSupportedSmsAdapters();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/super-admin/sms');
      const data = await res.json();
      if (data.success) {
        setProviders(data.providers || []);
        setAddonPackages(data.addonPackages || []);
        setRecentBroadcasts(data.recentBroadcasts || []);
        setMetrics(data.metrics || {});
      } else {
        setError(data.error || 'Failed to load SMS configuration.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to SMS service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTestProvider = async (providerId: string) => {
    setTestingId(providerId);
    setTestResult(null);
    try {
      const res = await fetch('/api/super-admin/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId })
      });
      const data = await res.json();
      setTestResult({
        providerId,
        success: data.success,
        message: data.result?.message || (data.success ? 'Gateway online and reachable.' : 'Connection test failed.')
      });
      await fetchData();
    } catch (err: any) {
      setTestResult({
        providerId,
        success: false,
        message: err.message || 'Connection test timed out.'
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;
    setSavingProvider(true);

    try {
      const isNew = !editingProvider.id;
      const url = '/api/super-admin/sms';
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProvider)
      });

      const data = await res.json();
      if (data.success) {
        setEditingProvider(null);
        await fetchData();
      } else {
        alert(data.error || 'Failed to save SMS provider.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save provider.');
    } finally {
      setSavingProvider(false);
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SMS provider?')) return;
    try {
      const res = await fetch(`/api/super-admin/sms?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      } else {
        alert(data.error || 'Failed to delete provider');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddon) return;
    setSavingAddon(true);

    try {
      const isNew = !editingAddon.id;
      const res = await fetch('/api/super-admin/sms/addons', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAddon)
      });

      const data = await res.json();
      if (data.success) {
        setEditingAddon(null);
        await fetchData();
      } else {
        alert(data.error || 'Failed to save SMS addon.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingAddon(false);
    }
  };

  const handleDeleteAddon = async (id: string) => {
    if (!confirm('Delete this SMS add-on package?')) return;
    try {
      const res = await fetch(`/api/super-admin/sms/addons?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-teal-400" />
            <span>Platform Universal SMS Gateway & Infrastructure</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure central telecom aggregators, manage client quotas, and provision SMS bundles with AES-256 encrypted credentials at rest.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() =>
              setEditingProvider({
                name: 'Banglalink Universal',
                code: 'BANGLALINK',
                type: 'HTTP_API',
                senderId: 'EduERP',
                baseUrl: 'https://vas.banglalink.net/sendSMS/sendSMS',
                isDefault: true,
                credentials: { userId: '', password: '', senderId: 'EduERP' }
              })
            }
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add SMS Provider</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Telecom Gateways</span>
          <div className="text-2xl font-black text-white">{metrics.activeProvidersCount || 0} Gateways</div>
          <span className="text-[11px] text-teal-400">Universal & Multi-Provider Routing</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Lifetime SMS Dispatched</span>
          <div className="text-2xl font-black text-white">{(metrics.totalSmsConsumed || 0).toLocaleString()} SMS</div>
          <span className="text-[11px] text-slate-400">Tracked across all client institutions</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Add-On Packages</span>
          <div className="text-2xl font-black text-white">{addonPackages.length} Bundles</div>
          <span className="text-[11px] text-emerald-400">Available for self-service purchase</span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Providers Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Configured Platform Providers</span>
            </h2>
            <p className="text-xs text-slate-400">Default provider is automatically used by institutions subscribed to Universal SMS.</p>
          </div>
        </div>

        {providers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-slate-950 rounded-xl border border-slate-800">
            No universal SMS providers configured yet. Click &quot;Add SMS Provider&quot; to set up Banglalink, GP, SSL Wireless, or BulkSMSBD.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((p) => {
              const isTesting = testingId === p.id;
              const hasTest = testResult?.providerId === p.id;

              return (
                <div
                  key={p.id}
                  className={`p-5 rounded-2xl border transition relative space-y-4 ${
                    p.isDefault
                      ? 'bg-teal-950/20 border-teal-500 shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-white text-sm">{p.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                          {p.code}
                        </span>
                        {p.isDefault && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Sender ID: <strong className="text-white">{p.senderId || 'None'}</strong> | Status:{' '}
                        <span className={p.status === 'ACTIVE' ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                          {p.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingProvider(p)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProvider(p.id)}
                        className="p-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Masked Credentials Summary */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Gateway URL:</span>
                      <span className="truncate max-w-[200px] text-slate-300">{p.baseUrl || 'Default Gateway URL'}</span>
                    </div>
                    {Object.entries(p.credentials || {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="capitalize">{k}:</span>
                        <span className="text-slate-200">{String(v)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Test Result Message */}
                  {hasTest && (
                    <div
                      className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                        testResult.success
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                          : 'bg-rose-950/60 border-rose-800 text-rose-300'
                      }`}
                    >
                      {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                      <span className="truncate">{testResult.message}</span>
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      {p.lastTestedAt ? `Tested: ${new Date(p.lastTestedAt).toLocaleDateString()}` : 'Not tested'}
                    </span>
                    <button
                      onClick={() => handleTestProvider(p.id)}
                      disabled={isTesting}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center gap-1.5 transition"
                    >
                      <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SMS Add-on Packages Configuration */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" />
              <span>SMS Credit Add-On Packages</span>
            </h2>
            <p className="text-xs text-slate-400">Bundles institutions can self-service purchase when their included plan quota runs low.</p>
          </div>
          <button
            onClick={() =>
              setEditingAddon({
                name: '5,000 SMS Power Pack',
                slug: 'pack-5k',
                messageQuantity: 5000,
                price: 2500,
                currency: 'BDT',
                validityDays: 365,
                isActive: true,
                displayOrder: addonPackages.length + 1
              })
            }
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bundle</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {addonPackages.map((pkg) => (
            <div key={pkg.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{pkg.name}</h4>
                  <div className="text-xl font-black text-teal-400 mt-1">
                    {pkg.messageQuantity.toLocaleString()} <span className="text-xs font-normal text-slate-400">SMS</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditingAddon(pkg)} className="p-1 text-slate-400 hover:text-white">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteAddon(pkg.id)} className="p-1 text-rose-400 hover:text-rose-300">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <div>Price: <strong className="text-white">BDT {pkg.price.toLocaleString()}</strong></div>
                <div>Validity: <strong className="text-white">{pkg.validityDays} Days</strong></div>
                <div>Rate: <strong className="text-emerald-400">BDT {(pkg.price / pkg.messageQuantity).toFixed(2)}/SMS</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: Provider Form */}
      {editingProvider && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-w-lg w-full p-6 space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingProvider.id ? 'Edit SMS Provider' : 'Add Universal SMS Provider'}
              </h3>
              <button onClick={() => setEditingProvider(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProvider} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Provider Adapter *</label>
                <select
                  disabled={Boolean(editingProvider.id)}
                  value={editingProvider.code}
                  onChange={(e) => {
                    const sel = supportedAdapters.find((a) => a.code === e.target.value);
                    const initCreds: any = {};
                    sel?.fields.forEach((f) => {
                      initCreds[f] = '';
                    });
                    setEditingProvider({
                      ...editingProvider,
                      code: e.target.value,
                      name: sel?.name || e.target.value,
                      credentials: initCreds
                    });
                  }}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  {supportedAdapters.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.name} ({a.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Provider Label *</label>
                  <input
                    type="text"
                    required
                    value={editingProvider.name}
                    onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Default Sender ID (Masking)</label>
                  <input
                    type="text"
                    placeholder="e.g. EduERP"
                    value={editingProvider.senderId || ''}
                    onChange={(e) => setEditingProvider({ ...editingProvider, senderId: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Custom Gateway URL (Optional override)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={editingProvider.baseUrl || ''}
                  onChange={(e) => setEditingProvider({ ...editingProvider, baseUrl: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              {/* Dynamic Credential Fields */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="font-bold text-teal-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Encrypted Credentials (AES-256-GCM)</span>
                </div>

                {supportedAdapters
                  .find((a) => a.code === editingProvider.code)
                  ?.fields.map((f) => (
                    <div key={f}>
                      <label className="block text-slate-400 capitalize mb-0.5">{f} *</label>
                      <input
                        type={f.toLowerCase().includes('pass') || f.toLowerCase().includes('secret') || f.toLowerCase().includes('token') || f.toLowerCase().includes('key') ? 'password' : 'text'}
                        value={editingProvider.credentials?.[f] || ''}
                        placeholder={editingProvider.id ? '•••••••• (leave unchanged or enter new value)' : `Enter ${f}`}
                        onChange={(e) =>
                          setEditingProvider({
                            ...editingProvider,
                            credentials: {
                              ...editingProvider.credentials,
                              [f]: e.target.value
                            }
                          })
                        }
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                      />
                    </div>
                  ))}
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProvider.isDefault}
                    onChange={(e) => setEditingProvider({ ...editingProvider, isDefault: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-950 text-teal-500"
                  />
                  <span className="text-slate-300 font-semibold">Make Platform Default</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProvider.status === 'ACTIVE'}
                    onChange={(e) =>
                      setEditingProvider({
                        ...editingProvider,
                        status: e.target.checked ? 'ACTIVE' : 'INACTIVE'
                      })
                    }
                    className="rounded border-slate-700 bg-slate-950 text-teal-500"
                  />
                  <span className="text-slate-300 font-semibold">Active & Online</span>
                </label>
              </div>

              <div className="border-t border-slate-800 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProvider(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProvider}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md"
                >
                  {savingProvider ? 'Saving...' : 'Save Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Addon Package Form */}
      {editingAddon && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingAddon.id ? 'Edit SMS Bundle' : 'Create SMS Bundle'}
              </h3>
              <button onClick={() => setEditingAddon(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddon} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Bundle Title *</label>
                <input
                  type="text"
                  required
                  value={editingAddon.name}
                  onChange={(e) => setEditingAddon({ ...editingAddon, name: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={editingAddon.slug}
                  onChange={(e) => setEditingAddon({ ...editingAddon, slug: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Quantity (SMS) *</label>
                  <input
                    type="number"
                    required
                    value={editingAddon.messageQuantity}
                    onChange={(e) => setEditingAddon({ ...editingAddon, messageQuantity: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Price (BDT) *</label>
                  <input
                    type="number"
                    required
                    value={editingAddon.price}
                    onChange={(e) => setEditingAddon({ ...editingAddon, price: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Validity (Days) *</label>
                <input
                  type="number"
                  required
                  value={editingAddon.validityDays}
                  onChange={(e) => setEditingAddon({ ...editingAddon, validityDays: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAddon(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddon}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  {savingAddon ? 'Saving...' : 'Save Bundle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
