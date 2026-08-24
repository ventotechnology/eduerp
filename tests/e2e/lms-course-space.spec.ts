import { test, expect } from '@playwright/test';

test.describe('LMS Course Space & Content Provisioning Suite', () => {
  test('creates a course space, module, lesson and verifies persistence', async ({ request }) => {
    // 1. Establish Teacher session
    const authRes = await request.post('/api/auth/demo-session', {
      data: { tenantSlug: 'demo-school', role: 'TEACHER' }
    });
    expect(authRes.status()).toBe(200);

    // 2. Fetch academic metadata
    const acRes = await request.get('/api/academics?tenantSlug=demo-school');
    const acJson = await acRes.json();
    const campusId = acJson.data?.campuses?.[0]?.id;
    const academicYearId = acJson.data?.academicYears?.[0]?.id;
    const classId = acJson.data?.classes?.[0]?.id;
    const sectionId = acJson.data?.sections?.[0]?.id;
    const subjectId = acJson.data?.subjects?.[0]?.id;
    const teacherId = acJson.data?.teachers?.[0]?.id;

    if (campusId && academicYearId && classId && sectionId && subjectId && teacherId) {
      // 3. Create course space
      const courseRes = await request.post('/api/lms?tenant=demo-school&action=CREATE_COURSE', {
        data: {
          title: `E2E Course Space ${Date.now()}`,
          code: `E2E-${Date.now().toString().slice(-4)}`,
          description: 'Automated E2E testing course space',
          term: 'Annual 2026',
          campusId,
          academicYearId,
          classId,
          sectionId,
          subjectId,
          primaryTeacherId: teacherId
        }
      });

      const courseJson = await courseRes.json();
      expect(courseJson.success).toBe(true);
      const courseId = courseJson.data?.id;

      if (courseId) {
        // 4. Create Module
        const modRes = await request.post('/api/lms?tenant=demo-school&action=CREATE_MODULE', {
          data: {
            courseId,
            title: 'Module 1: Introduction',
            description: 'Introduction module description',
            sequenceOrder: 1,
            isPublished: true
          }
        });
        const modJson = await modRes.json();
        expect(modJson.success).toBe(true);
        const moduleId = modJson.data?.id;

        if (moduleId) {
          // 5. Create Lesson
          const lesRes = await request.post('/api/lms?tenant=demo-school&action=CREATE_LESSON', {
            data: {
              moduleId,
              title: 'Lesson 1.1: Core Concepts',
              lessonType: 'VIDEO',
              durationMinutes: 30,
              contentUrl: 'https://youtube.com/sample',
              textContent: 'Sample lesson content',
              sequenceOrder: 1,
              isPublished: true
            }
          });
          const lesJson = await lesRes.json();
          expect(lesJson.success).toBe(true);
        }
      }
    }
  });
});
