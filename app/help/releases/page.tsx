'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PublicFooter } from '@/components/layout/public-footer';
import {
  Sparkles,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Zap,
  Wrench,
  Bug
} from 'lucide-react';

export default function ReleasesPage() {
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/help/releases')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReleases(data.data || []);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

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
                Release Notes & Changelog
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Product Evolution & Updates</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Release Notes & Platform Changelog
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto">
            Review recent feature releases, architectural improvements, and security enhancements shipped across EduERP SaaS.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono">Loading changelog...</p>
          </div>
        ) : releases.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
            <p className="text-xs text-slate-400">No release notes published yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {releases.map((rel) => {
              const newFeatures = typeof rel.newFeatures === 'string' ? JSON.parse(rel.newFeatures || '[]') : rel.newFeatures || [];
              const improvements = typeof rel.improvements === 'string' ? JSON.parse(rel.improvements || '[]') : rel.improvements || [];
              const bugFixes = typeof rel.bugFixes === 'string' ? JSON.parse(rel.bugFixes || '[]') : rel.bugFixes || [];

              return (
                <div
                  key={rel.id}
                  className="p-6 md:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs">
                          {rel.version}
                        </span>
                        <h2 className="text-lg font-bold text-white">{rel.title}</h2>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{rel.summary}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(rel.releaseDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* New Features */}
                  {newFeatures.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        <span>New Features & Capabilities</span>
                      </h4>
                      <ul className="space-y-1.5 pl-2">
                        {newFeatures.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {improvements.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Enhancements & Performance</span>
                      </h4>
                      <ul className="space-y-1.5 pl-2">
                        {improvements.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Bug Fixes */}
                  {bugFixes.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Bug className="w-3.5 h-3.5" />
                        <span>Resolved Issues</span>
                      </h4>
                      <ul className="space-y-1.5 pl-2">
                        {bugFixes.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
