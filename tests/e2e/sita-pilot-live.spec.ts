import { test, expect } from '@playwright/test';

test.describe('Command 12A.1 — SITA Real Madrasha Customer & Platform Owner Final Routing Contract', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://eduerp.us';

  const superAdminEmail = process.env.E2E_PLATFORM_SUPER_ADMIN_EMAIL || 'bloodsoft24@gmail.com';
  const superAdminPass = process.env.E2E_PLATFORM_SUPER_ADMIN_PASSWORD || 'Wallet.047890';

  const sitaEmail = process.env.E2E_SITA_EMAIL || 'contact@scholarsita.com';
  const sitaPass = process.env.E2E_SITA_PASSWORD || 'Password@123';

  // 1. Anonymous Visitor on Bare Tenant Root -> Redirect to Public CMS Website
  test('1. Anonymous visitor on bare tenant root (/scholars-international-tahfiz-academy) redirects to public website (/site/...)', async ({ page }) => {
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy`);
    await page.waitForLoadState('networkidle');

    // Verify redirected URL is the public site
    expect(page.url()).toContain('/site/scholars-international-tahfiz-academy');

    const pageText = await page.textContent('body');
    expect(pageText).toContain('Scholars International Tahfiz Academy');
    expect(pageText).toMatch(/Excellence in Education|Official Public Institutional Website|EduERP CMS/i);
    expect(pageText).toMatch(/Uttara, Dhaka|Mohammad Saifullah/i);
  });

  // 2. Anonymous Visitor on SITA Alias (/sita) -> Redirect to Public CMS Website
  test('2. Anonymous visitor on alias (/sita) redirects to canonical public website (/site/scholars-international-tahfiz-academy)', async ({ page }) => {
    await page.goto(`${BASE_URL}/sita`);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/site/scholars-international-tahfiz-academy');

    const pageText = await page.textContent('body');
    expect(pageText).toContain('Scholars International Tahfiz Academy');
    expect(pageText).toMatch(/Apply Online for Admission|Excellence in Education/i);
  });

  // 3. Authenticated SITA Principal on Bare Tenant Root -> Redirect to ERP Dashboard
  test('3. Authenticated SITA Principal on /scholars-international-tahfiz-academy redirects to SITA ERP Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', sitaEmail);
    await page.fill('input[type="password"], input[name="password"]', sitaPass);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/scholars-international-tahfiz-academy/**', { timeout: 15000 }).catch(() => {});

    // Now visit bare tenant root while authenticated
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy`);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/scholars-international-tahfiz-academy/dashboard');
    const pageText = await page.textContent('body');
    expect(pageText).toContain('Scholars International Tahfiz Academy');

    // Verify Hifz module navigation
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/hifz`);
    await page.waitForLoadState('networkidle');
    const hifzText = await page.textContent('body');
    expect(hifzText).toMatch(/Hifz|Quran|Tahfiz|Student/i);
  });

  // 4. Authenticated SITA Principal on Alias (/sita) -> Redirect to Canonical ERP Dashboard
  test('4. Authenticated SITA Principal on alias (/sita) redirects to canonical SITA ERP Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', sitaEmail);
    await page.fill('input[type="password"], input[name="password"]', sitaPass);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/scholars-international-tahfiz-academy/**', { timeout: 15000 }).catch(() => {});

    // Now visit alias /sita while authenticated
    await page.goto(`${BASE_URL}/sita`);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/scholars-international-tahfiz-academy/dashboard');
    const pageText = await page.textContent('body');
    expect(pageText).toContain('Scholars International Tahfiz Academy');
  });

  // 5. Authenticated Wrong-Tenant User -> Controlled Multi-Tenant Isolation Screen
  test('5. Authenticated wrong-tenant user accessing SITA root receives isolation mismatch screen', async ({ page }) => {
    // Login as demo-school principal
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', 'principal.demo-school@eduerp.us');
    await page.fill('input[type="password"], input[name="password"]', 'EduERP@2026#Secure');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/demo-school/**', { timeout: 15000 }).catch(() => {});

    // Attempt accessing SITA root
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy`);
    await page.waitForLoadState('networkidle');

    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/signed into another institution|Access Restricted|Access Denied|Security Policy|Redirecting/i);
  });

  // 6. Direct Public Website (/site/scholars-international-tahfiz-academy) Loads Directly
  test('6. Public website (/site/scholars-international-tahfiz-academy) loads directly', async ({ page }) => {
    await page.goto(`${BASE_URL}/site/scholars-international-tahfiz-academy`);
    await page.waitForLoadState('networkidle');

    const pageText = await page.textContent('body');
    expect(pageText).toContain('Scholars International Tahfiz Academy');
    expect(pageText).toMatch(/Excellence in Education|EIIN/i);
  });

  // 7. Public Online Admission (/apply/scholars-international-tahfiz-academy) Loads Directly
  test('7. Public online admission (/apply/scholars-international-tahfiz-academy) loads directly', async ({ page }) => {
    await page.goto(`${BASE_URL}/apply/scholars-international-tahfiz-academy`);
    await page.waitForLoadState('networkidle');

    const pageText = await page.textContent('body');
    expect(pageText).toContain('Scholars International Tahfiz Academy');
    expect(pageText).toMatch(/Admission|Application|Online/i);
  });

  // 8. Platform Super Admin (bloodsoft24@gmail.com) logs in to SaaS Control Plane
  test('8. Platform Super Admin (bloodsoft24@gmail.com) logs in and inspects SITA in SaaS Control Plane', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', superAdminEmail);
    await page.fill('input[type="password"], input[name="password"]', superAdminPass);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/super-admin**', { timeout: 15000 });

    await page.goto(`${BASE_URL}/super-admin/institutions`);
    await page.waitForLoadState('networkidle');
    const institutionsText = await page.textContent('body');
    expect(institutionsText).toContain('Scholars International Tahfiz Academy');
    expect(institutionsText).toContain('MADRASHA');
  });
});
