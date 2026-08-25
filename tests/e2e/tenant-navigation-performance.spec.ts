import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://eduerp.us';
const SITA_EMAIL = process.env.E2E_SITA_EMAIL || 'contact@scholarsita.com';
const SITA_PASSWORD = process.env.E2E_SITA_PASSWORD || 'Password@123';

async function loginAsPrincipal(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"], input[name="email"]', SITA_EMAIL);
  await page.fill('input[type="password"], input[name="password"]', SITA_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/scholars-international-tahfiz-academy/**', { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState('networkidle');
}

test.describe('Command 12A.5C: Tenant Panel Navigation & Content-Ready Performance Profiling', () => {

  test('1. SITA Authenticated Left Sidebar Warm Navigation Flow & Dual-Metric Profiling', async ({ page }) => {
    await loginAsPrincipal(page);
    expect(page.url()).toContain('/scholars-international-tahfiz-academy');

    const performanceMatrix: Array<{
      Transition: string;
      Route_Transition_ms: number;
      Content_Ready_ms: number;
    }> = [];

    // Helper to measure both URL change and primary content readiness
    async function measureHop(
      linkSelector: string,
      targetUrlPattern: string,
      contentSelector: string,
      transitionName: string
    ) {
      const clickTime = Date.now();
      await page.click(linkSelector);
      await page.waitForURL(targetUrlPattern);
      const urlTime = Date.now();
      await page.locator(contentSelector).first().waitFor({ timeout: 10000 });
      const contentTime = Date.now();

      const routeTransition = urlTime - clickTime;
      const contentReady = contentTime - clickTime;

      performanceMatrix.push({
        Transition: transitionName,
        Route_Transition_ms: routeTransition,
        Content_Ready_ms: contentReady
      });
    }

    // 1. Dashboard -> Students
    await measureHop(
      'aside a[href*="/students"]',
      '**/students',
      'table, tbody tr, text=/Student Information System|Students|Directory/i',
      'Dashboard -> Students'
    );

    // 2. Students -> Academics
    await measureHop(
      'aside a[href*="/academics"]',
      '**/academics',
      'text=/Academic Year|Structure|Curriculum/i',
      'Students -> Academics'
    );

    // 3. Academics -> Examination
    await measureHop(
      'aside a[href*="/examination"]',
      '**/examination',
      'text=/Examination|Exam|Marks|Grading/i',
      'Academics -> Examination'
    );

    // 4. Examination -> LMS
    await measureHop(
      'aside a[href*="/lms"]',
      '**/lms',
      'text=/Learning Management|Courses|LMS/i',
      'Examination -> LMS'
    );

    // 5. LMS -> Finance
    await measureHop(
      'aside a[href*="/finance"]',
      '**/finance',
      'text=/Finance|Accounting|Accounts|Invoices/i',
      'LMS -> Finance'
    );

    // 6. Finance -> HR
    await measureHop(
      'aside a[href*="/hr"]',
      '**/hr',
      'text=/Human Resources|Workforce|Employees|Staff/i',
      'Finance -> HR'
    );

    // 7. HR -> Facilities
    await measureHop(
      'aside a[href*="/facilities"]',
      '**/facilities',
      'text=/Facilities|Logistics|Hostel|Library|Transport/i',
      'HR -> Facilities'
    );

    // 8. Facilities -> Communication
    await measureHop(
      'aside a[href*="/communication"]',
      '**/communication',
      'text=/Communication|Notices|SMS Broadcast/i',
      'Facilities -> Communication'
    );

    // 9. Cache Return Navigation: Communication -> Students
    await measureHop(
      'aside a[href*="/students"]',
      '**/students',
      'table, tbody tr, text=/Student Information System|Students|Directory/i',
      'Return -> Students (Cached)'
    );

    console.log('=== TENANT PANEL NAVIGATION PERFORMANCE DUAL-METRIC MATRIX ===');
    console.table(performanceMatrix);

    expect(performanceMatrix.length).toBe(9);
  });

  test('2. Student SIS first row render and search debounce responsiveness', async ({ page }) => {
    await loginAsPrincipal(page);
    await page.click('aside a[href*="/students"]');
    await page.waitForURL('**/students');
    await page.waitForLoadState('networkidle');

    // Verify student page rendered without crashing
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toMatch(/Student Information System|Student SIS|Students/i);

    // Test debounced search without error
    const searchInput = page.locator('input[placeholder*="Search"]').first();
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
    await page.waitForLoadState('networkidle');

    // Assert Academic Years view is visible
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toMatch(/Academic Year|2026|Curriculum/i);
  });

});
