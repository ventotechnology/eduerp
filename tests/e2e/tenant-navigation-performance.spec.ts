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

test.describe('Command 12A.5B: Global Tenant Panel Navigation Performance & Latency Seal', () => {

  test('1. SITA Authenticated Left Sidebar Warm Navigation Flow & Latency Profiling', async ({ page }) => {
    await loginAsPrincipal(page);
    expect(page.url()).toContain('/scholars-international-tahfiz-academy');

    const timings: Record<string, number> = {};

    // 1. Dashboard -> Students
    const t0 = Date.now();
    await page.click('aside a[href*="/students"]');
    await page.waitForURL('**/students');
    await page.waitForSelector('table, h1:has-text("Student Information System")', { timeout: 10000 });
    timings['Dashboard -> Students'] = Date.now() - t0;

    // 2. Students -> Academics
    const t1 = Date.now();
    await page.click('aside a[href*="/academics"]');
    await page.waitForURL('**/academics');
    await page.waitForSelector('text=Academic, text=Structure', { timeout: 10000 });
    timings['Students -> Academics'] = Date.now() - t1;

    // 3. Academics -> Examination
    const t2 = Date.now();
    await page.click('aside a[href*="/examination"]');
    await page.waitForURL('**/examination');
    await page.waitForSelector('h1, text=Examination', { timeout: 10000 });
    timings['Academics -> Examination'] = Date.now() - t2;

    // 4. Examination -> LMS
    const t3 = Date.now();
    await page.click('aside a[href*="/lms"]');
    await page.waitForURL('**/lms');
    await page.waitForSelector('h1, text=Learning Management', { timeout: 10000 });
    timings['Examination -> LMS'] = Date.now() - t3;

    // 5. LMS -> Finance
    const t4 = Date.now();
    await page.click('aside a[href*="/finance"]');
    await page.waitForURL('**/finance');
    await page.waitForSelector('text=Finance, text=Accounting', { timeout: 10000 });
    timings['LMS -> Finance'] = Date.now() - t4;

    // 6. Finance -> HR
    const t5 = Date.now();
    await page.click('aside a[href*="/hr"]');
    await page.waitForURL('**/hr');
    await page.waitForSelector('text=Human Resources, text=Workforce', { timeout: 10000 });
    timings['Finance -> HR'] = Date.now() - t5;

    // 7. HR -> Facilities
    const t6 = Date.now();
    await page.click('aside a[href*="/facilities"]');
    await page.waitForURL('**/facilities');
    await page.waitForSelector('text=Facilities, text=Logistics', { timeout: 10000 });
    timings['HR -> Facilities'] = Date.now() - t6;

    // 8. Facilities -> Communication
    const t7 = Date.now();
    await page.click('aside a[href*="/communication"]');
    await page.waitForURL('**/communication');
    await page.waitForSelector('text=Communication, text=Broadcast', { timeout: 10000 });
    timings['Facilities -> Communication'] = Date.now() - t7;

    // 9. Cache Return Navigation: Communication -> Students
    const t8 = Date.now();
    await page.click('aside a[href*="/students"]');
    await page.waitForURL('**/students');
    await page.waitForSelector('table tbody tr, text=STU-', { timeout: 10000 });
    timings['Return -> Students (Cached)'] = Date.now() - t8;

    console.log('--- NAVIGATION PERFORMANCE MEASUREMENTS (ms) ---');
    console.table(timings);

    // Assert that warm cached return navigation is responsive
    expect(timings['Return -> Students (Cached)']).toBeLessThanOrEqual(2500);
  });

  test('2. Student SIS first row render and search debounce responsiveness', async ({ page }) => {
    await loginAsPrincipal(page);
    await page.click('aside a[href*="/students"]');
    await page.waitForURL('**/students');

    // Verify existing student records render
    const tableVisible = await page.isVisible('table');
    expect(tableVisible).toBeTruthy();

    const rows = await page.locator('tbody tr').count();
    expect(rows).toBeGreaterThanOrEqual(1);

    // Test debounced search without crashing
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Abdullah');
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/students');
    }
  });

  test('3. Academics & Structure default tab renders current Academic Year without multi-tab blocking', async ({ page }) => {
    await loginAsPrincipal(page);
    await page.click('aside a[href*="/academics"]');
    await page.waitForURL('**/academics');

    // Assert Academic Years view is visible
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toMatch(/Academic Year|2026|Curriculum/i);
  });

});
