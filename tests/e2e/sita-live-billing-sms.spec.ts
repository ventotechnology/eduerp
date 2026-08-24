import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://eduerp.us';
const SITA_EMAIL = process.env.E2E_SITA_EMAIL || 'contact@scholarsita.com';
const SITA_PASSWORD = process.env.E2E_SITA_PASSWORD || 'Password@123';
const SUPER_ADMIN_EMAIL = process.env.E2E_SUPER_ADMIN_EMAIL || 'bloodsoft24@gmail.com';
const SUPER_ADMIN_PASSWORD = process.env.E2E_SUPER_ADMIN_PASSWORD || 'Wallet.047890';

async function loginAsPrincipal(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"], input[name="email"]', SITA_EMAIL);
  await page.fill('input[type="password"], input[name="password"]', SITA_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/scholars-international-tahfiz-academy/**', { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('networkidle');
}

async function loginAsSuperAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"], input[name="email"]', SUPER_ADMIN_EMAIL);
  await page.fill('input[type="password"], input[name="password"]', SUPER_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/super-admin/**', { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('networkidle');
}

test.describe('Command 12A.4: SITA Live Billing Recovery, Zero-Hardcode Engine & Universal SMS Architecture', () => {

  test('1. SITA Billing Page loads cleanly without "This page couldn’t load" crash on canonical slug', async ({ page }) => {
    await loginAsPrincipal(page);
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/settings/billing`);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/settings/billing');

    const bodyText = await page.textContent('body');
    // Ensure no React child object crash or error boundary error
    expect(bodyText).not.toMatch(/This page couldn['’]t load/i);
    expect(bodyText).not.toMatch(/Objects are not valid as a React child/i);

    // Ensure real subscription data is displayed
    expect(bodyText).toMatch(/Subscription & Billing Operations|Active Package/i);
    expect(bodyText).toMatch(/SMS Quota|Student Capacity|Available Subscription Packages/i);
    expect(bodyText).toMatch(/Enterprise|Professional|Standard|Starter/i);
  });

  test('2. SITA Billing Page resolves properly on alias route /sita/settings/billing', async ({ page }) => {
    await loginAsPrincipal(page);
    await page.goto(`${BASE_URL}/sita/settings/billing`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).not.toMatch(/This page couldn['’]t load/i);
    expect(bodyText).toMatch(/Subscription & Billing Operations|Active Package/i);
  });

  test('3. SITA SMS Settings Page loads with provider routing options', async ({ page }) => {
    await loginAsPrincipal(page);
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/settings/sms`);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/settings/sms');

    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/SMS Gateway & Messaging Architecture|Service Mode|EduERP Universal SMS|Institution's Own SMS Gateway/i);
    expect(bodyText).toMatch(/Included Quota|Available Credits|Test Active Gateway Connectivity/i);
  });

  test('4. SITA Communication Page displays live SMS segment counter & gateway status', async ({ page }) => {
    await loginAsPrincipal(page);
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/communication`);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/communication');

    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/Instant SMS Broadcast Gateway|Target Recipients|Remaining Quota/i);

    // Fill Bangla message to verify dynamic segment counter
    const textarea = page.locator('textarea').last();
    await textarea.fill('আসসালামু আলাইকুম, আগামীকাল মাদরাসা খোলা থাকবে।');
    
    const updatedText = await page.textContent('body');
    expect(updatedText).toMatch(/বাংলা \/ Unicode/i);
  });

  test('5. Super Admin SMS Control Center loads with Universal Gateways and Addon Bundles', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto(`${BASE_URL}/super-admin/sms`);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/super-admin/sms');

    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/Platform Universal SMS Gateway|Configured Platform Providers|SMS Credit Add-On Packages/i);
  });

});
