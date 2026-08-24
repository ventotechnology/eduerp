'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicFooter } from '@/components/layout/public-footer';
import {
  Headphones,
  ArrowLeft,
  Send,
  Sparkles,
  BookOpen,
  AlertCircle,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

export default function CreateTicketPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    subject: '',
    categoryCode: 'LOGIN_AUTH',
    relatedModule: 'LOGIN',
    priority: 'NORMAL',
    description: '',
    businessImpact: '',
    affectedUrl: '',
    preferredContact: 'IN_APP'
  });

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setSessionUser(data.user);
        } else {
          router.push('/login?redirect=/support/tickets/new');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Live Knowledge Base Suggestions
  useEffect(() => {
    if (!form.subject.trim() || form.subject.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/support/suggestions?subject=${encodeURIComponent(form.subject)}&module=${form.relatedModule}`);
        const data = await res.json();
        if (data.success) {
          setSuggestions(data.data || []);
        }
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [form.subject, form.relatedModule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (data.success && data.ticketNumber) {
        router.push(`/support/tickets/${data.ticketNumber}`);
      } else {
        setError(data.error || 'Failed to create support ticket');
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
          <Link href="/support/tickets" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
              E
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white">
                EduERP
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase -mt-1">
                New Support Ticket
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/support/tickets" className="text-slate-400 hover:text-white transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Tickets</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Create a New Support Ticket
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Our engineering, implementation, and billing teams respond according to our guaranteed SLA policies.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-8 p-6 md:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subject / Summary <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Unable to generate First Term examination grade sheet for Class 9"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={form.categoryCode}
                    onChange={(e) => setForm({ ...form, categoryCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="LOGIN_AUTH">Login & Account Access</option>
                    <option value="ADMISSION">Online Admission & Intake</option>
                    <option value="STUDENT_SIS">Student Information System (SIS)</option>
                    <option value="ACADEMICS">Academics & Timetable</option>
                    <option value="ATTENDANCE">Biometric Attendance</option>
                    <option value="EXAMINATION">Examination & Marks</option>
                    <option value="LMS">LMS & Online Class</option>
                    <option value="FINANCE">Fees & Invoicing</option>
                    <option value="PAYMENT_GATEWAY">bKash / Payment Gateway</option>
                    <option value="HR_PAYROLL">HR & Staff Payroll</option>
                    <option value="DATA_MIGRATION">Bulk Data Migration</option>
                    <option value="BUG">Bug Report</option>
                    <option value="FEATURE_REQUEST">Feature Request</option>
                    <option value="OTHER">General Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Priority & Severity
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="LOW">Low (Minor Question / Feature)</option>
                    <option value="NORMAL">Normal (Standard Query - 8hr SLA)</option>
                    <option value="HIGH">High (Important Feature Blocked - 4hr SLA)</option>
                    <option value="URGENT">Urgent (Institution Operational Impact - 2hr SLA)</option>
                    <option value="CRITICAL">Critical (Total Institution Outage - 1hr SLA)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Related Module
                  </label>
                  <select
                    value={form.relatedModule}
                    onChange={(e) => setForm({ ...form, relatedModule: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="LOGIN">Authentication</option>
                    <option value="ADMISSION">Admission</option>
                    <option value="SIS">Students (SIS)</option>
                    <option value="ACADEMICS">Academics</option>
                    <option value="ATTENDANCE">Attendance</option>
                    <option value="EXAM">Examination</option>
                    <option value="LMS">LMS</option>
                    <option value="FINANCE">Fees & Finance</option>
                    <option value="HR">HR & Payroll</option>
                    <option value="OTHER">Other / General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Affected URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.affectedUrl}
                    onChange={(e) => setForm({ ...form, affectedUrl: e.target.value })}
                    placeholder="e.g. /dims/examination"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Detailed Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Provide clear details, steps to reproduce the issue, and expected behavior..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/20 transition transform active:scale-95"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating Ticket...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Support Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Right Column: Suggested Documentation */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Instant Help Suggestions</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Articles related to your topic that may answer your question immediately:
                </p>

                {suggestions.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {suggestions.map((sug) => (
                      <Link
                        key={sug.id}
                        href={`/help/articles/${sug.slug}`}
                        target="_blank"
                        className="block p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 transition group"
                      >
                        <span className="font-semibold text-xs text-white block group-hover:text-emerald-300">
                          {sug.title}
                        </span>
                        <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {sug.summary}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center text-slate-500 text-xs">
                    Type a subject to see suggested documentation
                  </div>
                )}
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs text-slate-400">
                <span className="font-bold text-white block">SLA Commitment</span>
                <p className="text-[11px] leading-relaxed">
                  All tickets are tracked against our formal Service Level Agreements. You will receive an immediate acknowledgment and resolution updates in this thread.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
