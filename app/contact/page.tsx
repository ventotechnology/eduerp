'use client';

import React, { useState, useEffect } from 'react';
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
  MessageSquare,
  MessageCircle,
  HelpCircle,
  BookOpen,
  Headphones,
  Calendar,
  Globe
} from 'lucide-react';

export default function ContactPage() {
  const [settings, setSettings] = useState({
    companyName: 'Vento Technology',
    productName: 'EduERP',
    address: 'House 2/B, Road 8, Nikunja-2, Khilkhet',
    city: 'Dhaka',
    postalCode: '1229',
    country: 'Bangladesh',
    generalEmail: 'teamhimu@gmail.com',
    supportEmail: 'teamhimu@gmail.com',
    salesEmail: 'teamhimu@gmail.com',
    billingEmail: 'teamhimu@gmail.com',
    phone: '+8801335556688',
    whatsapp: '+8801335556688',
    businessHours: 'Sunday - Thursday, 9:00 AM - 6:00 PM BST',
    timezone: 'Asia/Dhaka'
  });

  const [form, setForm] = useState({
    fullName: '',
    institutionName: '',
    email: '',
    phone: '',
    whatsapp: '',
    institutionType: 'SCHOOL',
    district: 'Dhaka',
    studentCount: '500',
    campusCount: '1',
    category: 'Product Demo',
    subject: 'Schedule Multi-Vertical Institution ERP Demo',
    preferredContact: 'WHATSAPP',
    requirements: ''
  });

  const [loading, setLoading] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/contact')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSettings(data.data);
        }
      })
      .catch(() => null);
  }, []);

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
        setSubmittedInquiry(data.inquiryNumber || 'INQ-2026-RECORDED');
      } else {
        setError(data.error || 'Failed to submit inquiry');
      }
    } catch {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cleanWaNumber = (settings.whatsapp || '+8801335556688').replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent('Hello EduERP / Vento Technology Team, I would like to learn more about EduERP for my institution.')}`;

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
                Client Success & Contact
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/help" className="text-slate-300 hover:text-emerald-400 transition flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help Center</span>
            </Link>
            <Link href="/training" className="text-slate-300 hover:text-emerald-400 transition flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Training Academy</span>
            </Link>
            <Link href="/support/tickets" className="text-slate-300 hover:text-emerald-400 transition flex items-center gap-1">
              <Headphones className="w-3.5 h-3.5" />
              <span>Support Portal</span>
            </Link>
            <Link href="/demo" className="text-slate-300 hover:text-white transition">
              Demo Directory
            </Link>
            <Link href="/login" className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition">
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
            <span>Official Client Success & Commercial Headquarters</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Connect with {settings.companyName}
          </h1>
          <p className="text-xs md:text-sm text-slate-300">
            Dedicated multi-vertical institutional onboarding, custom multi-campus deployment, BTEB/UGC compliance advisory, and technical support.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Official Contact Directory & WhatsApp CTA */}
          <div className="lg:col-span-5 space-y-6">
            {/* Primary Headquarters Box */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-1">
                  Product & Company
                </span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  <span>{settings.companyName}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Makers of {settings.productName} — Unified Education OS
                </p>
              </div>

              {/* Physical Address */}
              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Official Address:</span>
                    <span className="text-slate-300 block font-medium">
                      {settings.address}
                    </span>
                    <span className="text-slate-400 block text-[11px]">
                      {settings.city}-{settings.postalCode}, {settings.country}
                    </span>
                  </div>
                </div>

                {/* Email Channels */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-white block">Direct Email Contacts:</span>
                    <div className="text-slate-300 space-y-0.5">
                      <p><span className="text-slate-500">General/Official:</span> <a href={`mailto:${settings.generalEmail}`} className="text-blue-400 hover:underline">{settings.generalEmail}</a></p>
                      <p><span className="text-slate-500">Support Desk:</span> <a href={`mailto:${settings.supportEmail}`} className="text-blue-400 hover:underline">{settings.supportEmail}</a></p>
                      <p><span className="text-slate-500">Sales Inquiries:</span> <a href={`mailto:${settings.salesEmail}`} className="text-blue-400 hover:underline">{settings.salesEmail}</a></p>
                    </div>
                  </div>
                </div>

                {/* Phone & Hotline */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Direct Voice Line:</span>
                    <a href={`tel:${settings.phone}`} className="text-amber-400 font-mono font-semibold hover:underline block">
                      {settings.phone}
                    </a>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Operational Hours:</span>
                    <span className="text-slate-300 block">{settings.businessHours}</span>
                    <span className="text-slate-500 text-[11px] block">Timezone: {settings.timezone}</span>
                  </div>
                </div>
              </div>

              {/* Instant WhatsApp Click-to-Chat Button */}
              <div className="pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition transform active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp ({settings.whatsapp})</span>
                </a>
                <p className="text-[10px] text-center text-slate-500 mt-2">
                  Direct Click-to-Chat with EduERP Educational Deployment Specialists
                </p>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Self-Service Hubs</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link href="/help" className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/40 transition">
                  <span className="font-bold text-emerald-400 block">Help Center</span>
                  <span className="text-[10px] text-slate-400">Search guides & docs</span>
                </Link>
                <Link href="/training" className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/40 transition">
                  <span className="font-bold text-blue-400 block">Academy</span>
                  <span className="text-[10px] text-slate-400">Get certified</span>
                </Link>
                <Link href="/help/faq" className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/40 transition">
                  <span className="font-bold text-amber-400 block">FAQs</span>
                  <span className="text-[10px] text-slate-400">Instant answers</span>
                </Link>
                <Link href="/support/tickets" className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/40 transition">
                  <span className="font-bold text-purple-400 block">Support Desk</span>
                  <span className="text-[10px] text-slate-400">Track your tickets</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Inquiry Submission Form */}
          <div className="lg:col-span-7">
            <div className="p-6 md:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
              {submittedInquiry ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-white">Inquiry Registered Successfully!</h3>
                  <div className="inline-block px-4 py-2 rounded-xl bg-slate-950 border border-emerald-500/40 font-mono text-sm font-bold text-emerald-400">
                    Inquiry Reference: {submittedInquiry}
                  </div>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    Thank you. A dedicated educational solutions specialist from {settings.companyName} will contact you via your preferred channel ({form.preferredContact}) within 2 business hours.
                  </p>
                  <div className="pt-4 flex justify-center gap-3">
                    <button
                      onClick={() => {
                        setSubmittedInquiry(null);
                        setForm({
                          fullName: '',
                          institutionName: '',
                          email: '',
                          phone: '',
                          whatsapp: '',
                          institutionType: 'SCHOOL',
                          district: 'Dhaka',
                          studentCount: '500',
                          campusCount: '1',
                          category: 'Product Demo',
                          subject: 'Schedule Multi-Vertical Institution ERP Demo',
                          preferredContact: 'WHATSAPP',
                          requirements: ''
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition"
                    >
                      Submit Another Inquiry
                    </button>
                    <Link
                      href="/demo"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition"
                    >
                      Explore Interactive Demos
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Submit an Institutional Inquiry</h3>
                    <p className="text-xs text-slate-400">
                      Fill in your institution details and we will tailor a live demonstration or custom rollout proposal.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-medium">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Full Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        placeholder="e.g. Dr. Rafiqul Islam"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Institution Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.institutionName}
                        onChange={(e) => setForm({ ...form, institutionName: e.target.value })}
                        placeholder="e.g. Dhaka Ideal Model High School"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Official Email <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="principal@school.edu.bd"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Mobile Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value, whatsapp: e.target.value })}
                        placeholder="+880 17XX-XXXXXX"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Institution Type
                      </label>
                      <select
                        value={form.institutionType}
                        onChange={(e) => setForm({ ...form, institutionType: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="SCHOOL">K-12 School</option>
                        <option value="COLLEGE">Higher Secondary College</option>
                        <option value="SCHOOL_AND_COLLEGE">Combined School & College</option>
                        <option value="MADRASHA">Madrasha & Hifz</option>
                        <option value="UNIVERSITY">University & Higher Ed</option>
                        <option value="POLYTECHNIC">Polytechnic Institute</option>
                        <option value="TECHNICAL_INSTITUTE">Technical Training Institute</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Total Students (Approx)
                      </label>
                      <input
                        type="number"
                        value={form.studentCount}
                        onChange={(e) => setForm({ ...form, studentCount: e.target.value })}
                        placeholder="500"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Inquiry Category
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Product Demo">Product Demo</option>
                        <option value="Pricing">Pricing & Packages</option>
                        <option value="Implementation">Implementation Advisory</option>
                        <option value="Data Migration">Legacy Data Migration</option>
                        <option value="Custom Development">Custom Development</option>
                        <option value="Partnership">Channel Partnership</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Inquiry Subject
                    </label>
                    <input
                      type="text"
                      required
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="e.g. Schedule Online Admission & Finance Demo"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Specific Requirements & Campus Setup
                    </label>
                    <textarea
                      rows={3}
                      value={form.requirements}
                      onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                      placeholder="Mention any specific needs: e.g. bKash payment gateway, biometric attendance machines, Hifz Quran tracker, BANBEIS report compliance..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition transform active:scale-95 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Generating Inquiry Reference...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Inquiry & Request Callback</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
