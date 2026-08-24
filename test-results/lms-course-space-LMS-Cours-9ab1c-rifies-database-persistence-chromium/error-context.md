# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lms-course-space.spec.ts >> LMS Course Space & Content Provisioning Suite >> creates a course space, module, lesson with real login and verifies database persistence
- Location: tests/e2e/lms-course-space.spec.ts:4:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 500
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('LMS Course Space & Content Provisioning Suite', () => {
  4  |   test('creates a course space, module, lesson with real login and verifies database persistence', async ({ request }) => {
  5  |     // 1. Establish REAL Teacher session via /api/auth/login
  6  |     const teacherEmail = process.env.E2E_TEACHER_EMAIL || 'teacher.demo-school@eduerp.us';
  7  |     const teacherPass = process.env.E2E_TEACHER_PASSWORD;
  8  |     expect(teacherPass).toBeTruthy();
  9  | 
  10 |     const authRes = await request.post('/api/auth/login', {
  11 |       data: { email: teacherEmail, password: teacherPass }
  12 |     });
  13 |     expect(authRes.status()).toBe(200);
  14 | 
  15 |     // 2. Fetch academic metadata (strict assertions - fail if missing)
  16 |     const acRes = await request.get('/api/academics?tenantSlug=demo-school');
  17 |     expect(acRes.status()).toBe(200);
  18 |     const acJson = await acRes.json();
  19 |     expect(acJson.success).toBe(true);
  20 | 
  21 |     const campusId = acJson.data?.campuses?.[0]?.id;
  22 |     const academicYearId = acJson.data?.academicYears?.[0]?.id;
  23 |     const classObj = acJson.data?.classes?.[0];
  24 |     const classId = classObj?.id;
  25 |     const sectionId = classObj?.sections?.[0]?.id;
  26 | 
  27 |     expect(campusId).toBeTruthy();
  28 |     expect(academicYearId).toBeTruthy();
  29 |     expect(classId).toBeTruthy();
  30 |     expect(sectionId).toBeTruthy();
  31 | 
  32 |     // 3. Create course space
  33 |     const uniqueCode = `LMS-${Date.now().toString().slice(-5)}`;
  34 |     const courseRes = await request.post('/api/lms?tenant=demo-school&action=CREATE_COURSE', {
  35 |       data: {
  36 |         title: `Physics Mechanics ${uniqueCode}`,
  37 |         code: uniqueCode,
  38 |         description: 'E2E verified physics classroom space',
  39 |         term: 'Annual 2026',
  40 |         campusId,
  41 |         academicYearId,
  42 |         classId,
  43 |         sectionId
  44 |       }
  45 |     });
  46 | 
> 47 |     expect(courseRes.status()).toBe(200);
     |                                ^ Error: expect(received).toBe(expected) // Object.is equality
  48 |     const courseJson = await courseRes.json();
  49 |     expect(courseJson.success).toBe(true);
  50 |     const courseId = courseJson.data?.id;
  51 |     expect(courseId).toBeTruthy();
  52 | 
  53 |     // 4. Create Module
  54 |     const modRes = await request.post('/api/lms?tenant=demo-school&action=CREATE_MODULE', {
  55 |       data: {
  56 |         courseId,
  57 |         title: 'Module 1: Kinematics & Vectors',
  58 |         description: 'Introductory physics kinematics module',
  59 |         sequenceOrder: 1,
  60 |         isPublished: true
  61 |       }
  62 |     });
  63 |     expect(modRes.status()).toBe(200);
  64 |     const modJson = await modRes.json();
  65 |     expect(modJson.success).toBe(true);
  66 |     const moduleId = modJson.data?.id;
  67 |     expect(moduleId).toBeTruthy();
  68 | 
  69 |     // 5. Create Lesson
  70 |     const lesRes = await request.post('/api/lms?tenant=demo-school&action=CREATE_LESSON', {
  71 |       data: {
  72 |         moduleId,
  73 |         title: 'Lesson 1.1: Velocity and Acceleration',
  74 |         lessonType: 'DOCUMENT',
  75 |         durationMinutes: 45,
  76 |         textContent: 'Comprehensive study notes on vector velocity.',
  77 |         sequenceOrder: 1,
  78 |         isPublished: true
  79 |       }
  80 |     });
  81 |     expect(lesRes.status()).toBe(200);
  82 |     const lesJson = await lesRes.json();
  83 |     expect(lesJson.success).toBe(true);
  84 | 
  85 |     // 6. Verify persistence by retrieving full course list
  86 |     const listRes = await request.get('/api/lms?tenant=demo-school&action=COURSES');
  87 |     expect(listRes.status()).toBe(200);
  88 |     const listJson = await listRes.json();
  89 |     expect(listJson.success).toBe(true);
  90 |     const persistedCourse = listJson.data.find((c: any) => c.id === courseId);
  91 |     expect(persistedCourse).toBeTruthy();
  92 |     expect(persistedCourse.code).toBe(uniqueCode);
  93 |   });
  94 | });
  95 | 
```