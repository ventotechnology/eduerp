'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Shield,
  ShoppingBag,
  KeyRound,
  FileText,
  AlertCircle
} from 'lucide-react';

export default function SuperAdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSaasData = async () => {
    try {
      setLoading(true);
      setError(null);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-xs font-mono">Loading SaaS Platform Control Plane...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
          <div>
            <h3 className="font-bold text-sm text-white">SaaS Platform Access Error</h3>
            <p className="text-xs">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchSaasData}
          className="px-4 py-2 bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const { metrics, tenants = [], plans = [], recentOrders = [], gatewayHealth, systemHealth } = data || {};

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/80 p-6 rounded-3xl border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
              Control Plane v2.0
            </span>
            <span className="text-xs text-slate-400">• Database: PostgreSQL 16</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            SaaS Platform Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Unified multi-tenant control plane for institutions, commercial subscriptions, DB-driven pricing, and client demo vaults.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/institutions"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Institution</span>
          </Link>
          <button
            onClick={fetchSaasData}
            title="Refresh Metrics"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Commercial & Operational Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold">Monthly Recurring Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-white">
              BDT {metrics?.mrr?.toLocaleString() || 0}
            </span>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
              <span>ARR: BDT {metrics?.arr?.toLocaleString() || 0}</span>
              <span className="text-emerald-400 font-semibold">Commercial</span>
            </div>
          </div>
        </div>

        {/* Paying & Trial Institutions */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold">Active Customers</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {metrics?.payingTenantsCount || 0}
              </span>
              <span className="text-xs text-slate-400 font-medium">Paying</span>
              <span className="text-sm font-bold text-amber-400 ml-auto">
                +{metrics?.trialTenantsCount || 0} Trial
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
              <span>Total Commercial: {(metrics?.payingTenantsCount || 0) + (metrics?.trialTenantsCount || 0)}</span>
              <Link href="/super-admin/institutions" className="text-blue-400 hover:underline">
                View All →
              </Link>
            </div>
          </div>
        </div>

        {/* Demo Verticals */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold">Canonical Demo Verticals</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-white">
              {metrics?.demoTenantsCount || 0}
            </span>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
              <span>8 Specialized Engines</span>
              <Link href="/super-admin/demo-credentials" className="text-purple-400 hover:underline">
                Client Vault →
              </Link>
            </div>
          </div>
        </div>

        {/* bKash Gateway Health */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold">bKash Gateway Status</span>
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                gatewayHealth?.bkash?.status === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`} />
              <span className="text-base font-extrabold text-white">
                {gatewayHealth?.bkash?.status === 'CONNECTED' ? 'LIVE PRODUCTION' : (gatewayHealth?.bkash?.status || 'CONFIGURED')}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
              <span>Latency: {gatewayHealth?.bkash?.latencyMs || 0}ms</span>
              <Link href="/super-admin/gateways" className="text-pink-400 hover:underline">
                Config →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Control Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/super-admin/institutions"
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition group flex items-start gap-4"
        >
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition flex items-center gap-1.5">
              <span>Institution Management</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Onboard new schools/colleges, manage campus subscriptions, and launch authorized persona sessions.
            </p>
          </div>
        </Link>

        <Link
          href="/super-admin/plans"
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition group flex items-start gap-4"
        >
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-105 transition shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition flex items-center gap-1.5">
              <span>Plans & Feature Matrix</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Dynamically configure 4 public tiers, limits, student caps, and module entitlements without redeployment.
            </p>
          </div>
        </Link>

        <Link
          href="/super-admin/demo-credentials"
          className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition group flex items-start gap-4"
        >
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-105 transition shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition flex items-center gap-1.5">
              <span>Client Demo Vault</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Generate one-time client test packs, reset demo credentials, and export XLSX packs for prospects.
            </p>
          </div>
        </Link>
      </div>

      {/* Two Column Section: Recent Institutions & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Institutions */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Educational Institutions</h2>
              <p className="text-xs text-slate-400">Canonical demos & provisioned customer organizations</p>
            </div>
            <Link
              href="/super-admin/institutions"
              className="text-xs text-emerald-400 font-semibold hover:underline"
            >
              View All ({tenants.length}) →
            </Link>
          </div>

          <div className="space-y-2.5">
            {tenants.slice(0, 5).map((t: any) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-mono text-xs font-bold text-white">
                    {t.type?.slice(0, 2) || 'SC'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{t.name}</span>
                      {t.isDemoTenant && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          DEMO
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">/{t.slug}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-300">{t.activePlan}</span>
                  <Link
                    href={`/${t.slug}/dashboard`}
                    target="_blank"
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Commercial Orders</h2>
              <p className="text-xs text-slate-400">SaaS subscription orders & payments</p>
            </div>
            <Link
              href="/super-admin/orders"
              className="text-xs text-emerald-400 font-semibold hover:underline"
            >
              View All Orders →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No recent commercial subscription orders.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentOrders.slice(0, 5).map((ord: any) => (
                <div
                  key={ord.id}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-400 block">
                      {ord.orderNumber}
                    </span>
                    <span className="text-xs text-slate-300">
                      {ord.signup?.institutionName || ord.tenant?.slug || 'SaaS Plan Order'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-white block">
                      BDT {ord.totalAmount?.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
