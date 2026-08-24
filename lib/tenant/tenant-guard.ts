import { db } from '../db';
import { TenantContext } from './types';
import { SessionUser } from '../auth/types';

/**
 * Resolves and validates an active tenant by slug or ID.
 * Throws error if tenant does not exist or is inactive.
 */
export async function requireTenant(tenantIdentifier: string): Promise<TenantContext> {
  const tenant = await db.tenant.findFirst({
    where: {
      OR: [
        { id: tenantIdentifier },
        { slug: tenantIdentifier }
      ]
    },
    include: {
      institution: true
    }
  });

  if (!tenant) {
    throw new Error(`NOT_FOUND: Educational institution tenant '${tenantIdentifier}' not found.`);
  }

  if (!tenant.isActive) {
    throw new Error(`FORBIDDEN: Tenant '${tenant.slug}' is currently inactive or suspended.`);
  }

  return {
    tenantId: tenant.id,
    institutionId: tenant.institution?.id || tenant.id,
    slug: tenant.slug,
    name: tenant.institution?.name || tenant.slug,
    institutionType: tenant.institutionType,
    subscriptionTier: tenant.subscriptionTier,
    isActive: tenant.isActive,
    isDemoTenant: tenant.isDemoTenant
  };
}

/**
 * Validates that an authenticated user has authorization to access the specific target tenant.
 * Platform Super Admins are granted global access across all tenants.
 */
export function requireTenantUser(session: SessionUser, targetTenantId: string): void {
  if (session.isPlatformAdmin) {
    return; // Global access for platform administrators
  }

  if (!session.tenantId || session.tenantId !== targetTenantId) {
    throw new Error('FORBIDDEN: You do not have permission to access data belonging to another educational institution.');
  }
}

/**
 * Creates a tenant-scoped query wrapper that guarantees tenant boundary conditions.
 */
export function createTenantDb(tenantId: string) {
  return {
    tenantId,
    students: {
      findMany: (args: any = {}) =>
        db.student.findMany({
          ...args,
          where: {
            ...args.where,
            campus: { institution: { tenantId } }
          }
        }),
      findUnique: (args: any) =>
        db.student.findFirst({
          ...args,
          where: {
            ...args.where,
            campus: { institution: { tenantId } }
          }
        })
    },
    invoices: {
      findMany: (args: any = {}) =>
        db.invoice.findMany({
          ...args,
          where: {
            ...args.where,
            student: { campus: { institution: { tenantId } } }
          }
        })
    }
  };
}
