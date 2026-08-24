import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server-auth';
import { resolveCanonicalTenantSlug } from '@/lib/tenant/tenant-guard';

export const dynamic = 'force-dynamic';

interface TenantRootPageProps {
  params: Promise<{ tenant: string }> | { tenant: string };
}

/**
 * Bare Tenant Root (/[tenant]) intelligent router:
 * 1. Anonymous Visitor -> Redirect to Public Institutional Website (/site/[canonicalSlug])
 * 2. Authenticated Same-Tenant User -> Redirect to ERP Dashboard (/[canonicalSlug]/dashboard)
 * 3. Authenticated Platform Admin -> Redirect to ERP Dashboard (/[canonicalSlug]/dashboard)
 * 4. Authenticated Different-Tenant User -> Controlled Tenant Isolation Security Screen (handled by layout)
 */
export default async function TenantRootPage({ params }: TenantRootPageProps) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.tenant || 'demo-school';
  const canonicalSlug = resolveCanonicalTenantSlug(rawSlug);

  const session = await getServerSession();

  // 1. Anonymous Visitor -> Redirect to Public Website
  if (!session) {
    redirect(`/site/${encodeURIComponent(canonicalSlug)}`);
  }

  // 2. Authenticated Same-Tenant User or Platform Admin -> Redirect to ERP Dashboard
  const canonicalUserSlug = session.tenantSlug ? resolveCanonicalTenantSlug(session.tenantSlug) : null;
  if (session.isPlatformAdmin || (canonicalUserSlug && canonicalUserSlug === canonicalSlug)) {
    redirect(`/${encodeURIComponent(canonicalSlug)}/dashboard`);
  }

  // 3. Different Tenant User: TenantAppLayout in layout.tsx displays the controlled isolation denial screen
  return null;
}
