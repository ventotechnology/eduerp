'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tag,
  Plus,
  Edit2,
  Copy,
  Trash2,
  CheckCircle2,
  X,
  RefreshCw,
  Sparkles,
  DollarSign,
  Shield,
  Layers,
  Check,
  AlertCircle
} from 'lucide-react';

const SYSTEM_MODULE_FEATURES = [
  { key: 'SIS', name: 'Student Information System (SIS)' },
  { key: 'ATTENDANCE', name: 'Daily Attendance & Biometric Integration' },
  { key: 'ACADEMICS', name: 'Curriculum, Class, Section & Subject Management' },
  { key: 'EXAMINATION', name: 'Exams, Gradebook, Transcripts & GPA Engine' },
  { key: 'FINANCE', name: 'Student Fees, Collections & Automated Invoicing' },
  { key: 'ACCOUNTING', name: 'Double-Entry Accounting & General Ledger' },
  { key: 'HR_PAYROLL', name: 'Staff Management, Attendance & Payroll' },
  { key: 'PORTAL', name: 'Student & Guardian Self-Service Portal' },
  { key: 'LMS_COMPLETE', name: 'LMS, Video Classes & Online Question Bank' },
  { key: 'LIBRARY', name: 'Library & Book Barcode Tracking' },
  { key: 'HOSTEL_TRANSPORT', name: 'Hostel & Transport Fleet Management' },
  { key: 'CUSTOM_DOMAIN', name: 'Institutional Custom Domain (e.g. erp.school.edu.bd)' },
  { key: 'REST_API', name: 'Developer REST API & Webhooks Access' },
  { key: 'WHITE_LABEL', name: 'White-Label Branding & Custom Logos' },
  { key: 'PRIORITY_SUPPORT', name: '24/7 Priority Support & Dedicated Manager' },
  { key: 'GOV_COMPLIANCE', name: 'BANBEIS, DSHE, BTEB & UGC Regulatory Exports' },
  { key: 'UNIVERSITY_CREDIT', name: 'Open Credit, Semester & Prerequisite Engine' },
  { key: 'HIFZ_TRACKING', name: 'Madrasha 30-Para Hifzul Quran Progress Engine' },
];

