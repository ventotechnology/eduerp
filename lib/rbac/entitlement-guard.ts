import { SessionUser } from '../auth/types';
import { AppError } from '../errors/app-error';
import { SubscriptionEntitlementService, LimitMetric } from '../services/subscription-entitlement-service';
import { db } from '../db';

/**
 * Enforces that the current tenant session has an active entitlement for the specified feature.
 * If the feature is not included in their subscription package and has no active override,
 * throws a 403 Forbidden error with structured upgrade metadata.
 */
export async function requireTenantFeature(session: SessionUser, featureKey: string): Promise<void> {
  // Platform Super Admins have universal operational access
  if (session.isPlatformAdmin || session.role === 'PLATFORM_SUPER_ADMIN') {
    return;
  }

  if (!session.tenantId) {
    throw AppError.forbidden('Tenant context required to verify feature entitlement.');
  }

  // Check if tenant is active
  const tenant = await db.tenant.findUnique({
    where: { id: session.tenantId },
    select: { id: true, status: true, isActive: true, isDemoTenant: true }
  });

  if (!tenant || !tenant.isActive || tenant.status === 'SUSPENDED' || tenant.status === 'CANCELLED' || tenant.status === 'ARCHIVED') {
    throw AppError.forbidden(
      `Your institution account is currently ${tenant?.status || 'inactive'}. Please contact EduERP support or billing to reactivate your instance.`,
      { code: 'TENANT_INACTIVE', status: tenant?.status }
    );
  }

  if (tenant.isDemoTenant) {
    return; // Demo evaluation tenants have full exploratory access
  }

  const hasAccess = await SubscriptionEntitlementService.hasFeature(session.tenantId, featureKey);

  if (!hasAccess) {
    const sub = await SubscriptionEntitlementService.getTenantSubscription(session.tenantId);
    const planName = sub?.plan.name || 'Current';

    throw AppError.forbidden(
      `Feature '${featureKey}' is not included in your institution's ${planName} package. Please upgrade your package in Settings → Billing to access this module.`,
      {
        code: 'FEATURE_NOT_INCLUDED',
        featureKey,
        currentPlan: planName,
        upgradeUrl: `/${session.tenantSlug || 'settings'}/settings/billing`
      }
    );
  }
}

/**
 * Enforces that the tenant has not reached their plan's maximum capacity limit for a metric (students, teachers, campuses, etc.)
 */
export async function requireTenantLimit(tenantId: string, metric: LimitMetric): Promise<void> {
  const result = await SubscriptionEntitlementService.checkLimit(tenantId, metric);

  if (!result.allowed) {
    throw AppError.forbidden(
      result.message || `Limit reached for ${metric}. Please upgrade your package to add more.`,
      {
        code: 'LIMIT_REACHED',
        metric: result.metric,
        currentUsage: result.currentUsage,
        maxLimit: result.maxLimit,
        planName: result.planName
      }
    );
  }
}
