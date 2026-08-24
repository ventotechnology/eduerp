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
  21 |     const academicYear = acJson.data?.academicYears?.[0];
  22 |     const academicYearId = academicYear?.id;
  23 |     const sessionId = academicYear?.sessions?.[0]?.id;
  24 |     expect(academicYearId).toBeTruthy();
  25 |     expect(sessionId).toBeTruthy();
  26 | 
  27 |     // 3. Create Examination Session
  28 |     const examTitle = `Annual Evaluation ${Date.now()}`;
  29 |     const examRes = await request.post('/api/exams', {
  30 |       data: {
  31 |         action: 'CREATE_EXAM',
  32 |         tenantId: 'demo-school',
  33 |         payload: {
  34 |           name: examTitle,
  35 |           type: 'ANNUAL',
  36 |           termNumber: 1,
  37 |           sessionId,
  38 |           startDate: new Date().toISOString(),
  39 |           endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
  40 |           isPublished: true
  41 |         }
  42 |       }
  43 |     });
  44 | 
> 45 |     expect([200, 201]).toContain(examRes.status());
     |                        ^ Error: expect(received).toContain(expected) // indexOf
  46 |     const examJson = await examRes.json();
  47 |     expect(examJson.success).toBe(true);
  48 |     const createdExamId = examJson.data?.id;
  49 |     expect(createdExamId).toBeTruthy();
  50 | 
  51 |     // 4. Verify Exam is in persistent list
  52 |     const listRes = await request.get('/api/exams?tenantId=demo-school');
  53 |     expect(listRes.status()).toBe(200);
  54 |     const listJson = await listRes.json();
  55 |     expect(listJson.success).toBe(true);
  56 |     const persisted = listJson.data.find((e: any) => e.id === createdExamId);
  57 |     expect(persisted).toBeTruthy();
  58 |     expect(persisted.name).toBe(examTitle);
  59 |   });
  60 | });
  61 | 
```