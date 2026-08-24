import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';
import { db } from '../lib/db';
import { createSessionToken, SESSION_COOKIE_NAME } from '../lib/auth/session';
import { provisionSitaAndPlatformAccounts } from '../scripts/provision-sita-client';

describe('Command 12A.1 — Intelligent Bare Tenant Root Routing & Alias Resolution Suite', () => {
  let sitaUserToken: string;
  let demoSchoolToken: string;
  let superAdminToken: string;

  beforeAll(async () => {
    await provisionSitaAndPlatformAccounts();

    const sitaTenant = await db.tenant.findUnique({
      where: { slug: 'scholars-international-tahfiz-academy' }
    });
    const sitaUser = await db.user.findUnique({
      where: { email: 'contact@scholarsita.com' }
    });

    sitaUserToken = createSessionToken({
      userId: sitaUser!.id,
      email: sitaUser!.email,
      role: sitaUser!.role as any,
      tenantId: sitaTenant!.id,
      tenantSlug: sitaTenant!.slug
    });

    demoSchoolToken = createSessionToken({
      userId: 'demo-school-principal-id',
      email: 'principal.demo-school@eduerp.us',
      role: 'PRINCIPAL' as any,
      tenantId: 'demo-school-id',
      tenantSlug: 'demo-school'
    });

    superAdminToken = createSessionToken({
      userId: 'super-admin-id',
      email: 'bloodsoft24@gmail.com',
      role: 'PLATFORM_SUPER_ADMIN' as any,
      tenantId: null,
      tenantSlug: null
    });
  });

  // 1. Anonymous Visitor on Bare Tenant Root
  it('1. Anonymous visitor on /scholars-international-tahfiz-academy redirects to /site/scholars-international-tahfiz-academy', () => {
    const req = new NextRequest('https://eduerp.us/scholars-international-tahfiz-academy');
    const res = middleware(req);

    expect(res).toBeDefined();
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/site/scholars-international-tahfiz-academy');
  });

  // 2. Anonymous Visitor on SITA Alias
  it('2. Anonymous visitor on /sita redirects to /site/scholars-international-tahfiz-academy', () => {
    const req = new NextRequest('https://eduerp.us/sita');
    const res = middleware(req);

    expect(res).toBeDefined();
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/site/scholars-international-tahfiz-academy');
  });

  // 3. Anonymous Visitor on Demo Tenant Root
  it('3. Anonymous visitor on /demo-school redirects to /site/demo-school', () => {
    const req = new NextRequest('https://eduerp.us/demo-school');
    const res = middleware(req);

    expect(res).toBeDefined();
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/site/demo-school');
  });

  // 4. Authenticated SITA User on Canonical Root
  it('4. Authenticated SITA user on /scholars-international-tahfiz-academy redirects to SITA dashboard', () => {
    const req = new NextRequest('https://eduerp.us/scholars-international-tahfiz-academy', {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${sitaUserToken}`
      }
    });
    const res = middleware(req);

    expect(res).toBeDefined();
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/scholars-international-tahfiz-academy/dashboard');
  });

  // 5. Authenticated SITA User on SITA Alias
  it('5. Authenticated SITA user on /sita redirects to canonical SITA dashboard', () => {
    const req = new NextRequest('https://eduerp.us/sita', {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${sitaUserToken}`
      }
    });
    const res = middleware(req);

    expect(res).toBeDefined();
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/scholars-international-tahfiz-academy/dashboard');
  });

  // 6. Authenticated SITA User on Subpath Alias (/sita/hifz)
  it('6. Authenticated SITA user on /sita/hifz redirects to /scholars-international-tahfiz-academy/hifz', () => {
    const req = new NextRequest('https://eduerp.us/sita/hifz', {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${sitaUserToken}`
      }
    });
    const res = middleware(req);

    expect(res).toBeDefined();
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/scholars-international-tahfiz-academy/hifz');
  });

  // 7. Authenticated Wrong-Tenant User on SITA Root
  it('7. Authenticated demo-school user on /scholars-international-tahfiz-academy proceeds to isolation denial screen', () => {
    const req = new NextRequest('https://eduerp.us/scholars-international-tahfiz-academy', {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${demoSchoolToken}`
      }
    });
    const res = middleware(req);

    // Middleware allows request to proceed to layout.tsx which renders the isolation mismatch guard
    expect(res.status).not.toBe(307);
  });

  // 8. Super Admin on SITA Root
  it('8. Platform Super Admin on /sita redirects to SITA dashboard with support banner', () => {
    const req = new NextRequest('https://eduerp.us/sita', {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${superAdminToken}`
      }
    });
    const res = middleware(req);

    expect(res).toBeDefined();
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/scholars-international-tahfiz-academy/dashboard');
  });

  // 9. Public CMS Route (/site/...) Passes Through
  it('9. Public website route /site/scholars-international-tahfiz-academy passes through middleware', () => {
    const req = new NextRequest('https://eduerp.us/site/scholars-international-tahfiz-academy');
    const res = middleware(req);

    // Pass through to Next.js page renderer
    expect(res.status).toBe(200);
  });

  // 10. Public Admission Route (/apply/...) Passes Through
  it('10. Public admission route /apply/scholars-international-tahfiz-academy passes through middleware', () => {
    const req = new NextRequest('https://eduerp.us/apply/scholars-international-tahfiz-academy');
    const res = middleware(req);

    expect(res.status).toBe(200);
  });

  // 11. Dynamic Database Resolution for SITA
  it('11. Database contains real customer record for SITA', async () => {
    const tenant = await db.tenant.findUnique({
      where: { slug: 'scholars-international-tahfiz-academy' },
      include: { institution: true }
    });

    expect(tenant).toBeDefined();
    expect(tenant?.isDemoTenant).toBe(false);
    expect(tenant?.institution?.name).toBe('Scholars International Tahfiz Academy');
    expect(tenant?.institution?.address).toContain('Uttara, Dhaka');
  });
});
