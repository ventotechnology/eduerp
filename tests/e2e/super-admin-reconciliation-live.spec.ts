import { test, expect } from '@playwright/test';

test.describe('Super Admin Payment Reconciliation Live Verification', () => {
  const saEmail = process.env.E2E_PLATFORM_ADMIN_EMAIL || 'platform-super-admin@eduerp.us';
  const saPassword = process.env.E2E_PLATFORM_ADMIN_PASSWORD || 'ysCRc^76PWZ-q#r*9nHd+Gt6@V';

  test('1. Full Interactive Audit of Payment Reconciliation Dashboard', async ({ page }) => {
    // 1. Authenticate
    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"]').fill(saEmail);
    await page.locator('input[type="password"], input[name="password"]').fill(saPassword);
    await page.getByRole('button', { name: /Sign in|Login/i }).click();
    await page.waitForURL(/\/super-admin/, { timeout: 20000 });

    // 2. Navigate via sidebar to Payment Reconciliation
    const recSidebarLink = page.getByRole('link', { name: /Payment Reconciliation/i }).first();
    if (await recSidebarLink.isVisible()) {
      await recSidebarLink.click();
    } else {
      await page.goto('/super-admin/reconciliation');
    }

    await page.waitForURL(/\/super-admin\/reconciliation/, { timeout: 15000 });

    // 3. Assert Main UI Elements Rendered
    await expect(page.getByRole('heading', { name: /Payment Reconciliation Control Plane/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('REAL-TIME GL AUDIT')).toBeVisible();

    // 4. Assert Metric Summary Cards Render
    await expect(page.getByText('Match Rate', { exact: true })).toBeVisible();
    await expect(page.getByText('Total Gross', { exact: true })).toBeVisible();
    await expect(page.getByText('Gateway Fees', { exact: true })).toBeVisible();
    await expect(page.getByText('Matched', { exact: true })).toBeVisible();
    await expect(page.getByText('Amount Mismatch', { exact: true })).toBeVisible();
    await expect(page.getByText('Manual Review', { exact: true })).toBeVisible();

    // 5. Test Filters Interaction
    const searchInput = page.getByPlaceholder(/Search trx ID, batch, ref/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('REC-TEST-QUERY');
    await page.waitForTimeout(300);
    await searchInput.fill('');
    await page.waitForTimeout(300);

    // 6. Assert Zero Secrets in DOM HTML
    const pageHtml = await page.content();
    expect(pageHtml).not.toContain('app_secret');
    expect(pageHtml).not.toContain('enc_v1');
    expect(pageHtml).not.toContain('passwordHash');

    // 7. Verify Table or Valid Empty State
    const hasRows = await page.locator('tbody tr').count();
    expect(hasRows).toBeGreaterThan(0);

    // 8. Assert NO crash screens
    await expect(page.getByText("This page couldn't load")).not.toBeVisible();
  });

  test('2. Sequential Navigation Across Sibling Super Admin Pages', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"]').fill(saEmail);
    await page.locator('input[type="password"], input[name="password"]').fill(saPassword);
    await page.getByRole('button', { name: /Sign in|Login/i }).click();
    await page.waitForURL(/\/super-admin/, { timeout: 20000 });

    const sequence = [
      { name: 'SLA Policies', path: '/super-admin/sla' },
      { name: 'Demo Vault', path: '/super-admin/demo-credentials' },
      { name: 'Payment Reconciliation', path: '/super-admin/reconciliation' },
      { name: 'Orders & Revenue', path: '/super-admin/orders' },
      { name: 'Payment Gateways', path: '/super-admin/gateways' },
      { name: 'Institutions', path: '/super-admin/institutions' },
      { name: 'Overview', path: '/super-admin' },
    ];

    for (const step of sequence) {
      console.log(`[Sequential Nav] Moving to ${step.name} (${step.path})...`);
      await page.goto(step.path, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText("This page couldn't load")).not.toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(300);
    }
  });
});
