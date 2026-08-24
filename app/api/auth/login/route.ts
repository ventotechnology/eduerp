import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { ENV } from '@/lib/env';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, tenantSlug } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // 1. Check if user exists in Database
    let user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { tenant: true }
    });

    // 2. If running with Demo Simulators enabled and database is unseeded, handle fallback securely
    if (!user && ENV.ENABLE_DEMO_SIMULATORS) {
      // Allow demo platform super admin or demo tenant admin
      const isSuperAdminEmail = email.toLowerCase().includes('admin@eduerp') || email.toLowerCase().includes('super');
      const role = isSuperAdminEmail ? ('PLATFORM_SUPER_ADMIN' as const) : ('PRINCIPAL' as const);

      const sessionToken = createSessionToken({
        userId: `USR-${Date.now()}`,
        email: email.toLowerCase(),
        role,
        tenantId: isSuperAdminEmail ? null : (tenantSlug || 'dhaka-ideal-school')
      });

      const response = NextResponse.json({
        success: true,
        user: {
          email: email.toLowerCase(),
          role,
          tenantSlug: tenantSlug || null
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
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Account is ${user.status.toLowerCase()}. Please contact administrator.` },
        { status: 403 }
      );
    }

    // Verify Password
    const isPasswordValid = verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Issue Session Token
    const sessionToken = createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
      tenantId: user.tenantId
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantSlug: user.tenant?.slug || null
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
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
