import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { ENV } from '@/lib/env';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // 1. Check if user exists in Database - Fail Closed
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { tenant: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: `Account is ${user.status.toLowerCase()}. Please contact administrator.` },
        { status: 403 }
      );
    }

    // 2. Verify Password against cryptographic hash
    const isPasswordValid = verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // 3. Issue Authentic HMAC-Signed Session Token
    const sessionToken = createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      tenantId: user.tenantId,
      tenantSlug: user.tenant?.slug || null
    });

    const isPlatform = user.role.startsWith('PLATFORM_') || user.role === 'SUPER_ADMIN';
    const redirectUrl = isPlatform ? '/super-admin' : `/${user.tenant?.slug || 'demo-school'}/dashboard`;

    const response = NextResponse.json({
      success: true,
      redirectUrl,
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
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Login processing error.' },
      { status: 500 }
    );
  }
}
