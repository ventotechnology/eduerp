import { SaasPlanService } from '@/lib/services/saas-plan.service';
import SignupClient from './signup-client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SignupPage() {
  const plans = await SaasPlanService.getPublicPlans();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
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
                Institution Onboarding
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Back to Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Register Your Education Institution
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Set up your dedicated cloud workspace. Instant provisioning upon payment confirmation.
          </p>
        </div>

        <SignupClient plans={JSON.parse(JSON.stringify(plans))} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} EduERP Platform. All institution data is isolated and encrypted.</p>
      </footer>
    </div>
  );
}
