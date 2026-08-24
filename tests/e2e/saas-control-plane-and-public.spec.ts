import { test, expect } from '@playwright/test';

test.describe('COMMAND 11D — SaaS Control Plane, Public Pages & Vertical Admissions', () => {
  const saEmail = process.env.E2E_PLATFORM_ADMIN_EMAIL || 'platform-super-admin@eduerp.us';
  const saPassword = process.env.E2E_PLATFORM_ADMIN_PASSWORD || 'fq9AHAoMhP2HLH+*eV-V-b7J!8';

  test('1. Public Homepage loads cleanly without demo switcher bar', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/EduERP/);

    // Verify Demo Switcher is NOT rendered
    const demoSwitcher = page.locator('aside[aria-label="Interactive Demo Switcher"]');
    await expect(demoSwitcher).not.toBeVisible();

    // Verify navigation links
    const pricingLink = page.getByRole('link', { name: /Pricing/i }).first();
    await expect(pricingLink).toBeVisible();

    const demoLink = page.getByRole('link', { name: /Demo Showroom|Explore 8 Vertical Demos/i }).first();
    await expect(demoLink).toBeVisible();
  });

  test('2. Public Demo Showroom (/demo) renders all 8 vertical engines', async ({ page }) => {
    await page.goto('/demo');
    await expect(page.getByRole('heading', { name: /Explore EduERP Across 8 Specialized Educational Verticals/i })).toBeVisible();

    // Verify the 8 verticals
    await expect(page.getByText('Dhaka Ideal Model School')).toBeVisible();
    await expect(page.getByText('Chittagong Model College')).toBeVisible();
    await expect(page.getByText('Rajshahi Model School & College')).toBeVisible();
    await expect(page.getByText('Darul Uloom Islamia Madrasha')).toBeVisible();
    await expect(page.getByText('Metropolitan University Bangladesh')).toBeVisible();
    await expect(page.getByText('Dhaka Polytechnic Institute')).toBeVisible();
    await expect(page.getByText('Bangladesh Technical Vocational Academy')).toBeVisible();
    await expect(page.getByText('National Institute of Professional Training')).toBeVisible();
  });

  test('3. Public Legal Pages (/privacy, /terms, /contact) load correctly', async ({ page }) => {
    // Privacy
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: /Privacy Policy & Student Data Protection/i })).toBeVisible();
    await expect(page.getByText('Zero Commercial Monetization of Student Data')).toBeVisible();

    // Terms
    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: /Terms of Service & Master Subscription Agreement/i })).toBeVisible();

    // Contact
    await page.goto('/contact');
    await expect(page.getByRole('heading', { name: /Let's Transform Your Institution's Digital Operations/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Describe student capacity/i)).toBeVisible();
  });

  test('4. Super Admin SaaS Control Plane authentication & navigation', async ({ page }) => {
    // Attempt visiting /super-admin without auth should redirect to /login
    await page.goto('/super-admin');
    await page.waitForURL(/\/login/);

    // Login as Super Admin
    await page.getByPlaceholder(/name@institution.edu.bd/i).fill(saEmail);
    await page.getByPlaceholder(/••••••••/i).fill(saPassword);
    await page.getByRole('button', { name: /Sign in to EduERP OS/i }).click();

    // Wait for Super Admin Overview
    await page.waitForURL(/\/super-admin/);
    await expect(page.getByRole('heading', { name: /SaaS Platform Overview/i })).toBeVisible();

    // Visit Institutions page
    await page.goto('/super-admin/institutions');
    await expect(page.getByRole('heading', { name: /Institution Tenants/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /\+ Create Institution/i })).toBeVisible();

    // Visit Plans & Pricing page
    await page.goto('/super-admin/plans');
    await expect(page.getByRole('heading', { name: /SaaS Plans & Pricing Matrix/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /\+ Create Plan/i })).toBeVisible();

    // Visit Payment Gateways page
    await page.goto('/super-admin/gateways');
    await expect(page.getByRole('heading', { name: /Payment Gateways & bKash Integration/i })).toBeVisible();
    await expect(page.getByText('bKash Production Checkout Engine')).toBeVisible();

    // Visit Demo Credentials Vault
    await page.goto('/super-admin/demo-credentials');
    await expect(page.getByRole('heading', { name: /Client Demo Credential Vault/i })).toBeVisible();
  });

  test('5. Public Admissions on multiple vertical engines load without error', async ({ page }) => {
    // School admission
    await page.goto('/demo-school/admission');
    await expect(page.getByText(/Admission/i).first()).toBeVisible();

    // College admission
    await page.goto('/demo-college/admission');
    await expect(page.getByText(/Admission/i).first()).toBeVisible();

    // Madrasha admission
    await page.goto('/demo-madrasha/admission');
    await expect(page.getByText(/Admission/i).first()).toBeVisible();
  });
});
