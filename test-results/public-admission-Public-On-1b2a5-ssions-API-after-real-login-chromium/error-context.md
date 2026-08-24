# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: public-admission.spec.ts >> Public Online Admission & Real Pipeline Persistence Suite >> public application submission is visible in tenant admissions API after real login
- Location: tests/e2e/public-admission.spec.ts:9:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 201
Received: 400
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Public Online Admission & Real Pipeline Persistence Suite', () => {
  4  |   test('public portal loads and displays institution details', async ({ page }) => {
  5  |     await page.goto('/apply/dhaka-ideal-school');
  6  |     await expect(page.locator('body')).toContainText('Dhaka Ideal');
  7  |   });
  8  | 
  9  |   test('public application submission is visible in tenant admissions API after real login', async ({ request }) => {
  10 |     // 1. Submit public application
  11 |     const phone = `017${Math.floor(10000000 + Math.random() * 90000000)}`;
  12 |     const submitRes = await request.post('/api/admissions', {
  13 |       data: {
  14 |         action: 'APPLY',
  15 |         tenantSlug: 'demo-school',
  16 |         firstName: 'E2ETest',
  17 |         lastName: 'Applicant',
  18 |         phone,
  19 |         presentAddress: 'Dhaka',
  20 |         permanentAddress: 'Dhaka',
  21 |         guardianName: 'Guardian Test',
  22 |         guardianPhone: phone,
  23 |         gender: 'Male',
  24 |         dateOfBirth: '2014-01-01'
  25 |       }
  26 |     });
  27 | 
> 28 |     expect(submitRes.status()).toBe(201);
     |                                ^ Error: expect(received).toBe(expected) // Object.is equality
  29 |     const submitJson = await submitRes.json();
  30 |     expect(submitJson.success).toBe(true);
  31 |     expect(submitJson.data?.applicationNumber).toBeTruthy();
  32 |     const createdAppNum = submitJson.data.applicationNumber;
  33 | 
  34 |     // 2. Perform REAL login as Admission Officer
  35 |     const admissionEmail = process.env.E2E_ADMISSION_EMAIL || 'admission.demo-school@eduerp.us';
  36 |     const admissionPass = process.env.E2E_ADMISSION_PASSWORD;
  37 |     expect(admissionPass).toBeTruthy();
  38 | 
  39 |     const loginRes = await request.post('/api/auth/login', {
  40 |       data: { email: admissionEmail, password: admissionPass }
  41 |     });
  42 |     expect(loginRes.status()).toBe(200);
  43 | 
  44 |     // 3. Query admissions pipeline with authenticated session
  45 |     const listRes = await request.get('/api/admissions?tenantSlug=demo-school');
  46 |     expect(listRes.status()).toBe(200);
  47 |     const listJson = await listRes.json();
  48 |     expect(listJson.success).toBe(true);
  49 | 
  50 |     // 4. Verify the new application is persisted
  51 |     const foundCreated = listJson.data.find((a: any) => a.applicationNumber === createdAppNum);
  52 |     expect(foundCreated).toBeTruthy();
  53 |     expect(foundCreated.firstName).toBe('E2ETest');
  54 | 
  55 |     // 5. Verify the owner's application (APP-2026-0002) is preserved and intact
  56 |     const ownerApp = listJson.data.find((a: any) => a.applicationNumber === 'APP-2026-0002');
  57 |     expect(ownerApp).toBeTruthy();
  58 |     expect(ownerApp.firstName).toBe('Md Humayun');
  59 |   });
  60 | });
  61 | 
```