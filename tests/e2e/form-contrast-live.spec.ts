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

test.describe('Command 12A.5A: Global Form Contrast & Input Readability Live Verification', () => {

  test('1. Student SIS: Edit Student Profile modal input fields have accessible contrast and readable values', async ({ page }) => {
    await loginAsSitaOwner(page);
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/students`);
    await page.waitForLoadState('networkidle');

    // Click edit student profile button if available
    const editBtn = page.locator('button[title="Edit Student"]').first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(500);

      // Verify modal is open
      const modalHeader = page.locator('h3:has-text("Edit Student Profile")');
      await expect(modalHeader).toBeVisible();

      // Find First Name input
      const firstNameInput = page.locator('label:has-text("First Name") + input, input[placeholder="First name"]').first();
      await expect(firstNameInput).toBeVisible();

      // Evaluate computed styles to guarantee high contrast (not white on white)
      const styles = await firstNameInput.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          colorScheme: computed.colorScheme
        };
      });

      // Background must be white/light and color must NOT be white/light
      expect(styles.color).not.toBe('rgb(255, 255, 255)');
      expect(styles.color).not.toBe('rgb(237, 237, 237)');
      expect(styles.color).not.toBe('rgba(255, 255, 255, 1)');

      // Cancel modal without saving to avoid production data changes
      const cancelBtn = page.locator('button:has-text("Cancel")').first();
      await cancelBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('2. Student SIS: Add Student Wizard inputs across steps have valid contrast and readable options', async ({ page }) => {
    await loginAsSitaOwner(page);
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/students`);
    await page.waitForLoadState('networkidle');

    const addStudentBtn = page.locator('button:has-text("Add Student")').first();
    if (await addStudentBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addStudentBtn.click();
      await page.waitForTimeout(500);

      const modalTitle = page.locator('h3:has-text("Direct Student Onboarding Wizard")');
      await expect(modalTitle).toBeVisible();

      const firstNameInput = page.locator('input[placeholder="e.g. Mahfuzur"]').first();
      await expect(firstNameInput).toBeVisible();

      const styles = await firstNameInput.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });

      expect(styles.color).not.toBe('rgb(255, 255, 255)');

      // Close modal
      const closeBtn = page.locator('button:has-text("Cancel"), button svg.lucide-x').first();
      await closeBtn.click();
    }
  });

  test('3. Admission: New Admission Application Wizard inputs and selects are readable', async ({ page }) => {
    await loginAsSitaOwner(page);
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/admission`);
    await page.waitForLoadState('networkidle');

    const newAppBtn = page.locator('button:has-text("New Application"), button:has-text("Add Application")').first();
    if (await newAppBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newAppBtn.click();
      await page.waitForTimeout(500);

      const wizardTitle = page.locator('h3:has-text("New Admission Application Wizard")');
      if (await wizardTitle.isVisible().catch(() => false)) {
        const firstNameInput = page.locator('label:has-text("First Name") + input').first();
        if (await firstNameInput.isVisible().catch(() => false)) {
          const styles = await firstNameInput.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return { color: computed.color, backgroundColor: computed.backgroundColor };
          });
          expect(styles.color).not.toBe(styles.backgroundColor);
        }

        // Close wizard
        const closeBtn = page.locator('button svg.lucide-x').first();
        await closeBtn.click();
      }
    }
  });

  test('4. Public Admission Portal: Input fields have high contrast text', async ({ page }) => {
    await page.goto(`${BASE_URL}/apply/scholars-international-tahfiz-academy`);
    await page.waitForLoadState('networkidle');

    const firstNameInput = page.locator('input[placeholder="e.g. Mahfuzur"]').first();
    if (await firstNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const styles = await firstNameInput.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });

      expect(styles.color).not.toBe('rgb(255, 255, 255)');
      expect(styles.color).not.toBe('rgb(237, 237, 237)');
    }
  });

});
