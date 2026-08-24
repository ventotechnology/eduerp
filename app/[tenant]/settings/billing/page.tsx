import { SubscriptionEntitlementService } from '@/lib/services/subscription-entitlement-service';
import { db } from '@/lib/db';
import BillingClient from './billing-client';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TenantBillingPage({
  params
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: slug } = await params;

  const tenant = await db.tenant.findFirst({
    where: {
      OR: [
        { slug },
        { domains: { some: { domain: slug } } }
      ]
    }
  });

  if (!tenant) {
    notFound();
  }

  const summary = await SubscriptionEntitlementService.getTenantBillingSummary(tenant.id);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Subscription & Billing Operations
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your EduERP package, limits, payment methods, and platform invoices.
        </p>
      </div>

      <BillingClient
        tenantSlug={slug}
        initialData={JSON.parse(JSON.stringify(summary))}
      />
    </div>
  );
}
