# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: public-admission.spec.ts >> Public Online Admission & Real Pipeline Persistence Suite >> public portal loads and displays institution details
- Location: tests/e2e/public-admission.spec.ts:4:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('body')
Expected substring: "Dhaka Ideal"
Received string:    "404This page could not be found."
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('body')
    14 × locator resolved to <body class="antialiased min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">…</body>
       - unexpected value "404This page could not be found."

```

```yaml
- heading "404" [level=1]
- heading "This page could not be found." [level=2]
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Public Online Admission & Real Pipeline Persistence Suite', () => {
  4  |   test('public portal loads and displays institution details', async ({ page }) => {
  5  |     await page.goto('/apply/dhaka-ideal-school');
> 6  |     await expect(page.locator('body')).toContainText('Dhaka Ideal');
     |                                        ^ Error: expect(locator).toContainText(expected) failed
  7  |   });
  8  | 
  9  |   test('public application submission is visible in tenant admissions API after real login', async ({ request }) => {
  10 |     // 1. Fetch academic metadata for required campusId & academicYearId
  11 |     const acRes = await request.get('/api/academics?tenantSlug=demo-school');
  12 |     expect(acRes.status()).toBe(200);
  13 |     const acJson = await acRes.json();
  14 |     expect(acJson.success).toBe(true);
  15 | 
  16 |     const campusId = acJson.data?.campuses?.[0]?.id;
  17 |     const academicYearId = acJson.data?.academicYears?.[0]?.id;
  18 |     const classId = acJson.data?.classes?.[0]?.id;
  19 | 
  20 |     expect(campusId).toBeTruthy();
  21 |     expect(academicYearId).toBeTruthy();
  22 | 
  23 |     // 2. Submit public application
  24 |     const phone = `017${Math.floor(10000000 + Math.random() * 90000000)}`;
  25 |     const submitRes = await request.post('/api/admissions', {
  26 |       data: {
  27 |         action: 'APPLY',
  28 |         tenantSlug: 'demo-school',
  29 |         campusId,
  30 |         academicYearId,
  31 |         desiredClassId: classId,
  32 |         firstName: 'E2ETest',
  33 |         lastName: 'Applicant',
  34 |         phone,
  35 |         presentAddress: 'Dhaka',
  36 |         permanentAddress: 'Dhaka',
  37 |         guardianName: 'Guardian Test',
  38 |         guardianPhone: phone,
  39 |         gender: 'Male',
  40 |         dateOfBirth: '2014-01-01'
  41 |       }
  42 |     });
  43 | 
  44 |     expect(submitRes.status()).toBe(201);
  45 |     const submitJson = await submitRes.json();
  46 |     expect(submitJson.success).toBe(true);
  47 |     expect(submitJson.data?.applicationNumber).toBeTruthy();
  48 |     const createdAppNum = submitJson.data.applicationNumber;
  49 | 
  50 |     // 3. Perform REAL login as Admission Officer
  51 |     const admissionEmail = process.env.E2E_ADMISSION_EMAIL || 'admission-officer.demo-school@eduerp.us';
  52 |     const admissionPass = process.env.E2E_ADMISSION_PASSWORD;
  53 |     expect(admissionPass).toBeTruthy();
  54 | 
  55 |     const loginRes = await request.post('/api/auth/login', {
  56 |       data: { email: admissionEmail, password: admissionPass }
  57 |     });
  58 |     expect(loginRes.status()).toBe(200);
  59 | 
  60 |     // 4. Query admissions pipeline with authenticated session
  61 |     const listRes = await request.get('/api/admissions?tenantSlug=demo-school');
  62 |     expect(listRes.status()).toBe(200);
  63 |     const listJson = await listRes.json();
  64 |     expect(listJson.success).toBe(true);
  65 | 
  66 |     // 5. Verify the new application is persisted
  67 |     const foundCreated = listJson.data.find((a: any) => a.applicationNumber === createdAppNum);
  68 |     expect(foundCreated).toBeTruthy();
  69 |     expect(foundCreated.firstName).toBe('E2ETest');
  70 | 
  71 |     // 6. Verify the owner's application (APP-2026-0002) is preserved and intact
  72 |     const ownerApp = listJson.data.find((a: any) => a.applicationNumber === 'APP-2026-0002');
  73 |     expect(ownerApp).toBeTruthy();
  74 |     expect(ownerApp.firstName).toBe('Md Humayun');
  75 |   });
  76 | });
  77 | 
```