export default function PlansPricingPage() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Edit/Create Modal State
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Clone Modal State
  const [cloningPlan, setCloningPlan] = useState<any | null>(null);
  const [cloneCode, setCloneCode] = useState('');
  const [cloneName, setCloneName] = useState('');
  const [cloning, setCloning] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/plans?scope=admin');
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans || []);
      } else {
        setError(data.error || 'Failed to fetch plans');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setSaving(true);

    try {
      const method = editingPlan.id ? 'PUT' : 'POST';
      const res = await fetch('/api/plans', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPlan)
      });

      const data = await res.json();
      if (data.success) {
        setEditingPlan(null);
        await fetchPlans();
      } else {
        alert(data.error || 'Failed to save plan');
      }
    } catch (err: any) {
      alert(err.message || 'Network error saving plan');
    } finally {
      setSaving(false);
    }
  };

  const handleClonePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloningPlan || !cloneCode || !cloneName) return;
    setCloning(true);

    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CLONE',
          sourcePlanId: cloningPlan.id,
          newCode: cloneCode,
          newName: cloneName
        })
      });

      const data = await res.json();
      if (data.success) {
        setCloningPlan(null);
        setCloneCode('');
        setCloneName('');
        await fetchPlans();
      } else {
        alert(data.error || 'Failed to clone plan');
      }
    } catch (err: any) {
      alert(err.message || 'Network error cloning plan');
    } finally {
      setCloning(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate/delete this plan?')) return;
    try {
      const res = await fetch(`/api/plans?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchPlans();
      } else {
        alert(data.error || 'Failed to delete plan');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  };

  const openNewPlanModal = () => {
    setEditingPlan({
      code: 'CUSTOM_' + Math.floor(Math.random() * 1000),
      name: 'Custom Plan',
      slug: 'custom-' + Math.floor(Math.random() * 1000),
      tier: 'STARTER',
      description: 'Custom educational software package tailored for institutional requirements.',
      monthlyPrice: 5000,
      annualPrice: 50000,
      currency: 'BDT',
      monthlyDiscount: 0,
      annualDiscount: 16.67,
      trialDays: 14,
      setupFee: 0,
      maxStudents: 1000,
      maxCampuses: 2,
      maxUsers: 50,
      maxTeachers: 50,
      maxStorageGb: 50,
      includedSms: 2000,
      includedEmails: 10000,
      apiAccess: false,
      customDomain: false,
      whiteLabel: false,
      prioritySupport: false,
      isPublic: true,
      isActive: true,
      isFeatured: false,
      displayOrder: plans.length + 1,
      badge: 'Custom Package',
      buttonText: 'Get Started',
      features: SYSTEM_MODULE_FEATURES.map(f => ({
        featureKey: f.key,
        name: f.name,
        isEnabled: true
      }))
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-400" />
            <span>SaaS Plans & Pricing Matrix</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Database-driven tier management. Updates immediately synchronize with the public <Link href="/pricing" target="_blank" className="text-emerald-400 hover:underline">/pricing</Link> page.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openNewPlanModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Plan</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`p-5 rounded-3xl border flex flex-col justify-between transition ${
              p.isFeatured
                ? 'bg-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-white">{p.name}</span>
                  {p.isFeatured && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      FEATURED
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                  {p.code}
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-4 min-h-[36px]">{p.description}</p>

              {/* Pricing Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs text-slate-300 mb-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">Monthly Price:</span>
                  <span className="font-bold text-white text-sm">BDT {p.monthlyPrice?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500">Annual Price:</span>
                  <span className="font-semibold text-slate-300">BDT {p.annualPrice?.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-800/60 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Max Students:</span>
                    <span className="font-bold text-emerald-400">{p.maxStudents?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Campuses:</span>
                    <span className="font-semibold text-white">{p.maxCampuses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Storage:</span>
                    <span className="font-semibold text-white">{p.maxStorageGb} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subscribers:</span>
                    <span className="font-semibold text-slate-300">{p._count?.subscriptions || 0} Institutions</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setEditingPlan({ ...p })}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Edit Pricing & Entitlements</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCloningPlan(p);
                    setCloneCode(`${p.code}_CUSTOM`);
                    setCloneName(`${p.name} (Custom)`);
                  }}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-[11px] flex items-center justify-center gap-1 border border-slate-800 transition"
                >
                  <Copy className="w-3 h-3" />
                  <span>Clone</span>
                </button>

                <button
                  onClick={() => handleDeletePlan(p.id)}
                  className="p-1.5 rounded-xl bg-slate-950 hover:bg-rose-950/50 text-slate-500 hover:text-rose-400 border border-slate-800 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <span>{editingPlan.id ? `Edit Plan: ${editingPlan.name}` : 'Create New SaaS Package'}</span>
              </h3>
              <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Code / Identifier</label>
                  <input
                    type="text"
                    required
                    value={editingPlan.code}
                    onChange={(e) => setEditingPlan({ ...editingPlan, code: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Pricing & Discounts */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-white block">Pricing & Billing Terms</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-slate-400 mb-1">Monthly Price (BDT)</label>
                    <input
                      type="number"
                      required
                      value={editingPlan.monthlyPrice}
                      onChange={(e) => setEditingPlan({ ...editingPlan, monthlyPrice: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-400 mb-1">Annual Price (BDT)</label>
                    <input
                      type="number"
                      required
                      value={editingPlan.annualPrice}
                      onChange={(e) => setEditingPlan({ ...editingPlan, annualPrice: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-400 mb-1">Trial Days</label>
                    <input
                      type="number"
                      value={editingPlan.trialDays || 14}
                      onChange={(e) => setEditingPlan({ ...editingPlan, trialDays: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Limits */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-white block">Resource Limits & Capacity</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-slate-400 mb-1">Max Students</label>
                    <input
                      type="number"
                      required
                      value={editingPlan.maxStudents}
                      onChange={(e) => setEditingPlan({ ...editingPlan, maxStudents: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-400 mb-1">Max Campuses</label>
                    <input
                      type="number"
                      required
                      value={editingPlan.maxCampuses}
                      onChange={(e) => setEditingPlan({ ...editingPlan, maxCampuses: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-400 mb-1">Max Storage (GB)</label>
                    <input
                      type="number"
                      required
                      value={editingPlan.maxStorageGb}
                      onChange={(e) => setEditingPlan({ ...editingPlan, maxStorageGb: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Feature Matrix */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-white block">Module & Feature Entitlements</span>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {SYSTEM_MODULE_FEATURES.map((feat) => {
                    const currentFeat = editingPlan.features?.find((f: any) => f.featureKey === feat.key);
                    const isChecked = currentFeat ? currentFeat.isEnabled : true;
                    return (
                      <label
                        key={feat.key}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800/80 cursor-pointer hover:border-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const updatedFeatures = [...(editingPlan.features || [])];
                            const idx = updatedFeatures.findIndex(f => f.featureKey === feat.key);
                            if (idx >= 0) {
                              updatedFeatures[idx].isEnabled = e.target.checked;
                            } else {
                              updatedFeatures.push({
                                featureKey: feat.key,
                                name: feat.name,
                                isEnabled: e.target.checked
                              });
                            }
                            setEditingPlan({ ...editingPlan, features: updatedFeatures });
                          }}
                          className="rounded text-emerald-500"
                        />
                        <span className="text-[11px] text-slate-300 leading-tight">{feat.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save Plan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clone Modal */}
      {cloningPlan && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Clone Plan: {cloningPlan.name}</h3>
            <form onSubmit={handleClonePlan} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">New Plan Name</label>
                <input
                  type="text"
                  required
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">New Plan Code</label>
                <input
                  type="text"
                  required
                  value={cloneCode}
                  onChange={(e) => setCloneCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCloningPlan(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cloning}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center gap-2"
                >
                  {cloning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                  <span>Clone Package</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
