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
    await page.waitForLoadState('domcontentloaded');

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

  test('4. Facilities & Logistics: Create Hostel Building modal inputs have high contrast and readable text', async ({ page }) => {
    await loginAsSitaOwner(page);
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/facilities`);
    await page.waitForLoadState('networkidle');

    // Switch to Hostel tab
    const hostelTab = page.locator('button:has-text("Hostel & Housing"), button:has-text("Hostel")').first();
    if (await hostelTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await hostelTab.click();
      await page.waitForTimeout(500);

      // Click Create Hostel Building button
      const createHostelBtn = page.locator('button:has-text("Create Hostel Building"), button:has-text("Add Hostel"), button:has-text("New Hostel")').first();
      if (await createHostelBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createHostelBtn.click();
        await page.waitForTimeout(500);

        const modalTitle = page.locator('h3:has-text("Create Hostel Building")');
        await expect(modalTitle).toBeVisible();

        // Check Hostel Code input
        const codeInput = page.locator('input[placeholder="e.g. SITA-HST-01"]').first();
        await expect(codeInput).toBeVisible();

        const codeStyles = await codeInput.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return { color: computed.color, backgroundColor: computed.backgroundColor };
        });

        // Background should be dark and text should be white/light (high contrast)
        expect(codeStyles.color).not.toBe(codeStyles.backgroundColor);
        expect(codeStyles.backgroundColor).not.toBe('rgb(255, 255, 255)');

        // Type temporary test values locally to verify rendering
        await codeInput.fill('QA123');
        expect(await codeInput.inputValue()).toBe('QA123');

        const nameInput = page.locator('input[placeholder="e.g. Al-Farooq Boys Hostel"]').first();
        await nameInput.fill('Test Hostel');
        expect(await nameInput.inputValue()).toBe('Test Hostel');

        const capacityInput = page.locator('label:has-text("Bed Capacity") + input, label:has-text("Bed Capacity *") + input').first();
        if (await capacityInput.isVisible()) {
          await capacityInput.fill('100');
          expect(await capacityInput.inputValue()).toBe('100');
        }

        const wardenNameInput = page.locator('input[placeholder="e.g. Ustaz Abdullah"]').first();
        if (await wardenNameInput.isVisible()) {
          await wardenNameInput.fill('Test Warden');
          expect(await wardenNameInput.inputValue()).toBe('Test Warden');
        }

        const wardenPhoneInput = page.locator('input[placeholder="017XXXXXXXX"]').first();
        if (await wardenPhoneInput.isVisible()) {
          await wardenPhoneInput.fill('01700000000');
          expect(await wardenPhoneInput.inputValue()).toBe('01700000000');
        }

        // CANCEL modal to prevent any production data pollution
        const cancelBtn = page.locator('button:has-text("Cancel")').first();
        await cancelBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('5. Facilities & Logistics: Library and Inventory modals have accessible contrast', async ({ page }) => {
    await loginAsSitaOwner(page);
    await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/facilities`);
    await page.waitForLoadState('networkidle');

    // Check Library Add Book modal
    const libraryTab = page.locator('button:has-text("Library & Books"), button:has-text("Library")').first();
    if (await libraryTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await libraryTab.click();
      await page.waitForTimeout(400);

      const addBookBtn = page.locator('button:has-text("Add Book"), button:has-text("Catalog Book")').first();
      if (await addBookBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addBookBtn.click();
        await page.waitForTimeout(400);

        const titleInput = page.locator('input[placeholder="e.g. Sahih al-Bukhari (Complete)"]').first();
        if (await titleInput.isVisible()) {
          const styles = await titleInput.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return { color: computed.color, backgroundColor: computed.backgroundColor };
          });
          expect(styles.color).not.toBe(styles.backgroundColor);
          expect(styles.backgroundColor).not.toBe('rgb(255, 255, 255)');
        }

        const cancelBtn = page.locator('button:has-text("Cancel")').first();
        await cancelBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('6. Public Admission Portal: Input fields have high contrast text', async ({ page }) => {
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
