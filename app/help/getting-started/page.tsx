'use client';

import React from 'react';
import Link from 'next/link';
import { PublicFooter } from '@/components/layout/public-footer';
import {
  Compass,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Users,
  DollarSign,
  Award,
  BookOpen,
  Briefcase,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

const PATHWAYS = [
  {
    role: 'Institution Principal & Executive Leadership',
    icon: ShieldCheck,
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
    description: 'Master administrative oversight, academic term configuration, teacher workloads, and regulatory compliance.',
    steps: [
      'Authenticate with your assigned institutional domain or slug (e.g. /dims/dashboard).',
      'Verify Academic Session, Class Shifts (Morning/Day), and Section capacities.',
      'Approve staff profiles and assign class teacher privileges.',
      'Monitor live daily biometric attendance and fee collection summaries.'
    ],
    courseLink: '/training/courses/institution-administrator-essentials'
  },
  {
    role: 'Admission & Intake Officers',
    icon: Users,
    color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400',
    description: 'Manage public admissions, application screening, candidate shortlisting, and automated SIS enrollment.',
    steps: [
      'Publish and share your public admission portal link (/apply/[tenant-slug]).',
      'Review submitted applicant biodata, certificates, and previous school records.',
      'Transition applications from APPLIED to SHORTLISTED to ADMITTED.',
      'Generate permanent Student IDs and disburse initial admission fee invoices.'
    ],
    courseLink: '/training/courses/admission-officer-training'
  },
  {
    role: 'Classroom Teachers & Faculty',
    icon: BookOpen,
    color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
    description: 'Execute daily classroom routines: attendance taking, digital homework assignments, and marks submission.',
    steps: [
      'Access your assigned class roster and mark period attendance.',
      'Create interactive LMS lesson spaces and upload digital reading materials.',
      'Enter term examination marks (Written, MCQ, Practical) with boundary checks.',
      'Communicate with guardians regarding student performance notes.'
    ],
    courseLink: '/training/courses/teacher-classroom-training'
  },
  {
    role: 'Accounts & Finance Officers',
    icon: DollarSign,
    color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-400',
    description: 'Manage institutional cashflows: fee invoice generation, bKash automated reconciliation, and double-entry ledger.',
    steps: [
      'Configure student fee heads (Tuition, Lab, Exam, Library) per grade.',
      'Run monthly batch invoice generation and dispatch parent bKash payment links.',
      'Verify real-time bKash and cashless transaction reconciliations.',
      'Generate monthly general ledger income statements and payroll disburse.'
    ],
    courseLink: '/training/courses/finance-accounts-training'
  }
];

export default function GettingStartedPage() {
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
                Getting Started Pathways
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
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
            <Compass className="w-3.5 h-3.5" />
            <span>Structured Onboarding Roadmaps</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Role-Based Getting Started Pathways
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            Select your functional role to access step-by-step onboarding sequences, core checklist items, and certification courses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PATHWAYS.map((path) => {
            const Icon = path.icon;
            return (
              <div
                key={path.role}
                className="p-6 md:p-8 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-6 shadow-xl"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${path.color} border shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{path.role}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{path.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Core Onboarding Checklist:
                    </span>
                    {path.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <Link
                    href={path.courseLink}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition"
                  >
                    <span>Start Academy Certification Course</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
