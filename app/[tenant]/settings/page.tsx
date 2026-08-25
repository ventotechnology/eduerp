'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTenant } from '@/lib/tenant-context';
import { BANGLADESH_EDUCATION_BOARDS } from '@/lib/constants';
import {
  Settings,
  Building2,
  Palette,
  Shield,
  Layers,
  Save,
  CheckCircle2,
  Plus,
  Sliders,
  User,
  KeyRound,
  Users,
  AlertTriangle,
  Compass,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  CreditCard,
  Check
} from 'lucide-react';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'profile';

  const { branding, institutionType, institutionTypeConfig, activeUser, campuses, tenantSlug } = useTenant();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'institution' | 'branding' | 'admissions' | 'users'>(
    ['profile', 'security', 'institution', 'branding', 'admissions', 'users'].includes(initialTab) ? initialTab : 'profile'
  );

  // Profile State
  const [profileName, setProfileName] = useState(activeUser?.name || 'Mohammad Saifullah');
  const [profilePhone, setProfilePhone] = useState('01711223344');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password / Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Institution State
  const [instName, setInstName] = useState(branding.name);
  const [shortName, setShortName] = useState(branding.shortName);
  const [eiin, setEiin] = useState(branding.eiin || '');
  const [board, setBoard] = useState(branding.boardAffiliation || BANGLADESH_EDUCATION_BOARDS[0]);
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor);
  const [instSuccess, setInstSuccess] = useState(false);

  // Admission Settings State
  const [admissionOpen, setAdmissionOpen] = useState(true);
  const [applicationFee, setApplicationFee] = useState(500);
  const [admissionFeeDefault, setAdmissionFeeDefault] = useState(5000);
  const [testRequired, setTestRequired] = useState(false);
  const [admissionSuccess, setAdmissionSuccess] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'security', 'institution', 'branding', 'admissions', 'users'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, phone: profilePhone })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update profile');
      setProfileSuccess('Profile details saved successfully.');
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Error updating profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      setPasswordLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to change password');
      setPasswordSuccess('Password updated successfully. Please use your new password for subsequent logins.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'Error changing password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleInstitutionSave = (e: React.FormEvent) => {
    e.preventDefault();
    setInstSuccess(true);
    setTimeout(() => setInstSuccess(false), 2500);
  };

  const handleAdmissionSave = (e: React.FormEvent) => {
    e.preventDefault();
    setAdmissionSuccess(true);
    setTimeout(() => setAdmissionSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Control Center
            </span>
            <span className="text-xs text-slate-400">Owner & Institution Management</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Settings, Profile & Security
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your personal credentials, institution identity, admission policies, and security configurations.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400">
          {[
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'security', label: 'Security & Password', icon: KeyRound },
            { id: 'institution', label: 'Institution Profile', icon: Building2 },
            { id: 'branding', label: 'Branding & Themes', icon: Palette },
            { id: 'admissions', label: 'Admission Rules', icon: Compass }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  isActive ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
          <a
            href={`/${tenantSlug}/settings/sms`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition text-teal-400 hover:bg-slate-800 hover:text-white"
          >
            <Mail className="w-3.5 h-3.5 text-teal-400" />
            <span>SMS Gateway</span>
          </a>
          <a
            href={`/${tenantSlug}/settings/payments`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition text-amber-400 hover:bg-slate-800 hover:text-white"
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            <span>Payment Gateways</span>
          </a>
          <a
            href={`/${tenantSlug}/settings/billing`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition text-emerald-400 hover:bg-slate-800 hover:text-white"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Subscription & Billing</span>
          </a>
        </div>
      </div>

      {/* TAB 1: My Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSave} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 text-xs text-white">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              <span>Personal Account Profile</span>
            </h2>
            <span className="text-[11px] text-slate-400">Logged in as {activeUser.name}</span>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-800 text-emerald-300 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Primary Email (Login ID)</label>
              <input
                type="email"
                disabled
                value={activeUser.email || 'contact@scholarsita.com'}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 cursor-not-allowed opacity-80"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Managed by platform administrative controls.</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Mobile / WhatsApp Number</label>
              <input
                type="tel"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Assigned Institutional Role</label>
              <input
                type="text"
                disabled
                value={activeUser.role.replace(/_/g, ' ')}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 capitalize opacity-80 cursor-not-allowed font-semibold"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={profileLoading}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>{profileLoading ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Security & Password */}
      {activeTab === 'security' && (
        <form onSubmit={handlePasswordChange} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 text-xs text-white max-w-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Account Security & Password</span>
            </h2>
            <span className="text-[11px] text-slate-400">Encrypted with Argon2/bcrypt</span>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-800 text-emerald-300 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">New Password *</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={passwordLoading}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{passwordLoading ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: Institution Profile */}
      {activeTab === 'institution' && (
        <form onSubmit={handleInstitutionSave} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 text-xs text-white">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span>Institution Identity & Profile</span>
            </h2>
            <span className="text-[11px] text-slate-400">EIIN & Affiliation Settings</span>
          </div>

          {instSuccess && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-800 text-emerald-300 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Institution details saved successfully.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Institution Full Name</label>
              <input
                type="text"
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Short Name / Monogram Code</label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">EIIN Number</label>
              <input
                type="text"
                value={eiin}
                onChange={(e) => setEiin(e.target.value)}
                placeholder="e.g. 132456"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Education Board / Affiliation</label>
              <select
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              >
                {BANGLADESH_EDUCATION_BOARDS.map((b) => (
                  <option key={b} value={b} className="bg-slate-900 text-white">{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Institution Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: Branding & Themes */}
      {activeTab === 'branding' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 text-xs text-white">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-pink-400" />
            <span>Branding & Primary Theme</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Primary Brand Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-slate-950 border border-slate-700"
                />
                <span className="font-mono text-slate-300">{primaryColor}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Admission Rules */}
      {activeTab === 'admissions' && (
        <form onSubmit={handleAdmissionSave} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 text-xs text-white max-w-2xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Admission Portal Configuration</span>
          </h2>

          {admissionSuccess && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-800 text-emerald-300 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Admission rules updated.</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <span className="font-bold text-white block">Online Admission Status</span>
                <span className="text-[11px] text-slate-400">Allow prospective students/parents to submit applications online</span>
              </div>
              <input
                type="checkbox"
                checked={admissionOpen}
                onChange={(e) => setAdmissionOpen(e.target.checked)}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Application Fee (BDT)</label>
                <input
                  type="number"
                  min="0"
                  value={applicationFee}
                  onChange={(e) => setApplicationFee(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Default Admission Fee (BDT)</label>
                <input
                  type="number"
                  min="0"
                  value={admissionFeeDefault}
                  onChange={(e) => setAdmissionFeeDefault(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Admission Settings</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
