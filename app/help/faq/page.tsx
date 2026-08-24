'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PublicFooter } from '@/components/layout/public-footer';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  Headphones,
  CheckCircle2
} from 'lucide-react';

export default function FaqPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [votedIds, setVotedIds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/help/faq?search=${encodeURIComponent(search)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFaqs(data.data || []);
          if (data.data && data.data.length > 0 && !openFaqId) {
            setOpenFaqId(data.data[0].id);
          }
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [search]);

  const handleVote = async (id: string, helpful: boolean) => {
    if (votedIds[id] !== undefined) return;
    try {
      await fetch('/api/help/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, helpful })
      });
      setVotedIds((prev) => ({ ...prev, [id]: helpful }));
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/help" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
              E
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white">
                EduERP
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase -mt-1">
                Frequently Asked Questions
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/help" className="text-slate-400 hover:text-white transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Help Center</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto">
            Quick answers to common questions regarding authentication, permissions, fee collection, examinations, and data isolation.
          </p>

          {/* Search bar */}
          <div className="relative max-w-lg mx-auto pt-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 shadow-md focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono">Loading FAQs...</p>
          </div>
        ) : faqs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">No FAQ items matched &quot;{search}&quot;</h3>
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              const hasVoted = votedIds[faq.id] !== undefined;

              return (
                <div
                  key={faq.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full p-4 md:p-5 flex items-center justify-between text-left gap-4 hover:bg-slate-800/50 transition"
                  >
                    <span className="text-sm font-bold text-white">{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 space-y-4">
                      <p className="whitespace-pre-wrap">{faq.answer}</p>

                      {/* Vote helpful */}
                      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Was this helpful?</span>
                        {hasVoted ? (
                          <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Feedback recorded</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleVote(faq.id, true)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 transition"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => handleVote(faq.id, false)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition"
                            >
                              No
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Support Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-800/50 text-center space-y-3">
          <Headphones className="w-6 h-6 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Can&apos;t find what you&apos;re looking for?</h3>
          <p className="text-xs text-slate-400">
            Submit a ticket to our dedicated educational support team.
          </p>
          <Link
            href="/support/tickets/new"
            className="inline-block px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-md"
          >
            Create Support Ticket
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
