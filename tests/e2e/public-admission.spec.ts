import { test, expect } from '@playwright/test';

test.describe('Public Online Admission & Real Pipeline Persistence Suite', () => {
  test('public portal loads and displays institution details', async ({ page }) => {
    await page.goto('/apply/dhaka-ideal-school');
    await expect(page.locator('body')).toContainText('Dhaka Ideal');
  });

  test('public application submission is visible in tenant admissions API after real login', async ({ request }) => {
    // 1. Submit public application
    const phone = `017${Math.floor(10000000 + Math.random() * 90000000)}`;
    const submitRes = await request.post('/api/admissions/public', {
      data: {
        tenantSlug: 'dhaka-ideal-school',
        firstName: 'E2ETest',
        lastName: 'Applicant',
        phone,
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        guardianName: 'Guardian Test',
        guardianPhone: phone,
        gender: 'Male',
        dateOfBirth: '2014-01-01'
      }
    });

    expect(submitRes.status()).toBe(201);
    const submitJson = await submitRes.json();
    expect(submitJson.success).toBe(true);
    expect(submitJson.data?.applicationNumber).toBeTruthy();
    const createdAppNum = submitJson.data.applicationNumber;

    // 2. Perform REAL login as Admission Officer
    const admissionEmail = process.env.E2E_ADMISSION_EMAIL || 'admission.demo-school@eduerp.us';
    const admissionPass = process.env.E2E_ADMISSION_PASSWORD;
    expect(admissionPass).toBeTruthy();

    const loginRes = await request.post('/api/auth/login', {
      data: { email: admissionEmail, password: admissionPass }
    });
    expect(loginRes.status()).toBe(200);

    // 3. Query admissions pipeline with authenticated session
    const listRes = await request.get('/api/admissions?tenantSlug=demo-school');
    expect(listRes.status()).toBe(200);
    const listJson = await listRes.json();
    expect(listJson.success).toBe(true);

    // 4. Verify the new application is persisted
    const foundCreated = listJson.data.find((a: any) => a.applicationNumber === createdAppNum);
    expect(foundCreated).toBeTruthy();
    expect(foundCreated.firstName).toBe('E2ETest');

    // 5. Verify the owner's application (APP-2026-0002) is preserved and intact
    const ownerApp = listJson.data.find((a: any) => a.applicationNumber === 'APP-2026-0002');
    expect(ownerApp).toBeTruthy();
    expect(ownerApp.firstName).toBe('Md Humayun');
  });
});
