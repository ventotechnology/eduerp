'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
  Globe,
  Save,
  CheckCircle2
} from 'lucide-react';

export default function SuperAdminContactSettingsPage() {
  const [form, setForm] = useState({
    companyName: 'Vento Technology',
    productName: 'EduERP',
    address: 'House 2/B, Road 8, Nikunja-2, Khilkhet',
    city: 'Dhaka',
    postalCode: '1229',
    country: 'Bangladesh',
    generalEmail: 'teamhimu@gmail.com',
    supportEmail: 'support@eduerp.us',
    salesEmail: 'sales@eduerp.us',
    billingEmail: 'billing@eduerp.us',
    phone: '+8801335556688',
    whatsapp: '+8801335556688',
    businessHours: 'Sunday - Thursday, 9:00 AM - 6:00 PM BST',
    timezone: 'Asia/Dhaka',
    websiteUrl: 'https://eduerp.us'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/contact')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setForm(data.data);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/contact/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(data.error || 'Failed to save settings');
      }
    } catch {
      alert('Error saving contact settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          Platform Contact & Company Profile
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure official company headquarters, voice lines, WhatsApp click-to-chat, and department emails.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs font-mono">Loading settings...</div>
      ) : (
        <form onSubmit={handleSave} className="p-6 md:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl text-xs">
          {saved && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Platform contact settings successfully updated across all public hubs!</span>
            </div>
          )}

          {/* Company & Product Identity */}
          <div className="space-y-4">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] border-b border-slate-800 pb-2">
              Company & Product Identity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company Legal Name</label>
                <input
                  type="text"
                  required
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Headquarters Physical Address */}
          <div className="space-y-4">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] border-b border-slate-800 pb-2">
              Headquarters Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">City</label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Postal Code & Country</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    required
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Email Contacts */}
          <div className="space-y-4">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] border-b border-slate-800 pb-2">
              Email Channels
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">General / Official Email</label>
                <input
                  type="email"
                  required
                  value={form.generalEmail}
                  onChange={(e) => setForm({ ...form, generalEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Support Desk Email</label>
                <input
                  type="email"
                  required
                  value={form.supportEmail}
                  onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Sales Email</label>
                <input
                  type="email"
                  required
                  value={form.salesEmail}
                  onChange={(e) => setForm({ ...form, salesEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Billing Email</label>
                <input
                  type="email"
                  required
                  value={form.billingEmail}
                  onChange={(e) => setForm({ ...form, billingEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Voice & Instant Chat */}
          <div className="space-y-4">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] border-b border-slate-800 pb-2">
              Voice Hotline & WhatsApp
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Voice Phone Line</label>
                <input
                  type="text"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">WhatsApp Click-to-Chat Number</label>
                <input
                  type="text"
                  required
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">Business Hours & Timezone</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={form.businessHours}
                    onChange={(e) => setForm({ ...form, businessHours: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    required
                    value={form.timezone}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
            >
              {saving ? (
                <span>Saving Changes...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Platform Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
