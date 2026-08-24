import { test, expect } from '@playwright/test';

test.describe('LMS Course Space & Content Provisioning Suite', () => {
  test('creates a course space, module, lesson with real login and verifies database persistence', async ({ request }) => {
    // 1. Establish REAL Teacher session via /api/auth/login
    const teacherEmail = process.env.E2E_TEACHER_EMAIL || 'teacher.demo-school@eduerp.us';
    const teacherPass = process.env.E2E_TEACHER_PASSWORD;
    expect(teacherPass).toBeTruthy();

    const authRes = await request.post('/api/auth/login', {
      data: { email: teacherEmail, password: teacherPass }
    });
    expect(authRes.status()).toBe(200);

    // 2. Fetch academic metadata (strict assertions - fail if missing)
    const acRes = await request.get('/api/academics?tenantSlug=demo-school');
    expect(acRes.status()).toBe(200);
    const acJson = await acRes.json();
    expect(acJson.success).toBe(true);

    const campusId = acJson.data?.campuses?.[0]?.id;
    const academicYearId = acJson.data?.academicYears?.[0]?.id;
    const classObj = acJson.data?.classes?.[0];
    const classId = classObj?.id;
    const sectionId = classObj?.sections?.[0]?.id;

    expect(campusId).toBeTruthy();
    expect(academicYearId).toBeTruthy();
    expect(classId).toBeTruthy();
    expect(sectionId).toBeTruthy();

    // 3. Create course space
    const uniqueCode = `LMS-${Date.now().toString().slice(-5)}`;
    const courseRes = await request.post('/api/lms?tenant=demo-school&action=CREATE_COURSE', {
      data: {
        title: `Physics Mechanics ${uniqueCode}`,
        code: uniqueCode,
        description: 'E2E verified physics classroom space',
        term: 'Annual 2026',
        campusId,
        academicYearId,
        classId,
        sectionId
      }
    });

    expect(courseRes.status()).toBe(200);
    const courseJson = await courseRes.json();
    expect(courseJson.success).toBe(true);
    const courseId = courseJson.data?.id;
    expect(courseId).toBeTruthy();

    // 4. Create Module
    const modRes = await request.post('/api/lms?tenant=demo-school&action=CREATE_MODULE', {
      data: {
        courseId,
        title: 'Module 1: Kinematics & Vectors',
        description: 'Introductory physics kinematics module',
        sequenceOrder: 1,
        isPublished: true
      }
    });
    expect(modRes.status()).toBe(200);
    const modJson = await modRes.json();
    expect(modJson.success).toBe(true);
    const moduleId = modJson.data?.id;
    expect(moduleId).toBeTruthy();

    // 5. Create Lesson
    const lesRes = await request.post('/api/lms?tenant=demo-school&action=CREATE_LESSON', {
      data: {
        moduleId,
        title: 'Lesson 1.1: Velocity and Acceleration',
        lessonType: 'DOCUMENT',
        durationMinutes: 45,
        textContent: 'Comprehensive study notes on vector velocity.',
        sequenceOrder: 1,
        isPublished: true
      }
    });
    expect(lesRes.status()).toBe(200);
    const lesJson = await lesRes.json();
    expect(lesJson.success).toBe(true);

    // 6. Verify persistence by retrieving full course list
    const listRes = await request.get('/api/lms?tenant=demo-school&action=COURSES');
    expect(listRes.status()).toBe(200);
    const listJson = await listRes.json();
    expect(listJson.success).toBe(true);
    const persistedCourse = listJson.data.find((c: any) => c.id === courseId);
    expect(persistedCourse).toBeTruthy();
    expect(persistedCourse.code).toBe(uniqueCode);
  });
});
