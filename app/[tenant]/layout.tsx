import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server-auth';
import { TenantSidebar } from '@/components/layout/tenant-sidebar';
import { TenantHeader } from '@/components/layout/tenant-header';
import { ForcePasswordChangeModal } from '@/components/auth/force-password-change-modal';
import { resolveCanonicalTenantSlug } from '@/lib/tenant/tenant-guard';
import { db } from '@/lib/db';
import { ShieldAlert, ArrowLeft, LogOut, ExternalLink, ShieldCheck } from 'lucide-react';

export default async function TenantAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }> | { tenant: string };
}) {
  const resolvedParams = await params;
  const urlTenantSlug = resolvedParams?.tenant || 'demo-school';

  const session = await getServerSession();
  if (!session) {
    redirect(`/login?returnUrl=/${encodeURIComponent(urlTenantSlug)}/dashboard&reason=auth_required`);
  }

  // Multi-Tenant Isolation & Session Binding Check
  if (!session.isPlatformAdmin) {
    let userTenantSlug = session.tenantSlug;
    let userTenantName = session.tenantSlug;

    if (!userTenantSlug && session.tenantId) {
      const userTenant = await db.tenant.findUnique({
        where: { id: session.tenantId },
        select: { slug: true, institution: { select: { name: true } } }
      });
      if (userTenant) {
        userTenantSlug = userTenant.slug;
        userTenantName = userTenant.institution?.name || userTenant.slug;
      }
    }

    const canonicalUrlSlug = resolveCanonicalTenantSlug(urlTenantSlug);
    const canonicalUserSlug = userTenantSlug ? resolveCanonicalTenantSlug(userTenantSlug) : null;

    if (canonicalUserSlug && canonicalUrlSlug !== canonicalUserSlug) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                You are signed into another institution
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your authenticated session is active for <strong className="text-amber-300 font-semibold">{userTenantName || canonicalUserSlug}</strong> as <span className="font-mono text-slate-300">{session.email}</span> ({session.role}).
              </p>
              <p className="text-xs text-slate-500">
                Direct cross-tenant browsing to <strong className="text-slate-300">{canonicalUrlSlug}</strong> is restricted to enforce strict educational data boundary isolation.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <Link
                href={`/${canonicalUserSlug}/dashboard`}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to My Institution ({canonicalUserSlug})</span>
              </Link>
              <Link
                href="/login"
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign In to a Different Account</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  // Check if user requires forced password change
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { forcePasswordChange: true, email: true }
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Audited Platform Support Session Banner */}
      {session.isPlatformAdmin && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2 text-xs text-amber-300 font-medium flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>PLATFORM SUPPORT SESSION</strong> • Viewing <code className="bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200">{urlTenantSlug}</code> as Super Admin ({session.name})
            </span>
          </div>
          <Link
            href="/super-admin/institutions"
            className="flex items-center gap-1 text-amber-300 hover:text-amber-200 underline text-[11px]"
          >
            <span>Return to SaaS Control Plane</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      <div className="flex-1 flex min-w-0">
        <TenantSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TenantHeader />
          <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-106px)]">
            {children}
          </main>
        </div>
      </div>

      {user?.forcePasswordChange && (
        <ForcePasswordChangeModal userEmail={user.email} />
      )}
    </div>
  );
}
