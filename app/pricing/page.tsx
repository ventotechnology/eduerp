import { SaasPlanService } from '@/lib/services/saas-plan.service';
import PricingClient from './pricing-client';
import Link from 'next/link';
import { ShieldCheck, Zap, Headphones, CheckCircle2, Building2, HelpCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const plans = await SaasPlanService.getPublicPlans();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation */}
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
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/demo"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Demo Portals
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <Zap className="w-3.5 h-3.5" /> Transparent Institutional SaaS Pricing
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto">
          One Complete Platform for <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">Every Level of Education</span>
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto">
          From madrasahs and schools to universities and polytechnics. Choose the package that matches your institution size and scale effortlessly.
        </p>
      </section>

      {/* Interactive Pricing Cards */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">
        <PricingClient initialPlans={JSON.parse(JSON.stringify(plans))} />

        {/* Feature Highlights Grid */}
        <div className="mt-24 pt-16 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Automated Tenant Provisioning</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Instant activation upon bKash payment. Your custom subdomain, primary campus, academic calendar, and administrator accounts are created automatically.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Government Compliance Ready</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Built-in 1-click exports for BANBEIS, DSHE, UGC, BTEB, and Madrasha Education Board regulatory inspection templates.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
              <Headphones className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Dedicated Onboarding & Support</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Full data migration assistance from legacy spreadsheets or old software, teacher training workshops, and SLA-backed uptime guarantee.
            </p>
          </div>
        </div>

        {/* Pricing FAQs */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              <HelpCircle className="w-4 h-4" /> Frequently Asked Questions
            </div>
            <h2 className="text-3xl font-extrabold text-white">Common Questions About EduERP Plans</h2>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
              <h4 className="text-base font-semibold text-white mb-2">How does bKash checkout and activation work?</h4>
              <p className="text-sm text-slate-400">
                When you click Subscribe or Start Trial, you will be redirected to the secure official bKash merchant gateway. Once you enter your bKash PIN and OTP, our server immediately executes and verifies the transaction with bKash, provisions your institution instance, and activates your dashboard within 5 seconds.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
              <h4 className="text-base font-semibold text-white mb-2">Can we upgrade our plan as our student count grows?</h4>
              <p className="text-sm text-slate-400">
                Yes! You can upgrade anytime from your institution billing portal. The remaining balance of your current billing period is automatically prorated towards your new package.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
              <h4 className="text-base font-semibold text-white mb-2">Can we pay via Bank Wire or Cheque?</h4>
              <p className="text-sm text-slate-400">
                Yes, during checkout you can choose &quot;Bank Transfer / Wire&quot;. Deposit the subscription fee to our City Bank corporate account and submit your deposit slip reference. Our billing team will verify and activate your subscription within 2 business hours.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
              <h4 className="text-base font-semibold text-white mb-2">Is our institutional data secure and isolated?</h4>
              <p className="text-sm text-slate-400">
                EduERP enforces strict multi-tenant isolation at the database level. Every student record, fee transaction, mark sheet, and audit log is cryptographically tagged with your tenant ID and accessible only by your authenticated staff and students.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} EduERP Platform. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-slate-400 transition-colors">Support & Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
