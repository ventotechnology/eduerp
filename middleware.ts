import { NextRequest, NextResponse } from 'next/server';
import { resolveCanonicalTenantSlug } from './lib/tenant/tenant-aliases';

const SESSION_COOKIE_NAME = 'eduerp_session';

// Public non-tenant root segments that should NOT be treated as tenant slugs
const PUBLIC_NON_TENANT_ROUTES = new Set([
  'api',
  '_next',
  'apply',
  'checkout',
  'contact',
  'demo',
  'help',
  'login',
  'payment',
  'pricing',
  'privacy',
  'results',
  'signup',
  'site',
  'super-admin',
  'support',
  'terms',
  'training',
  'verify',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml'
]);

/**
 * Lightweight helper to extract session payload from the cookie without heavy imports
 */
function extractSessionPayload(cookieValue: string | undefined): {
  userId: string;
  email: string;
  role: string;
  tenantId: string | null;
  tenantSlug: string | null;
  expiresAt: number;
} | null {
  if (!cookieValue || !cookieValue.includes('.')) return null;
  try {
    const [data] = cookieValue.split('.');
    const decoded = Buffer.from(data, 'base64url').toString('utf8');
    const parsed = JSON.parse(decoded);
    if (!parsed || (parsed.expiresAt && Date.now() > parsed.expiresAt)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip Next.js internals, static files, and root landing page
  if (
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return NextResponse.next();
  }

  const firstSegment = segments[0].toLowerCase();

  // 2. Skip public non-tenant routes (/site, /apply, /login, /signup, etc.)
  if (PUBLIC_NON_TENANT_ROUTES.has(firstSegment)) {
    return NextResponse.next();
  }

  const rawSlug = segments[0];
  const canonicalSlug = resolveCanonicalTenantSlug(rawSlug);

  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = extractSessionPayload(sessionCookie);

  // 3. Case: Bare Tenant Root (e.g. /scholars-international-tahfiz-academy or /sita or /demo-school)
  if (segments.length === 1) {
    // 3A. Anonymous Visitor -> Redirect to Public Institutional Website (/site/[canonicalSlug])
    if (!session) {
      const siteUrl = new URL(`/site/${encodeURIComponent(canonicalSlug)}`, req.url);
      return NextResponse.redirect(siteUrl);
    }

    // 3B. Authenticated User
    const isPlatformAdmin =
      session.role.startsWith('PLATFORM_') || session.role === 'SUPER_ADMIN';
    const canonicalUserSlug = session.tenantSlug
      ? resolveCanonicalTenantSlug(session.tenantSlug)
      : null;

    if (isPlatformAdmin || (canonicalUserSlug && canonicalUserSlug === canonicalSlug)) {
      // Same-Tenant or Super Admin -> Redirect to ERP Dashboard
      const dashboardUrl = new URL(`/${encodeURIComponent(canonicalSlug)}/dashboard`, req.url);
      return NextResponse.redirect(dashboardUrl);
    }

    // 3C. Different-Tenant User (Mismatched Institution)
    // Direct user to canonical URL so app/[tenant]/layout.tsx can render the controlled security isolation screen
    if (rawSlug !== canonicalSlug) {
      const canonicalMismatchUrl = new URL(`/${encodeURIComponent(canonicalSlug)}`, req.url);
      return NextResponse.redirect(canonicalMismatchUrl);
    }

    return NextResponse.next();
  }

  // 4. Case: Subpath with alias (e.g. /sita/dashboard, /sita/hifz, /sita/admission)
  if (rawSlug !== canonicalSlug) {
    const canonicalSubpath = `/${encodeURIComponent(canonicalSlug)}/${segments.slice(1).join('/')}`;
    const targetUrl = new URL(canonicalSubpath, req.url);
    targetUrl.search = req.nextUrl.search;
    return NextResponse.redirect(targetUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets with extensions (.svg, .png, .jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)'
  ]
};
