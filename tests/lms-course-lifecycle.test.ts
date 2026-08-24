import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import {
  createLmsCourse,
  updateLmsCourse,
  getLmsCourseById,
  saveLmsSyllabus,
  addLearningOutcome,
  copyLmsCourse,
  archiveLmsCourse,
} from '@/lib/services/lms-course-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('COMMAND 8: LMS Course Space Lifecycle & Academic Linkage', () => {
  let institutionId: string;
  let campusId: string;
  let teacherId: string;
  let student1Id: string;
  let student2Id: string;
  let classId: string;
  let sectionId: string;
  let subjectId: string;
  let academicYearId: string;
  let teacherActor: SessionUser;
  let student1Actor: SessionUser;
  let student2Actor: SessionUser;
  let tenantSlug: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const tenant = await db.tenant.create({
      data: {
        slug: `lms-tenant-${timestamp}`,
        institutionType: 'UNIVERSITY',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
      },
    });
    tenantSlug = tenant.slug;

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'LMS University',
        shortName: 'LMSU',
        address: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '01711223344',
        email: `lms-${timestamp}@eduerp.us`,
      },
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Main Campus',
        code: `MC-${timestamp}`,
        address: 'Dhaka',
      },
    });
    campusId = campus.id;

    const ay = await db.academicYear.create({
      data: {
        institutionId: inst.id,
        name: `Academic Year 2026-${timestamp}`,
        code: `AY-${timestamp}`,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        status: 'ACTIVE',
      },
    });
    academicYearId = ay.id;

    const cls = await db.class.create({
      data: {
        institutionId: inst.id,
        name: "BSc in CSE",
        numericValue: 13,
      },
    });
    classId = cls.id;

    const sec = await db.section.create({
      data: {
        classId: cls.id,
        name: 'Section A',
        capacity: 50,
      },
    });
    sectionId = sec.id;

    const subj = await db.subject.create({
      data: {
        classId: cls.id,
        name: "Computer Architecture",
        code: `CSE-301-${timestamp}`,
        type: "THEORY",
      },
    });
    subjectId = subj.id;

    const emp = await db.employee.create({
      data: {
        campusId: campus.id,
        employeeCode: `EMP-TCH-${timestamp}`,
        firstName: 'Tariqul',
        lastName: 'Hasan',
        designation: 'Associate Professor',
        joiningDate: new Date('2020-01-01'),
        basicSalary: 85000,
        phone: '01700000000',
        email: `tariqul-${timestamp}@lmsu.edu`,
        status: 'ACTIVE',
      },
    });
    teacherId = emp.id;

    const s1 = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `STU-LMS1-${timestamp}`,
        admissionNumber: `ADM-LMS1-${timestamp}`,
        firstName: 'Farhan',
        lastName: 'Kabir',
        dateOfBirth: new Date('2004-01-01'),
        gender: 'Male',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        status: 'ACTIVE',
      },
    });
    student1Id = s1.id;

    // Enroll student 1 in Class + Section
    await db.enrollment.create({
      data: {
        studentId: s1.id,
        academicYearId: ay.id,
        classId: cls.id,
        sectionId: sec.id,
        rollNumber: '1',
        status: 'ACTIVE',
      },
    });

    const s2 = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `STU-LMS2-${timestamp}`,
        admissionNumber: `ADM-LMS2-${timestamp}`,
        firstName: 'Imran',
        lastName: 'Nazir',
        dateOfBirth: new Date('2004-01-01'),
        gender: 'Male',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        status: 'ACTIVE',
      },
    });
    student2Id = s2.id;
    // Student 2 is NOT enrolled in Section A

    teacherActor = {
      id: emp.id,
      name: 'Prof. Tariqul',
      email: emp.email,
      role: 'TEACHER',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    student1Actor = {
      id: 'user-s1',
      name: 'Farhan Kabir',
      email: 's1@lmsu.edu',
      role: 'STUDENT',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    student2Actor = {
      id: 'user-s2',
      name: 'Imran Nazir',
      email: 's2@lmsu.edu',
      role: 'STUDENT',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };
  });

  it('creates course space, enforces duplicate prevention, saves syllabus, outcomes, copies course and archives', async () => {
    // 1. Create LMS Course
    const course = await createLmsCourse(
      tenantSlug,
      {
        campusId,
        code: `CSE-301-SEC-A-${Date.now()}`,
        title: 'Computer Architecture & Organization',
        description: 'Instruction sets, pipelining, and memory hierarchy.',
        academicYearId,
        classId,
        sectionId,
        subjectId,
        primaryTeacherId: teacherId,
        status: 'PUBLISHED',
      },
      teacherActor
    );
    expect(course.id).toBeDefined();
    expect(course.status).toBe('PUBLISHED');

    // 2. Prevent duplicate active course space for same class, section, subject in same academic year
    await expect(
      createLmsCourse(
        tenantSlug,
        {
          campusId,
          code: `CSE-301-DUP-${Date.now()}`,
          title: 'Duplicate Attempt Course',
          academicYearId,
          classId,
          sectionId,
          subjectId,
          primaryTeacherId: teacherId,
        },
        teacherActor
      )
    ).rejects.toThrow(/already exists/i);

    // 3. Save Syllabus
    const syllabus = await saveLmsSyllabus(
      tenantSlug,
      {
        courseId: course.id,
        overview: 'Comprehensive study of pipelined RISC architectures.',
        objectives: 'Understand CPU microarchitectures, caches, and memory consistency models.',
        requiredMaterials: 'Computer Organization and Design: Patterson & Hennessy (6th Edition)',
        assessmentBreakdown: 'Homework: 10%, Assignments: 20%, Quizzes: 20%, Midterm: 20%, Final: 30%',
        officeHours: 'Sunday & Tuesday 02:00 PM - 04:00 PM',
      },
      teacherActor
    );
    expect(syllabus.version).toBe(1);

    // 4. Add Learning Outcomes (CLO1, CLO2)
    const clo1 = await addLearningOutcome(
      tenantSlug,
      {
        courseId: course.id,
        code: 'CLO1',
        description: 'Design and analyze 5-stage pipelined datapath with hazard forwarding.',
        bloomLevel: 'APPLY',
      },
      teacherActor
    );
    expect(clo1.code).toBe('CLO1');

    // 5. Course Copy to Next Academic Period
    const copiedCourse = await copyLmsCourse(
      tenantSlug,
      {
        sourceCourseId: course.id,
        newCode: `CSE-301-SPRING27-${Date.now()}`,
        newTitle: 'Computer Architecture (Spring 2027)',
        primaryTeacherId: teacherId,
      },
      teacherActor
    );
    expect(copiedCourse.id).toBeDefined();
    expect(copiedCourse.status).toBe('DRAFT');

    const copiedFull = await getLmsCourseById(tenantSlug, copiedCourse.id);
    expect(copiedFull.syllabus?.overview).toBe(syllabus.overview);
    expect(copiedFull.learningOutcomes.length).toBe(1);

    // 6. Archive Course
    const archived = await archiveLmsCourse(tenantSlug, course.id, teacherActor);
    expect(archived.status).toBe('ARCHIVED');
  });
});
