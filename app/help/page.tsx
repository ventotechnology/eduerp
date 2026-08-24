'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PublicFooter } from '@/components/layout/public-footer';
import {
  Search,
  BookOpen,
  Rocket,
  Users,
  DollarSign,
  Award,
  Briefcase,
  HelpCircle,
  Headphones,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Compass,
  FileText
} from 'lucide-react';

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ articles: any[]; faqs: any[] } | null>(null);
  const [searching, setSearching] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/help/articles?featured=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.categories || []);
          setFeaturedArticles(data.items || []);
        }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/help/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults({ articles: data.articles || [], faqs: data.faqs || [] });
        }
      } catch {
        setSearchResults(null);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const categoryIcons: Record<string, React.ElementType> = {
    'getting-started': Rocket,
    'student-sis': Users,
    'finance-fees': DollarSign,
    'examinations-marks': Award,
    'academic-lms': BookOpen,
    'hr-payroll': Briefcase
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
                Help & Knowledge Base
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/help/getting-started" className="text-slate-300 hover:text-white transition">
              Getting Started
            </Link>
            <Link href="/help/faq" className="text-slate-300 hover:text-white transition">
              FAQ
            </Link>
            <Link href="/training" className="text-slate-300 hover:text-white transition">
              Training Academy
            </Link>
            <Link href="/support/tickets" className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5" />
              <span>Support Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Search Section */}
      <div className="relative py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EduERP Documentation & Knowledge Base</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            How can we help your institution today?
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto">
            Search our comprehensive library of administrator guides, teacher tutorials, admission workflows, and fee billing references.
          </p>

          {/* Search Box */}
          <div className="relative max-w-2xl mx-auto pt-4">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics: e.g. login, admissions, fees invoice, grading, biometric attendance..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 shadow-xl focus:outline-none"
              />
              {searching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Live Search Dropdown */}
            {searchResults && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 text-left overflow-hidden divide-y divide-slate-800 max-h-96 overflow-y-auto">
                {searchResults.articles.length === 0 && searchResults.faqs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No documentation matched &quot;{searchQuery}&quot;. Try different keywords or{' '}
                    <Link href="/support/tickets/new" className="text-emerald-400 underline">
                      submit a support ticket
                    </Link>.
                  </div>
                ) : (
                  <>
                    {searchResults.articles.length > 0 && (
                      <div className="p-3">
                        <span className="text-[10px] uppercase font-bold text-slate-500 px-2 block mb-1">
                          Knowledge Base Articles
                        </span>
                        {searchResults.articles.map((art) => (
                          <Link
                            key={art.id}
                            href={`/help/articles/${art.slug}`}
                            className="block p-2 rounded-xl hover:bg-slate-800 transition"
                          >
                            <span className="font-semibold text-xs text-white block">{art.title}</span>
                            <span className="text-[11px] text-slate-400 block line-clamp-1">{art.summary}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    {searchResults.faqs.length > 0 && (
                      <div className="p-3">
                        <span className="text-[10px] uppercase font-bold text-slate-500 px-2 block mb-1">
                          Frequently Asked Questions
                        </span>
                        {searchResults.faqs.map((faq) => (
                          <Link
                            key={faq.id}
                            href="/help/faq"
                            className="block p-2 rounded-xl hover:bg-slate-800 transition"
                          >
                            <span className="font-semibold text-xs text-emerald-300 block">{faq.question}</span>
                            <span className="text-[11px] text-slate-400 block line-clamp-1">{faq.answer}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Categories Grid */}
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        {/* Knowledge Categories */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Browse by Knowledge Domain</h2>
              <p className="text-xs text-slate-400">Explore comprehensive documentation tailored for your department</p>
            </div>
            <Link href="/help/articles" className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1">
              <span>View All Articles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const Icon = categoryIcons[cat.slug] || BookOpen;
              const articleCount = cat._count?.articles ?? 0;
              return (
                <Link
                  key={cat.id}
                  href={`/help/articles?category=${cat.slug}`}
                  className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition duration-200 group flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                    <span>{articleCount} {articleCount === 1 ? 'Article' : 'Articles'}</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition">
                      Explore Guides <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Featured Guides & Quick Pathways */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Featured Articles */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Recommended Administrator & Teacher Guides</span>
            </h2>
            <div className="space-y-3">
              {featuredArticles.map((art) => (
                <Link
                  key={art.id}
                  href={`/help/articles/${art.slug}`}
                  className="block p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">
                        {art.category?.name || 'General'}
                      </span>
                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                        {art.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {art.summary}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Support & Onboarding Column */}
          <div className="space-y-6">
            {/* Getting Started Pathways Box */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Compass className="w-4 h-4" />
                <span>Role-Based Onboarding</span>
              </div>
              <h3 className="text-base font-bold text-white">
                New to EduERP? Start with guided pathways.
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Step-by-step checklists tailored for Principals, Admission Officers, Teachers, and Accountants.
              </p>
              <Link
                href="/help/getting-started"
                className="block text-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition"
              >
                View Getting Started Pathways
              </Link>
            </div>

            {/* Need Direct Help? */}
            <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Headphones className="w-4 h-4" />
                <span>Two-Way Support Desk</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Need direct technical assistance?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Open a support ticket to communicate directly with our engineers, implementation leads, and billing specialists.
              </p>
              <Link
                href="/support/tickets/new"
                className="block text-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition"
              >
                Open a Support Ticket
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
