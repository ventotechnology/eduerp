import { db } from '@/lib/db';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';

/**
 * Generates SaaS Platform-wide analytics for Platform Super Admins only
 */
export async function getPlatformSuperAdminAnalytics(actor: SessionUser) {
  if (!actor.isPlatformAdmin && actor.role !== 'PLATFORM_SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw AppError.forbidden('Unauthorized: Platform-wide analytics require Platform Super Admin authorization.');
  }

  const totalTenants = await db.tenant.count();
  const activeTenants = await db.tenant.count({ where: { isActive: true } });

  const tenantsByType = await db.tenant.groupBy({
    by: ['institutionType'],
    _count: { id: true },
  });

  const tenantsByTier = await db.tenant.groupBy({
    by: ['subscriptionTier'],
    _count: { id: true },
  });

  const totalPlatformUsers = await db.user.count();
  const totalAuditLogs = await db.auditLog.count();

  return {
    platform: {
      totalTenants,
      activeTenants,
      inactiveTenants: totalTenants - activeTenants,
      totalPlatformUsers,
      totalAuditLogsGenerated: totalAuditLogs,
    },
    breakdown: {
      byInstitutionType: tenantsByType.map((t) => ({ type: t.institutionType, count: t._count.id })),
      bySubscriptionTier: tenantsByTier.map((t) => ({ tier: t.subscriptionTier, count: t._count.id })),
    },
    generatedAt: new Date().toISOString(),
  };
}
