# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: exam-management.spec.ts >> Examination Engine & Result Publication Suite >> creates examination session and audits schedules with real login
- Location: tests/e2e/exam-management.spec.ts:4:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 500
Received array: [200, 201]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Examination Engine & Result Publication Suite', () => {
  4  |   test('creates examination session and audits schedules with real login', async ({ request }) => {
  5  |     // 1. Establish REAL Exam Controller session via /api/auth/login
  6  |     const examEmail = process.env.E2E_EXAM_EMAIL || 'exam.demo-school@eduerp.us';
  7  |     const examPass = process.env.E2E_EXAM_PASSWORD;
  8  |     expect(examPass).toBeTruthy();
  9  | 
  10 |     const authRes = await request.post('/api/auth/login', {
  11 |       data: { email: examEmail, password: examPass }
  12 |     });
  13 |     expect(authRes.status()).toBe(200);
  14 | 
  15 |     // 2. Fetch academic metadata (strict assertion)
  16 |     const acRes = await request.get('/api/academics?tenantSlug=demo-school');
  17 |     expect(acRes.status()).toBe(200);
  18 |     const acJson = await acRes.json();
  19 |     expect(acJson.success).toBe(true);
  20 | 
  21 |     const academicYearId = acJson.data?.academicYears?.[0]?.id;
  22 |     expect(academicYearId).toBeTruthy();
  23 | 
  24 |     // 3. Create Examination Session
  25 |     const examTitle = `Annual Evaluation ${Date.now()}`;
  26 |     const examRes = await request.post('/api/exams', {
  27 |       data: {
  28 |         action: 'CREATE_EXAM',
  29 |         tenantId: 'demo-school',
  30 |         payload: {
  31 |           name: examTitle,
  32 |           type: 'ANNUAL',
  33 |           termNumber: 1,
  34 |           academicYearId,
  35 |           startDate: new Date().toISOString(),
  36 |           endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
  37 |           isPublished: true
  38 |         }
  39 |       }
  40 |     });
  41 | 
> 42 |     expect([200, 201]).toContain(examRes.status());
     |                        ^ Error: expect(received).toContain(expected) // indexOf
  43 |     const examJson = await examRes.json();
  44 |     expect(examJson.success).toBe(true);
  45 |     const createdExamId = examJson.data?.id;
  46 |     expect(createdExamId).toBeTruthy();
  47 | 
  48 |     // 4. Verify Exam is in persistent list
  49 |     const listRes = await request.get('/api/exams?tenantId=demo-school');
  50 |     expect(listRes.status()).toBe(200);
  51 |     const listJson = await listRes.json();
  52 |     expect(listJson.success).toBe(true);
  53 |     const persisted = listJson.data.find((e: any) => e.id === createdExamId);
  54 |     expect(persisted).toBeTruthy();
  55 |     expect(persisted.name).toBe(examTitle);
  56 |   });
  57 | });
  58 | 
```