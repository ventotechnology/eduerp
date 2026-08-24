'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  X,
  Search,
  BookOpen,
  Headphones,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface ContextualHelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentModule?: string;
}

export function ContextualHelpDrawer({
  isOpen,
  onClose,
  currentModule
}: ContextualHelpDrawerProps) {
  const [articles, setArticles] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const query = new URLSearchParams();
    if (currentModule) query.set('module', currentModule);
    if (search) query.set('search', search);

    fetch(`/api/help/articles?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setArticles(data.items || []);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));

    fetch(`/api/help/faq?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFaqs(data.data || []);
        }
      })
      .catch(() => null);
  }, [isOpen, currentModule, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Contextual Module Help</h3>
              <p className="text-[10px] text-slate-400">
                {currentModule ? `Documentation for ${currentModule}` : 'EduERP Quick Documentation'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search help topics..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Suggested Articles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Relevant Guides
              </span>
              <Link
                href="/help"
                target="_blank"
                className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Full Help Center</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-500 text-xs">Loading guides...</div>
            ) : articles.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                No module-specific guides found.
              </div>
            ) : (
              <div className="space-y-2">
                {articles.slice(0, 5).map((art) => (
                  <Link
                    key={art.id}
                    href={`/help/articles/${art.slug}`}
                    target="_blank"
                    className="block p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 transition group"
                  >
                    <span className="font-semibold text-xs text-white group-hover:text-emerald-300 block">
                      {art.title}
                    </span>
                    <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {art.summary}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Module FAQs */}
          {faqs.length > 0 && (
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Common Questions
              </span>
              <div className="space-y-2">
                {faqs.slice(0, 4).map((faq) => (
                  <div key={faq.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="font-semibold text-xs text-emerald-300 block">{faq.question}</span>
                    <p className="text-[11px] text-slate-400">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Support CTA */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 space-y-2">
          <Link
            href="/support/tickets/new"
            target="_blank"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition"
          >
            <Headphones className="w-4 h-4" />
            <span>Open Support Ticket</span>
          </Link>
          <div className="flex justify-center gap-4 text-[11px] text-slate-400 pt-1">
            <Link href="/training" target="_blank" className="hover:text-white">Training Academy</Link>
            <span>•</span>
            <Link href="/contact" target="_blank" className="hover:text-white">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
