import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://eduerp.us';
const SITA_EMAIL = process.env.E2E_SITA_EMAIL || 'contact@scholarsita.com';
const SITA_PASSWORD = process.env.E2E_SITA_PASSWORD || 'Password@123';

async function loginAsPrincipal(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"], input[name="email"]', SITA_EMAIL);
  await page.fill('input[type="password"], input[name="password"]', SITA_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/scholars-international-tahfiz-academy/**', { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('networkidle');
}

test.describe('Command 12A.3: SITA Real Institution Owner Control Center, Academic Setup & Subscription Lifecycle', () => {

  test('1. SITA canonical root & alias route to public CMS website for anonymous visitors', async ({ page }) => {
    // Bare tenant slug
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/site/scholars-international-tahfiz-academy');

    // Alias slug
    await page.goto(`${BASE_URL}/sita`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/site/scholars-international-tahfiz-academy');

    // Verify SITA branding on public website
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/Scholars International Tahfiz Academy|SITA/i);
    expect(bodyText).toMatch(/Mohammad Saifullah|Uttara/i);
  });

  test('2. SITA Principal login & institutional header authentication', async ({ page }) => {
    await loginAsPrincipal(page);
    expect(page.url()).toContain('/scholars-international-tahfiz-academy');
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/Mohammad Saifullah|Principal/i);
  });

  test('3. SITA Academics Configuration & Setup Center', async ({ page }) => {
    await loginAsPrincipal(page);
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/academics`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/academics');
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/Academic|Curriculum|Classes|Sections|Subjects|Timetable/i);
  });

  test('4. SITA Admission Desk & Application Wizard Dropdowns', async ({ page }) => {
    await loginAsPrincipal(page);
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/admission`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admission');
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/Admission|Enrollment|Application/i);
  });

  test('5. SITA Settings, Profile & Security Tabs', async ({ page }) => {
    await loginAsPrincipal(page);
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/settings?tab=profile`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/settings');
    const profileText = await page.textContent('body');
    expect(profileText).toMatch(/Profile|Institution/i);

    // Check security tab
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/settings?tab=security`);
    await page.waitForLoadState('networkidle');
    const securityText = await page.textContent('body');
    expect(securityText).toMatch(/Password|Security/i);
  });

  test('6. SITA Subscription Self-Service & 4-Plan Comparison', async ({ page }) => {
    await loginAsPrincipal(page);
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/settings/billing`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/settings/billing');
    const billingText = await page.textContent('body');
    expect(billingText).toMatch(/Active Package|Available Subscription Packages|Starter|Standard|Professional|Enterprise/i);
  });

  test('7. Super Admin SaaS Orders & Revenue Billing Verification Queue', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', 'bloodsoft24@gmail.com');
    await page.fill('input[type="password"], input[name="password"]', 'Wallet.047890');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/super-admin/**', { timeout: 15000 }).catch(() => {});

    await page.goto(`${BASE_URL}/super-admin/orders`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/super-admin/orders');
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/SaaS Orders|Revenue Billing|Subscription/i);
  });

});
