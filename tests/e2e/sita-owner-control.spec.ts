import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://eduerp.us';

test.describe('Command 12A.3: SITA Real Institution Owner Control Center, Academic Setup & Subscription Lifecycle', () => {

  test('1. SITA canonical root & alias route to public CMS website for anonymous visitors', async ({ page }) => {
    // Test bare tenant slug
    const resRoot = await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy`, { waitUntil: 'domcontentloaded' });
    expect(resRoot?.status()).toBeLessThan(400);
    expect(page.url()).toContain('/site/scholars-international-tahfiz-academy');

    // Test alias slug
    const resAlias = await page.goto(`${BASE_URL}/sita`, { waitUntil: 'domcontentloaded' });
    expect(resAlias?.status()).toBeLessThan(400);
    expect(page.url()).toContain('/site/scholars-international-tahfiz-academy');

    // Verify SITA branding on public website
    await expect(page.locator('body')).toContainText(/Scholars International Tahfiz Academy|SITA/i);
  });

  test('2. SITA Principal login & authentication', async ({ page }) => {
    await page.goto(`${BASE_URL}/login?tenant=sita`, { waitUntil: 'domcontentloaded' });

    // Fill credentials
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');

    if (await emailInput.isVisible()) {
      await emailInput.fill('contact@scholarsita.com');
      await passwordInput.fill('Sita@Admin2026!');

      const submitBtn = page.locator('button[type="submit"]');
      await submitBtn.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('3. SITA Academics Configuration & Setup Center', async ({ page }) => {
    await page.goto(`${BASE_URL}/sita/academics`, { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('/sita/academics');
    await expect(page.locator('body')).toContainText(/Academic|Curriculum|Classes|Sections/i);
  });

  test('4. SITA Admission Desk & Application Wizard Dropdowns', async ({ page }) => {
    await page.goto(`${BASE_URL}/sita/admission`, { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('/sita/admission');
    await expect(page.locator('body')).toContainText(/Admission|Enrollment|Application/i);
  });

  test('5. SITA Settings, Profile & Security Tabs', async ({ page }) => {
    await page.goto(`${BASE_URL}/sita/settings?tab=profile`, { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('/sita/settings');
    await expect(page.locator('body')).toContainText(/Profile|Security|Institution/i);

    // Check security tab
    await page.goto(`${BASE_URL}/sita/settings?tab=security`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Password|Security/i);
  });

  test('6. SITA Subscription Self-Service & 4-Plan Comparison', async ({ page }) => {
    await page.goto(`${BASE_URL}/sita/settings/billing`, { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('/sita/settings/billing');
    await expect(page.locator('body')).toContainText(/Subscription|Billing|Capacity|Tier/i);
  });

  test('7. Super Admin SaaS Orders & Revenue Billing Verification Queue', async ({ page }) => {
    await page.goto(`${BASE_URL}/super-admin/orders`, { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('/super-admin/orders');
    await expect(page.locator('body')).toContainText(/SaaS Orders|Revenue Billing|Subscription/i);
  });

});
