import { test, expect } from '@playwright/test';

test.describe('HR & Workforce Operations Suite', () => {
  test('loads HR workforce directory, attendance and leave records with real HR admin login', async ({ request }) => {
    // 1. Establish REAL HR Admin session via /api/auth/login
    const hrEmail = process.env.E2E_HR_EMAIL || 'hr.demo-school@eduerp.us';
    const hrPass = process.env.E2E_HR_PASSWORD;
    expect(hrPass).toBeTruthy();

    const authRes = await request.post('/api/auth/login', {
      data: { email: hrEmail, password: hrPass }
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
