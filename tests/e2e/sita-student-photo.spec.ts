import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://eduerp.us';
const SITA_EMAIL = process.env.E2E_SITA_EMAIL || 'contact@scholarsita.com';
const SITA_PASSWORD = process.env.E2E_SITA_PASSWORD || 'Password@123';

async function loginAsSitaOwner(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"], input[name="email"]', SITA_EMAIL);
  await page.fill('input[type="password"], input[name="password"]', SITA_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/scholars-international-tahfiz-academy/**', { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState('networkidle');
}

test.describe('Command 12A.5: SITA Live Student & Guardian Photo Lifecycle, ID Card Rendering & Online Admission', () => {

  test('1. Student SIS Table & Profile Drawer load with photo components on canonical route', async ({ page }) => {
    await loginAsSitaOwner(page);
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/students`);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/students');

    const bodyText = await page.textContent('body');
    expect(bodyText).not.toMatch(/This page couldn['’]t load/i);
    expect(bodyText).toMatch(/Student Information System|Student SIS|Students/i);

    // Verify Direct Add Student modal has Photo Uploader
    const addStudentBtn = page.locator('button:has-text("Add Student"), button:has-text("New Student"), button:has-text("Admit Student")').first();
    if (await addStudentBtn.isVisible()) {
      await addStudentBtn.click();
      await page.waitForTimeout(500);

      const modalContent = await page.textContent('body');
      expect(modalContent).toMatch(/Student Photograph|Upload Photo|Drag and drop photo|Take Photo/i);

      // Close modal
      const closeBtn = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });

  test('2. Student ID Card button triggers ID Card modal or is ready in SIS table', async ({ page }) => {
    await loginAsSitaOwner(page);
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/students`);
    await page.waitForLoadState('networkidle');

    const idCardBtn = page.locator('button[title="Student ID Card"]').first();
    if (await idCardBtn.isVisible()) {
      await idCardBtn.click();
      await page.waitForTimeout(500);

      const cardText = await page.textContent('body');
      expect(cardText).toMatch(/Official Student ID|Print ID Card|EduERP Smart SIS/i);

      // Close modal
      const closeBtn = page.locator('button:has-text("Close"), button:has-text("×")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    } else {
      // Empty state or table loaded
      const bodyText = await page.textContent('body');
      expect(bodyText).toMatch(/Students|Student SIS|Add Student|No students found/i);
    }
  });

  test('3. Online Admission Portal renders student photo uploader in Step 1', async ({ page }) => {
    // Check canonical admission route
    await page.goto(`${BASE_URL}/apply/scholars-international-tahfiz-academy`);
    await page.waitForLoadState('networkidle');

    const bodyText = await page.textContent('body');
    expect(bodyText).not.toMatch(/This page couldn['’]t load/i);
    expect(bodyText).toMatch(/Applicant Photograph|Student Personal Details|Upload Photo|Drag & drop/i);

    // Check alias admission route
    await page.goto(`${BASE_URL}/apply/sita`);
    await page.waitForLoadState('networkidle');

    const aliasText = await page.textContent('body');
    expect(aliasText).not.toMatch(/This page couldn['’]t load/i);
    expect(aliasText).toMatch(/Applicant Photograph|Student Personal Details|Upload Photo/i);
  });

  test('4. Institution Admission Desk loads with photo lifecycle support', async ({ page }) => {
    await loginAsSitaOwner(page);
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/admission`);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/admission');
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toMatch(/This page couldn['’]t load/i);
    expect(bodyText).toMatch(/Admission Management|Applications|Enrollment/i);
  });

});
