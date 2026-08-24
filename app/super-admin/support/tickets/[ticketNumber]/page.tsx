'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  Lock,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  ShieldCheck,
  Building2,
  Sparkles,
  Tag
} from 'lucide-react';

export default function SuperAdminTicketConsolePage() {
  const params = useParams();
  const router = useRouter();
  const ticketNumber = (params?.ticketNumber as string) || '';

  const [ticket, setTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC_REPLY' | 'INTERNAL_NOTE'>('PUBLIC_REPLY');
  const [status, setStatus] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [assignAgentName, setAssignAgentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketNumber}`);
      const data = await res.json();
      if (data.success && data.data) {
        setTicket(data.data);
        setMessages(data.data.messages || []);
        setStatus(data.data.status);
        setResolutionSummary(data.data.resolutionSummary || '');
        setAssignAgentName(data.data.assignedAgentName || '');
      } else {
        setError(data.error || 'Failed to load ticket.');
      }
    } catch {
      setError('Network connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketNumber) {
      fetchTicket();
    }
  }, [ticketNumber]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketNumber}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage.trim(), visibility })
      });
      const data = await res.json();
      if (data.success) {
        setReplyMessage('');
        await fetchTicket();
      } else {
        alert(data.error || 'Failed to dispatch message');
      }
    } catch {
      alert('Error sending message');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (newStatus === 'RESOLVED' && !resolutionSummary.trim()) {
      alert('Please provide a resolution summary before resolving the ticket.');
      return;
    }

    try {
      const res = await fetch(`/api/support/tickets/${ticketNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          resolutionSummary: newStatus === 'RESOLVED' ? resolutionSummary.trim() : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchTicket();
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch {
      alert('Error updating status');
    }
  };

  const handleAssignAgent = async () => {
    if (!assignAgentName.trim()) return;
    try {
      const res = await fetch(`/api/support/tickets/${ticketNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ASSIGN',
          agentName: assignAgentName.trim(),
          agentEmail: 'teamhimu@gmail.com'
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchTicket();
        alert('Ticket successfully assigned.');
      }
    } catch {
      alert('Failed to assign agent');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs font-mono">Loading ticket console...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h2 className="text-lg font-bold text-white">{error || 'Ticket Not Found'}</h2>
        <Link href="/super-admin/support/tickets" className="px-4 py-2 bg-emerald-600 rounded-xl text-xs font-bold text-white">
          Back to Ticket Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/support/tickets"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {ticket.ticketNumber}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {ticket.tenantId}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {ticket.status}
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-white truncate max-w-xl mt-1">
              {ticket.subject}
            </h1>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
            <button
              onClick={() => handleUpdateStatus('RESOLVED')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
            >
              Resolve Ticket
            </button>
          )}
          {ticket.status === 'RESOLVED' && (
            <button
              onClick={() => handleUpdateStatus('CLOSED')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition"
            >
              Close Ticket
            </button>
          )}
          {(ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && (
            <button
              onClick={() => handleUpdateStatus('REOPENED')}
              className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-400 font-bold text-xs transition"
            >
              Reopen
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Messages Thread & Reply Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* Ticket Description */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span>Opened by <strong className="text-white">{ticket.creatorName}</strong> ({ticket.creatorEmail})</span>
              <span>{new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-xs md:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {/* Chronological Messages */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Message History ({messages.length})
            </h3>

            <div className="space-y-3">
              {messages.map((msg: any) => {
                const isInternal = msg.visibility === 'INTERNAL_NOTE';
                const isSupport = msg.senderType === 'SUPPORT_AGENT';

                return (
                  <div
                    key={msg.id}
                    className={`p-5 rounded-2xl border ${
                      isInternal
                        ? 'bg-amber-950/25 border-amber-800/60'
                        : isSupport
                        ? 'bg-emerald-950/20 border-emerald-800/50'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-2 mb-2 text-xs">
                      <div className="flex items-center gap-2">
                        {isInternal ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold text-[10px] flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>INTERNAL NOTE (Hidden from Customer)</span>
                          </span>
                        ) : (
                          <span className="font-bold text-white">{msg.senderName}</span>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({msg.senderType})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Support Reply Box with Toggle */}
          <form onSubmit={handleSendMessage} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Compose Message
              </h4>
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setVisibility('PUBLIC_REPLY')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    visibility === 'PUBLIC_REPLY'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Public Customer Reply
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('INTERNAL_NOTE')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    visibility === 'INTERNAL_NOTE'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>Internal Staff Note</span>
                </button>
              </div>
            </div>

            {visibility === 'INTERNAL_NOTE' && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>This note will only be visible to Platform Support Staff. The customer will NOT see it.</span>
              </div>
            )}

            <textarea
              rows={4}
              required
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder={visibility === 'INTERNAL_NOTE' ? 'Enter private internal investigation note...' : 'Type response to customer...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !replyMessage.trim()}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition disabled:opacity-50 ${
                  visibility === 'INTERNAL_NOTE'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{visibility === 'INTERNAL_NOTE' ? 'Post Internal Note' : 'Send Public Reply'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Ticket Metadata & Resolution Summary */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Metadata Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">Ticket Properties</h3>

            <div className="space-y-2.5 divide-y divide-slate-800/80">
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Tenant:</span>
                <span className="font-mono text-emerald-400 font-bold">{ticket.tenantId}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-200">{ticket.categoryCode}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Priority:</span>
                <span className="font-mono font-bold text-amber-400">{ticket.priority}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Module:</span>
                <span className="font-mono text-slate-200">{ticket.relatedModule || 'N/A'}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Assigned Lead:</span>
                <span className="font-semibold text-slate-200">{ticket.assignedAgentName || 'Unassigned'}</span>
              </div>
            </div>

            {/* Reassign Agent */}
            <div className="pt-2 space-y-2 border-t border-slate-800">
              <label className="block text-[10px] font-bold uppercase text-slate-400">
                Assign Support Agent
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={assignAgentName}
                  onChange={(e) => setAssignAgentName(e.target.value)}
                  placeholder="Agent Name"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAssignAgent}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>

          {/* Resolution Summary Box */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">Resolution Details</h3>
            <textarea
              rows={3}
              value={resolutionSummary}
              onChange={(e) => setResolutionSummary(e.target.value)}
              placeholder="Enter comprehensive root cause & resolution summary..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
            />
            {ticket.status !== 'RESOLVED' && (
              <button
                type="button"
                onClick={() => handleUpdateStatus('RESOLVED')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Mark Ticket Resolved
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
