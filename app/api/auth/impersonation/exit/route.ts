import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getServerSession } from '@/lib/auth/server-auth';
import { ENV } from '@/lib/env';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import { UserStatus } from '@/lib/auth/types';

export async function POST(req: NextRequest) {
  try {
    const caller = await getServerSession(req);
    if (!caller || !caller.impersonator) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active impersonation session found to exit.'
        },
        { status: 400 }
      );
    }

    const superAdminUser = await db.user.findUnique({
      where: { id: caller.impersonator.userId }
    });

    if (!superAdminUser || superAdminUser.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: 'Original Platform Super Admin account is invalid or inactive.'
        },
        { status: 401 }
      );
    }

    // Record AuditLog
    await logAuditEvent({
      tenantId: null,
      actor: {
        id: superAdminUser.id,
        email: superAdminUser.email,
        name: superAdminUser.name,
        role: superAdminUser.role,
        tenantId: null,
        status: UserStatus.ACTIVE,
        isPlatformAdmin: true
      },
      action: 'QA_IMPERSONATION_ENDED',
      resourceType: 'UserSession',
      resourceId: caller.id,
      previousState: {
        exitedImpersonatedUserId: caller.id,
        exitedImpersonatedRole: caller.role
      },
      newState: {
        restoredUserId: superAdminUser.id,
        restoredRole: superAdminUser.role
      }
    });

    // Restore standard 7-day session for Super Admin
    const sessionToken = createSessionToken({
      userId: superAdminUser.id,
      email: superAdminUser.email,
      role: superAdminUser.role as any,
      tenantId: null,
      impersonator: null
    });

    const response = NextResponse.json({
      success: true,
      message: `Restored session for Platform Super Admin (${superAdminUser.email})`,
      redirectUrl: '/super-admin',
      user: {
        id: superAdminUser.id,
        email: superAdminUser.email,
        name: superAdminUser.name,
        role: superAdminUser.role,
        tenantId: null,
        impersonator: null
      }
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: ENV.IS_PRODUCTION,
      sameSite: 'lax',
      maxAge: ENV.SESSION_EXPIRY_DAYS * 24 * 60 * 60,
      path: '/'
    });

    return response;
  } catch (err: any) {
    console.error('Exit impersonation error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to exit impersonation.' },
      { status: 500 }
    );
  }
}
