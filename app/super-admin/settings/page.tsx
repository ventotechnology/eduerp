'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Building,
  Mail,
  Shield,
  FileText,
  Globe
} from 'lucide-react';

export default function PlatformSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    platformName: 'EduERP OS',
    companyName: 'Vento Technology',
    supportEmail: 'support@eduerp.us',
    salesEmail: 'sales@eduerp.us',
    billingEmail: 'billing@eduerp.us',
    contactPhone: '+880 1700-000000',
    headquartersAddress: 'Level 12, Gulshan-2, Dhaka-1212, Bangladesh',
    currency: 'BDT',
    timezone: 'Asia/Dhaka',
    enablePublicSignup: true,
    enableDemoShowroom: true,
    maintenanceMode: false
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          <span>Platform SaaS Configuration</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Global SaaS configuration, company branding, legal compliance metadata, and contact endpoints.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* General SaaS Info */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>General Platform Info</span>
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Platform Brand Name</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Corporate Operating Entity</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Base Currency</label>
              <input
                type="text"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Default Timezone</label>
              <input
                type="text"
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Public Legal & Contact Details */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400" />
            <span>Public Support & Contact Inquiries</span>
          </h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Technical Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Sales Department Email</label>
              <input
                type="email"
                value={settings.salesEmail}
                onChange={(e) => setSettings({ ...settings, salesEmail: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Billing Support Email</label>
              <input
                type="email"
                value={settings.billingEmail}
                onChange={(e) => setSettings({ ...settings, billingEmail: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Direct Helpline Phone</label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Headquarters Address</label>
              <input
                type="text"
                value={settings.headquartersAddress}
                onChange={(e) => setSettings({ ...settings, headquartersAddress: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          {saved && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Platform Settings Saved</span>
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
