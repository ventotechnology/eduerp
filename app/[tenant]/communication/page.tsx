'use client';

import React, { useState } from 'react';
import { useTenant } from '@/lib/tenant-context';
import {
  Radio,
  Bell,
  Mail,
  MessageSquare,
  AlertTriangle,
  Send,
  CheckCircle2,
  Users,
  Plus
} from 'lucide-react';

export default function CommunicationPage() {
  const { branding } = useTenant();

  const [notices, setNotices] = useState([
    {
      id: 'NOT-01',
      title: 'Midterm Examination 2026 Routine Published',
      audience: 'All Students & Guardians',
      date: '2026-08-22',
      isUrgent: false,
      content: 'The finalized timetable for the Midterm Examination 2026 is published on the portal. Admit cards are available for download.'
    },
    {
      id: 'NOT-02',
      title: 'Teacher-Parent Consultation Meeting (Grades 6-10)',
      audience: 'Guardians',
      date: '2026-08-20',
      isUrgent: false,
      content: 'We request all parents and guardians to attend the consultative progress meeting on Saturday at 10:00 AM in the main auditorium.'
    }
  ]);

  const [smsText, setSmsText] = useState('');
  const [smsTarget, setSmsTarget] = useState('ALL_PARENTS');
  const [smsSent, setSmsSent] = useState(false);

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsText.trim()) return;
    setSmsSent(true);
    setTimeout(() => {
      setSmsSent(false);
      setSmsText('');
      alert('SMS Broadcast queued and dispatched to 1,850 phone numbers!');
    }, 1000);
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
            Targeted notifications for specific classes, SMS broadcasts for overdue fees, and emergency parent alerts.
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition shrink-0">
          <Plus className="w-4 h-4" />
          <span>Publish New Notice</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Notices Board */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white">
            Active Institutional Notices
          </h3>
          <div className="space-y-3">
            {notices.map((n) => (
              <div
                key={n.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {n.audience}
                  </span>
                  <span className="text-slate-400">{n.date}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{n.title}</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{n.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Instant SMS Broadcast Form */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              Instant SMS Broadcast Gateway
            </h3>
          </div>
          <p className="text-slate-500 text-[11px]">
            Connected to Bangladesh National SMS Gateway Provider (Balance: 14,200 SMS).
          </p>

          <form onSubmit={handleSendSms} className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Recipients</label>
              <select
                value={smsTarget}
                onChange={(e) => setSmsTarget(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="ALL_PARENTS">All Guardians / Parents (1,850)</option>
                <option value="OVERDUE_FEES">Guardians with Overdue Fees (82)</option>
                <option value="ABSENT_TODAY">Parents of Students Absent Today (99)</option>
                <option value="ALL_STAFF">All Teachers & Employees (78)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">SMS Message (English / বাংলা)</label>
              <textarea
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                placeholder="Type SMS message here... (160 characters = 1 SMS)"
                rows={4}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={!smsText.trim() || smsSent}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{smsSent ? 'Dispatching SMS...' : 'Broadcast SMS Now'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
