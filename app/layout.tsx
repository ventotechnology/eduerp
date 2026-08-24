import type { Metadata } from 'next';
import './globals.css';
import { TenantProvider } from '@/lib/tenant-context';
import { DemoRoleBar } from '@/components/layout/demo-role-bar';

export const metadata: Metadata = {
  title: 'EduERP OS - Multi-Institution Education ERP & Campus SaaS',
  description: 'Next-generation Education Operating System for Schools, Colleges, Madrasahs, Universities & Technical Institutes with One Core and Configurable Vertical Engines.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="antialiased min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
        <TenantProvider>
          <DemoRoleBar />
          <div className="flex-1 flex flex-col">{children}</div>
        </TenantProvider>
      </body>
    </html>
  );
}
