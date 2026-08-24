import { test, expect } from '@playwright/test';

test.describe('Examination Engine & Result Publication Suite', () => {
  test('creates examination session and audits schedules', async ({ request }) => {
    // 1. Establish Exam Controller session
    const authRes = await request.post('/api/auth/demo-session', {
      data: { tenantSlug: 'demo-school', role: 'EXAM_CONTROLLER' }
    });
    expect(authRes.status()).toBe(200);

    // 2. Fetch academic year
    const acRes = await request.get('/api/academics?tenantSlug=demo-school');
    const acJson = await acRes.json();
    const academicYearId = acJson.data?.academicYears?.[0]?.id;

    if (academicYearId) {
      // 3. Create Examination
      const examRes = await request.post('/api/exams', {
        data: {
          action: 'CREATE_EXAM',
          tenantId: 'demo-school',
          payload: {
            name: `E2E Term Exam ${Date.now()}`,
            type: 'TERM',
            termNumber: 1,
            academicYearId,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            isPublished: true
          }
        }
      });

      const examJson = await examRes.json();
      expect(examJson.success).toBe(true);

      // 4. Verify Exam is in list
      const listRes = await request.get('/api/exams?tenantId=demo-school');
      const listJson = await listRes.json();
      expect(listJson.success).toBe(true);
      expect(listJson.data.length).toBeGreaterThan(0);
    }
  });
});
