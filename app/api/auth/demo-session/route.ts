import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getServerSession } from '@/lib/auth/server-auth';
import { ENV } from '@/lib/env';
import { resolveCanonicalTenantSlug } from '@/lib/tenant/tenant-guard';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import { UserStatus } from '@/lib/auth/types';
import { apiSuccess, apiError } from '@/lib/api/safe-response';

async function handleImpersonation(req: NextRequest, tenantSlugInput: string, roleInput?: string, targetUserIdInput?: string) {
  // 1. Verify caller session - MUST already be authenticated as Platform Super Admin
  const caller = await getServerSession(req);
  if (!caller) {
    return apiError(
      'UNAUTHORIZED',
      'Authentication required. Only Platform Super Admin can impersonate institution personas.',
      401
    );
  }

  // Check caller platform privileges (either direct platform admin or has active platform super admin impersonator)
  const isCallerPlatformAdmin = caller.isPlatformAdmin || caller.impersonator?.role === 'PLATFORM_SUPER_ADMIN';
  if (!isCallerPlatformAdmin) {
    return apiError(
      'FORBIDDEN',
      'Impersonation requires Platform Super Admin privileges.',
      403
    );
  }

  if (!tenantSlugInput) {
    return apiError('VALIDATION_ERROR', 'Tenant slug or identifier is required.', 400);
  }

  // Disallow targeting Platform Super Admin via impersonation
  if (roleInput && (roleInput === 'PLATFORM_SUPER_ADMIN' || roleInput.startsWith('PLATFORM_') || roleInput === 'SUPER_ADMIN')) {
    return apiError(
      'FORBIDDEN',
      'Cannot impersonate Platform Super Admin privileges.',
      403
    );
  }

  // 2. Locate target tenant in database
  const targetSlug = resolveCanonicalTenantSlug(tenantSlugInput);
  const tenant = await db.tenant.findFirst({
    where: {
      OR: [
        { slug: targetSlug },
        { id: targetSlug },
        { slug: tenantSlugInput },
        { id: tenantSlugInput }
      ]
    },
    include: {
      institution: true
    }
  });

  if (!tenant) {
    return apiError(
      'NOT_FOUND',
      `Target educational institution '${tenantSlugInput}' not found.`,
      404
    );
  }

  if (!tenant.isActive) {
    return apiError(
      'FORBIDDEN',
      `Target institution '${tenant.institution?.name || tenant.slug}' is currently inactive or suspended.`,
      403
    );
  }

  // 3. Locate target user for this tenant
  let targetUser: any = null;

  if (targetUserIdInput) {
    targetUser = await db.user.findFirst({
      where: {
        id: targetUserIdInput,
        tenantId: tenant.id,
        status: 'ACTIVE' as any
      },
      include: {
        tenant: true
      }
    });
  }

  if (!targetUser && roleInput) {
    targetUser = await db.user.findFirst({
      where: {
        role: roleInput as any,
        tenantId: tenant.id,
        status: 'ACTIVE' as any
      },
      include: {
        tenant: true
      }
    });
  }

  // Fallback: search for owner/head roles (PRINCIPAL, HEADMASTER, VICE_CHANCELLOR, ADMIN, etc.)
  if (!targetUser) {
    targetUser = await db.user.findFirst({
      where: {
        tenantId: tenant.id,
        status: 'ACTIVE' as any,
        role: {
          in: ['PRINCIPAL', 'HEADMASTER', 'VICE_CHANCELLOR', 'ADMIN', 'DIRECTOR', 'CHAIRMAN', 'DEAN', 'TEACHER'] as any
        }
      },
      orderBy: { createdAt: 'asc' },
      include: {
        tenant: true
      }
    });
  }

  // Fallback: any active user in tenant
  if (!targetUser) {
    targetUser = await db.user.findFirst({
      where: {
        tenantId: tenant.id,
        status: 'ACTIVE' as any
      },
      orderBy: { createdAt: 'asc' },
      include: {
        tenant: true
      }
    });
  }

  if (!targetUser) {
    return apiError(
      'NO_OWNER_AVAILABLE',
      `No active user account found for institution '${tenant.institution?.name || targetSlug}'.`,
      404
    );
  }

  // 4. Determine original Platform Super Admin actor
  const originalActor = caller.impersonator || {
    userId: caller.id,
    email: caller.email,
    role: caller.role
  };

  // 5. Record tamper-proof AuditLog entry
  const isChanging = Boolean(caller.impersonator);
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || undefined;
  const userAgent = req.headers.get('user-agent') || undefined;

  await logAuditEvent({
    tenantId: tenant.id,
    actor: {
      id: originalActor.userId,
      email: originalActor.email,
      name: originalActor.email.split('@')[0],
      role: originalActor.role,
      tenantId: null,
      status: UserStatus.ACTIVE,
      isPlatformAdmin: true
    },
    action: isChanging ? 'QA_IMPERSONATION_CHANGED' : 'QA_IMPERSONATION_STARTED',
    resourceType: 'UserSession',
    resourceId: targetUser.id,
    previousState: isChanging ? { impersonatedUserId: caller.id, role: caller.role } : null,
    newState: {
      impersonatedUserId: targetUser.id,
      impersonatedRole: targetUser.role,
      impersonatedEmail: targetUser.email,
      targetTenantId: tenant.id,
      targetTenantSlug: tenant.slug
    },
    ipAddress,
    userAgent
  });

  // 6. Issue short-lived 60-minute HMAC-signed session token containing original actor context
  const IMPERSONATION_EXPIRY_SECONDS = 60 * 60; // 60 minutes
  const sessionToken = createSessionToken(
    {
      userId: targetUser.id,
      email: targetUser.email,
      role: targetUser.role as any,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      impersonator: originalActor
    },
    IMPERSONATION_EXPIRY_SECONDS
  );

  const redirectUrl = `/${tenant.slug}/dashboard`;

  const responseBody = {
    success: true,
    ok: true,
    message: `Impersonation active: Acting as ${targetUser.name || targetUser.email} (${targetUser.role}) at ${tenant.institution?.name || tenant.slug}`,
    redirectUrl,
    impersonation: {
      tenantSlug: tenant.slug,
      institutionName: tenant.institution?.name || tenant.slug,
      role: targetUser.role,
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role
      }
    },
    user: {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      impersonator: originalActor
    }
  };

  const response = NextResponse.json(responseBody, {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: ENV.IS_PRODUCTION,
    sameSite: 'lax',
    maxAge: IMPERSONATION_EXPIRY_SECONDS,
    path: '/'
  });

  return response;
}

