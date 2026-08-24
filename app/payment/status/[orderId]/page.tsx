import { SaasSignupService } from '@/lib/services/saas-signup.service';
import StatusClient from './status-client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PaymentStatusPage({
  params,
  searchParams
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ status?: string; reason?: string }>;
}) {
  const { orderId } = await params;
  const query = await searchParams;
  const data = await SaasSignupService.getOrderDetails(orderId);

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
                Payment Verification
              </span>
            </div>
          </Link>
          <div className="text-xs text-slate-400 font-mono">
            {data?.order?.orderNumber || orderId}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex items-center justify-center">
        <StatusClient
          orderId={orderId}
          queryStatus={query.status}
          queryReason={query.reason}
          initialData={data ? JSON.parse(JSON.stringify(data)) : null}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} EduERP Platform. Real-time bKash Verification Engine.</p>
      </footer>
    </div>
  );
}
