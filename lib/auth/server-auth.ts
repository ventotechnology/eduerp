import { cookies, headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from './session';
import { SessionUser, UserStatus } from './types';
import { db } from '../db';

/**
 * Extracts and verifies the authenticated user from server cookies or request.
 */
export async function getServerSession(req?: NextRequest): Promise<SessionUser | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // In non-request contexts
    }
  }

  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  const isPlatformAdmin = [
    'PLATFORM_SUPER_ADMIN',
    'PLATFORM_ADMIN',
    'SUPPORT_ADMIN',
    'BILLING_ADMIN',
    'SALES_ADMIN'
  ].includes(payload.role);

  let userName = payload.name;
  if (!userName || userName === payload.email.split('@')[0]) {
    try {
      const dbUser = await db.user.findUnique({
        where: { id: payload.userId },
        select: {
          name: true,
          tenant: {
            select: {
              institution: {
                select: { principalHeadName: true }
              }
            }
          }
        }
      });
      if (dbUser?.name && dbUser.name.trim() !== '') {
        userName = dbUser.name;
      } else if (dbUser?.tenant?.institution?.principalHeadName) {
        userName = dbUser.tenant.institution.principalHeadName;
      } else {
        userName = payload.email.split('@')[0];
      }
    } catch {
      userName = payload.email.split('@')[0];
    }
  }

  return {
    id: payload.userId,
    email: payload.email,
    name: userName || payload.email.split('@')[0],
    role: payload.role,
    tenantId: payload.tenantId,
    tenantSlug: payload.tenantSlug || null,
    status: UserStatus.ACTIVE,
    isPlatformAdmin,
    impersonator: payload.impersonator || null
  };
}

/**
 * Enforces authenticated session. Throws error if unauthenticated.
 */
export async function requireAuth(req?: NextRequest): Promise<SessionUser> {
  const session = await getServerSession(req);
  if (!session) {
    throw new Error('UNAUTHORIZED: Authentication required.');
  }
  if (session.status === UserStatus.LOCKED || session.status === UserStatus.SUSPENDED) {
    throw new Error(`FORBIDDEN: User account is ${session.status}.`);
  }
  return session;
}

/**
 * Enforces Platform Super Admin privileges.
 */
export async function requirePlatformAdmin(req?: NextRequest): Promise<SessionUser> {
  const session = await requireAuth(req);
  if (!session.isPlatformAdmin) {
    throw new Error('FORBIDDEN: Platform Super Admin privileges required.');
  }
  return session;
}
