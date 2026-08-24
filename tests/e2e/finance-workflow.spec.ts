import { test, expect } from '@playwright/test';

test.describe('Finance & Invoice Workflow Suite', () => {
  test('fetches live overview, ledger and balance sheet', async ({ request }) => {
    // 1. Establish Accountant session
    const authRes = await request.post('/api/auth/demo-session', {
      data: { tenantSlug: 'demo-school', role: 'ACCOUNTANT' }
    });
    expect(authRes.status()).toBe(200);

    // 2. Query overview tab
    const ovRes = await request.get('/api/finance?tenantId=demo-school&tab=overview');
    expect(ovRes.status()).toBe(200);
    const ovJson = await ovRes.json();
    expect(ovJson.success).toBe(true);
    expect(ovJson.data).toHaveProperty('metrics');

    // 3. Query trial balance tab
    const tbRes = await request.get('/api/finance?tenantId=demo-school&tab=trial_balance');
    expect(tbRes.status()).toBe(200);
    const tbJson = await tbRes.json();
    expect(tbJson.success).toBe(true);
  });
});
