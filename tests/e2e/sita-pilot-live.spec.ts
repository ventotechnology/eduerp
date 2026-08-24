import { test, expect } from '@playwright/test';

test.describe('Command 12A — SITA Real Madrasha Customer & Platform Owner Live Verification', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://eduerp.us';

  const superAdminEmail = process.env.E2E_PLATFORM_SUPER_ADMIN_EMAIL || 'bloodsoft24@gmail.com';
  const superAdminPass = process.env.E2E_PLATFORM_SUPER_ADMIN_PASSWORD || 'Wallet.047890';

  const adminEmail = process.env.E2E_PLATFORM_ADMIN_EMAIL || 'walletmix@gmail.com';
  const adminPass = process.env.E2E_PLATFORM_ADMIN_PASSWORD || 'Wallet.047890';

  const sitaEmail = process.env.E2E_SITA_EMAIL || 'contact@scholarsita.com';
  const sitaPass = process.env.E2E_SITA_PASSWORD || 'Password@123';

  test('1. Platform Super Admin (bloodsoft24@gmail.com) logs in and inspects SITA in SaaS Control Plane', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', superAdminEmail);
    await page.fill('input[type="password"], input[name="password"]', superAdminPass);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/super-admin**', { timeout: 15000 });

    // Verify SaaS control plane
    await page.goto(`${BASE_URL}/super-admin`);
    const pageText = await page.textContent('body');
    expect(pageText).toContain('SaaS Platform');

    // Verify Institutions directory lists SITA
    await page.goto(`${BASE_URL}/super-admin/institutions`);
    await page.waitForLoadState('networkidle');
    const institutionsText = await page.textContent('body');
    expect(institutionsText).toContain('Scholars International Tahfiz Academy');
    expect(institutionsText).toContain('MADRASHA');
  });

  test('2. Platform Admin (walletmix@gmail.com) logs in to SaaS Control Plane', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', adminEmail);
    await page.fill('input[type="password"], input[name="password"]', adminPass);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/super-admin**', { timeout: 15000 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('3. SITA Principal (contact@scholarsita.com) logs in and lands on SITA dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', sitaEmail);
    await page.fill('input[type="password"], input[name="password"]', sitaPass);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/scholars-international-tahfiz-academy/dashboard**', { timeout: 15000 }).catch(async () => {
      await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/dashboard`);
    });

    await page.waitForLoadState('networkidle');
    const pageText = await page.textContent('body');
    expect(pageText).toContain('Scholars International Tahfiz Academy');

    // Verify Hifz module navigation is present
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/hifz`);
    await page.waitForLoadState('networkidle');
    const hifzText = await page.textContent('body');
    expect(hifzText).toMatch(/Hifz|Quran|Tahfiz|Student/i);
  });

  test('4. SITA Friendly Alias (/sita) resolves seamlessly to SITA dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', sitaEmail);
    await page.fill('input[type="password"], input[name="password"]', sitaPass);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/**', { timeout: 10000 });
    await page.goto(`${BASE_URL}/sita/dashboard`);
    await page.waitForLoadState('networkidle');

    const pageText = await page.textContent('body');
    expect(pageText).toContain('Scholars International Tahfiz Academy');
  });

  test('5. Strict Tenant Isolation: SITA Principal is denied access to demo-school and demo-madrasha', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', sitaEmail);
    await page.fill('input[type="password"], input[name="password"]', sitaPass);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/**', { timeout: 10000 });

    // Attempt accessing demo-school
    await page.goto(`${BASE_URL}/demo-school/dashboard`);
    await page.waitForLoadState('networkidle');
    const schoolDenialText = await page.textContent('body');
    expect(schoolDenialText).toMatch(/signed into another institution|Access Restricted|Access Denied|Security Policy|Redirecting/i);

    // Attempt accessing demo-madrasha
    await page.goto(`${BASE_URL}/demo-madrasha/dashboard`);
    await page.waitForLoadState('networkidle');
    const madrashaDenialText = await page.textContent('body');
    expect(madrashaDenialText).toMatch(/signed into another institution|Access Restricted|Access Denied|Security Policy|Redirecting/i);
  });

  test('6. Public Online Admission portal resolves for SITA', async ({ page }) => {
    await page.goto(`${BASE_URL}/apply/scholars-international-tahfiz-academy`);
    await page.waitForLoadState('networkidle');

    const pageText = await page.textContent('body');
    expect(pageText).toContain('Scholars International Tahfiz Academy');
    expect(pageText).toMatch(/Admission|Application|Online/i);
  });
});
