'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/lib/tenant-context';
import {
  MessageSquare,
  AlertTriangle,
  Send,
  CheckCircle2,
  Users,
  Plus,
  Bell,
  X,
  Sparkles,
  AlertCircle,
  Loader2,
  Radio,
  FileText,
} from 'lucide-react';

export default function CommunicationPage() {
  const { branding, tenantSlug } = useTenant();

  const [loading, setLoading] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalGuardians: 0,
    totalEmployees: 0,
    overdueInvoicesCount: 0,
  });
  const [smsGateway, setSmsGateway] = useState<any>({
    isConfigured: false,
    provider: 'NOT_CONFIGURED',
    balance: 0,
    status: 'INTEGRATION_NOT_CONFIGURED',
  });

  const [smsText, setSmsText] = useState('');
  const [smsTarget, setSmsTarget] = useState('ALL_PARENTS');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [smsSuccess, setSmsSuccess] = useState<string | null>(null);

  // Notice Modal
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [isSubmittingNotice, setIsSubmittingNotice] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    audience: 'All Students & Guardians',
    content: '',
    isUrgent: false,
  });
  const [noticeError, setNoticeError] = useState<string | null>(null);
  const [noticeSuccess, setNoticeSuccess] = useState<string | null>(null);

  const loadCommunicationData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/communication?tenantId=${tenantSlug || 'demo-school'}`);
      const json = await res.json();
      if (json.success) {
        setNotices(json.data.notices || []);
        setStats(json.data.stats || { totalStudents: 0, totalGuardians: 0, totalEmployees: 0, overdueInvoicesCount: 0 });
        setSmsGateway(json.data.smsGateway || { isConfigured: false });
      }
    } catch (err) {
      console.error('Failed to load communication records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunicationData();
  }, [tenantSlug]);

  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingNotice(true);
    setNoticeError(null);
    setNoticeSuccess(null);
    try {
      const res = await fetch('/api/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PUBLISH_NOTICE',
          tenantId: tenantSlug || 'demo-school',
          ...noticeForm,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || json.error || 'Failed to publish notice');
      }

      setNoticeSuccess('Notice published successfully to the institutional board.');
      setShowNoticeModal(false);
      setNoticeForm({
        title: '',
        audience: 'All Students & Guardians',
        content: '',
        isUrgent: false,
      });
      loadCommunicationData();
    } catch (err: any) {
      setNoticeError(err.message);
    } finally {
      setIsSubmittingNotice(false);
    }
  };

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsText.trim()) return;

    setIsSendingSms(true);
    setSmsError(null);
    setSmsSuccess(null);
    try {
      const res = await fetch('/api/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_SMS',
          tenantId: tenantSlug || 'demo-school',
          target: smsTarget,
          message: smsText,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || json.error || 'Failed to dispatch SMS');
      }

      setSmsSuccess(`SMS broadcast queued successfully to ${json.data?.count || 0} recipients.`);
      setSmsText('');
    } catch (err: any) {
      setSmsError(err.message);
    } finally {
      setIsSendingSms(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Campus Communication, Notice Board & SMS Gateway
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Targeted notifications for specific classes, SMS broadcasts for overdue fees, and emergency alerts.
          </p>
        </div>

        <button
          onClick={() => setShowNoticeModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Notice</span>
        </button>
      </div>

      {noticeSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{noticeSuccess}</span>
          </div>
          <button onClick={() => setNoticeSuccess(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Notices Board */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" /> Active Institutional Notices
            </h3>
            <span className="text-xs text-slate-400 font-medium">{notices.length} notices</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              <span>Loading notices...</span>
            </div>
          ) : notices.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">No Notices Published Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  There are no published institutional announcements on this board. Use the button below to broadcast the first notice.
                </p>
              </div>
              <button
                onClick={() => setShowNoticeModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Publish First Notice</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {notices.map((n) => (
                <div
                  key={n.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        {n.audience}
                      </span>
                      {n.isUrgent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 animate-pulse">
                          URGENT
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">{n.date}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{n.title}</h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{n.content}</p>
                  {n.publishedBy && (
                    <div className="pt-2 text-[10px] text-slate-400 font-medium">
                      Published by: {n.publishedBy}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Instant SMS Broadcast Form */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              Instant SMS Broadcast Gateway
            </h3>
          </div>

          <div className={`p-3 rounded-xl border text-[11px] space-y-1 ${
            smsGateway?.isConfigured
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
              : 'bg-amber-950/40 border-amber-800 text-amber-200'
          }`}>
            <div className="font-bold flex items-center gap-1.5">
              {smsGateway?.isConfigured ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Gateway Active ({smsGateway.provider})</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>SMS Gateway Not Configured</span>
                </>
              )}
            </div>
            <p className="text-slate-400 text-[10px]">
              {smsGateway?.isConfigured
                ? `Ready to broadcast (Current quota: ${smsGateway.balance} SMS).`
                : 'Configure SMS provider credentials (Banglalink / GP / Teletalk) in Platform Settings to enable outbound SMS.'}
            </p>
          </div>

          {smsError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{smsError}</span>
            </div>
          )}

          {smsSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{smsSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSendSms} className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Recipients</label>
              <select
                value={smsTarget}
                onChange={(e) => setSmsTarget(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL_PARENTS" className="bg-slate-900 text-white">All Guardians / Parents ({stats.totalGuardians})</option>
                <option value="OVERDUE_FEES" className="bg-slate-900 text-white">Guardians with Overdue Invoices ({stats.overdueInvoicesCount})</option>
                <option value="ALL_STAFF" className="bg-slate-900 text-white">All Faculty & Staff ({stats.totalEmployees})</option>
                <option value="ALL_STUDENTS" className="bg-slate-900 text-white">All Active Students ({stats.totalStudents})</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">SMS Message (English / বাংলা)</label>
              <textarea
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                placeholder="Type SMS message here... (160 characters = 1 SMS)"
                rows={4}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={!smsText.trim() || isSendingSms}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 transition"
            >
              {isSendingSms ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching SMS...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast SMS Now</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* PUBLISH NOTICE MODAL */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-800 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" /> Publish Institutional Notice
              </h3>
              <button onClick={() => setShowNoticeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {noticeError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{noticeError}</span>
              </div>
            )}

            <form onSubmit={handlePublishNotice} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Sports Day 2026 Schedule"
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Audience / Category *</label>
                <select
                  value={noticeForm.audience}
                  onChange={(e) => setNoticeForm({ ...noticeForm, audience: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="All Students & Guardians" className="bg-slate-900 text-white">All Students & Guardians</option>
                  <option value="Guardians Only" className="bg-slate-900 text-white">Guardians Only</option>
                  <option value="Teachers & Employees" className="bg-slate-900 text-white">Teachers & Employees</option>
                  <option value="Hifz Section Only" className="bg-slate-900 text-white">Hifz Section Only</option>
                  <option value="General Public / Website" className="bg-slate-900 text-white">General Public / Website</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Notice Content *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write the full announcement text here..."
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isUrgent"
                  checked={noticeForm.isUrgent}
                  onChange={(e) => setNoticeForm({ ...noticeForm, isUrgent: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="isUrgent" className="text-slate-300 text-xs font-medium cursor-pointer">
                  Mark as Urgent Alert (High Priority Banner)
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNotice}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmittingNotice ? 'Publishing...' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

