import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { ENV } from '@/lib/env';
import { TENANT_SLUG_ALIASES } from '@/lib/tenant/tenant-guard';
import { QA_ACCOUNT_DEFINITIONS } from '@/scripts/provision-qa-users';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantSlug, role } = body;

    if (!role) {
      return NextResponse.json({ success: false, error: 'Role is required.' }, { status: 400 });
    }

    const isPlatform = role.startsWith('PLATFORM_') || role === 'SUPER_ADMIN';
    const targetSlug = isPlatform ? 'platform' : (TENANT_SLUG_ALIASES[tenantSlug] || tenantSlug || 'demo-school');

    // 1. Find matching QA Account definition
    const qaDef = QA_ACCOUNT_DEFINITIONS.find(
      (a) => a.tenantSlug === targetSlug && a.role === role
    ) || QA_ACCOUNT_DEFINITIONS.find(
      (a) => a.tenantSlug === targetSlug
    ) || QA_ACCOUNT_DEFINITIONS[0];

    // 2. Lookup or load user from database
    let user = await db.user.findFirst({
      where: { email: qaDef.email },
      include: { tenant: true }
    });

    if (!user) {
      // Fallback lookup by role and tenant
      const tenant = await db.tenant.findUnique({ where: { slug: targetSlug } });
      user = await db.user.findFirst({
        where: {
          role: role as any,
          tenantId: tenant ? tenant.id : null
        },
        include: { tenant: true }
      });
    }

    const userId = user ? user.id : `usr-demo-${Date.now()}`;
    const email = user ? user.email : qaDef.email;
    const name = user ? user.name : qaDef.name;
    const tenantId = user ? user.tenantId : (isPlatform ? null : 'demo-school');
    const userRole = (user ? user.role : role) as any;

    // 3. Issue authentic HMAC-signed session token
    const sessionToken = createSessionToken({
      userId,
      email,
      role: userRole,
      tenantId
    });

    const redirectUrl = isPlatform ? '/super-admin' : `/${targetSlug}/dashboard`;

    const response = NextResponse.json({
      success: true,
      message: `Switched session to ${qaDef.name} (${userRole})`,
      redirectUrl,
      user: {
        id: userId,
        email,
        name,
        role: userRole,
        tenantId,
        tenantSlug: targetSlug
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
    console.error('Demo session switch error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to switch demo session.' }, { status: 500 });
  }
}
