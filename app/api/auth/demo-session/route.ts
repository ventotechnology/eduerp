import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getServerSession } from '@/lib/auth/server-auth';
import { ENV } from '@/lib/env';
import { TENANT_SLUG_ALIASES } from '@/lib/tenant/tenant-guard';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import { UserStatus } from '@/lib/auth/types';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify caller session - MUST already be authenticated as Platform Super Admin
    const caller = await getServerSession(req);
    if (!caller) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED: Authentication required. Only Platform Super Admin can impersonate QA personas.'
        },
        { status: 401 }
      );
    }

    // Check caller platform privileges (either direct platform admin or has active platform super admin impersonator)
    const isCallerPlatformAdmin = caller.isPlatformAdmin || caller.impersonator?.role === 'PLATFORM_SUPER_ADMIN';
    if (!isCallerPlatformAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN: Impersonation requires Platform Super Admin privileges.'
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { tenantSlug, role } = body;

    if (!role) {
      return NextResponse.json({ success: false, error: 'Role is required.' }, { status: 400 });
    }

    // 2. Disallow targeting Platform Super Admin via impersonation (caller is already super admin)
    if (role === 'PLATFORM_SUPER_ADMIN' || role.startsWith('PLATFORM_') || role === 'SUPER_ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'FORBIDDEN: Cannot impersonate Platform Super Admin privileges.'
        },
        { status: 403 }
      );
    }

    // 3. Locate target tenant in database
    const targetSlug = TENANT_SLUG_ALIASES[tenantSlug] || tenantSlug;
    const tenant = await db.tenant.findFirst({
      where: {
        OR: [
          { slug: targetSlug },
          { id: targetSlug }
        ]
      },
      include: {
        institution: true
      }
    });

    if (!tenant) {
      return NextResponse.json(
        {
          success: false,
          error: `NOT_FOUND: Target tenant '${tenantSlug}' not found in database.`
        },
        { status: 404 }
      );
    }

    if (!tenant.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: `FORBIDDEN: Target tenant '${tenant.slug}' is inactive or suspended.`
        },
        { status: 403 }
      );
    }

    // 4. Locate real QA User in database for this tenant & role - NEVER synthesize fake user IDs
    const targetUser = await db.user.findFirst({
      where: {
        role: role as any,
        tenantId: tenant.id,
        status: 'ACTIVE' as any
      },
      include: {
        tenant: true
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          error: `NOT_FOUND: No active QA user with role '${role}' found for institution '${tenant.institution?.name || targetSlug}'.`
        },
        { status: 404 }
      );
    }

    // 5. Determine original Platform Super Admin actor
    const originalActor = caller.impersonator || {
      userId: caller.id,
      email: caller.email,
      role: caller.role
    };

    // 6. Record tamper-proof AuditLog entry
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

    // 7. Issue short-lived 60-minute HMAC-signed session token containing original actor context
    const IMPERSONATION_EXPIRY_SECONDS = 60 * 60; // 60 minutes
    const sessionToken = createSessionToken(
      {
        userId: targetUser.id,
        email: targetUser.email,
        role: targetUser.role as any,
        tenantId: tenant.id,
        impersonator: originalActor
      },
      IMPERSONATION_EXPIRY_SECONDS
    );

    const redirectUrl = `/${tenant.slug}/dashboard`;

    const response = NextResponse.json({
      success: true,
      message: `Impersonation active: Acting as ${targetUser.name} (${targetUser.role}) at ${tenant.institution?.name || tenant.slug}`,
      redirectUrl,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        impersonator: originalActor
      }
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: ENV.IS_PRODUCTION,
      sameSite: 'lax',
      maxAge: IMPERSONATION_EXPIRY_SECONDS,
      path: '/'
    });

    return response;
  } catch (err: any) {
    console.error('Secure demo impersonation error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to switch impersonation session.' },
      { status: 500 }
    );
  }
}
