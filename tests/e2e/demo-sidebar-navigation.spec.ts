import { test, expect } from '@playwright/test';

test.describe('COMMAND 11E.1 — Demo Tenant Comprehensive Sidebar Navigation Suite', () => {
  const schoolEmail = process.env.E2E_PRINCIPAL_EMAIL || 'principal.demo-school@eduerp.us';
  const schoolPassword = process.env.E2E_PRINCIPAL_PASSWORD || '';

  const madrashaEmail = process.env.E2E_MADRASHA_PRINCIPAL_EMAIL || 'principal.demo-madrasha@eduerp.us';
  const madrashaPassword = process.env.E2E_MADRASHA_PRINCIPAL_PASSWORD || '';

  const universityEmail = process.env.E2E_UNIVERSITY_VC_EMAIL || 'vice-chancellor.demo-university@eduerp.us';
  const universityPassword = process.env.E2E_UNIVERSITY_VC_PASSWORD || '';

  test('1. School Principal Navigates All Core Menu Modules Without Mismatch Error', async ({ page }) => {
    // 1. UI Login
    await page.goto('/login');
    await page.locator('input[name="email"]').fill(schoolEmail);
    await page.locator('input[name="password"]').fill(schoolPassword);
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL(/\/demo-school\/dashboard/);

    const schoolModules = [
      { path: '/demo-school/dashboard', titleRegex: /Dhaka Ideal Model High School|Dashboard/i },
      { path: '/demo-school/admission', titleRegex: /Online Admission & Enrollment Engine/i },
      { path: '/demo-school/students', titleRegex: /Student Information System \(SIS\)/i },
      { path: '/demo-school/academics', titleRegex: /Academic Structure & Curriculum/i },
      { path: '/demo-school/examination', titleRegex: /Examination & Marks Engine/i },
      { path: '/demo-school/lms', titleRegex: /Learning Management System \(LMS\)/i },
      { path: '/demo-school/finance', titleRegex: /Financial Operations & General Ledger/i },
      { path: '/demo-school/hr', titleRegex: /HR & Payroll Management/i },
      { path: '/demo-school/facilities', titleRegex: /Campus Facilities & Logistics/i },
      { path: '/demo-school/communication', titleRegex: /Central Communications Hub/i },
      { path: '/demo-school/ai-assistant', titleRegex: /AI Operations Copilot/i },
      { path: '/demo-school/custom-reports', titleRegex: /Custom Report Builder/i },
      { path: '/demo-school/settings', titleRegex: /Institutional Settings/i }
    ];

    for (const mod of schoolModules) {
      await page.goto(mod.path);
      await expect(page.getByRole('heading', { name: /You are signed into another institution/i })).not.toBeVisible();
      await expect(page.getByText(/Cross-tenant access is strictly prohibited/i)).not.toBeVisible();
      await expect(page.getByRole('heading', { name: mod.titleRegex })).toBeVisible({ timeout: 15000 });
    }
  });

  test('2. Madrasha Principal Navigates Vertical-Specific Modules (including Hifz)', async ({ page }) => {
    // 1. UI Login
    await page.goto('/login');
    await page.locator('input[name="email"]').fill(madrashaEmail);
    await page.locator('input[name="password"]').fill(madrashaPassword);
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL(/\/demo-madrasha\/dashboard/);

    const madrashaModules = [
      { path: '/demo-madrasha/dashboard', titleRegex: /Darul Uloom Islamia Madrasha/i },
      { path: '/demo-madrasha/hifz', titleRegex: /Hifzul Quran Automated Tracker/i },
      { path: '/demo-madrasha/students', titleRegex: /Student Information System \(SIS\)/i },
      { path: '/demo-madrasha/hr', titleRegex: /HR & Payroll Management/i }
    ];

    for (const mod of madrashaModules) {
      await page.goto(mod.path);
      await expect(page.getByRole('heading', { name: /You are signed into another institution/i })).not.toBeVisible();
      await expect(page.getByText(/Cross-tenant access is strictly prohibited/i)).not.toBeVisible();
      await expect(page.getByRole('heading', { name: mod.titleRegex })).toBeVisible({ timeout: 15000 });
    }
  });

  test('3. University Vice Chancellor Navigates Vertical-Specific Modules (including Higher-Ed)', async ({ page }) => {
    // 1. UI Login
    await page.goto('/login');
    await page.locator('input[name="email"]').fill(universityEmail);
    await page.locator('input[name="password"]').fill(universityPassword);
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL(/\/demo-university\/dashboard/);

    const universityModules = [
      { path: '/demo-university/dashboard', titleRegex: /Metropolitan University Bangladesh/i },
      { path: '/demo-university/faculty-research', titleRegex: /University Faculties, Credits & Research Portal/i },
      { path: '/demo-university/students', titleRegex: /Student Information System \(SIS\)/i },
      { path: '/demo-university/hr', titleRegex: /HR & Payroll Management/i }
    ];

    for (const mod of universityModules) {
      await page.goto(mod.path);
      await expect(page.getByRole('heading', { name: /You are signed into another institution/i })).not.toBeVisible();
      await expect(page.getByText(/Cross-tenant access is strictly prohibited/i)).not.toBeVisible();
      await expect(page.getByRole('heading', { name: mod.titleRegex })).toBeVisible({ timeout: 15000 });
    }
  });
});
