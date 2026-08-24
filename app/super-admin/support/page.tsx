'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Headphones,
  Inbox,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Star,
  Users,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Ticket,
  Plus
} from 'lucide-react';

export default function SuperAdminSupportOverviewPage() {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/super-admin/support').then((r) => r.json()),
      fetch('/api/support/tickets?limit=8').then((r) => r.json())
    ])
      .then(([aData, tData]) => {
        if (aData.success) setAnalytics(aData.data);
        if (tData.success) setRecentTickets(tData.items || []);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Client Success & Support Desk
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global cross-tenant support queues, SLA resolution monitoring, and two-way customer communication.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/sla"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition"
          >
            SLA Policies
          </Link>
          <Link
            href="/super-admin/support/tickets"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
          >
            <Ticket className="w-4 h-4" />
            <span>Open Ticket Queue</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Tickets</span>
          <div className="text-2xl font-black text-white">{analytics?.totalTickets ?? 0}</div>
          <span className="text-[10px] text-slate-500">All recorded</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-blue-400">Active / Open</span>
          <div className="text-2xl font-black text-blue-400">{analytics?.openTickets ?? 0}</div>
          <span className="text-[10px] text-slate-500">Requiring attention</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-amber-400">Unassigned</span>
          <div className="text-2xl font-black text-amber-400">{analytics?.unassignedTickets ?? 0}</div>
          <span className="text-[10px] text-slate-500">Needs agent routing</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-rose-400">Urgent / Critical</span>
          <div className="text-2xl font-black text-rose-400">{analytics?.urgentTickets ?? 0}</div>
          <span className="text-[10px] text-slate-500">SLA priority tier</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-400">Avg CSAT Rating</span>
          <div className="text-2xl font-black text-emerald-400 flex items-center gap-1">
            <span>{analytics?.averageCsat ?? '5.0'}</span>
            <Star className="w-4 h-4 fill-emerald-400" />
          </div>
          <span className="text-[10px] text-slate-500">{analytics?.totalCsatResponses ?? 0} total ratings</span>
        </div>
      </div>

      {/* Recent Queue Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Live Cross-Tenant Support Tickets
          </h2>
          <Link
            href="/super-admin/support/tickets"
            className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>View Complete Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-mono">Loading queues...</div>
        ) : recentTickets.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">No tickets currently in queue.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-3 font-semibold">Ticket #</th>
                  <th className="pb-3 font-semibold">Tenant</th>
                  <th className="pb-3 font-semibold">Subject</th>
                  <th className="pb-3 font-semibold">Priority</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Created</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-mono font-bold text-emerald-400">
                      {t.ticketNumber}
                    </td>
                    <td className="py-3 font-mono text-slate-300">
                      {t.tenantId}
                    </td>
                    <td className="py-3 font-semibold text-white truncate max-w-xs">
                      {t.subject}
                    </td>
                    <td className="py-3">
                      <span className={`text-[10px] font-bold font-mono ${
                        t.priority === 'CRITICAL' ? 'text-rose-400' : t.priority === 'URGENT' ? 'text-amber-400' : 'text-slate-300'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 text-[11px]">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/super-admin/support/tickets/${t.ticketNumber}`}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 font-semibold transition text-[11px]"
                      >
                        Resolve
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
