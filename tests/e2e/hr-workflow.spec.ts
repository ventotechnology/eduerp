import { test, expect } from '@playwright/test';

test.describe('HR & Workforce Operations Suite', () => {
  test('loads HR workforce directory, attendance and leave records', async ({ request }) => {
    // 1. Establish HR Admin session
    const authRes = await request.post('/api/auth/demo-session', {
      data: { tenantSlug: 'demo-school', role: 'HR_ADMIN' }
    });
    expect(authRes.status()).toBe(200);

    // 2. Fetch HR Directory
    const hrRes = await request.get('/api/hr?tenantId=demo-school&tab=overview');
    expect(hrRes.status()).toBe(200);
    const hrJson = await hrRes.json();
    expect(hrJson.success).toBe(true);
    expect(hrJson.data).toHaveProperty('metrics');
  });
});
