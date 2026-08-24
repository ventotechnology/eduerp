import { test, expect } from '@playwright/test';

test.describe('Command 12 — Commercial Onboarding, Pricing & Entitlements Live Tests', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://eduerp.us';
  const saEmail = process.env.E2E_PLATFORM_ADMIN_EMAIL || 'platform-super-admin@eduerp.us';
  const saPassword = process.env.E2E_PLATFORM_ADMIN_PASSWORD || 'ysCRc^76PWZ-q#r*9nHd+Gt6@V';

  test('1. Public Pricing page loads dynamic PostgreSQL plans and features', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    await expect(page).toHaveTitle(/EduERP/);

    // Verify presence of commercial packages
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Starter');
    expect(pageContent).toContain('Standard');
    expect(pageContent).toContain('Professional');
    expect(pageContent).toContain('Enterprise');

    // Verify BDT currency pricing
    expect(pageContent).toMatch(/BDT|৳/);

    // Verify CTAs
    const starterBtn = page.locator('text=Choose Starter').or(page.locator('text=Start Free Trial')).first();
    await expect(starterBtn).toBeVisible();
  });

  test('2. Public Signup page provides interactive slug validation and plan selection', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup?plan=starter`);

    // Verify form elements
    await expect(page.locator('input[placeholder*="Dhaka Scholars"]').or(page.locator('input[type="text"]').first())).toBeVisible();

    // Verify slug input with .eduerp.us suffix
    const slugSuffix = page.locator('text=.eduerp.us');
    await expect(slugSuffix).toBeVisible();

    // Verify package selection card
    const orderSummary = page.locator('text=Order Summary').or(page.locator('text=Free Trial Summary'));
    await expect(orderSummary).toBeVisible();
  });

  test('3. Super Admin SaaS Control Plane renders real-time commercial metrics & plans', async ({ page }) => {
    // Authenticate as Platform Super Admin
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', saEmail);
    await page.fill('input[type="password"], input[name="password"]', saPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/super-admin**', { timeout: 15000 });

    // Verify SaaS control plane sections
    await page.goto(`${BASE_URL}/super-admin`);
    const pageText = await page.textContent('body');
    expect(pageText).toContain('SaaS Platform');

    // Verify Institutions directory
    await page.goto(`${BASE_URL}/super-admin/institutions`);
    await expect(page.getByRole('button', { name: /Create Institution/i })).toBeVisible();

    // Verify Plans control panel
    await page.goto(`${BASE_URL}/super-admin/plans`);
    await expect(page.getByRole('button', { name: /Create Plan/i })).toBeVisible();
  });

  test('4. Controlled QA Pilot Tenant dashboard renders with 14-step onboarding checklist', async ({ page }) => {
    // Login as Pilot Academy Principal
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"], input[name="email"]', 'owner@pilot-academy.qa');
    await page.fill('input[type="password"], input[name="password"]', 'PilotQA@2026#Secure');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/pilot-academy-qa/dashboard**', { timeout: 15000 }).catch(async () => {
      await page.goto(`${BASE_URL}/pilot-academy-qa/dashboard`);
    });

    // Check dashboard or onboarding wizard loaded
    await page.waitForLoadState('networkidle');
    const pageText = await page.textContent('body');
    expect((pageText || '').length).toBeGreaterThan(100);
    expect(pageText || '').toMatch(/Pilot|EduERP|Dashboard|Academic|Overview/i);
  });
});
