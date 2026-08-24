import { Page, APIRequestContext, expect } from '@playwright/test';

export async function loginViaUi(page: Page, email: string, pass: string, targetPath = '/dashboard') {
  await page.goto('/login');
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', pass);
  await page.click('button[type="submit"]');
  await page.waitForURL(`**${targetPath}`, { timeout: 15000 });
}

export async function loginViaApi(request: APIRequestContext, email: string, pass: string) {
  const res = await request.post('/api/auth/login', {
    data: { email, password: pass }
  });
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.success).toBe(true);
  return json.user;
}
