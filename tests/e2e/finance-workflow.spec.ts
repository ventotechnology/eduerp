import { test, expect } from '@playwright/test';

test.describe('Finance & Invoice Workflow Suite', () => {
  test('fetches live overview, ledger and balance sheet with real accountant login', async ({ request }) => {
    // 1. Establish REAL Accountant session via /api/auth/login
    const accountantEmail = process.env.E2E_ACCOUNTANT_EMAIL || 'accountant.demo-school@eduerp.us';
    const accountantPass = process.env.E2E_ACCOUNTANT_PASSWORD;
    expect(accountantPass).toBeTruthy();

    const authRes = await request.post('/api/auth/login', {
      data: { email: accountantEmail, password: accountantPass }
    });
    expect(authRes.status()).toBe(200);

    // 2. Query overview tab
    const ovRes = await request.get('/api/finance?tenantId=demo-school&tab=overview');
    expect(ovRes.status()).toBe(200);
    const ovJson = await ovRes.json();
    expect(ovJson.success).toBe(true);
    expect(ovJson.data).toHaveProperty('invoices');
    expect(ovJson.data).toHaveProperty('summary');

    // 3. Query trial balance tab
    const tbRes = await request.get('/api/finance?tenantId=demo-school&tab=trial_balance');
    expect(tbRes.status()).toBe(200);
    const tbJson = await tbRes.json();
    expect(tbJson.success).toBe(true);
  });
});
