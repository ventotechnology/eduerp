import { test, expect } from '@playwright/test';

test.describe('Authentication & Session Invalidation Suite', () => {
  test('unauthenticated visitor accessing dashboard gets redirected to login', async ({ page }) => {
    await page.goto('/demo-school/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('valid login establishes authentic session and accesses dashboard', async ({ page }) => {
    const email = process.env.E2E_PRINCIPAL_EMAIL || 'principal.demo-school@eduerp.us';
    const password = process.env.E2E_PRINCIPAL_PASSWORD;
    expect(password).toBeTruthy();

    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', email);
    await page.fill('input[type="password"], input[name="password"]', password!);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/demo-school/dashboard');
  });

  test('invalid login credentials are strictly rejected with 401', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: {
        email: 'nonexistent@eduerp.us',
        password: 'WrongPassword!123456789'
      }
    });
    expect(res.status()).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  test('old compromised shared password is strictly rejected for QA accounts', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: {
        email: process.env.E2E_PRINCIPAL_EMAIL || 'principal.demo-school@eduerp.us',
        password: 'CompromisedOldPassword123!'
      }
    });
    expect(res.status()).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
  });
});
