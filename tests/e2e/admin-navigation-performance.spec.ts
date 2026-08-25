import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://eduerp.us';
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'bloodsoft24@gmail.com';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'Wallet.047890';

async function loginAsSuperAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('domcontentloaded');

  await page.fill('input[type="email"], input[name="email"]', SUPER_ADMIN_EMAIL);
  await page.fill('input[type="password"], input[name="password"]', SUPER_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/super-admin**', { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState('networkidle');
}

test.describe('Command 12A.5C: Super Admin Panel Navigation & Content-Ready Performance Profiling', () => {

  test('1. Super Admin Navigation Flow & Dual-Metric Profiling (Route Transition vs Content Ready)', async ({ page }) => {
    await loginAsSuperAdmin(page);
    expect(page.url()).toContain('/super-admin');

    const performanceMatrix: Array<{
      Transition: string;
      Route_Transition_ms: number;
      Content_Ready_ms: number;
    }> = [];

    async function measureAdminHop(
      linkSelector: string,
      targetUrlPattern: string,
      contentHeadingRegex: RegExp,
      transitionName: string
    ) {
      const clickTime = Date.now();
      await page.click(linkSelector);
      await page.waitForURL(targetUrlPattern);
      const urlTime = Date.now();
      await page.getByRole('heading', { name: contentHeadingRegex }).first().waitFor({ timeout: 10000 }).catch(async () => {
        await page.locator('main, table').first().waitFor({ timeout: 10000 });
      });
      const contentTime = Date.now();

      performanceMatrix.push({
        Transition: transitionName,
        Route_Transition_ms: urlTime - clickTime,
        Content_Ready_ms: contentTime - clickTime
      });
    }

    // 1. Overview -> Institutions
    await measureAdminHop(
      'aside a[href*="/super-admin/institutions"]',
      '**/super-admin/institutions',
      /Institution/i,
      'Overview -> Institutions'
    );

    // 2. Institutions -> Subscriptions
    await measureAdminHop(
      'aside a[href*="/super-admin/subscriptions"]',
      '**/super-admin/subscriptions',
      /Subscription/i,
      'Institutions -> Subscriptions'
    );

    // 3. Subscriptions -> Plans & Pricing
    await measureAdminHop(
      'aside a[href*="/super-admin/plans"]',
      '**/super-admin/plans',
      /Plan|Pricing/i,
      'Subscriptions -> Plans & Pricing'
    );

    // 4. Plans -> Orders & Revenue
    await measureAdminHop(
      'aside a[href*="/super-admin/orders"]',
      '**/super-admin/orders',
      /Order|Revenue/i,
      'Plans -> Orders & Revenue'
    );

    // 5. Orders -> Payment Gateways
    await measureAdminHop(
      'aside a[href*="/super-admin/gateways"]',
      '**/super-admin/gateways',
      /Gateway|Payment/i,
      'Orders -> Payment Gateways'
    );

    // 6. Payment Gateways -> Universal SMS
    await measureAdminHop(
      'aside a[href*="/super-admin/sms"]',
      '**/super-admin/sms',
      /SMS|Universal/i,
      'Gateways -> Universal SMS'
    );

    // 7. Universal SMS -> Support Desk
    await measureAdminHop(
      'aside a[href*="/super-admin/support"]',
      '**/super-admin/support',
      /Support|Ticket/i,
      'Universal SMS -> Support Desk'
    );

    // 8. Support Desk -> Platform Users
    await measureAdminHop(
      'aside a[href*="/super-admin/users"]',
      '**/super-admin/users',
      /User|Admin/i,
      'Support -> Platform Users'
    );

    // 9. Platform Users -> Platform Settings
    await measureAdminHop(
      'aside a[href*="/super-admin/settings"]',
      '**/super-admin/settings',
      /Setting|Configuration/i,
      'Platform Users -> Settings'
    );

    // 10. Cache Return Hop: Settings -> Institutions
    await measureAdminHop(
      'aside a[href*="/super-admin/institutions"]',
      '**/super-admin/institutions',
      /Institution/i,
      'Return -> Institutions (Cached)'
    );

    console.log('=== SUPER ADMIN PANEL NAVIGATION PERFORMANCE DUAL-METRIC MATRIX ===');
    console.table(performanceMatrix);

    expect(performanceMatrix.length).toBe(10);
  });
});
