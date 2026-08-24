import { test, expect } from '@playwright/test';

test.describe('Public Online Admission & Real Pipeline Persistence Suite', () => {
  test('public portal loads and displays institution details', async ({ page }) => {
    await page.goto('/apply/dhaka-ideal-school');
    await expect(page.locator('body')).toContainText('Dhaka Ideal');
  });

  test('public application submission is visible in tenant admissions API after real login', async ({ request }) => {
    // 1. Fetch academic metadata for required campusId & academicYearId
    const acRes = await request.get('/api/academics?tenantSlug=demo-school');
    expect(acRes.status()).toBe(200);
    const acJson = await acRes.json();
    expect(acJson.success).toBe(true);

    const campusId = acJson.data?.campuses?.[0]?.id;
    const academicYearId = acJson.data?.academicYears?.[0]?.id;
    const classId = acJson.data?.classes?.[0]?.id;

    expect(campusId).toBeTruthy();
    expect(academicYearId).toBeTruthy();

    // 2. Submit public application
    const phone = `017${Math.floor(10000000 + Math.random() * 90000000)}`;
    const submitRes = await request.post('/api/admissions', {
      data: {
        action: 'APPLY',
        tenantSlug: 'demo-school',
        campusId,
        academicYearId,
        desiredClassId: classId,
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

    // 3. Perform REAL login as Admission Officer
    const admissionEmail = process.env.E2E_ADMISSION_EMAIL || 'admission-officer.demo-school@eduerp.us';
    const admissionPass = process.env.E2E_ADMISSION_PASSWORD;
    expect(admissionPass).toBeTruthy();

    const loginRes = await request.post('/api/auth/login', {
      data: { email: admissionEmail, password: admissionPass }
    });
    expect(loginRes.status()).toBe(200);

    // 4. Query admissions pipeline with authenticated session
    const listRes = await request.get('/api/admissions?tenantSlug=demo-school');
    expect(listRes.status()).toBe(200);
    const listJson = await listRes.json();
    expect(listJson.success).toBe(true);

    // 5. Verify the new application is persisted
    const foundCreated = listJson.data.find((a: any) => a.applicationNumber === createdAppNum);
    expect(foundCreated).toBeTruthy();
    expect(foundCreated.firstName).toBe('E2ETest');

    // 6. Verify the owner's application (APP-2026-0002) is preserved and intact
    const ownerApp = listJson.data.find((a: any) => a.applicationNumber === 'APP-2026-0002');
    expect(ownerApp).toBeTruthy();
    expect(ownerApp.firstName).toBe('Md Humayun');
  });
});
