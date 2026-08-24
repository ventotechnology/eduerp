import React from 'react';
import { TenantSidebar } from '@/components/layout/tenant-sidebar';
import { TenantHeader } from '@/components/layout/tenant-header';

export default function TenantAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
