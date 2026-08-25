import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getServerSession } from '@/lib/auth/server-auth';
import { ENV } from '@/lib/env';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import { UserStatus } from '@/lib/auth/types';
import { apiSuccess, apiError } from '@/lib/api/safe-response';

async function handleExitImpersonation(req: NextRequest) {
  const caller = await getServerSession(req);
  if (!caller || !caller.impersonator) {
    return apiError('NO_ACTIVE_IMPERSONATION', 'No active impersonation session found to exit.', 400);
  }

  const superAdminUser = await db.user.findUnique({
    where: { id: caller.impersonator.userId }
  });

  if (!superAdminUser || superAdminUser.status !== 'ACTIVE') {
    return apiError('INVALID_SUPER_ADMIN', 'Original Platform Super Admin account is invalid or inactive.', 401);
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

  const responseBody = {
    success: true,
    ok: true,
    message: `Restored session for Platform Super Admin (${superAdminUser.email})`,
    redirectUrl: '/super-admin/institutions',
    user: {
      id: superAdminUser.id,
      email: superAdminUser.email,
      name: superAdminUser.name,
      role: superAdminUser.role,
      tenantId: null,
      impersonator: null
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
    maxAge: ENV.SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/'
  });

  return response;
}

export async function POST(req: NextRequest) {
  try {
    return await handleExitImpersonation(req);
  } catch (err: any) {
    console.error('Exit impersonation error:', err);
    return apiError('INTERNAL_ERROR', err.message || 'Failed to exit impersonation.', 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    return await handleExitImpersonation(req);
  } catch (err: any) {
    console.error('Exit impersonation GET error:', err);
    return apiError('INTERNAL_ERROR', err.message || 'Failed to exit impersonation.', 500);
  }
}
