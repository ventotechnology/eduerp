import { test, expect } from '@playwright/test';

test.describe('Authentication & Session Invalidation Suite', () => {
  test('unauthenticated visitor accessing dashboard gets redirected to login', async ({ page }) => {
    await page.goto('/demo-school/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('valid login establishes session and accesses dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'principal.demo-school@eduerp.us');
    await page.fill('input[type="password"], input[name="password"]', 'EduErp@2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/demo-school/dashboard');
  });

  test('interactive demo session switcher issues authoritative server session', async ({ request }) => {
    const res = await request.post('/api/auth/demo-session', {
      data: { tenantSlug: 'demo-school', role: 'PRINCIPAL' }
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.user.role).toBe('PRINCIPAL');
  });
});
