'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Shield,
  CreditCard,
  Edit2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MoreVertical,
  X,
  Sparkles,
  ArrowRight,
  Lock,
  UserCheck
} from 'lucide-react';

const INSTITUTION_TYPES = [
  { value: 'SCHOOL', label: 'School (General K-12)' },
  { value: 'COLLEGE', label: 'College (Higher Secondary / HSC)' },
  { value: 'SCHOOL_AND_COLLEGE', label: 'School & College (Combined)' },
  { value: 'MADRASHA', label: 'Madrasha (Dakhil, Alim, Kamil, Hifz)' },
  { value: 'UNIVERSITY', label: 'University (Higher Education)' },
  { value: 'POLYTECHNIC', label: 'Polytechnic (Diploma Engineering)' },
  { value: 'TECHNICAL_INSTITUTE', label: 'Technical / Vocational Institute' },
  { value: 'TRAINING_INSTITUTE', label: 'Professional Training Institute' },
];

export default function InstitutionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Multi-step Onboarding Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [createdResult, setCreatedResult] = useState<any | null>(null);

  // Form State for Onboarding
  const [form, setForm] = useState({
    type: 'SCHOOL',
    name: '',
    shortName: '',
    eiin: '',
    instituteCode: '',
    boardAffiliation: 'Dhaka Education Board',
    phone: '',
    email: '',
    website: '',
    address: '',
    district: 'Dhaka',
    division: 'Dhaka',
    upazilaThana: 'Dhanmondi',
    currencyCode: 'BDT',
    currencySymbol: '৳',
    tenantSlug: '',
    customDomain: '',
    campusName: '',
    campusCode: 'MAIN',
    campusAddress: '',
    academicYearName: '2026',
    planId: '',
    billingCycle: 'MONTHLY',
    trialDays: 14,
    ownerName: '',
    ownerEmail: '',
    ownerPhone: ''
  });

  // Manage Subscription Modal
  const [subModalTenant, setSubModalTenant] = useState<any | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('MONTHLY');
  const [savingSub, setSavingSub] = useState(false);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/super-admin/saas');
      const data = await res.json();
      if (data.success) {
        setTenants(data.tenants || []);
        setPlans(data.plans || []);
        if (data.plans?.length > 0 && !form.planId) {
          setForm(prev => ({ ...prev, planId: data.plans[0].id }));
        }
      } else {
        setError(data.error || 'Failed to load institutions');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading institutions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  // Auto-generate slug and campus name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setForm(prev => ({
      ...prev,
      name,
      tenantSlug: prev.tenantSlug || slug,
      campusName: prev.campusName || `${name} Main Campus`
    }));
  };

  // Submit Multi-step Onboarding
  const handleCreateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/super-admin/saas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_INSTITUTION_FULL',
          payload: form
        })
      });

      const data = await res.json();
      if (data.success) {
        setCreatedResult(data.data);
        await fetchTenants();
      } else {
        alert(data.error || 'Failed to onboard institution');
      }
    } catch (err: any) {
      alert(err.message || 'Network error onboarding institution');
    } finally {
      setCreating(false);
    }
  };

  // Impersonate Principal / Role
  const handleImpersonate = async (tenantSlug: string, role = 'PRINCIPAL') => {
    try {
      const res = await fetch(`/api/auth/demo-session?tenantSlug=${tenantSlug}&role=${role}`);
      const data = await res.json();
      if (data.success) {
        router.push(`/${tenantSlug}/dashboard`);
      } else {
        alert(data.error || 'Failed to start impersonation');
      }
    } catch (err: any) {
      alert(err.message || 'Impersonation failed');
    }
  };

  // Update Subscription
  const handleSaveSubscription = async () => {
    if (!subModalTenant || !selectedPlanId) return;
    setSavingSub(true);
    try {
      const res = await fetch('/api/super-admin/saas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ASSIGN_SUBSCRIPTION',
          tenantId: subModalTenant.id,
          planId: selectedPlanId,
          billingCycle: selectedCycle,
          status: 'ACTIVE'
        })
      });
      const data = await res.json();
      if (data.success) {
        setSubModalTenant(null);
        await fetchTenants();
      } else {
        alert(data.error || 'Failed to update subscription');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update subscription');
    } finally {
      setSavingSub(false);
    }
  };

  // Toggle Active/Suspended
  const handleToggleStatus = async (tenantId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/super-admin/saas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_TENANT_STATUS',
          tenantId,
          isActive: !currentStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchTenants();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <span>Institution Tenants ({tenants.length})</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage multi-tenant educational institutions, onboarding wizards, subscriptions, and access control.
          </p>
        </div>

        <button
          onClick={() => {
            setWizardStep(1);
            setCreatedResult(null);
            setShowCreateModal(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Institution</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by institution name or tenant slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Types</option>
            {INSTITUTION_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                <th className="py-3.5 px-4 font-semibold">Institution Name</th>
                <th className="py-3.5 px-4 font-semibold">Vertical Type</th>
                <th className="py-3.5 px-4 font-semibold">Tenant Slug</th>
                <th className="py-3.5 px-4 font-semibold">Subscription Plan</th>
                <th className="py-3.5 px-4 font-semibold">Users</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No matching educational institutions found.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-emerald-400">
                          {t.shortName?.slice(0, 2) || 'SC'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white block">{t.name}</span>
                            {t.isDemoTenant && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                DEMO
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">{t.customDomain || `${t.slug}.eduerp.us`}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold">
                      /{t.slug}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white">{t.activePlan}</span>
                      <span className="block text-[10px] text-slate-400 uppercase">{t.billingCycle}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {t.userCount} Accounts
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        t.isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {t.isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleImpersonate(t.slug, t.type === 'UNIVERSITY' ? 'VICE_CHANCELLOR' : 'PRINCIPAL')}
                          title="Enter institution as Principal/Head"
                          className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <Shield className="w-3 h-3" />
                          <span>Impersonate</span>
                        </button>

                        <button
                          onClick={() => {
                            setSubModalTenant(t);
                            setSelectedPlanId(plans[0]?.id || '');
                            setSelectedCycle(t.billingCycle || 'MONTHLY');
                          }}
                          title="Manage Plan & Subscription"
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          href={`/${t.slug}/dashboard`}
                          target="_blank"
                          title="Open Live Portal"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-step Onboarding Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  {wizardStep}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Manual Institution Onboarding</h3>
                  <p className="text-xs text-slate-400">Step {wizardStep} of 4 • Provision new educational tenant</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {createdResult ? (
                <div className="p-6 bg-emerald-950/30 border border-emerald-800/80 rounded-2xl text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-black text-white">Institution Successfully Onboarded!</h4>
                  <p className="text-xs text-slate-300">
                    Tenant <strong className="text-emerald-400 font-mono">{createdResult.tenant.slug}</strong> has been provisioned with database tenant, institution, campus, and owner credentials.
                  </p>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs font-mono space-y-2 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Institution:</span>
                      <span className="text-white font-bold">{createdResult.institution.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Portal URL:</span>
                      <span className="text-emerald-400 font-bold">https://eduerp.us/{createdResult.tenant.slug}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Owner Username:</span>
                      <span className="text-white">{createdResult.user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Temporary Password:</span>
                      <span className="text-amber-300 font-extrabold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80">
                        {createdResult.temporaryPassword}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-amber-400">
                    ⚠️ Copy this temporary password now. It is hashed in the database and will not be displayed again.
                  </p>

                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreatedResult(null);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateInstitution} className="space-y-4">
                  {/* Step 1: Type & Basics */}
                  {wizardStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Institution Vertical Engine</label>
                        <select
                          value={form.type}
                          onChange={(e) => setForm({ ...form, type: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          {INSTITUTION_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Institution Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Bangladesh International Model College"
                          value={form.name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5">Short Name / Acronym</label>
                          <input
                            type="text"
                            placeholder="e.g. BIMC"
                            value={form.shortName}
                            onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5">EIIN / Institute Code</label>
                          <input
                            type="text"
                            placeholder="e.g. 108245"
                            value={form.eiin}
                            onChange={(e) => setForm({ ...form, eiin: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          disabled={!form.name}
                          onClick={() => setWizardStep(2)}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                        >
                          <span>Next: Tenant & Campus</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Tenant & Campus */}
                  {wizardStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Unique Tenant URL Slug</label>
                        <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                          <span className="px-3 text-xs text-slate-500 font-mono">https://eduerp.us/</span>
                          <input
                            type="text"
                            required
                            value={form.tenantSlug}
                            onChange={(e) => setForm({ ...form, tenantSlug: e.target.value })}
                            className="w-full py-2.5 pr-3 bg-transparent text-xs text-emerald-400 font-mono focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Main Campus Name</label>
                        <input
                          type="text"
                          required
                          value={form.campusName}
                          onChange={(e) => setForm({ ...form, campusName: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Campus Address</label>
                        <input
                          type="text"
                          placeholder="e.g. House 14, Road 5, Dhanmondi, Dhaka"
                          value={form.address}
                          onChange={(e) => setForm({ ...form, address: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="flex justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => setWizardStep(1)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          disabled={!form.tenantSlug}
                          onClick={() => setWizardStep(3)}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                        >
                          <span>Next: Subscription Plan</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Subscription */}
                  {wizardStep === 3 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Select SaaS Subscription Tier</label>
                        <div className="grid grid-cols-2 gap-3">
                          {plans.map(p => (
                            <div
                              key={p.id}
                              onClick={() => setForm({ ...form, planId: p.id })}
                              className={`p-3.5 rounded-xl border cursor-pointer transition ${
                                form.planId === p.id
                                  ? 'bg-emerald-950/40 border-emerald-500 text-white'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <span className="font-bold text-xs block text-white">{p.name}</span>
                              <span className="text-[11px] text-emerald-400 font-bold">BDT {p.monthlyPrice?.toLocaleString()}/mo</span>
                              <span className="text-[10px] text-slate-500 block mt-1">Up to {p.maxStudents} Students</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5">Billing Terms</label>
                          <select
                            value={form.billingCycle}
                            onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                          >
                            <option value="MONTHLY">Monthly Billing</option>
                            <option value="ANNUAL">Annual Contract (16% Discount)</option>
                            <option value="TRIAL">14-Day Free Trial</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5">Academic Session</label>
                          <input
                            type="text"
                            value={form.academicYearName}
                            onChange={(e) => setForm({ ...form, academicYearName: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => setWizardStep(2)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setWizardStep(4)}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                        >
                          <span>Next: Owner Identity</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Owner Admin Identity & Review */}
                  {wizardStep === 4 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Owner / Principal Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Prof. Mohammad Shahidullah"
                          value={form.ownerName}
                          onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5">Owner Login Email</label>
                          <input
                            type="email"
                            required
                            placeholder="principal@institution.edu.bd"
                            value={form.ownerEmail}
                            onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5">Contact Phone</label>
                          <input
                            type="text"
                            placeholder="01711223344"
                            value={form.ownerPhone}
                            onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                        <span className="font-bold text-white block mb-1">Provisioning Summary</span>
                        <div className="flex justify-between text-slate-400">
                          <span>Tenant:</span>
                          <span className="font-mono text-emerald-400">/{form.tenantSlug}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Type:</span>
                          <span className="text-white">{form.type}</span>
                        </div>
                      </div>

                      <div className="flex justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => setWizardStep(3)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={creating || !form.ownerEmail}
                          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/30"
                        >
                          {creating ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Provisioning Tenant...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Execute Atomic Provisioning</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manage Subscription Modal */}
      {subModalTenant && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Assign Subscription Plan</h3>
              <button onClick={() => setSubModalTenant(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Modifying plan for <strong className="text-white">{subModalTenant.name}</strong> ({subModalTenant.slug})
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Plan Tier</label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - BDT {p.monthlyPrice}/mo</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Billing Cycle</label>
              <select
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="ANNUAL">Annual Contract</option>
                <option value="TRIAL">Trial</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSubModalTenant(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubscription}
                disabled={savingSub}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2"
              >
                {savingSub ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
