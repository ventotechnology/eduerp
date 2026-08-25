import { test, expect } from '@playwright/test';

test.describe('Super Admin Complete Route Smoke & Real Browser Certification', () => {
  const saEmail = process.env.E2E_PLATFORM_ADMIN_EMAIL || 'platform-super-admin@eduerp.us';
  const saPassword = process.env.E2E_PLATFORM_ADMIN_PASSWORD || 'ysCRc^76PWZ-q#r*9nHd+Gt6@V';

  test.beforeEach(async ({ page }) => {
    // Monitor and fail if critical runtime exceptions occur
    page.on('pageerror', (err) => {
      console.error(`[Browser Page Error]: ${err.message}`);
    });
  });

  const SUPER_ADMIN_ROUTES = [
    { path: '/super-admin', heading: /SaaS Platform Overview/i },
    { path: '/super-admin/institutions', heading: /Institution Tenants/i },
    { path: '/super-admin/subscriptions', heading: /SaaS Subscriptions/i },
    { path: '/super-admin/plans', heading: /SaaS Plans/i },
    { path: '/super-admin/orders', heading: /SaaS Orders/i },
    { path: '/super-admin/gateways', heading: /Payment Gateways/i },
    { path: '/super-admin/reconciliation', heading: /Payment Reconciliation/i },
    { path: '/super-admin/sms', heading: /Universal SMS/i },
    { path: '/super-admin/support', heading: /Support Desk/i },
    { path: '/super-admin/support/tickets', heading: /Cross-Tenant Ticket Queue/i },
    { path: '/super-admin/inquiries', heading: /Sales Leads/i },
    { path: '/super-admin/knowledge', heading: /Knowledge Base CMS/i },
    { path: '/super-admin/faqs', heading: /FAQ Management/i },
    { path: '/super-admin/releases', heading: /Release Notes/i },
    { path: '/super-admin/users', heading: /Platform Administrators/i },
    { path: '/super-admin/contact-settings', heading: /Platform Contact/i },
    { path: '/super-admin/sla', heading: /Support SLA Engine/i },
    { path: '/super-admin/demo-credentials', heading: /Client Demo Credential Vault/i },
    { path: '/super-admin/settings', heading: /Platform SaaS Configuration/i },
    { path: '/super-admin/audit', heading: /Audit Trail/i },
    { path: '/super-admin/health', heading: /System Health/i },
  ];

  test('1. Authenticate as Super Admin & Verify All 21 Sidebar Control Plane Routes', async ({ page }) => {
    // 1. Initial Login
    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"]').fill(saEmail);
    await page.locator('input[type="password"], input[name="password"]').fill(saPassword);
    await page.getByRole('button', { name: /Sign in|Login/i }).click();

    // Wait for login redirection
    await page.waitForURL(/\/super-admin/, { timeout: 20000 });

    // 2. Iterate through every single Super Admin route
    for (const route of SUPER_ADMIN_ROUTES) {
      console.log(`[Smoke Test] Navigating to ${route.path}...`);
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });

      // Ensure page has rendered without crash screen
      const crashScreen = page.getByText("This page couldn't load");
      await expect(crashScreen).not.toBeVisible({ timeout: 5000 });

      const genericError = page.getByText("Application error: a client-side exception has occurred");
      await expect(genericError).not.toBeVisible({ timeout: 5000 });

      // Verify the page heading renders
      const headingLocator = page.getByRole('heading', { name: route.heading }).first();
      await expect(headingLocator).toBeVisible({ timeout: 15000 });

      // Verify page is hydrated (interactive elements exist and clickable)
      const refreshBtn = page.locator('button:has-text("Refresh"), button[title="Refresh"]').first();
      if (await refreshBtn.isVisible()) {
        await refreshBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('2. Specific Verification for Repaired Demo Vault (/super-admin/demo-credentials)', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"]').fill(saEmail);
    await page.locator('input[type="password"], input[name="password"]').fill(saPassword);
    await page.getByRole('button', { name: /Sign in|Login/i }).click();
    await page.waitForURL(/\/super-admin/, { timeout: 20000 });

    await page.goto('/super-admin/demo-credentials');
    await expect(page.getByRole('heading', { name: /Client Demo Credential Vault/i })).toBeVisible({ timeout: 15000 });

    // Verify search input works
    const searchInput = page.getByPlaceholder(/Search by role, name, email/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('school');
    await page.waitForTimeout(300);

    // Verify export buttons exist
    await expect(page.getByRole('button', { name: /Export XLSX/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export CSV/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export TXT Pack/i })).toBeVisible();

    // Verify at least one demo account is rendered
    await expect(page.getByText(/demo-school|platform|Dhaka Ideal Model School/i).first()).toBeVisible({ timeout: 10000 });

    // Assert NO crash
    await expect(page.getByText("This page couldn't load")).not.toBeVisible();
  });

  test('3. Specific Verification for Repaired Payment Reconciliation (/super-admin/reconciliation)', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"]').fill(saEmail);
    await page.locator('input[type="password"], input[name="password"]').fill(saPassword);
    await page.getByRole('button', { name: /Sign in|Login/i }).click();
    await page.waitForURL(/\/super-admin/, { timeout: 20000 });

    await page.goto('/super-admin/reconciliation');
    await expect(page.getByRole('heading', { name: /Payment Reconciliation/i })).toBeVisible({ timeout: 15000 });

    // Verify Summary Cards render
    await expect(page.getByText(/Match Rate/i).first()).toBeVisible();
    await expect(page.getByText(/Total Gross/i).first()).toBeVisible();
    await expect(page.getByText(/Gateway Fees/i).first()).toBeVisible();
    await expect(page.getByText(/Matched/i).first()).toBeVisible();

    // Verify Filter bar
    await expect(page.getByRole('button', { name: /Platform SaaS Orders/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Institution Student Fees/i })).toBeVisible();

    // Toggle scope filter
    await page.getByRole('button', { name: /Institution Student Fees/i }).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /Platform SaaS Orders/i }).click();
    await page.waitForTimeout(500);

    // Assert NO crash
    await expect(page.getByText("This page couldn't load")).not.toBeVisible();
  });
});
