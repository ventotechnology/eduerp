import { test, expect, Page } from '@playwright/test';

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'bloodsoft24@gmail.com';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'Wallet.047890';
const SITA_SLUG = 'scholars-international-tahfiz-academy';

async function loginAsSuperAdmin(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  await page.fill('input[type="email"], input[name="email"]', SUPER_ADMIN_EMAIL);
  await page.fill('input[type="password"], input[name="password"]', SUPER_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/super-admin**', { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState('networkidle');
}

test.describe('Command 12A.5C: Super Admin Impersonation, Banner & Institution Control Suite', () => {
  test('1. Super Admin navigates to Institutions, Impersonates SITA, and exits cleanly', async ({ page }) => {
    await loginAsSuperAdmin(page);

    // Navigate to Institutions Control Center
    await page.goto('/super-admin/institutions');
    await page.waitForLoadState('networkidle');

    // Verify Institutions Page loaded
    await expect(page.locator('h1')).toContainText(/Institution/i);

    // Locate Scholars International Tahfiz Academy row
    const sitaRow = page.locator('tr', { hasText: /Scholars International|scholars-international-tahfiz-academy/i }).first();
    await expect(sitaRow).toBeVisible({ timeout: 10000 });

    // Click Impersonate button
    const impersonateBtn = sitaRow.locator('button', { hasText: /Impersonate/i });
    await expect(impersonateBtn).toBeVisible();
    await impersonateBtn.click();

    // Verify redirection to SITA dashboard without JSON error
    await page.waitForURL(new RegExp(`.*${SITA_SLUG}.*`), { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Verify Impersonation Banner is visible
    const banner = page.locator('aside[aria-label*="Impersonation"]').first();
    await expect(banner).toBeVisible({ timeout: 10000 });
    await expect(banner).toContainText(/Scholars International|SITA|Mohammad Saifullah|PRINCIPAL/i);

    // Verify Exit Impersonation Button exists
    const exitBtn = page.locator('button:has-text("Exit Impersonation")').first();
    await expect(exitBtn).toBeVisible();

    // Click Exit Impersonation
    await exitBtn.click();

    // Verify redirection back to Super Admin Control Plane
    await page.waitForURL('**/super-admin**', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const adminHeading = page.locator('h1, span:has-text("Control Plane")').first();
    await expect(adminHeading).toBeVisible();
  });

  test('2. SITA Institution Edit modal opens populated with existing data and cancels cleanly', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super-admin/institutions');
    await page.waitForLoadState('networkidle');

    const sitaRow = page.locator('tr', { hasText: /Scholars International|scholars-international-tahfiz-academy/i }).first();
    await expect(sitaRow).toBeVisible();

    // Click Edit button
    const editBtn = sitaRow.locator('button', { hasText: /Edit/i });
    await editBtn.click();

    // Verify Edit Modal is visible
    const modal = page.locator('text=Edit Institution Profile').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify fields populated
    const nameInput = page.locator('input[value*="Scholars International"]').first();
    await expect(nameInput).toBeVisible();

    // Click Cancel (Ensuring ZERO mutations on live production)
    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    await cancelBtn.click();

    // Modal closed
    await expect(modal).not.toBeVisible();
  });

  test('3. Super Admin Manage drawer displays tabs (Users, Campuses, Subscription, Slug)', async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto('/super-admin/institutions');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible();

    // Click Manage button
    const manageBtn = firstRow.locator('button', { hasText: /Manage/i });
    await manageBtn.click();

    // Verify Manage Drawer opened
    await expect(page.locator('button:has-text("Overview")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Users")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Campuses")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Subscription")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Slug & Domain")').first()).toBeVisible();

    // Close drawer
    const closeBtn = page.locator('div[role="dialog"] button, div.fixed button').first();
    await closeBtn.click();
  });
});
