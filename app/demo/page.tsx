'use client';

import React from 'react';
import Link from 'next/link';
import { PublicFooter } from '@/components/layout/public-footer';
import {
  GraduationCap,
  Building2,
  BookOpen,
  Sparkles,
  ArrowRight,
  Shield,
  CheckCircle2,
  ExternalLink,
  Laptop,
  Flame,
  Award,
  Layers,
  Wrench,
  BookCheck,
  Compass,
  Lock
} from 'lucide-react';

const VERTICAL_SHOWCASE = [
  {
    slug: 'demo-school',
    type: 'K-12 General School',
    name: 'Dhaka Ideal Model School',
    tagline: 'Complete School Operating System for Play/Nursery through Class 10 (SSC)',
    badge: 'K-12 School Engine',
    color: 'emerald',
    modules: [
      'Daily Period-wise Attendance & SMS Alerts',
      'Continuous Assessment (CA) & Term Exams',
      'Automated Sibling Fee Discounts & Invoicing',
      'Online Admission Portal with Document Upload',
      'Student & Guardian Self-Service Web Portal'
    ],
    rolesToTest: 'Principal, Vice Principal, Academic Coordinator, Class Teacher, Student, Guardian, Accountant, Librarian'
  },
  {
    slug: 'demo-college',
    type: 'Higher Secondary College',
    name: 'Chittagong Model College',
    tagline: 'Tailored for Intermediate Class 11-12 across Science, Humanities & Business Studies',
    badge: 'HSC College Engine',
    color: 'blue',
    modules: [
      'HSC Group & 4th Optional Subject Selection',
      'Continuous & Practical Exam Marks Entry',
      'Board Registration Data Export (BISE)',
      'Departmental Heads & Faculty Appraisals',
      'Digital College ID Cards & Admit Generators'
    ],
    rolesToTest: 'Principal, Associate Professor (Physics), HSC Student'
  },
  {
    slug: 'demo-school-college',
    type: 'Integrated School & College',
    name: 'Rajshahi Model School & College',
    tagline: 'Dual-tier Unified Campus Managing K-10 School and 11-12 College under One Platform',
    badge: 'Integrated Campus Engine',
    color: 'indigo',
    modules: [
      'Dual Shift & Multi-wing Academic Operations',
      'Cross-Shift Faculty & Staff Timetable Engine',
      'Unified Accounting with Wing-wise Cost Centers',
      'Class 1-12 Progression & Roll Assignment',
      'Integrated Online Admission with Stream Separation'
    ],
    rolesToTest: 'Principal, Section Head, Integrated Campus Coordinator'
  },
  {
    slug: 'demo-madrasha',
    type: 'Madrasha & Islamic Complex',
    name: 'Darul Uloom Islamia Madrasha',
    tagline: 'Specialized Engine for Ebtedayee, Dakhil, Alim, Fazil, Kamil and 30-Para Hifzul Quran',
    badge: 'Madrasha & Hifz Engine',
    color: 'teal',
    modules: [
      '30-Para Hifz Daily Sabak, Sabki & Dour Tracker',
      'Dakhil & Alim Islamic Studies Curriculum',
      'Madrasha Education Board (BMEB) Export',
      'Hostel Waqf & Lillah Boarding Accounts',
      'Qari / Ustad Evaluation & Progress Reports'
    ],
    rolesToTest: 'Principal (Muhtamim), Hifz Department Head (Ustad), Dakhil Student'
  },
  {
    slug: 'demo-university',
    type: 'University & Higher Education',
    name: 'Metropolitan University Bangladesh',
    tagline: 'Higher Education Operating System with Open Credit, Faculty Portals & Research Grants',
    badge: 'University Open Credit Engine',
    color: 'purple',
    modules: [
      'Semester Credit Hour & Open Course Registration',
      'Course Add/Drop & Prerequisite Validation',
      'Credit-weighted CGPA & Semester Transcripts',
      'Faculty Workload, Research Grants & Thesis Defense',
      'Departmental Budgeting & Research Accounting'
    ],
    rolesToTest: 'Vice Chancellor, Dean of Engineering, Department Head, Course Professor, University Student, Registrar'
  },
  {
    slug: 'demo-polytechnic',
    type: 'Polytechnic Diploma Institute',
    name: 'Dhaka Polytechnic Institute',
    tagline: '4-Year Engineering Diploma Engine Aligned with BTEB Regulations',
    badge: 'Polytechnic Diploma Engine',
    color: 'amber',
    modules: [
      'BTEB 8-Semester Diploma Curriculum Management',
      'Practical Lab & Workshop Assessment Logbook',
      '8th Semester Industrial Attachment & Internship',
      'Continuous Practical Assessment (TC/PC/TF/PF)',
      'BTEB Board Registration & Result Processing'
    ],
    rolesToTest: 'Principal / Director, Chief Instructor (Computer), Diploma Engineering Student'
  },
  {
    slug: 'demo-vocational',
    type: 'Technical & Vocational Academy',
    name: 'Bangladesh Technical Vocational Academy',
    tagline: 'Skills Development & Competency-Based Training (CBT&A) Aligned with NTVQF Standards',
    badge: 'NTVQF Skills Engine',
    color: 'rose',
    modules: [
      'NTVQF Level 1-4 Competency Assessment Matrix',
      'Trade-wise Workshop Machinery Inventory',
      'Industry Apprenticeship & Job Placement Cell',
      'Competency Certificate & Digital Skill Badges',
      'Consumable Material Requisition for Workshops'
    ],
    rolesToTest: 'Principal / Lead Assessor, Senior Trade Instructor, Trade Trainee'
  },
  {
    slug: 'demo-training',
    type: 'Professional Training Academy',
    name: 'National Institute of Professional Training',
    tagline: 'Short Courses, Corporate Training Cohorts, Executive Certifications & CPD Credits',
    badge: 'Professional Training Engine',
    color: 'cyan',
    modules: [
      'Cohort & Batch-based Short Course Scheduling',
      'Corporate Client Invoicing & Sponsorships',
      'Automated QR-Verifiable Certificate Generation',
      'Post-Test Assessments & CPD Hours Logbook',
      'Trainer Performance & Evaluation Feedback'
    ],
    rolesToTest: 'Executive Director, Lead Corporate Trainer, Executive Trainee'
  }
];

