'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PublicFooter } from '@/components/layout/public-footer';
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Calendar,
  Eye,
  BookOpen,
  ChevronRight,
  Headphones,
  Sparkles,
  Share2
} from 'lucide-react';

export default function ArticleViewPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';

  const [article, setArticle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voted, setVoted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/help/articles/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setArticle(data.data);
        } else {
          setError(data.error || 'Article not found');
        }
      })
      .catch(() => setError('Failed to load article'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleVote = async (helpful: boolean) => {
    if (voted !== null) return;
    try {
      await fetch(`/api/help/articles/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful })
      });
      setVoted(helpful);
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
                Knowledge Base
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/help/articles" className="text-slate-400 hover:text-white transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Articles</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {loading ? (
          <div className="py-24 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono">Loading documentation...</p>
          </div>
        ) : error || !article ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-xl font-bold text-white">{error || 'Article Not Found'}</h2>
            <p className="text-xs text-slate-400">The requested guide may have moved or been updated.</p>
            <Link href="/help" className="inline-block px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition">
              Return to Help Center
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Article Content */}
            <article className="lg:col-span-8 space-y-6">
              {/* Breadcrumb & Metadata */}
              <div className="space-y-3 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Link href="/help" className="hover:text-emerald-400">Help</Link>
                  <span>/</span>
                  <Link href={`/help/articles?category=${article.category?.slug}`} className="hover:text-emerald-400">
                    {article.category?.name || 'Guides'}
                  </Link>
                  <span>/</span>
                  <span className="text-slate-200 truncate">{article.title}</span>
                </div>

                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                  {article.title}
                </h1>

                <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
                  {article.summary}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Updated {new Date(article.updatedAt || article.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>{article.viewCount} views</span>
                  </div>
                  {article.relatedModule && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono font-semibold">
                      Module: {article.relatedModule}
                    </span>
                  )}
                </div>
              </div>

              {/* Article Body */}
              <div className="prose prose-invert prose-emerald max-w-none text-xs md:text-sm leading-relaxed space-y-4 text-slate-300 whitespace-pre-wrap">
                {article.body}
              </div>

              {/* Helpful Voting Widget */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3 mt-8">
                <h4 className="text-xs font-bold text-white">Was this article helpful?</h4>
                {voted !== null ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Thank you for your feedback!</span>
                  </div>
                ) : (
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => handleVote(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-emerald-600/20 hover:border-emerald-500/40 border border-slate-700 text-xs font-bold text-slate-200 hover:text-emerald-400 transition"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Yes ({article.helpfulCount})</span>
                    </button>
                    <button
                      onClick={() => handleVote(false)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-600/20 hover:border-rose-500/40 border border-slate-700 text-xs font-bold text-slate-200 hover:text-rose-400 transition"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>No</span>
                    </button>
                  </div>
                )}
              </div>
            </article>

            {/* Right Sidebar: Related Articles & Support CTA */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Related Articles */}
              {article.relatedArticles && article.relatedArticles.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Related Articles
                  </h3>
                  <div className="space-y-2">
                    {article.relatedArticles.map((rel: any) => (
                      <Link
                        key={rel.id}
                        href={`/help/articles/${rel.slug}`}
                        className="block p-2.5 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 transition"
                      >
                        <span className="font-semibold text-xs text-white block">{rel.title}</span>
                        <span className="text-[11px] text-slate-400 block line-clamp-1 mt-0.5">{rel.summary}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Still have questions? */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-3 text-center">
                <Headphones className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Still have questions?</h4>
                <p className="text-xs text-slate-400">
                  Our educational technical team is available on the support portal.
                </p>
                <Link
                  href="/support/tickets/new"
                  className="block w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-md shadow-emerald-600/20"
                >
                  Open Support Ticket
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
