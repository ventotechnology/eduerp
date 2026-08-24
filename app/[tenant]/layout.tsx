import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server-auth';
import { TenantSidebar } from '@/components/layout/tenant-sidebar';
import { TenantHeader } from '@/components/layout/tenant-header';

export default async function TenantAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }> | { tenant: string };
}) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams?.tenant || 'demo-school';

  const session = await getServerSession();
  if (!session) {
    redirect(`/login?returnUrl=/${encodeURIComponent(tenantSlug)}/dashboard&reason=auth_required`);
  }

  return (
    <div className="flex-1 flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <TenantSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TenantHeader />
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-106px)]">
          {children}
        </main>
      </div>
    </div>
  );
}
