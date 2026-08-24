'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicFooter } from '@/components/layout/public-footer';
import {
  Headphones,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function CustomerTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setSessionUser(data.user);
        } else {
          router.push('/login?redirect=/support/tickets');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  useEffect(() => {
    if (!sessionUser) return;
    setLoading(true);
    const query = new URLSearchParams();
    if (statusFilter !== 'ALL') query.set('status', statusFilter);
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
  }, [sessionUser, statusFilter, search]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 font-mono font-bold text-[10px]">NEW</span>;
      case 'OPEN':
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold text-[10px]">IN PROGRESS</span>;
      case 'WAITING_FOR_CUSTOMER':
        return <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 font-mono font-bold text-[10px]">ACTION REQUIRED</span>;
      case 'CUSTOMER_REPLIED':
        return <span className="px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-400 font-mono font-bold text-[10px]">REPLIED</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px]">RESOLVED</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 font-mono font-bold text-[10px]">CLOSED</span>;
      case 'REOPENED':
        return <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 font-mono font-bold text-[10px]">REOPENED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono font-bold text-[10px]">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="text-[10px] font-bold text-rose-400 font-mono">CRITICAL</span>;
      case 'URGENT':
        return <span className="text-[10px] font-bold text-amber-400 font-mono">URGENT</span>;
      case 'HIGH':
        return <span className="text-[10px] font-bold text-orange-400 font-mono">HIGH</span>;
      default:
        return <span className="text-[10px] font-bold text-slate-400 font-mono">NORMAL</span>;
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
                Support Center
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/help" className="text-slate-300 hover:text-white transition">
              Knowledge Base
            </Link>
            <Link href="/training" className="text-slate-300 hover:text-white transition">
              Training Academy
            </Link>
            <Link
              href="/support/tickets/new"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Ticket</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Support Tickets & Inquiries
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Track and communicate directly with EduERP platform technical and implementation specialists.
            </p>
          </div>
          <Link
            href="/support/tickets/new"
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Open New Support Ticket</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket number (e.g. TKT-2026-000001), subject, or keyword..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Ticket Statuses</option>
              <option value="NEW">New / Unassigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_CUSTOMER">Action Required (Waiting on You)</option>
              <option value="CUSTOMER_REPLIED">Customer Replied</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        {/* Ticket List */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono">Loading support tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <Headphones className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No tickets found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You do not have any open support tickets at this time. If you need assistance with your institution ERP, open a new ticket below.
            </p>
            <Link
              href="/support/tickets/new"
              className="inline-block px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-md"
            >
              Create First Ticket
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/support/tickets/${ticket.ticketNumber}`}
                className="block p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition group shadow-md"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {ticket.ticketNumber}
                      </span>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                      {ticket.relatedModule && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {ticket.relatedModule}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm md:text-base font-bold text-white group-hover:text-emerald-300 transition">
                      {ticket.subject}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-1">
                      {ticket.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-slate-500 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{ticket._count?.messages || 1} msgs</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
