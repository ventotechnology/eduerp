import { db } from '../db';
import { TenantContext } from './types';
import { SessionUser } from '../auth/types';
import {
  TENANT_SLUG_ALIASES,
  resolveCanonicalTenantSlug,
  isSameTenant,
  getTenantRouteSlug
} from './tenant-aliases';

export {
  TENANT_SLUG_ALIASES,
  resolveCanonicalTenantSlug,
  isSameTenant,
  getTenantRouteSlug
};

const tenantResolutionCache = new Map<string, { context: TenantContext; expiresAt: number }>();

/**
 * Resolves and validates an active tenant by slug or ID with alias normalization.
 * Throws error if tenant does not exist or is inactive.
 */
export async function requireTenant(tenantIdentifier: string): Promise<TenantContext> {
  const now = Date.now();
  const cached = tenantResolutionCache.get(tenantIdentifier);
  if (cached && cached.expiresAt > now) {
    return cached.context;
  }

  const canonicalIdentifier = resolveCanonicalTenantSlug(tenantIdentifier);
  if (canonicalIdentifier !== tenantIdentifier) {
    const canonicalCached = tenantResolutionCache.get(canonicalIdentifier);
    if (canonicalCached && canonicalCached.expiresAt > now) {
      return canonicalCached.context;
    }
  }

  // 1. Try exact match first
  let tenant = await db.tenant.findFirst({
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

  // 2. If not found, fallback to canonical alias
  if (!tenant && canonicalIdentifier !== tenantIdentifier) {
    tenant = await db.tenant.findFirst({
      where: {
        OR: [
          { id: canonicalIdentifier },
          { slug: canonicalIdentifier }
        ]
      },
      include: {
        institution: true
      }
    });
  }

  if (!tenant) {
    throw new Error(`NOT_FOUND: Educational institution tenant '${tenantIdentifier}' not found.`);
  }

  if (!tenant.isActive) {
    throw new Error(`FORBIDDEN: Tenant '${tenant.slug}' is currently inactive or suspended.`);
  }

  const context: TenantContext = {
    tenantId: tenant.id,
    institutionId: tenant.institution?.id || tenant.id,
    slug: tenant.slug,
    name: tenant.institution?.name || tenant.slug,
    institutionType: tenant.institutionType,
    subscriptionTier: tenant.subscriptionTier,
    isActive: tenant.isActive,
    isDemoTenant: tenant.isDemoTenant
  };

  tenantResolutionCache.set(tenantIdentifier, { context, expiresAt: now + 15000 });
  tenantResolutionCache.set(tenant.id, { context, expiresAt: now + 15000 });
  tenantResolutionCache.set(tenant.slug, { context, expiresAt: now + 15000 });

  return context;
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

export interface ResolvedTenantContext {
  tenantId: string;
  institutionId: string;
  tenantSlug: string;
  name: string;
  institutionType: string;
  subscriptionTier?: string;
}

/**
 * Standardized tenant context resolver for APIs and server actions.
 * - Authenticated: Uses session.tenantId authoritatively (or allows platform admins to target any tenant).
 * - Public: Safely resolves the active tenant by slug.
 */
export async function resolveTenantContext(options: {
  session?: SessionUser | null;
  tenantSlug?: string | null;
  tenantId?: string | null;
  isPublic?: boolean;
}): Promise<ResolvedTenantContext> {
  const { session, tenantSlug, tenantId, isPublic } = options;

  // 1. Authenticated session flow
  if (session && !isPublic) {
    if (session.isPlatformAdmin) {
      const identifier = tenantId || tenantSlug || session.tenantId;
      if (!identifier) {
        throw new Error('VALIDATION_ERROR: Tenant identifier is required for platform administrators.');
      }
      const tenant = await requireTenant(identifier);
      return {
        tenantId: tenant.tenantId,
        institutionId: tenant.institutionId,
        tenantSlug: tenant.slug,
        name: tenant.name,
        institutionType: tenant.institutionType,
        subscriptionTier: tenant.subscriptionTier
      };
    }

    if (!session.tenantId) {
      throw new Error('UNAUTHENTICATED: User session has no associated institution tenant.');
    }

    const tenant = await requireTenant(session.tenantId);

    // If client supplied a tenantSlug, verify it matches the user's institution slug (accounting for aliases)
    if (tenantSlug) {
      const canonicalReqSlug = resolveCanonicalTenantSlug(tenantSlug);
      const canonicalUserSlug = resolveCanonicalTenantSlug(tenant.slug);
      const isSlugMatch =
        tenantSlug === tenant.tenantId ||
        tenantSlug === tenant.slug ||
        canonicalReqSlug === canonicalUserSlug ||
        isSameTenant(tenantSlug, tenant.slug);
      if (!isSlugMatch) {
        throw new Error('FORBIDDEN: Cross-tenant access is strictly prohibited.');
      }
    }
    // If client supplied a tenantId, verify it matches either ID, slug, or alias
    if (tenantId) {
      const isIdMatch =
        tenantId === tenant.tenantId ||
        tenantId === tenant.slug ||
        isSameTenant(tenantId, tenant.slug) ||
        resolveCanonicalTenantSlug(tenantId) === resolveCanonicalTenantSlug(tenant.slug);
      if (!isIdMatch) {
        throw new Error('FORBIDDEN: Cross-tenant access is strictly prohibited.');
      }
    }

    return {
      tenantId: tenant.tenantId,
      institutionId: tenant.institutionId,
      tenantSlug: tenant.slug,
      name: tenant.name,
      institutionType: tenant.institutionType,
      subscriptionTier: tenant.subscriptionTier
    };
  }

  // 2. Public flow (e.g. /apply/[tenantSlug] or public websites)
  const identifier = tenantSlug || tenantId;
  if (!identifier) {
    throw new Error('NOT_FOUND: Educational institution tenant identifier is required.');
  }

  const tenant = await requireTenant(identifier);
  return {
    tenantId: tenant.tenantId,
    institutionId: tenant.institutionId,
    tenantSlug: tenant.slug,
    name: tenant.name,
    institutionType: tenant.institutionType,
    subscriptionTier: tenant.subscriptionTier
  };
}

