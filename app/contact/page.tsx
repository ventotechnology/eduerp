'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PublicFooter } from '@/components/layout/public-footer';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  Sparkles,
  Building2,
  Clock,
  MessageSquare
} from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    institutionName: '',
    email: '',
    phone: '',
    institutionType: 'SCHOOL',
    subject: 'Schedule Institution ERP Demo',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Failed to submit inquiry');
      }
    } catch {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
              E
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white">
                EduERP
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase -mt-1">
                Institutional OS
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/pricing" className="text-slate-300 hover:text-white transition">
              Pricing
            </Link>
            <Link href="/demo" className="text-slate-300 hover:text-white transition">
              Demo Directory
            </Link>
            <Link href="/login" className="text-slate-300 hover:text-white transition">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Section */}
      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EduERP Solution Experts</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Let&apos;s Transform Your Institution&apos;s Digital Operations
          </h1>
          <p className="text-xs md:text-sm text-slate-300">
            Have questions about custom multi-campus deployments, BTEB/UGC compliance, or data migration from legacy systems? Reach out directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Contact Details */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <h2 className="text-base font-bold text-white">Direct Communication Channels</h2>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Email Inquiries</span>
                    <span className="text-slate-400 block text-[11px]">General & Support: support@eduerp.us</span>
                    <span className="text-slate-400 block text-[11px]">Institutional Sales: sales@eduerp.us</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Direct Phone Hotline</span>
                    <span className="text-slate-400 block text-[11px]">+880 1700-000000 (Dhaka)</span>
                    <span className="text-slate-400 block text-[11px]">Sunday – Thursday: 9:00 AM – 6:00 PM</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Corporate Headquarters</span>
                    <span className="text-slate-400 block text-[11px]">Vento Technology</span>
                    <span className="text-slate-400 block text-[11px]">Level 12, Gulshan-2, Dhaka-1212, Bangladesh</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Rapid Response SLA</span>
              </span>
              <p>Inquiries received during business hours are reviewed within 2 hours by dedicated educational software engineers.</p>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-2 p-8 rounded-3xl bg-slate-900 border border-slate-800">
            {submitted ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Inquiry Received Successfully!</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out. An educational solutions specialist has received your request and will follow up at <strong className="text-emerald-400">{form.email}</strong> promptly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <h2 className="text-base font-bold text-white mb-2">Send an Institutional Inquiry</h2>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Mohammad Kabir"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Institution Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Imperial Model College"
                      value={form.institutionName}
                      onChange={(e) => setForm({ ...form, institutionName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Official Email</label>
                    <input
                      type="email"
                      required
                      placeholder="principal@college.edu.bd"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="01711000000"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Institution Type</label>
                    <select
                      value={form.institutionType}
                      onChange={(e) => setForm({ ...form, institutionType: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="SCHOOL">School (K-12)</option>
                      <option value="COLLEGE">College (HSC)</option>
                      <option value="SCHOOL_AND_COLLEGE">School & College</option>
                      <option value="MADRASHA">Madrasha & Hifz</option>
                      <option value="UNIVERSITY">University / Higher Ed</option>
                      <option value="POLYTECHNIC">Polytechnic Institute</option>
                      <option value="TECHNICAL_INSTITUTE">Technical / Vocational</option>
                      <option value="TRAINING_INSTITUTE">Training Institute</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Inquiry / Requirements</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe student capacity, campus count, or specific module requirements..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{loading ? 'Sending Inquiry...' : 'Submit Inquiry'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
