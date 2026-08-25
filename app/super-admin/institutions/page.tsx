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
  UserCheck,
  Users,
  Eye,
  Settings2,
  Power,
  KeyRound,
  History,
  MapPin,
  Globe,
  Phone,
  Mail,
  Loader2,
  Check,
  AlertTriangle
} from 'lucide-react';
import { safeFetchJson } from '@/lib/api/safe-response';
import { clearAllTenantCache } from '@/lib/cache/tenant-cache';

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
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Impersonating state
  const [impersonatingSlug, setImpersonatingSlug] = useState<string | null>(null);

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
    academicYearStartDate: '2026-01-01',
    academicYearEndDate: '2026-12-31',
    setupAcademicStructure: false,
    createTeacherProfile: false,
    ownerRole: 'PRINCIPAL',
    planId: '',
    billingCycle: 'MONTHLY',
    trialDays: 14,
    ownerName: '',
    ownerEmail: '',
    ownerPhone: ''
  });

  // Modals & Drawers
  const [viewModalTenant, setViewModalTenant] = useState<any | null>(null);
  const [editModalTenant, setEditModalTenant] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const [manageModalTenant, setManageModalTenant] = useState<any | null>(null);
  const [manageTab, setManageTab] = useState<'overview' | 'users' | 'campuses' | 'subscription' | 'slug' | 'audit'>('overview');
  const [manageDetails, setManageDetails] = useState<any | null>(null);
  const [loadingManageDetails, setLoadingManageDetails] = useState(false);

  // Quick Subscription Modal
  const [subModalTenant, setSubModalTenant] = useState<any | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('MONTHLY');
  const [savingSub, setSavingSub] = useState(false);

  // Suspend/Reactivate Modal
  const [suspendModalTenant, setSuspendModalTenant] = useState<any | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [processingStatus, setProcessingStatus] = useState(false);

  // User Management State in Manage Drawer
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', role: 'TEACHER', password: '' });
  const [creatingUser, setCreatingUser] = useState(false);
  const [resetPasswordResult, setResetPasswordResult] = useState<{ email: string; tempPass: string } | null>(null);

  // Slug Update State
  const [newSlugInput, setNewSlugInput] = useState('');
  const [slugReason, setSlugReason] = useState('');
  const [updatingSlug, setUpdatingSlug] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await safeFetchJson('/api/super-admin/saas');
      if (res.ok && res.data?.success) {
        setTenants(res.data.tenants || []);
        setPlans(res.data.plans || []);
        if (res.data.plans?.length > 0 && !form.planId) {
          setForm(prev => ({ ...prev, planId: res.data.plans[0].id }));
        }
      } else {
        setError(res.error || 'Failed to load institutions');
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

  // Fetch full details when opening Manage Drawer
  const fetchInstitutionDetails = async (tenantId: string) => {
    try {
      setLoadingManageDetails(true);
      const res = await safeFetchJson('/api/super-admin/saas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'GET_INSTITUTION_DETAILS', tenantId })
      });
      if (res.ok && res.data?.success) {
        setManageDetails(res.data.tenant);
        setNewSlugInput(res.data.tenant.slug || '');
      } else {
        showToast(res.error || 'Failed to load full institution details', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load details', 'error');
    } finally {
      setLoadingManageDetails(false);
    }
  };

  // Safe Impersonate Handler
  const handleImpersonate = async (tenantSlug: string, role = 'PRINCIPAL', targetUserId?: string) => {
    try {
      setImpersonatingSlug(tenantSlug);
      const res = await safeFetchJson('/api/auth/demo-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug, role, targetUserId })
      });

      if (res.ok && (res.data?.success || res.data?.ok)) {
        clearAllTenantCache();
        showToast(res.data?.message || 'Entering institution portal...', 'success');
        const dest = res.data?.redirectUrl || `/${tenantSlug}/dashboard`;
        window.location.href = dest;
      } else {
        const errorMsg = res.error || res.data?.error?.message || res.data?.error || 'Failed to start impersonation session.';
        showToast(errorMsg, 'error');
        setImpersonatingSlug(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Impersonation failed.', 'error');
      setImpersonatingSlug(null);
    }
  };

  // Open Edit Modal with full existing data
  const handleOpenEdit = async (tenant: any) => {
    setEditModalTenant(tenant);
    setSavingEdit(false);
    // Fetch details to populate all fields
    try {
      const res = await safeFetchJson('/api/super-admin/saas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'GET_INSTITUTION_DETAILS', tenantId: tenant.id })
      });
      if (res.ok && res.data?.success && res.data.tenant?.institution) {
        const inst = res.data.tenant.institution;
        const t = res.data.tenant;
        setEditFormData({
          name: inst.name || '',
          shortName: inst.shortName || '',
          institutionType: t.institutionType || 'SCHOOL',
          instituteCode: inst.instituteCode || '',
          eiin: inst.eiin || '',
          boardAffiliation: inst.boardAffiliation || '',
          phone: inst.phone || '',
          email: inst.email || '',
          website: inst.website || '',
          address: inst.address || '',
          district: inst.district || '',
          division: inst.division || '',
          upazilaThana: inst.upazilaThana || '',
          principalHeadName: inst.principalHeadName || '',
          principalHeadTitle: inst.principalHeadTitle || '',
          primaryColor: inst.primaryColor || '#2563eb',
          secondaryColor: inst.secondaryColor || '#0f172a',
          currencyCode: inst.currencyCode || 'BDT',
          currencySymbol: inst.currencySymbol || '৳',
          customDomain: t.customDomain || '',
          status: t.status || 'ACTIVE_PAID',
          isActive: t.isActive
        });
      } else {
        setEditFormData({
          name: tenant.name || '',
          shortName: tenant.shortName || '',
          institutionType: tenant.type || 'SCHOOL',
          phone: '',
          email: '',
          website: '',
          address: '',
          district: 'Dhaka',
          division: 'Dhaka',
          upazilaThana: '',
          principalHeadName: '',
          principalHeadTitle: 'Principal',
          primaryColor: '#2563eb',
          secondaryColor: '#0f172a',
          currencyCode: 'BDT',
          currencySymbol: '৳',
          customDomain: tenant.customDomain || '',
          status: tenant.status || 'ACTIVE_PAID',
          isActive: tenant.isActive
        });
      }
    } catch {
      setEditFormData({
        name: tenant.name || '',
        shortName: tenant.shortName || '',
        institutionType: tenant.type || 'SCHOOL',
        status: tenant.status || 'ACTIVE_PAID',
        isActive: tenant.isActive
      });
    }
  };

  // Submit Edit Institution
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalTenant) return;
    setSavingEdit(true);

    try {
      const res = await safeFetchJson('/api/super-admin/saas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_INSTITUTION',
          tenantId: editModalTenant.id,
          payload: editFormData
        })
      });

      if (res.ok && res.data?.success) {
        showToast(res.data.message || 'Institution details saved successfully!', 'success');
        setEditModalTenant(null);
        await fetchTenants();
      } else {
        showToast(res.error || 'Failed to save changes.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Open Manage Drawer
  const handleOpenManage = (tenant: any, tab: 'overview' | 'users' | 'campuses' | 'subscription' | 'slug' | 'audit' = 'overview') => {
    setManageModalTenant(tenant);
    setManageTab(tab);
    setResetPasswordResult(null);
    fetchInstitutionDetails(tenant.id);
  };

  // Update Subscription
  const handleSaveSubscription = async () => {
    if (!subModalTenant || !selectedPlanId) return;
    setSavingSub(true);
    try {
      const res = await safeFetchJson('/api/super-admin/saas', {
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
      if (res.ok && res.data?.success) {
        showToast('Subscription updated successfully!', 'success');
        setSubModalTenant(null);
        await fetchTenants();
      } else {
        showToast(res.error || 'Failed to update subscription', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update subscription', 'error');
    } finally {
      setSavingSub(false);
    }
  };

  // Toggle Active/Suspended with Reason
  const handleConfirmStatusChange = async () => {
    if (!suspendModalTenant) return;
    setProcessingStatus(true);
    try {
      const res = await safeFetchJson('/api/super-admin/saas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_TENANT_STATUS',
          tenantId: suspendModalTenant.id,
          isActive: !suspendModalTenant.isActive,
          reason: suspendReason
        })
      });
      if (res.ok && res.data?.success) {
        showToast(
          `Institution ${!suspendModalTenant.isActive ? 'reactivated' : 'suspended'} successfully.`,
          'success'
        );
        setSuspendModalTenant(null);
        setSuspendReason('');
        await fetchTenants();
      } else {
        showToast(res.error || 'Failed to change status', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setProcessingStatus(false);
    }
  };

  // Create User inside Tenant
  const handleCreateTenantUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageModalTenant) return;
    setCreatingUser(true);
    try {
      const res = await safeFetchJson('/api/super-admin/saas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_TENANT_USER',
          tenantId: manageModalTenant.id,
          name: newUserData.name,
          email: newUserData.email,
          role: newUserData.role,
          password: newUserData.password || undefined
        })
      });
      if (res.ok && res.data?.success) {
        showToast(`User ${newUserData.email} created successfully!`, 'success');
        setShowAddUserModal(false);
        setNewUserData({ name: '', email: '', role: 'TEACHER', password: '' });
        await fetchInstitutionDetails(manageModalTenant.id);
      } else {
        showToast(res.error || 'Failed to create user', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create user', 'error');
    } finally {
      setCreatingUser(false);
    }
  };

  // Reset User Password
  const handleResetUserPassword = async (userId: string, userEmail: string) => {
    if (!manageModalTenant) return;
    try {
      const res = await safeFetchJson('/api/super-admin/saas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESET_TENANT_OWNER_PASSWORD',
          tenantId: manageModalTenant.id,
          userId
        })
      });
      if (res.ok && res.data?.success) {
        setResetPasswordResult({
          email: userEmail,
          tempPass: res.data.temporaryPassword
        });
        showToast(`Temporary password generated for ${userEmail}`, 'success');
      } else {
        showToast(res.error || 'Failed to reset password', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to reset password', 'error');
    }
  };

  // Update Tenant Slug
  const handleUpdateSlug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageModalTenant || !newSlugInput) return;
    setUpdatingSlug(true);
    try {
      const res = await safeFetchJson('/api/super-admin/saas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_TENANT_SLUG',
          tenantId: manageModalTenant.id,
          newSlug: newSlugInput,
          reason: slugReason
        })
      });
      if (res.ok && res.data?.success) {
        showToast(res.data.message || 'Slug updated successfully!', 'success');
        await fetchTenants();
        await fetchInstitutionDetails(manageModalTenant.id);
      } else {
        showToast(res.error || 'Failed to update slug', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update slug', 'error');
    } finally {
      setUpdatingSlug(false);
    }
  };

  // Filtered tenants
  const filteredTenants = tenants.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      (t.shortName && t.shortName.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl text-xs font-semibold shadow-2xl flex items-center gap-3 border ${
              toast.type === 'success'
                ? 'bg-emerald-950 text-emerald-200 border-emerald-700/80 shadow-emerald-950/40'
                : toast.type === 'error'
                ? 'bg-rose-950 text-rose-200 border-rose-700/80 shadow-rose-950/40'
                : 'bg-slate-900 text-slate-200 border-slate-700 shadow-slate-950/40'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <span>Institution Tenants & Control Center ({tenants.length})</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage educational institutions, multi-campus structures, user identities, subscriptions, and safe impersonation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTenants}
            title="Refresh List"
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
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
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by institution name, short name, or tenant slug..."
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
                <th className="py-3.5 px-4 font-semibold text-right">Management Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    {loading ? 'Loading institutions...' : 'No matching educational institutions found.'}
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const isEntering = impersonatingSlug === t.slug;
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-emerald-400 shrink-0">
                            {t.shortName?.slice(0, 2) || t.name?.slice(0, 2) || 'SC'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-white block">{t.name}</span>
                              {t.isDemoTenant && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  DEMO
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {t.customDomain || `${t.slug}.eduerp.us`}
                            </span>
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
                        <span className="font-bold text-white">{t.activePlan || t.currentPlan}</span>
                        <span className="block text-[10px] text-slate-400 uppercase">{t.billingCycle}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        <button
                          onClick={() => handleOpenManage(t, 'users')}
                          className="hover:text-emerald-400 hover:underline transition"
                        >
                          {t.userCount} Accounts
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            t.isActive
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {t.isActive ? 'ACTIVE' : 'SUSPENDED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Impersonate Button */}
                          <button
                            onClick={() =>
                              handleImpersonate(t.slug, t.type === 'UNIVERSITY' ? 'VICE_CHANCELLOR' : 'PRINCIPAL')
                            }
                            disabled={isEntering}
                            title="Enter institution as Principal / Head"
                            className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-50 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-xs"
                          >
                            {isEntering ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Entering...</span>
                              </>
                            ) : (
                              <>
                                <Shield className="w-3 h-3 text-amber-400" />
                                <span>Impersonate</span>
                              </>
                            )}
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(t)}
                            title="Edit Institution Profile"
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-[11px] font-semibold transition flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3 text-blue-400" />
                            <span>Edit</span>
                          </button>

                          {/* Manage Drawer Button */}
                          <button
                            onClick={() => handleOpenManage(t, 'overview')}
                            title="Manage Institution (Users, Campuses, Settings)"
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-[11px] font-semibold transition flex items-center gap-1"
                          >
                            <Settings2 className="w-3 h-3 text-purple-400" />
                            <span>Manage</span>
                          </button>

                          {/* Suspend / Reactivate Button */}
                          <button
                            onClick={() => {
                              setSuspendModalTenant(t);
                              setSuspendReason('');
                            }}
                            title={t.isActive ? 'Suspend Institution' : 'Reactivate Institution'}
                            className={`p-1.5 rounded-lg border transition ${
                              t.isActive
                                ? 'text-rose-400 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20'
                                : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          {/* Live Portal Link */}
                          <Link
                            href={`/${t.slug}/dashboard`}
                            target="_blank"
                            title="Open Live Tenant Portal"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition border border-transparent hover:border-slate-700"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EDIT INSTITUTION MODAL */}
      {/* ========================================================================= */}
      {editModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Edit Institution Profile</h2>
                  <p className="text-xs text-slate-400 font-mono">
                    /{editModalTenant.slug} • ID: {editModalTenant.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditModalTenant(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Official Institution Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Short Name / Acronym *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.shortName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, shortName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Vertical Type</label>
                  <select
                    value={editFormData.institutionType || 'SCHOOL'}
                    onChange={(e) => setEditFormData({ ...editFormData, institutionType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  >
                    {INSTITUTION_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">EIIN Number</label>
                  <input
                    type="text"
                    value={editFormData.eiin || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, eiin: e.target.value })}
                    placeholder="e.g. 132456"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Institute Code</label>
                  <input
                    type="text"
                    value={editFormData.instituteCode || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, instituteCode: e.target.value })}
                    placeholder="e.g. DIMS-01"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Board / Affiliation</label>
                  <input
                    type="text"
                    value={editFormData.boardAffiliation || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, boardAffiliation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Custom Domain</label>
                  <input
                    type="text"
                    value={editFormData.customDomain || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, customDomain: e.target.value })}
                    placeholder="e.g. portal.school.edu.bd"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Principal / Head of Institution Name</label>
                  <input
                    type="text"
                    value={editFormData.principalHeadName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, principalHeadName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Principal / Head Title</label>
                  <input
                    type="text"
                    value={editFormData.principalHeadTitle || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, principalHeadTitle: e.target.value })}
                    placeholder="Principal, Vice Chancellor, Muhtamim..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Official Phone</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Official Email</label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Website URL</label>
                  <input
                    type="text"
                    value={editFormData.website || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Campus Address</label>
                  <input
                    type="text"
                    value={editFormData.address || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">District</label>
                  <input
                    type="text"
                    value={editFormData.district || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Division</label>
                  <input
                    type="text"
                    value={editFormData.division || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, division: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Primary Color (Hex)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editFormData.primaryColor || '#2563eb'}
                      onChange={(e) => setEditFormData({ ...editFormData, primaryColor: e.target.value })}
                      className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editFormData.primaryColor || '#2563eb'}
                      onChange={(e) => setEditFormData({ ...editFormData, primaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Currency Code & Symbol</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editFormData.currencyCode || 'BDT'}
                      onChange={(e) => setEditFormData({ ...editFormData, currencyCode: e.target.value })}
                      className="w-24 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <input
                      type="text"
                      value={editFormData.currencySymbol || '৳'}
                      onChange={(e) => setEditFormData({ ...editFormData, currencySymbol: e.target.value })}
                      className="w-16 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 font-bold text-center"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tenant Status</label>
                  <select
                    value={editFormData.status || 'ACTIVE_PAID'}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ACTIVE_PAID">ACTIVE_PAID</option>
                    <option value="ACTIVE_TRIAL">ACTIVE_TRIAL</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalTenant(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Institution</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MANAGE INSTITUTION DRAWER / MODAL */}
      {/* ========================================================================= */}
      {manageModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">{manageModalTenant.name}</h2>
                  <p className="text-xs text-slate-400 font-mono">
                    /{manageModalTenant.slug} • {manageModalTenant.type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setManageModalTenant(null);
                  setManageDetails(null);
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
              {[
                { id: 'overview', label: 'Overview', icon: Building2 },
                { id: 'users', label: `Users (${manageDetails?.users?.length || manageModalTenant.userCount})`, icon: Users },
                { id: 'campuses', label: `Campuses (${manageDetails?.institution?.campuses?.length || manageModalTenant.campusCount || 1})`, icon: MapPin },
                { id: 'subscription', label: 'Subscription', icon: CreditCard },
                { id: 'slug', label: 'Slug & Domain', icon: Globe },
                { id: 'audit', label: 'Audit Logs', icon: History }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = manageTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setManageTab(tab.id as any)}
                    className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 shrink-0 ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {loadingManageDetails ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                <span className="text-xs font-mono">Loading full institution configuration...</span>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* TAB 1: OVERVIEW */}
                {manageTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-slate-500 font-semibold text-[11px]">Primary Contact</span>
                        <div className="font-bold text-white text-sm">
                          {manageDetails?.institution?.principalHeadName || 'Not Assigned'}
                        </div>
                        <div className="text-slate-400 text-xs">
                          {manageDetails?.institution?.principalHeadTitle || 'Principal'}
                        </div>
                        <div className="text-slate-400 text-xs pt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{manageDetails?.institution?.phone || 'No phone'}</span>
                        </div>
                        <div className="text-slate-400 text-xs flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{manageDetails?.institution?.email || 'No email'}</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-slate-500 font-semibold text-[11px]">Location & Address</span>
                        <div className="font-bold text-white text-xs">
                          {manageDetails?.institution?.address || 'Main Campus'}
                        </div>
                        <div className="text-slate-400 text-xs">
                          {manageDetails?.institution?.upazilaThana}, {manageDetails?.institution?.district}, {manageDetails?.institution?.division}
                        </div>
                        <div className="text-slate-500 text-[11px] pt-1">
                          EIIN: <span className="font-mono text-slate-300">{manageDetails?.institution?.eiin || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-slate-500 font-semibold text-[11px]">Live Portal Link</span>
                        <div className="font-mono text-emerald-400 text-xs truncate">
                          /{manageDetails?.slug}
                        </div>
                        <div className="text-slate-400 text-[11px] truncate">
                          {manageDetails?.customDomain || `${manageDetails?.slug}.eduerp.us`}
                        </div>
                        <div className="pt-2">
                          <button
                            onClick={() => handleImpersonate(manageDetails?.slug, 'PRINCIPAL')}
                            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl font-bold transition flex items-center gap-1.5"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Impersonate as Principal</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: USERS */}
                {manageTab === 'users' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-sm">Institution User Accounts</h3>
                      <button
                        onClick={() => setShowAddUserModal(true)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add User</span>
                      </button>
                    </div>

                    {resetPasswordResult && (
                      <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-200 space-y-1">
                        <div className="font-bold text-sm flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-emerald-400" />
                          <span>Temporary Password Generated for {resetPasswordResult.email}</span>
                        </div>
                        <div className="font-mono bg-slate-950/80 px-3 py-2 rounded-xl text-emerald-300 text-sm font-black select-all border border-emerald-900">
                          {resetPasswordResult.tempPass}
                        </div>
                        <div className="text-[11px] text-emerald-400/80">
                          The user will be required to change this password on their first login.
                        </div>
                      </div>
                    )}

                    <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                            <th className="py-2.5 px-3.5 font-semibold">User</th>
                            <th className="py-2.5 px-3.5 font-semibold">Email</th>
                            <th className="py-2.5 px-3.5 font-semibold">Role</th>
                            <th className="py-2.5 px-3.5 font-semibold">Status</th>
                            <th className="py-2.5 px-3.5 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {(!manageDetails?.users || manageDetails.users.length === 0) ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-500">
                                No users found in this institution.
                              </td>
                            </tr>
                          ) : (
                            manageDetails.users.map((u: any) => (
                              <tr key={u.id} className="hover:bg-slate-900/40 transition">
                                <td className="py-2.5 px-3.5 font-bold text-white">{u.name}</td>
                                <td className="py-2.5 px-3.5 font-mono text-slate-300">{u.email}</td>
                                <td className="py-2.5 px-3.5">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                    {u.role}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3.5">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      u.status === 'ACTIVE'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-rose-500/20 text-rose-400'
                                    }`}
                                  >
                                    {u.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleImpersonate(manageDetails.slug, u.role, u.id)}
                                      title="Impersonate this user account"
                                      className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border border-amber-500/30"
                                    >
                                      <Shield className="w-3 h-3" />
                                      <span>Impersonate</span>
                                    </button>
                                    <button
                                      onClick={() => handleResetUserPassword(u.id, u.email)}
                                      title="Generate Secure Temporary Password"
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold transition flex items-center gap-1"
                                    >
                                      <KeyRound className="w-3 h-3 text-emerald-400" />
                                      <span>Reset Pass</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 3: CAMPUSES */}
                {manageTab === 'campuses' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-white text-sm">Configured Campuses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {manageDetails?.institution?.campuses?.map((c: any) => (
                        <div key={c.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-sm">{c.name}</span>
                            <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                              {c.code}
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs">{c.address || 'Address not specified'}</p>
                          <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1 border-t border-slate-800">
                            <span>Phone: {c.phone || 'N/A'}</span>
                            <span>Email: {c.email || 'N/A'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: SUBSCRIPTION */}
                {manageTab === 'subscription' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-white text-sm">Subscription & Limits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-slate-500 font-semibold text-[11px]">Current Plan</span>
                        <div className="font-black text-white text-base">
                          {manageDetails?.subscriptions?.[0]?.plan?.name || manageDetails?.subscriptionTier}
                        </div>
                        <div className="text-emerald-400 font-mono text-xs uppercase">
                          Status: {manageDetails?.subscriptions?.[0]?.status || 'ACTIVE'}
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-slate-500 font-semibold text-[11px]">Billing Cycle</span>
                        <div className="font-bold text-white text-sm">
                          {manageDetails?.subscriptions?.[0]?.billingCycle || 'MONTHLY'}
                        </div>
                        <div className="text-slate-400 text-xs">
                          Auto-renew: {manageDetails?.subscriptions?.[0]?.autoRenew ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-slate-500 font-semibold text-[11px]">Period End</span>
                        <div className="font-bold text-white text-sm">
                          {manageDetails?.subscriptions?.[0]?.currentPeriodEnd
                            ? new Date(manageDetails.subscriptions[0].currentPeriodEnd).toLocaleDateString()
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: SLUG & DOMAIN */}
                {manageTab === 'slug' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1 text-xs">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>Controlled Tenant Slug Update</span>
                      </div>
                      <p className="text-amber-200/80">
                        Changing an institution slug updates their primary system routing. The previous slug will continue to be safely redirected via route aliases.
                      </p>
                    </div>

                    <form onSubmit={handleUpdateSlug} className="space-y-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">New Tenant Slug *</label>
                        <input
                          type="text"
                          required
                          value={newSlugInput}
                          onChange={(e) => setNewSlugInput(e.target.value)}
                          placeholder="e.g. scholars-international"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Reason for Slug Change *</label>
                        <input
                          type="text"
                          required
                          value={slugReason}
                          onChange={(e) => setSlugReason(e.target.value)}
                          placeholder="e.g. Legal rebrand request from institution head"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={updatingSlug || newSlugInput === manageDetails?.slug}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center gap-2 shadow-md"
                      >
                        {updatingSlug ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Updating Slug...</span>
                          </>
                        ) : (
                          <>
                            <Globe className="w-3.5 h-3.5" />
                            <span>Update Tenant Slug</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* TAB 6: AUDIT HISTORY */}
                {manageTab === 'audit' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-white text-sm">Recent Audit Trail</h3>
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                            <th className="py-2.5 px-3.5 font-semibold">Action</th>
                            <th className="py-2.5 px-3.5 font-semibold">Resource</th>
                            <th className="py-2.5 px-3.5 font-semibold">Actor</th>
                            <th className="py-2.5 px-3.5 font-semibold">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {(!manageDetails?.auditLogs || manageDetails.auditLogs.length === 0) ? (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-slate-500">
                                No audit records found for this tenant.
                              </td>
                            </tr>
                          ) : (
                            manageDetails.auditLogs.map((log: any) => (
                              <tr key={log.id} className="hover:bg-slate-900/40 transition font-mono text-[11px]">
                                <td className="py-2 px-3.5 font-bold text-emerald-400">{log.action}</td>
                                <td className="py-2 px-3.5 text-slate-300">{log.resourceType}</td>
                                <td className="py-2 px-3.5 text-slate-400">{log.actorRole || 'SUPER_ADMIN'}</td>
                                <td className="py-2 px-3.5 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD USER MODAL (Inside Manage) */}
      {/* ========================================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Add Institution User Account</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTenantUser} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="e.g. Professor Ahmed Ali"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="e.g. ahmed@school.edu.bd"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Role *</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="PRINCIPAL">Principal / Headmaster</option>
                  <option value="TEACHER">Teacher / Faculty</option>
                  <option value="ACCOUNTANT">Accountant / Bursar</option>
                  <option value="ADMIN">Administrative Officer</option>
                  <option value="LIBRARIAN">Librarian</option>
                  <option value="HOSTEL_SUPER">Hostel Warden</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Optional Initial Password</label>
                <input
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Leave empty to auto-generate temporary password"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold disabled:opacity-50"
                >
                  {creatingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUSPEND / REACTIVATE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {suspendModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Power
                  className={`w-5 h-5 ${
                    suspendModalTenant.isActive ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                />
                <h3 className="font-bold text-white text-sm">
                  {suspendModalTenant.isActive ? 'Suspend Institution' : 'Reactivate Institution'}
                </h3>
              </div>
              <button onClick={() => setSuspendModalTenant(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Are you sure you want to {suspendModalTenant.isActive ? 'suspend' : 'reactivate'}{' '}
              <strong className="text-white">{suspendModalTenant.name}</strong>?
            </p>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Reason / Notes *</label>
              <input
                type="text"
                required
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Account overdue or client requested freeze"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSuspendModalTenant(null)}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusChange}
                disabled={processingStatus}
                className={`px-4 py-2 rounded-xl font-bold text-white transition disabled:opacity-50 ${
                  suspendModalTenant.isActive
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'
                }`}
              >
                {processingStatus ? 'Processing...' : suspendModalTenant.isActive ? 'Confirm Suspension' : 'Confirm Reactivation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK SUBSCRIPTION MODAL */}
      {/* ========================================================================= */}
      {subModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Manage Plan: {subModalTenant.name}</h3>
              <button onClick={() => setSubModalTenant(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select SaaS Plan</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.tier}) — ৳{p.monthlyPrice}/mo
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Billing Cycle</label>
                <select
                  value={selectedCycle}
                  onChange={(e) => setSelectedCycle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="MONTHLY">MONTHLY</option>
                  <option value="ANNUAL">ANNUAL</option>
                  <option value="QUARTERLY">QUARTERLY</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setSubModalTenant(null)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSubscription}
                  disabled={savingSub}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50"
                >
                  {savingSub ? 'Saving...' : 'Update Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