export async function POST(req: NextRequest) {
  try {
    let tenantSlug = '';
    let role = '';
    let targetUserId = '';

    // Check if JSON body
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const body = await req.json();
        tenantSlug = body.tenantSlug || body.slug || '';
        role = body.role || '';
        targetUserId = body.targetUserId || body.userId || '';
      } catch {
        // Fall back to query params
      }
    }

    // Fallback to query params
    if (!tenantSlug) {
      const { searchParams } = new URL(req.url);
      tenantSlug = searchParams.get('tenantSlug') || searchParams.get('slug') || '';
      role = role || searchParams.get('role') || '';
      targetUserId = targetUserId || searchParams.get('targetUserId') || searchParams.get('userId') || '';
    }

    return await handleImpersonation(req, tenantSlug, role || undefined, targetUserId || undefined);
  } catch (err: any) {
    console.error('Impersonation error:', err);
    return apiError('INTERNAL_ERROR', err.message || 'Failed to switch impersonation session.', 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || searchParams.get('slug') || '';
    const role = searchParams.get('role') || undefined;
    const targetUserId = searchParams.get('targetUserId') || searchParams.get('userId') || undefined;

    return await handleImpersonation(req, tenantSlug, role, targetUserId);
  } catch (err: any) {
    console.error('Impersonation GET error:', err);
    return apiError('INTERNAL_ERROR', err.message || 'Failed to switch impersonation session.', 500);
  }
}