export default function DemoShowroomPage() {
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
                Demo Showroom
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/pricing" className="text-slate-300 hover:text-white transition">
              Pricing
            </Link>
            <Link href="/contact" className="text-slate-300 hover:text-white transition">
              Contact Sales
            </Link>
            <Link href="/login" className="text-slate-300 hover:text-white transition">
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

      {/* Hero Header */}
      <section className="pt-16 pb-12 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Live Vertical Engines Demo Directory</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
          Explore EduERP Across 8 Specialized Educational Verticals
        </h1>
        <p className="mt-4 text-slate-300 text-sm md:text-base max-w-3xl mx-auto leading-relaxed">
          EduERP adapts its schema, workflows, and terminology to your exact institution type. 
          Browse the vertical engines below to preview how our modular architecture powers institutions of every scale.
        </p>
      </section>

      {/* 8 Showcase Cards */}
      <section className="px-4 sm:px-6 lg:px-8 pb-24 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VERTICAL_SHOWCASE.map((v) => (
            <div
              key={v.slug}
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-6 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {v.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-400">/{v.slug}</span>
                </div>

                <h2 className="text-xl font-bold text-white mb-1.5">{v.name}</h2>
                <p className="text-xs text-slate-300 mb-4">{v.tagline}</p>

                {/* Key Features */}
                <div className="space-y-2 mb-5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Built-in Vertical Capabilities:
                  </span>
                  <div className="space-y-1.5">
                    {v.modules.map((m, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Personas included */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Simulated User Roles:
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{v.rolesToTest}</p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-800">
                <Link
                  href={`/${v.slug}/dashboard`}
                  target="_blank"
                  className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <span>Preview Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/contact"
                  className="w-full sm:w-auto py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <span>Request Full Demo</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <section className="bg-slate-900 border-t border-slate-800 py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl md:text-3xl font-black text-white">
            Ready to deploy EduERP for your institution?
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Get started in minutes with our automated onboarding wizard or speak with our educational engineering team for on-premise, hybrid, or custom enterprise deployments.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/25"
            >
              Start 14-Day Free Trial
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition border border-slate-700"
            >
              Schedule Live Consultation
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
