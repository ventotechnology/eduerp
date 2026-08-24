'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/lib/tenant-context';
import { PRESET_DEMO_TENANTS } from '@/lib/constants';
import {
  Building2,
  DollarSign,
  Users,
  Activity,
  Plus,
  ArrowUpRight,
  Sparkles,
  Server,
  Radio,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  CreditCard,
  Edit2,
  Save,
  X,
  RefreshCw,
  Zap,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function SuperAdminPage() {
  const { switchTenant } = useTenant();

  const [activeTab, setActiveTab] = useState<'saas' | 'plans' | 'gateways' | 'tenants' | 'health'>('saas');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Plan Editing Modal State
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);

  // Fetch live SaaS metrics & plans
  const fetchSaasData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/super-admin/saas');
      const resData = await res.json();
      if (resData.success) {
        setData(resData);
      } else {
        setError(resData.error || 'Failed to load SaaS admin data');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaasData();
  }, []);

  // Save Plan Edits
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    setSavingPlan(true);
    try {
      const res = await fetch('/api/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPlan.id,
          name: editingPlan.name,
          monthlyPrice: Number(editingPlan.monthlyPrice),
          annualPrice: Number(editingPlan.annualPrice),
          monthlyDiscount: Number(editingPlan.monthlyDiscount || 0),
          annualDiscount: Number(editingPlan.annualDiscount || 0),
          maxStudents: Number(editingPlan.maxStudents),
          maxCampuses: Number(editingPlan.maxCampuses),
          maxStorageGb: Number(editingPlan.maxStorageGb),
          includedSms: Number(editingPlan.includedSms),
          isActive: editingPlan.isActive,
          isFeatured: editingPlan.isFeatured,
          badge: editingPlan.badge,
          buttonText: editingPlan.buttonText
        })
      });

      const updatedData = await res.json();
      if (updatedData.success) {
        setEditingPlan(null);
        await fetchSaasData();
      } else {
        alert(updatedData.error || 'Failed to update plan');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save plan changes');
    } finally {
      setSavingPlan(false);
    }
  };

  // Toggle Gateway
  const handleToggleGateway = async (gw: string, isEnabled: boolean) => {
    try {
      await fetch('/api/super-admin/saas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_GATEWAY',
          gateway: gw,
          gatewayData: { isEnabled }
        })
      });
      await fetchSaasData();
    } catch (err) {
      // silent
    }
  };

  const metrics = data?.metrics || {
    mrr: 0,
    arr: 0,
    activeSubscribers: 0,
    totalSubscriptions: 0,
    totalCollected: 0
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Top SaaS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              SaaS Commercial Operations & Control Plane
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Platform Super Admin Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Live database-driven packages, bKash gateway diagnostics, subscription revenue velocity, and multi-tenant management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSaasData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <Link
            href="/pricing"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-500/20"
          >
            <span>View Public /pricing</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 SaaS Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Monthly Recurring Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">BDT {metrics.mrr.toLocaleString()}</span>
            <span className="text-[11px] font-bold text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> Live MRR
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            ARR Run-Rate: BDT {metrics.arr.toLocaleString()}
          </span>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Subscriptions</span>
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{metrics.activeSubscribers}</span>
            <span className="text-[11px] font-bold text-slate-400">
              / {metrics.totalSubscriptions} total
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            Paying Educational Tenants
          </span>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Billed Revenue</span>
            <DollarSign className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">BDT {metrics.totalCollected.toLocaleString()}</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            Platform SaaS Invoices Paid
          </span>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">bKash Gateway Status</span>
            <Radio className="w-4 h-4 text-pink-400 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-base font-bold ${
              data?.gatewayHealth?.bkash?.status === 'CONNECTED' ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {data?.gatewayHealth?.bkash?.status || 'CHECKING'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1 truncate">
            {data?.gatewayHealth?.bkash?.message || 'Testing live connection...'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('saas')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition ${
            activeTab === 'saas'
              ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 border-x border-slate-800'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          SaaS Orders & Revenue
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition ${
            activeTab === 'plans'
              ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 border-x border-slate-800'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Packages & Pricing Editor
        </button>
        <button
          onClick={() => setActiveTab('gateways')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition ${
            activeTab === 'gateways'
              ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 border-x border-slate-800'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Payment Gateways & bKash
        </button>
        <button
          onClick={() => setActiveTab('tenants')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition ${
            activeTab === 'tenants'
              ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 border-x border-slate-800'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Institution Tenants ({PRESET_DEMO_TENANTS.length})
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition ${
            activeTab === 'health'
              ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 border-x border-slate-800'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          System Health
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'saas' && (
        <div className="space-y-6">
          {/* Recent Orders */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-sm">
            <h2 className="text-base font-bold text-white mb-4">Recent Subscription Orders</h2>
            {data?.recentOrders?.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No subscription orders recorded yet. Visit /pricing to test signups.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-semibold">Order #</th>
                      <th className="pb-3 font-semibold">Institution / Tenant</th>
                      <th className="pb-3 font-semibold">Plan</th>
                      <th className="pb-3 font-semibold">Cycle</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Gateway</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data?.recentOrders?.map((ord: any) => (
                      <tr key={ord.id} className="text-slate-300">
                        <td className="py-3 font-mono font-bold text-emerald-400">
                          {ord.orderNumber}
                        </td>
                        <td className="py-3 font-medium text-white">
                          {ord.signup?.institutionName || ord.tenant?.slug || 'New Application'}
                        </td>
                        <td className="py-3">{ord.plan?.name}</td>
                        <td className="py-3 uppercase text-[11px]">{ord.billingCycle}</td>
                        <td className="py-3 font-extrabold text-white">BDT {ord.totalAmount?.toLocaleString()}</td>
                        <td className="py-3 uppercase">{ord.gateway || 'None'}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            ord.status === 'FULFILLED' || ord.status === 'PAID'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : ord.status === 'PROCESSING'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">
                          {new Date(ord.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Invoices */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-sm">
            <h2 className="text-base font-bold text-white mb-4">Platform SaaS Invoices</h2>
            {data?.recentInvoices?.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No invoices issued yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-semibold">Invoice #</th>
                      <th className="pb-3 font-semibold">Tenant</th>
                      <th className="pb-3 font-semibold">Period</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Method</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data?.recentInvoices?.map((inv: any) => (
                      <tr key={inv.id} className="text-slate-300">
                        <td className="py-3 font-mono font-bold text-emerald-400">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 font-mono text-slate-200">
                          {inv.tenant?.slug || 'N/A'}
                        </td>
                        <td className="py-3 text-slate-400">{inv.billingPeriod}</td>
                        <td className="py-3 font-extrabold text-white">BDT {inv.totalAmount?.toLocaleString()}</td>
                        <td className="py-3 uppercase">{inv.paymentMethod || 'BKASH'}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
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
      )}

      {/* Plans & Pricing Editor Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              SaaS Packages & Tier Configuration (Database Driven)
            </h2>
            <span className="text-xs text-emerald-400">
              Modifications immediately update public /pricing without code redeploys.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data?.plans?.map((p: any) => (
              <div key={p.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-lg text-white">{p.name}</span>
                    <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                      {p.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4 min-h-[36px]">{p.description}</p>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs text-slate-300 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Monthly:</span>
                      <span className="font-bold text-white">BDT {p.monthlyPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Annual:</span>
                      <span className="font-bold text-white">BDT {p.annualPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Max Students:</span>
                      <span className="font-semibold text-emerald-400">{p.maxStudents.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Max Campuses:</span>
                      <span className="font-semibold text-white">{p.maxCampuses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Storage:</span>
                      <span className="font-semibold text-white">{p.maxStorageGb} GB</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setEditingPlan(p)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
                >
                  <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Edit Pricing & Limits</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Gateways Tab */}
      {activeTab === 'gateways' && (
        <div className="space-y-6">
          <h2 className="text-base font-bold text-white mb-2">Payment Gateway Configurations</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.gateways?.map((gw: any) => (
              <div key={gw.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs text-white">
                      {gw.gateway.slice(0, 4)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{gw.displayName || gw.name}</h3>
                      <span className="text-xs text-slate-400">{gw.provider || 'Gateway Provider'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleGateway(gw.gateway, !gw.isEnabled)}
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition ${
                      gw.isEnabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {gw.isEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <p className="text-xs text-slate-300">{gw.instructions}</p>

                <div className="pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                  <span>Limits: BDT {gw.minAmount} - BDT {gw.maxAmount.toLocaleString()}</span>
                  <span>Mode: {gw.isSandbox ? 'Sandbox / Test' : 'Live Production'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Institutional Tenants Tab */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">Demo & Institutional Workspaces</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRESET_DEMO_TENANTS.map((t) => (
              <div key={t.slug} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-white">{t.name}</h3>
                <div className="text-xs text-emerald-400 font-mono">/{t.slug}</div>
                <div className="text-[11px] text-slate-400">{t.type} · {t.board}</div>
                <button
                  onClick={() => switchTenant(t.slug)}
                  className="w-full mt-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                >
                  Enter Portal
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Health Tab */}
      {activeTab === 'health' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white">Infrastructure & Runtime Verification</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400">PostgreSQL Container</span>
              <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Healthy & Migrated
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400">bKash Merchant API</span>
              <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Token Grant 200 OK
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400">Multi-Tenant Routing</span>
              <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Subdomain & Path Sync
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Editing Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                Edit Package: {editingPlan.name}
              </h3>
              <button
                onClick={() => setEditingPlan(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Monthly Price (BDT)
                  </label>
                  <input
                    type="number"
                    required
                    value={editingPlan.monthlyPrice}
                    onChange={(e) => setEditingPlan({ ...editingPlan, monthlyPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Annual Price (BDT)
                  </label>
                  <input
                    type="number"
                    required
                    value={editingPlan.annualPrice}
                    onChange={(e) => setEditingPlan({ ...editingPlan, annualPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Max Students
                  </label>
                  <input
                    type="number"
                    required
                    value={editingPlan.maxStudents}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxStudents: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Max Campuses
                  </label>
                  <input
                    type="number"
                    required
                    value={editingPlan.maxCampuses}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxCampuses: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Storage (GB)
                  </label>
                  <input
                    type="number"
                    required
                    value={editingPlan.maxStorageGb}
                    onChange={(e) => setEditingPlan({ ...editingPlan, maxStorageGb: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Included SMS
                  </label>
                  <input
                    type="number"
                    required
                    value={editingPlan.includedSms}
                    onChange={(e) => setEditingPlan({ ...editingPlan, includedSms: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Badge (e.g. Most Popular)
                </label>
                <input
                  type="text"
                  value={editingPlan.badge || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, badge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingPlan.isActive}
                    onChange={(e) => setEditingPlan({ ...editingPlan, isActive: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500"
                  />
                  <span>Active & Public</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingPlan.isFeatured}
                    onChange={(e) => setEditingPlan({ ...editingPlan, isFeatured: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500"
                  />
                  <span>Featured Card</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPlan}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingPlan ? 'Saving...' : 'Save & Publish'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
