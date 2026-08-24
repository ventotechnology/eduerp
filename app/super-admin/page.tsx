'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTenant } from '@/lib/tenant-context';
import { SAAS_PLATFORM_STATS, SAAS_SUBSCRIPTION_PLANS } from '@/lib/mock-data';
import { PRESET_DEMO_TENANTS } from '@/lib/constants';
import {
  Shield,
  Building2,
  DollarSign,
  Users,
  Activity,
  Plus,
  ArrowUpRight,
  Layers,
  Sparkles,
  Server,
  Radio,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function SuperAdminPage() {
  const { switchTenant } = useTenant();

  const [tenants, setTenants] = useState(PRESET_DEMO_TENANTS);
  const [plans, setPlans] = useState(SAAS_SUBSCRIPTION_PLANS);
  const [activeTab, setActiveTab] = useState<'tenants' | 'plans' | 'health'>('tenants');

  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [newInstName, setNewInstName] = useState('');
  const [newInstType, setNewInstType] = useState('SCHOOL');

  const handleProvisionTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstName.trim()) return;

    const slug = newInstName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newTenant = {
      slug,
      name: newInstName,
      shortName: newInstName.slice(0, 4).toUpperCase(),
      type: newInstType as any,
      primaryColor: '#2563eb',
      secondaryColor: '#0f172a',
      eiin: '199841',
      board: 'Dhaka Education Board',
      headTitle: 'Principal',
      headName: 'Dr. Headmaster',
      address: 'Dhaka, Bangladesh',
      description: 'Newly provisioned institution tenant on EduERP SaaS.'
    };

    setTenants([...tenants, newTenant]);
    setShowProvisionModal(false);
    setNewInstName('');
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Top SaaS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
              SaaS Multi-Tenant Control Plane
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Platform Super Admin Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage all educational tenants, MRR/ARR revenue velocity, subscription billing limits, and system infrastructure.
          </p>
        </div>

        <button
          onClick={() => setShowProvisionModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Tenant</span>
        </button>
      </div>

      {/* 4 SaaS Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Institutions</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{SAAS_PLATFORM_STATS.totalInstitutions}</span>
            <span className="text-[11px] font-bold text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +4 this mo
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">45 Active Subscriptions • 3 Trial</p>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Monthly Recurring Revenue (MRR)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">
              ${SAAS_PLATFORM_STATS.monthlyRecurringRevenueUSD.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              (৳ {(SAAS_PLATFORM_STATS.monthlyRecurringRevenueBDT / 100000).toFixed(1)}L)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">ARR: ${SAAS_PLATFORM_STATS.annualRecurringRevenueUSD.toLocaleString()}</p>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Platform Active Students</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {SAAS_PLATFORM_STATS.totalStudentsPlatform.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across 48 campuses in Bangladesh</p>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Cloud Infrastructure SLA</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-400">{SAAS_PLATFORM_STATS.systemUptime}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">482K SMS dispatched this month</p>
        </div>
      </div>

      {/* Tab Controls */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'tenants' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          All Provisioned Tenants ({tenants.length})
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'plans' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Subscription Packages & Dynamic Limits
        </button>
      </div>

      {/* Tab 1: Provisioned Tenants List & Impersonation */}
      {activeTab === 'tenants' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-300 font-semibold uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Institution Name</th>
                  <th className="p-3">Vertical Engine</th>
                  <th className="p-3">Domain / Slug</th>
                  <th className="p-3">EIIN / Code</th>
                  <th className="p-3">Affiliation</th>
                  <th className="p-3">Subscription</th>
                  <th className="p-3 text-right">Impersonate & Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {tenants.map((t) => (
                  <tr key={t.slug} className="hover:bg-slate-800/40 transition">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-xs"
                          style={{ backgroundColor: t.primaryColor }}
                        >
                          {t.shortName.slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{t.name}</span>
                          <span className="text-[10px] text-slate-400">{t.address}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                        {t.type}
                      </span>
                    </td>

                    <td className="p-3 font-mono text-purple-400">{t.slug}.eduerp.app</td>
                    <td className="p-3 font-mono">{t.eiin}</td>
                    <td className="p-3 text-slate-400">{t.board}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Active Pro
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <Link
                        href={`/${t.shortName.toLowerCase()}/dashboard`}
                        onClick={() => switchTenant(t.slug)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-xs"
                      >
                        <span>Open Dashboard</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Subscription Packages */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`p-6 rounded-2xl bg-slate-900/90 border flex flex-col justify-between ${
                plan.badge ? 'border-purple-500 shadow-xl shadow-purple-950/40 relative' : 'border-slate-800'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-purple-600 text-white font-bold text-[10px] uppercase tracking-wider">
                  {plan.badge}
                </span>
              )}

              <div>
                <h3 className="font-bold text-lg text-white">{plan.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{plan.targetAudience}</p>

                <div className="my-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">৳ {plan.priceBdtMonth.toLocaleString()}</span>
                  <span className="text-xs text-slate-400">/ month (${plan.priceUsdMonth})</span>
                </div>

                <div className="space-y-2 py-3 border-y border-slate-800 text-xs text-slate-300">
                  <p>👥 <strong>Student Limit:</strong> {plan.studentLimit.toLocaleString()} Students</p>
                  <p>🏛️ <strong>Campuses Allowed:</strong> Up to {plan.campusLimit} Campus</p>
                  <p>💾 <strong>Cloud Storage:</strong> {plan.storageGb} GB</p>
                  <p>📱 <strong>SMS Included:</strong> {plan.smsIncluded.toLocaleString()} / month</p>
                </div>

                <div className="mt-4 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Included Modules:
                  </span>
                  {plan.modules.map((m) => (
                    <div key={m} className="flex items-center gap-1.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className="mt-6 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition">
                Configure Plan Limits
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Provision New Tenant Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 text-xs">
            <h3 className="font-bold text-base text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              <span>Provision New Educational Tenant</span>
            </h3>

            <form onSubmit={handleProvisionTenant} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Institution Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sylhet Engineering & Tech College"
                  value={newInstName}
                  onChange={(e) => setNewInstName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Select Institution Vertical</label>
                <select
                  value={newInstType}
                  onChange={(e) => setNewInstType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white"
                >
                  <option value="SCHOOL">School (Play - Grade 12)</option>
                  <option value="COLLEGE">Higher Secondary College (HSC XI-XII)</option>
                  <option value="MADRASHA">Madrasha & 30-Para Hifzul Quran</option>
                  <option value="UNIVERSITY">University & Higher Education</option>
                  <option value="POLYTECHNIC">Polytechnic / Technical Institute</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md"
                >
                  Provision & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
