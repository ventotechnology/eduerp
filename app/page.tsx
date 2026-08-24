'use client';

import React from 'react';
import Link from 'next/link';
import { PublicFooter } from '@/components/layout/public-footer';
import {
  GraduationCap,
  Sparkles,
  Shield,
  Building2,
  BookCheck,
  Microscope,
  CheckCircle2,
  ArrowRight,
  QrCode,
  DollarSign,
  Users,
  Award,
  Layers,
  Bot,
  Zap,
  Globe,
  Compass,
  ExternalLink
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
              E
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                EduERP
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase -mt-1">
                Institutional OS
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link
              href="/pricing"
              className="text-slate-300 hover:text-emerald-400 transition"
            >
              Pricing & Plans
            </Link>
            <Link
              href="/demo"
              className="text-slate-300 hover:text-emerald-400 transition hidden sm:inline-block"
            >
              Demo Showroom
            </Link>
            <Link
              href="/results"
              className="text-slate-300 hover:text-white transition hidden md:inline-block"
            >
              Public Results
            </Link>
            <Link
              href="/login"
              className="text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition font-bold shadow-md shadow-emerald-500/20"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 px-6 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>EduERP: Next-Gen SaaS Platform with PostgreSQL 16 & Multi-Tenant Partitioning</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            The Complete Operating System for <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Schools, Colleges, Madrasahs & Universities</span>
          </h1>

          <p className="mt-6 text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Eliminate fragmented software. EduERP dynamically configures academic structures, terminology, 
            shifts, grading scales, fee rules, LMS, and regulatory reports to match your exact institution type.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition flex items-center gap-2"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm border border-slate-800 transition flex items-center gap-2"
            >
              <span>Explore 8 Vertical Demos</span>
              <ExternalLink className="w-4 h-4 text-emerald-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* 8 Institutional Verticals Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Configurable Vertical Architecture
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-2 max-w-2xl mx-auto">
            One robust database engine dynamically optimized for 8 distinct educational institution models.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/demo-school/dashboard"
            target="_blank"
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition group space-y-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              SC
            </div>
            <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition">K-12 School Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Classes 1-10, daily period attendance, SMS notifications, and term exam grade sheets.
            </p>
          </Link>

          <Link
            href="/demo-college/dashboard"
            target="_blank"
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition group space-y-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              CL
            </div>
            <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition">HSC College Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Classes 11-12, Science/Arts/Commerce group selection, 4th subject, and BISE board exports.
            </p>
          </Link>

          <Link
            href="/demo-madrasha/dashboard"
            target="_blank"
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 transition group space-y-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
              MD
            </div>
            <h3 className="font-bold text-white text-sm group-hover:text-teal-400 transition">Madrasha & 30-Para Hifz</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dakhil, Alim, Kamil plus 30-Para Sabak, Sabki, Dour tracking and Waqf accounting.
            </p>
          </Link>

          <Link
            href="/demo-university/dashboard"
            target="_blank"
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition group space-y-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              UN
            </div>
            <h3 className="font-bold text-white text-sm group-hover:text-purple-400 transition">University Open Credit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Semester credit hours, prerequisites, faculty workloads, thesis defense, and CGPA calculations.
            </p>
          </Link>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
          >
            <span>View All 8 Institutional Verticals in Demo Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 105 Modules Grid */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-800">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            105 Native Modules Built into One Core
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-2 max-w-2xl mx-auto">
            From online admission to graduation and alumni, all synchronized with double-entry accounting, smart biometrics, LMS and AI analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center mb-3">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Online Admission & Test Engine</h3>
            <p className="text-slate-400 leading-relaxed">
              Paperless application workflow, online application fee collection, timed MCQ/written admission tests, automatic scoring, and merit list generation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Fees, bKash & Double-Entry Ledger</h3>
            <p className="text-slate-400 leading-relaxed">
              Automated monthly tuition invoicing, sibling discounts, Bangladesh gateway checkouts (bKash, Nagad, Rocket, Cards) & full Double-Entry Accounting.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm">Exams, GPA/CGPA & QR Verification</h3>
            <p className="text-slate-400 leading-relaxed">
              Configurable theory/practical/assignment marks, automated GPA/CGPA calculation, and branded PDF report cards with tamper-proof QR codes.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
