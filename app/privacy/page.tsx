'use client';

import React from 'react';
import Link from 'next/link';
import { PublicFooter } from '@/components/layout/public-footer';
import {
  Shield,
  Lock,
  Database,
  FileText,
  CheckCircle2,
  Server,
  UserCheck,
  Building2
} from 'lucide-react';

export default function PrivacyPolicyPage() {
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
                Legal & Compliance
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/terms" className="text-slate-300 hover:text-white transition">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-slate-300 hover:text-white transition">
              Contact
            </Link>
            <Link href="/login" className="text-slate-300 hover:text-white transition">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-10">
        <div className="border-b border-slate-800 pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>EduERP SaaS Security & Data Privacy Policy</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Privacy Policy & Student Data Protection
          </h1>
          <p className="text-xs text-slate-400">
            Effective Date: January 1, 2026 • Last Revised: August 24, 2026 • Version 2.4
          </p>
        </div>

        {/* Section 1: Overview */}
        <section className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>1. Commitment to Educational Privacy</span>
          </h2>
          <p>
            Vento Technology (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), operating the EduERP Platform (accessible at <strong className="text-white">eduerp.us</strong>), is committed to safeguarding the privacy and security of educational institutions, administrators, faculty, staff, parents, guardians, and students.
          </p>
          <p>
            EduERP operates strictly as a <strong className="text-emerald-400">Data Processor</strong> on behalf of subscribed educational institutions (&quot;Tenants&quot; or &quot;Data Controllers&quot;). We process institutional and personal data exclusively according to customer instructions and in strict compliance with applicable data protection legislation.
          </p>
        </section>

        {/* Section 2: Data We Process */}
        <section className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>2. Categories of Information Processed</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="font-bold text-white text-xs">Institutional Data</h3>
              <p className="text-slate-400 text-[11px]">
                Institution legal name, EIIN, accreditation credentials, campus addresses, administrative emails, bank accounts, and academic fee rules.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="font-bold text-white text-xs">Student & Guardian Data</h3>
              <p className="text-slate-400 text-[11px]">
                Student full name, date of birth, emergency contact, guardian national ID details, daily attendance, examination scores, and fee transaction logs.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="font-bold text-white text-xs">Faculty & Employee Data</h3>
              <p className="text-slate-400 text-[11px]">
                Faculty designations, department assignments, biometric clock-in logs, payroll history, and LMS course materials.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="font-bold text-white text-xs">System & Security Logs</h3>
              <p className="text-slate-400 text-[11px]">
                Cryptographic session tokens, IP address audit logs, login timestamps, and RBAC action audits for compliance tracking.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Student Privacy Shield */}
        <section className="p-6 rounded-3xl bg-emerald-950/20 border border-emerald-800/60 space-y-3 text-xs text-slate-300">
          <h2 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>3. Zero Commercial Monetization of Student Data</span>
          </h2>
          <p>
            EduERP enforces a strict zero-monetization policy:
          </p>
          <ul className="space-y-1.5 list-disc list-inside text-slate-200">
            <li>We <strong className="text-white">NEVER sell, rent, lease, or trade</strong> student personal data, academic records, or behavioral metrics to third-party advertisers.</li>
            <li>We <strong className="text-white">NEVER serve behavioral or commercial advertisements</strong> within the EduERP application, portals, or mobile interfaces.</li>
            <li>Student academic records are permanently owned by the subscribing educational institution and may be deleted or exported at any time.</li>
          </ul>
        </section>

        {/* Section 4: Data Security & Infrastructure */}
        <section className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <h2 className="text-base font-bold text-white">4. Technical Security Measures & Multi-Tenant Isolation</h2>
          <p>
            EduERP implements enterprise-grade technical and organizational safeguards:
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Strict Multi-Tenant Logical Partitioning:</strong> All database queries are scoped to validated tenant IDs. No cross-tenant data access is possible.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Encryption Standards:</strong> Data in transit is secured with TLS 1.3 encryption. Passwords and credentials are cryptographically hashed using PBKDF2/SHA-512.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Automated Disaster Recovery:</strong> Hourly automated snapshots and encrypted off-site database backups with point-in-time recovery.</span>
            </div>
          </div>
        </section>

        {/* Section 5: Data Protection Inquiries */}
        <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 text-xs text-slate-300">
          <h2 className="text-sm font-bold text-white">5. Data Protection Officer (DPO) Contact</h2>
          <p>
            If you have questions regarding this Privacy Policy, wish to exercise data subject rights (access, rectification, erasure), or require a formal Data Processing Addendum (DPA), contact:
          </p>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-slate-300 space-y-1">
            <div>Data Protection Office, EduERP OS</div>
            <div>Email: <a href="mailto:privacy@eduerp.us" className="text-emerald-400 hover:underline">privacy@eduerp.us</a></div>
            <div>Helpline: +880 1700-000000</div>
            <div>Address: Level 12, Gulshan-2, Dhaka-1212, Bangladesh</div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
