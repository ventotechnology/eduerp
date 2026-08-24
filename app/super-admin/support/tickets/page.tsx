'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Ticket,
  Search,
  Filter,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function SuperAdminTicketsQueuePage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (statusFilter !== 'ALL') query.set('status', statusFilter);
    if (priorityFilter !== 'ALL') query.set('priority', priorityFilter);
    if (search) query.set('search', search);

    fetch(`/api/support/tickets?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTickets(data.items || []);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [statusFilter, priorityFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/support"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Cross-Tenant Ticket Queue
            </h1>
            <p className="text-xs text-slate-400">
              Manage and resolve all customer and institution inquiries.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ticket #, subject, or submitter email..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
            <option value="CUSTOMER_REPLIED">Customer Replied</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-mono">Loading queues...</div>
        ) : tickets.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">No tickets match current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-3 font-semibold">Ticket #</th>
                  <th className="pb-3 font-semibold">Tenant</th>
                  <th className="pb-3 font-semibold">Submitter</th>
                  <th className="pb-3 font-semibold">Subject</th>
                  <th className="pb-3 font-semibold">Priority</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Assigned</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-mono font-bold text-emerald-400">
                      {t.ticketNumber}
                    </td>
                    <td className="py-3 font-mono text-slate-300">
                      {t.tenantId}
                    </td>
                    <td className="py-3 text-slate-300">
                      <span className="font-semibold block">{t.creatorName}</span>
                      <span className="text-[10px] text-slate-500">{t.creatorEmail}</span>
                    </td>
                    <td className="py-3 font-semibold text-white truncate max-w-xs">
                      {t.subject}
                    </td>
                    <td className="py-3 font-mono font-bold">
                      <span className={
                        t.priority === 'CRITICAL' ? 'text-rose-400' : t.priority === 'URGENT' ? 'text-amber-400' : 'text-slate-300'
                      }>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 text-[11px]">
                      {t.assignedAgentName || <span className="text-amber-400 italic">Unassigned</span>}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/super-admin/support/tickets/${t.ticketNumber}`}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition text-[11px]"
                      >
                        Manage
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
