'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PublicFooter } from '@/components/layout/public-footer';
import {
  BookOpen,
  Search,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

function ArticlesContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedModule, setSelectedModule] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (selectedCategory) query.set('category', selectedCategory);
    if (selectedModule) query.set('module', selectedModule);
    if (search) query.set('search', search);

    fetch(`/api/help/articles?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setArticles(data.items || []);
          if (data.categories) setCategories(data.categories);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedModule, search]);

  return (
    <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Knowledge Base Articles</h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Browse through official documentation, workflows, best practices, and integration guides.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by keyword..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Knowledge Domains</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Institutional Modules</option>
            <option value="LOGIN">Authentication & Login</option>
            <option value="ADMISSION">Online Admission & Intake</option>
            <option value="SIS">Student Information System (SIS)</option>
            <option value="ACADEMICS">Academics & Timetable</option>
            <option value="ATTENDANCE">Biometric Attendance</option>
            <option value="EXAM">Examination & Results</option>
            <option value="LMS">LMS & Digital Homework</option>
            <option value="FINANCE">Fees & Accounting</option>
            <option value="HR">HR & Staff Payroll</option>
            <option value="HIFZ">Madrasha & Hifz Engine</option>
            <option value="UNIVERSITY">University & Research</option>
          </select>
        </div>
      </div>

      {/* Articles List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-mono">Loading documentation...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No articles matched your filter criteria</h3>
          <p className="text-xs text-slate-400">Try clearing filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map((art) => (
            <Link
              key={art.id}
              href={`/help/articles/${art.slug}`}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition flex flex-col justify-between group shadow-md"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">
                    {art.category?.name || 'General'}
                  </span>
                  {art.relatedModule && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                      {art.relatedModule}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                  {art.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {art.summary}
                </p>
              </div>
              <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>{art.viewCount} views</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition">
                  Read Article <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

export default function ArticlesDirectoryPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
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
                Articles & Guides
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/help" className="text-slate-400 hover:text-white transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Help Center</span>
            </Link>
          </div>
        </div>
      </header>

      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading...</div>}>
        <ArticlesContent />
      </Suspense>

      <PublicFooter />
    </div>
  );
}
