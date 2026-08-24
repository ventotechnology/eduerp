'use client';

import React from 'react';
import Link from 'next/link';
import { PublicFooter } from '@/components/layout/public-footer';
import {
  FileText,
  Shield,
  CreditCard,
  Building2,
  CheckCircle2,
  Server
} from 'lucide-react';

export default function TermsOfServicePage() {
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
            <Link href="/privacy" className="text-slate-300 hover:text-white transition">
              Privacy Policy
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold">
            <FileText className="w-3.5 h-3.5" />
            <span>EduERP Software-as-a-Service (SaaS) Agreement</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Terms of Service & Master Subscription Agreement
          </h1>
          <p className="text-xs text-slate-400">
            Effective Date: January 1, 2026 • Last Revised: August 24, 2026 • Version 2.4
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <h2 className="text-base font-bold text-white">1. Agreement to Terms</h2>
          <p>
            By registering, accessing, subscribing to, or using the EduERP Platform (including all web portals, mobile interfaces, APIs, and subdomains under <strong className="text-white">eduerp.us</strong>), you (&quot;Subscriber&quot;, &quot;Customer&quot;, or &quot;Institution&quot;) agree to be legally bound by these Terms of Service.
          </p>
          <p>
            If you are entering into this agreement on behalf of an educational institution (such as a school, college, madrasha, university, polytechnic, or training academy), you represent and warrant that you possess the requisite legal authority to bind that entity.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <h2 className="text-base font-bold text-white">2. SaaS Subscription Tiers & Billing</h2>
          <p>
            EduERP is provided as a subscription-based cloud service billed monthly or annually in Bangladesh Taka (BDT) or foreign currency.
          </p>
          <ul className="space-y-2 list-disc list-inside text-slate-200">
            <li><strong className="text-white">Subscription Packages:</strong> Plan tiers (Starter, Standard, Professional, Enterprise, or Custom) dictate student capacity, campus limits, storage allotments, and feature entitlements.</li>
            <li><strong className="text-white">Payment Methods:</strong> Subscription payments are processed via verified Bangladeshi MFS gateways (bKash, Nagad, Rocket), Cards, or Direct Corporate Bank Wire EFT.</li>
            <li><strong className="text-white">Free Trial Period:</strong> Standard subscriptions include a 14-day evaluation trial. Upon trial expiration, continued platform operations require an active subscription payment.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <h2 className="text-base font-bold text-white">3. Service Level Agreement (SLA) & Uptime</h2>
          <p>
            We strive to provide 99.9% application uptime for commercial production tenants. Scheduled maintenance windows are communicated at least 48 hours in advance and executed during off-peak weekend hours.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <h2 className="text-base font-bold text-white">4. Institutional Responsibilities & Acceptable Use</h2>
          <p>
            The subscribing institution is solely responsible for:
          </p>
          <ul className="space-y-1.5 list-disc list-inside text-slate-200">
            <li>Maintaining the confidentiality of institutional administrator login credentials.</li>
            <li>Ensuring all student and employee information entered into the system complies with applicable national education regulations.</li>
            <li>Promptly revoking access for discharged or former faculty and staff.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <h2 className="text-base font-bold text-white">5. Governing Law & Dispute Resolution</h2>
          <p>
            These Terms of Service shall be governed by and construed in accordance with the laws of the People&apos;s Republic of Bangladesh. Any dispute arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts of Dhaka, Bangladesh.
          </p>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
