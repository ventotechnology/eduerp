'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PublicFooter } from '@/components/layout/public-footer';
import {
  Headphones,
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  ShieldCheck,
  RotateCcw,
  Star,
  MessageSquare
} from 'lucide-react';

export default function CustomerTicketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const ticketNumber = (params?.ticketNumber as string) || '';

  const [ticket, setTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CSAT modal state
  const [showCsatModal, setShowCsatModal] = useState(false);
  const [csatRating, setCsatRating] = useState(5);
  const [csatComment, setCsatComment] = useState('');
  const [csatSubmitted, setCsatSubmitted] = useState(false);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketNumber}`);
      const data = await res.json();
      if (data.success && data.data) {
        setTicket(data.data);
        setMessages(data.data.messages || []);
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

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setReplying(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketNumber}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setReplyMessage('');
        await fetchTicket();
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch {
      alert('Error sending reply');
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (status: string, reason?: string) => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason })
      });
      const data = await res.json();
      if (data.success) {
        await fetchTicket();
        if (status === 'CLOSED' || status === 'RESOLVED') {
          setShowCsatModal(true);
        }
      } else {
        alert(data.error || 'Failed to update ticket status');
      }
    } catch {
      alert('Error updating status');
    }
  };

  const handleSubmitCsat = async () => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketNumber}/csat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: csatRating, comment: csatComment })
      });
      const data = await res.json();
      if (data.success) {
        setCsatSubmitted(true);
        setTimeout(() => {
          setShowCsatModal(false);
          fetchTicket();
        }, 1200);
      }
    } catch {
      alert('Failed to submit rating');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold text-white mb-2">{error || 'Ticket Not Found'}</h2>
        <p className="text-xs text-slate-400 mb-4">You may not have permission to view tickets outside your institution.</p>
        <Link href="/support/tickets" className="px-4 py-2 bg-emerald-600 rounded-xl text-xs font-bold text-white">
          Back to Support Tickets
        </Link>
      </div>
    );
  }

  const isResolved = ticket.status === 'RESOLVED';
  const isClosed = ticket.status === 'CLOSED';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/support/tickets" className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-emerald-400">
                  {ticket.ticketNumber}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {ticket.status}
                </span>
              </div>
              <h1 className="font-bold text-sm text-white truncate max-w-md">
                {ticket.subject}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {isResolved && (
              <>
                <button
                  onClick={() => handleStatusChange('CLOSED', 'Customer confirmed resolution')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Resolution & Close</span>
                </button>
                <button
                  onClick={() => handleStatusChange('REOPENED', 'Customer reopened ticket')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-200 hover:text-rose-400 border border-slate-700 transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reopen Ticket</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Conversation Container */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Ticket Header Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white">{ticket.subject}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                <span>Opened by <strong className="text-slate-200">{ticket.creatorName}</strong> ({ticket.creatorRole})</span>
                <span>•</span>
                <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                {ticket.relatedModule && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-emerald-400">Module: {ticket.relatedModule}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Priority:</span>
              <span className="font-mono font-bold text-amber-400">{ticket.priority}</span>
            </div>
          </div>

          {/* Resolution Summary Banner if Resolved */}
          {ticket.resolutionSummary && (
            <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/60 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Resolution Summary</span>
              </div>
              <p className="text-slate-300 whitespace-pre-wrap">{ticket.resolutionSummary}</p>
            </div>
          )}
        </div>

        {/* Chronological Message Thread */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Conversation Thread ({messages.length})
          </h3>

          <div className="space-y-4">
            {messages.map((msg: any) => {
              const isSupportAgent = msg.senderType === 'SUPPORT_AGENT';

              return (
                <div
                  key={msg.id}
                  className={`p-5 rounded-2xl border ${
                    isSupportAgent
                      ? 'bg-emerald-950/20 border-emerald-800/50 ml-4 md:ml-8'
                      : 'bg-slate-900 border-slate-800 mr-4 md:mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-2.5 mb-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        isSupportAgent ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {isSupportAgent ? 'S' : 'U'}
                      </div>
                      <span className="font-bold text-white">{msg.senderName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({isSupportAgent ? 'EduERP Support Lead' : msg.senderRole})
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs md:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {msg.message}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reply Box */}
        {!isClosed && (
          <form onSubmit={handleSendReply} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
            <h4 className="text-xs font-bold text-white">Reply to Support Team</h4>
            <textarea
              rows={4}
              required
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your response here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={replying || !replyMessage.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition transform active:scale-95"
              >
                {replying ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending Reply...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* CSAT Modal */}
        {showCsatModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Star className="w-6 h-6 fill-emerald-400 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">How was your support experience?</h3>
              <p className="text-xs text-slate-400">
                Please rate the assistance provided for ticket <span className="font-mono text-emerald-400 font-bold">{ticket.ticketNumber}</span>.
              </p>

              {csatSubmitted ? (
                <div className="p-4 text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Thank you for your rating!</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-center gap-2 py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCsatRating(star)}
                        className={`p-2 rounded-xl transition ${
                          csatRating >= star
                            ? 'text-amber-400'
                            : 'text-slate-600'
                        }`}
                      >
                        <Star className="w-7 h-7 fill-current" />
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    value={csatComment}
                    onChange={(e) => setCsatComment(e.target.value)}
                    placeholder="Optional comments or suggestions..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCsatModal(false)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition"
                    >
                      Skip
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitCsat}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md"
                    >
                      Submit Rating
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
