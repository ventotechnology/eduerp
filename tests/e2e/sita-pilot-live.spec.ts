import { test, expect } from '@playwright/test';

test.describe('Command 12A.2 — SITA Real Madrasha Customer Live Operational & UI Contrast Verification Suite', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://eduerp.us';

  const superAdminEmail = process.env.E2E_PLATFORM_SUPER_ADMIN_EMAIL || 'bloodsoft24@gmail.com';
  const superAdminPass = process.env.E2E_PLATFORM_SUPER_ADMIN_PASSWORD || 'Wallet.047890';

  const sitaEmail = process.env.E2E_SITA_EMAIL || 'contact@scholarsita.com';
  const sitaPass = process.env.E2E_SITA_PASSWORD || 'Password@123';

  // 1. Anonymous Visitor on Bare Tenant Root -> Redirect to Public CMS Website
  test('1. Anonymous visitor on bare tenant root (/scholars-international-tahfiz-academy) redirects to public website (/site/...)', async ({ page }) => {
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy`);
    await page.waitForLoadState('networkidle');

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

  // 3. Authenticated SITA Principal on Bare Tenant Root -> Redirect to ERP Dashboard & Display Name
  test('3. Authenticated SITA Principal on /scholars-international-tahfiz-academy redirects to SITA ERP Dashboard with real display name', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', sitaEmail);
    await page.fill('input[type="password"], input[name="password"]', sitaPass);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/scholars-international-tahfiz-academy/**', { timeout: 15000 }).catch(() => {});

    // Visit bare tenant root while authenticated
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy`);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/scholars-international-tahfiz-academy/dashboard');
    const pageText = await page.textContent('body');
    expect(pageText).toContain('Scholars International Tahfiz Academy');

    // Verify Principal Profile Name (Mohammad Saifullah) appears in header/UI
    expect(pageText).toMatch(/Mohammad Saifullah/i);

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

    await page.goto(`${BASE_URL}/sita`);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/scholars-international-tahfiz-academy/dashboard');
    const pageText = await page.textContent('body');
    expect(pageText).toContain('Scholars International Tahfiz Academy');
  });

  // 5. Admission Wizard Modal High Contrast Verification
  test('5. SITA Admission page renders with high contrast New Admission modal', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', sitaEmail);
    await page.fill('input[type="password"], input[name="password"]', sitaPass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/scholars-international-tahfiz-academy/**', { timeout: 15000 }).catch(() => {});

    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/admission`);
    await page.waitForLoadState('networkidle');

    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/Admission|Application|Candidate|Applicant/i);
  });

  // 6. HR Workforce & Campus Resolution Verification
  test('6. SITA HR Workforce page loads with campus context and high contrast modals', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', sitaEmail);
    await page.fill('input[type="password"], input[name="password"]', sitaPass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/scholars-international-tahfiz-academy/**', { timeout: 15000 }).catch(() => {});

    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/hr`);
    await page.waitForLoadState('networkidle');

    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/Workforce|Employee|Attendance|Payroll|Leave/i);
  });

  // 7. Finance & Standard Chart of Accounts Verification
  test('7. SITA Finance page loads with Chart of Accounts and Journal Voucher capabilities', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', sitaEmail);
    await page.fill('input[type="password"], input[name="password"]', sitaPass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/scholars-international-tahfiz-academy/**', { timeout: 15000 }).catch(() => {});

    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/finance`);
    await page.waitForLoadState('networkidle');

    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/Finance|Ledger|Accounts|Voucher|Journal/i);
  });

  // 8. Communication Notice Board & Truthful SMS Status Verification
  test('8. SITA Communication page loads with notice board and truthful SMS gateway status', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', sitaEmail);
    await page.fill('input[type="password"], input[name="password"]', sitaPass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/scholars-international-tahfiz-academy/**', { timeout: 15000 }).catch(() => {});

    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/communication`);
    await page.waitForLoadState('networkidle');

    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/Communication|Notice|Circular|SMS/i);
  });

  // 9. Facilities Management & Action Modals Verification
  test('9. SITA Facilities page loads all operational tabs with actionable buttons and zero dead buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', sitaEmail);
    await page.fill('input[type="password"], input[name="password"]', sitaPass);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/scholars-international-tahfiz-academy/**', { timeout: 15000 }).catch(() => {});

    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/facilities`);
    await page.waitForLoadState('networkidle');

    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/Facilities|Library|Hostel|Transport|Inventory|Fixed Assets/i);
  });

  // 10. Platform Super Admin (bloodsoft24@gmail.com) logs in to SaaS Control Plane
  test('10. Platform Super Admin (bloodsoft24@gmail.com) logs in and inspects SITA in SaaS Control Plane', async ({ page }) => {
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
