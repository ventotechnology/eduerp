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
      { path: '/demo-school/dashboard', titleRegex: /Dhaka Ideal Model High School/i },
      { path: '/demo-school/admission', titleRegex: /Online Admission/i },
      { path: '/demo-school/students', titleRegex: /Student Information System/i },
      { path: '/demo-school/academics', titleRegex: /Academic Structure/i },
      { path: '/demo-school/examination', titleRegex: /Examination/i },
      { path: '/demo-school/lms', titleRegex: /Learning Management/i },
      { path: '/demo-school/finance', titleRegex: /Finance/i },
      { path: '/demo-school/hr', titleRegex: /HR|Workforce/i },
      { path: '/demo-school/facilities', titleRegex: /Facilities|Campus Operations/i },
      { path: '/demo-school/communication', titleRegex: /Communication|Notice Board/i },
      { path: '/demo-school/ai-assistant', titleRegex: /AI Management Copilot|AI Assistant/i },
      { path: '/demo-school/custom-reports', titleRegex: /Analytics|Compliance|Report/i },
      { path: '/demo-school/settings', titleRegex: /Institution Configuration|Branding|Settings/i }
    ];

    for (const mod of schoolModules) {
      await page.goto(mod.path);
      await expect(page.getByRole('heading', { name: /You are signed into another institution/i })).not.toBeVisible();
      await expect(page.getByText(/Cross-tenant access is strictly prohibited/i)).not.toBeVisible();
      await expect(page.getByRole('heading', { name: mod.titleRegex }).first()).toBeVisible({ timeout: 15000 });
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
      { path: '/demo-madrasha/hifz', titleRegex: /Hifzul Quran/i },
      { path: '/demo-madrasha/students', titleRegex: /Student Information System/i },
      { path: '/demo-madrasha/hr', titleRegex: /HR, Workforce Lifecycle|HR/i }
    ];

    for (const mod of madrashaModules) {
      await page.goto(mod.path);
      await expect(page.getByRole('heading', { name: /You are signed into another institution/i })).not.toBeVisible();
      await expect(page.getByText(/Cross-tenant access is strictly prohibited/i)).not.toBeVisible();
      await expect(page.getByRole('heading', { name: mod.titleRegex }).first()).toBeVisible({ timeout: 15000 });
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
      { path: '/demo-university/faculty-research', titleRegex: /Higher Education, Semester Credit Hours/i },
      { path: '/demo-university/students', titleRegex: /Student Information System/i },
      { path: '/demo-university/hr', titleRegex: /HR, Workforce Lifecycle|HR/i }
    ];

    for (const mod of universityModules) {
      await page.goto(mod.path);
      await expect(page.getByRole('heading', { name: /You are signed into another institution/i })).not.toBeVisible();
      await expect(page.getByText(/Cross-tenant access is strictly prohibited/i)).not.toBeVisible();
      await expect(page.getByRole('heading', { name: mod.titleRegex }).first()).toBeVisible({ timeout: 15000 });
    }
  });
});
