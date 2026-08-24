'use client';

import React from 'react';
import Link from 'next/link';
import { useTenant } from '@/lib/tenant-context';
import { PRESET_DEMO_TENANTS } from '@/lib/constants';
import {
  GraduationCap,
  Lock,
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
  Compass
} from 'lucide-react';

export default function HomePage() {
  const { switchTenant } = useTenant();

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-6 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))] pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-800 text-blue-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>EduERP: The Universal Education Operating System</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            One ERP Core for <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">Schools, Colleges, Madrasahs & Universities</span>
          </h1>

          <p className="mt-6 text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Eliminate fragmented software. EduERP dynamically configures academic structures, terminology, 
            shifts, grading scales, fee rules, and regulatory reports to match your exact institution type.
          </p>

          {/* Quick Launch Vertical Cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {PRESET_DEMO_TENANTS.map((tenant) => {
              const icons = {
                SCHOOL: Building2,
                COLLEGE: GraduationCap,
                MADRASHA: BookCheck,
                UNIVERSITY: Microscope,
                POLYTECHNIC: Layers,
                SCHOOL_AND_COLLEGE: Building2,
                TECHNICAL_INSTITUTE: Layers,
                TRAINING_INSTITUTE: Layers,
                OTHER: Building2
              };
              const Icon = icons[tenant.type] || Building2;

              return (
                <div
                  key={tenant.slug}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:shadow-2xl transition group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                        style={{ backgroundColor: tenant.primaryColor }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                        {tenant.type}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition leading-snug">
                      {tenant.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3">
                      {tenant.description}
                    </p>
                  </div>

                  <Link
                    href={`/${tenant.shortName.toLowerCase()}/dashboard`}
                    onClick={() => switchTenant(tenant.slug)}
                    className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition shadow-md group-hover:brightness-110"
                    style={{ backgroundColor: tenant.primaryColor }}
                  >
                    <span>Launch {tenant.type} Demo</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Quick SaaS Control Strip */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
            <Link
              href="/login"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 border border-blue-500 text-white font-bold hover:bg-blue-500 transition shadow-md shadow-blue-600/30"
            >
              <Lock className="w-4 h-4 text-blue-200" />
              <span>Official Portal Sign In</span>
            </Link>

            <Link
              href="/super-admin"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-900/40 border border-purple-700 text-purple-200 hover:bg-purple-900/60 transition shadow-sm"
            >
              <Shield className="w-4 h-4 text-purple-400" />
              <span>SaaS Super Admin Platform Dashboard</span>
            </Link>

            <Link
              href="/verify/VRF-DIMS-9041-A1"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 hover:bg-emerald-900/60 transition shadow-sm"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Public Certificate & Transcript Verification Portal</span>
            </Link>

            <Link
              href="/results"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition shadow-sm"
            >
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Public Student Result Search Portal</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 12 Core Pillars Section */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Comprehensive 105-Module Education Operating System
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-2xl mx-auto">
            From online admission to graduation and alumni, all synchronized with double-entry accounting, smart biometrics, LMS and AI analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center mb-4">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Online Admission & Test Engine</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Paperless application workflow, online application fee collection, timed MCQ/written admission tests, automatic scoring, and merit list generation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center mb-4">
              <BookCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Madrasha & 30-Para Hifz Engine</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Specialized tracking for Ebtedayee, Dakhil, Alim, Kamil plus full 30-Para daily Sabak, Sabki, Dour, Surah, Ayat, and Ustad evaluation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center mb-4">
              <Microscope className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">University & Higher Ed Engine</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Faculties, Departments, Semester Credit Hour system, Course Add/Drop, Retakes, Credit-weighted CGPA, Thesis defense, and Research grants.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center mb-4">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Exams, GPA/CGPA & QR Verification</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Configurable theory/practical/assignment marks, automated GPA/CGPA calculation, and branded PDF report cards with tamper-proof QR codes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center mb-4">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Fees, bKash/Nagad & Accounts</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Dynamic fee rules, sibling discounts, Bangladesh gateway checkouts (bKash, Nagad, Rocket, Cards) & full Double-Entry General Ledger.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-pink-950 text-pink-400 flex items-center justify-center mb-4">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">AI Copilot & Predictive Analytics</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              RBAC-aware natural language assistant for Principals/VCs and predictive machine learning models flagging student dropout and fee default risks.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-6 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>© 2026 EduERP OS. All rights reserved. Designed for Schools, Colleges, Madrasahs & Universities.</p>
      </footer>
    </div>
  );
}
