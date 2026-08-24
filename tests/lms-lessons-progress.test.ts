import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { createLmsCourse } from '@/lib/services/lms-course-service';
import {
  createModule,
  createLesson,
  updateLessonProgress,
  getCourseContentWithProgress,
} from '@/lib/services/lesson-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('COMMAND 8: LMS Modules, Digital Lessons & Progress Tracking', () => {
  let institutionId: string;
  let campusId: string;
  let teacherId: string;
  let studentId: string;
  let courseId: string;
  let teacherActor: SessionUser;
  let tenantSlug: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const tenant = await db.tenant.create({
      data: { slug: `lms-les-${timestamp}`, institutionType: 'UNIVERSITY', subscriptionTier: 'ENTERPRISE', isActive: true },
    });
    tenantSlug = tenant.slug;

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Lesson Test University',
        shortName: 'LTU',
        address: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '01711223344',
        email: `les-${timestamp}@eduerp.us`,
      },
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: { institutionId: inst.id, name: 'Main Campus', code: `MC-${timestamp}`, address: 'Dhaka' },
    });
    campusId = campus.id;

    const emp = await db.employee.create({
      data: {
        campusId: campus.id,
        employeeCode: `EMP-LES-${timestamp}`,
        firstName: 'Shahriar',
        lastName: 'Ahmed',
        designation: 'Professor',
        joiningDate: new Date('2020-01-01'),
        basicSalary: 90000,
        phone: '01700000000',
        email: `shahriar-${timestamp}@eduerp.us`,
        status: 'ACTIVE',
      },
    });
    teacherId = emp.id;

    const stu = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `STU-LES-${timestamp}`,
        admissionNumber: `ADM-LES-${timestamp}`,
        firstName: 'Nabil',
        lastName: 'Hossain',
        dateOfBirth: new Date('2004-01-01'),
        gender: 'Male',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        status: 'ACTIVE',
      },
    });
    studentId = stu.id;

    teacherActor = {
      id: emp.id,
      name: 'Prof. Shahriar',
      email: emp.email,
      role: 'TEACHER',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    const crs = await createLmsCourse(
      tenantSlug,
      {
        campusId,
        code: `PHY-101-${timestamp}`,
        title: 'General Physics I',
        primaryTeacherId: teacherId,
        status: 'PUBLISHED',
      },
      teacherActor
    );
    courseId = crs.id;
  });

  it('creates ordered modules, digital lessons across content types, tracks student progress and calculates percentage', async () => {
    // 1. Create Modules
    const mod1 = await createModule(
      tenantSlug,
      {
        courseId,
        title: 'Module 1: Vectors & Kinematics',
        sequenceOrder: 1,
        releaseType: 'IMMEDIATE',
        isPublished: true,
      },
      teacherActor
    );

    const mod2 = await createModule(
      tenantSlug,
      {
        courseId,
        title: 'Module 2: Dynamics & Work-Energy',
        sequenceOrder: 2,
        releaseType: 'PREREQUISITE_MODULE',
        prerequisiteModuleId: mod1.id,
        isPublished: true,
      },
      teacherActor
    );

    // 2. Create Lessons with different content types
    const les1 = await createLesson(
      tenantSlug,
      {
        moduleId: mod1.id,
        title: '1.1 Vector Algebra & Dot Products',
        summary: 'Unit vectors, scalar and cross products with 3D graphical examples.',
        content: 'Vectors represent physical quantities possessing both magnitude and direction...',
        contentType: 'RICH_TEXT',
        estimatedDurationMinutes: 45,
        sequenceOrder: 1,
        completionRule: 'MANUAL_CHECK',
        status: 'PUBLISHED',
      },
      teacherActor
    );

    const les2 = await createLesson(
      tenantSlug,
      {
        moduleId: mod1.id,
        title: '1.2 2D Projectile Motion Video Lecture',
        summary: 'Trajectory equations under constant gravitational acceleration.',
        contentType: 'VIDEO_LINK',
        videoUrl: 'https://youtube.com/watch?v=demo-physics-01',
        estimatedDurationMinutes: 30,
        sequenceOrder: 2,
        completionRule: 'VIEW_RESOURCE',
        status: 'PUBLISHED',
      },
      teacherActor
    );

    // 3. Update Lesson Progress for student (Complete Lesson 1)
    const progressRes1 = await updateLessonProgress(
      tenantSlug,
      {
        lessonId: les1.id,
        studentId,
        status: 'COMPLETED',
      },
      teacherActor
    );
    expect(progressRes1.lessonProgress.status).toBe('COMPLETED');
    expect(progressRes1.courseProgress.completedActivitiesCount).toBe(1);
    expect(progressRes1.courseProgress.totalActivitiesCount).toBe(2);
    expect(progressRes1.courseProgress.progressPercentage).toBe(50);
    expect(progressRes1.courseProgress.status).toBe('IN_PROGRESS');

    // 4. Complete Lesson 2 -> Progress reaches 100%
    const progressRes2 = await updateLessonProgress(
      tenantSlug,
      {
        lessonId: les2.id,
        studentId,
        status: 'COMPLETED',
      },
      teacherActor
    );
    expect(progressRes2.courseProgress.completedActivitiesCount).toBe(2);
    expect(progressRes2.courseProgress.progressPercentage).toBe(100);
    expect(progressRes2.courseProgress.status).toBe('COMPLETED');

    // 5. Fetch course content with progress overlay
    const content = await getCourseContentWithProgress(tenantSlug, courseId, studentId);
    expect(content.length).toBe(2);
    expect((content[0].lessons[0] as any).userProgress.status).toBe('COMPLETED');
  });
});
