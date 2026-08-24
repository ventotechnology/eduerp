import { test, expect } from '@playwright/test';

test.describe('Public Online Admission & Pipeline Suite', () => {
  test('public portal loads and displays institution details', async ({ page }) => {
    await page.goto('/apply/dhaka-ideal-school');
    await expect(page.locator('body')).toContainText('Dhaka Ideal');
  });

  test('public application submission is visible in tenant admissions API', async ({ request }) => {
    // 1. Submit public application
    const appNumber = `E2E-${Date.now()}`;
    const submitRes = await request.post('/api/admissions/public', {
      data: {
        tenantSlug: 'dhaka-ideal-school',
        firstName: 'E2ETest',
        lastName: 'Applicant',
        phone: '01711223344',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        guardianName: 'Guardian Test',
        guardianPhone: '01711223344',
        gender: 'Male',
        dateOfBirth: '2014-01-01'
      }
    });

    expect(submitRes.status()).toBe(201);
    const submitJson = await submitRes.json();
    expect(submitJson.success).toBe(true);

    // 2. Query admissions pipeline with admin session
    const demoSession = await request.post('/api/auth/demo-session', {
      data: { tenantSlug: 'demo-school', role: 'ADMISSION_OFFICER' }
    });
    expect(demoSession.status()).toBe(200);

    const listRes = await request.get('/api/admissions?tenantSlug=demo-school');
    expect(listRes.status()).toBe(200);
    const listJson = await listRes.json();
    expect(listJson.success).toBe(true);
    expect(listJson.data.some((a: any) => a.firstName === 'E2ETest')).toBe(true);
  });
});
