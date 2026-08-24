import { test, expect } from '@playwright/test';

test.describe('Examination Engine & Result Publication Suite', () => {
  test('creates examination session and audits schedules with real login', async ({ request }) => {
    // 1. Establish REAL Exam Controller session via /api/auth/login
    const examEmail = process.env.E2E_EXAM_EMAIL || 'exam.demo-school@eduerp.us';
    const examPass = process.env.E2E_EXAM_PASSWORD;
    expect(examPass).toBeTruthy();

    const authRes = await request.post('/api/auth/login', {
      data: { email: examEmail, password: examPass }
    });
    expect(authRes.status()).toBe(200);

    // 2. Fetch academic metadata (strict assertion)
    const acRes = await request.get('/api/academics?tenantSlug=demo-school');
    expect(acRes.status()).toBe(200);
    const acJson = await acRes.json();
    expect(acJson.success).toBe(true);

    const academicYear = acJson.data?.academicYears?.[0];
    const academicYearId = academicYear?.id;
    const sessionId = academicYear?.sessions?.[0]?.id;
    expect(academicYearId).toBeTruthy();
    expect(sessionId).toBeTruthy();

    // 3. Create Examination Session
    const examTitle = `Annual Evaluation ${Date.now()}`;
    const examRes = await request.post('/api/exams', {
      data: {
        action: 'CREATE_EXAM',
        tenantId: 'demo-school',
        payload: {
          name: examTitle,
          type: 'ANNUAL',
          termNumber: 1,
          sessionId,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
          isPublished: true
        }
      }
    });

    expect([200, 201]).toContain(examRes.status());
    const examJson = await examRes.json();
    expect(examJson.success).toBe(true);
    const createdExamId = examJson.data?.id;
    expect(createdExamId).toBeTruthy();

    // 4. Verify Exam is in persistent list
    const listRes = await request.get('/api/exams?tenantId=demo-school');
    expect(listRes.status()).toBe(200);
    const listJson = await listRes.json();
    expect(listJson.success).toBe(true);
    const persisted = listJson.data.find((e: any) => e.id === createdExamId);
    expect(persisted).toBeTruthy();
    expect(persisted.name).toBe(examTitle);
  });
});
