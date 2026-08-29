import { NextRequest, NextResponse } from 'next/server';
import { exchangeSSOToken } from '@/lib/venomin/sso';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getCustomerSafeError, VENOMIN_ERROR_CODES } from '@/lib/venomin/errors';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, errorCode: VENOMIN_ERROR_CODES.SSO_INVALID, safeMessage: 'Malformed request.' },
      { status: 400 }
    );
  }

  if (!body.token) {
    return NextResponse.json(
      { success: false, errorCode: VENOMIN_ERROR_CODES.SSO_INVALID, safeMessage: 'SSO token is required.' },
      { status: 400 }
    );
  }

  const result = await exchangeSSOToken(body.token);

  if (!result.success) {
    const errorDetails = getCustomerSafeError(result.errorCode || VENOMIN_ERROR_CODES.SSO_INVALID);
    return NextResponse.json(
      {
        success: false,
        errorCode: result.errorCode || VENOMIN_ERROR_CODES.SSO_INVALID,
        safeMessage: errorDetails.safeMessage,
        details: result.errorMessage,
      },
      { status: errorDetails.status }
    );
  }

  const response = NextResponse.json({
    success: true,
    user: result.user,
    redirectUrl: result.redirectUrl || '/dashboard',
  });

  if (result.sessionToken) {
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: result.sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
  }

  return response;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const returnTo = req.nextUrl.searchParams.get('returnTo');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_sso_token', req.url));
  }

  const result = await exchangeSSOToken(token);

  if (!result.success || !result.sessionToken) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(result.errorCode || 'sso_failed')}`, req.url)
    );
  }

  const destination = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
    ? returnTo
    : result.redirectUrl || '/dashboard';

  const redirectResponse = NextResponse.redirect(new URL(destination, req.url));

  redirectResponse.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: result.sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  return redirectResponse;
}
