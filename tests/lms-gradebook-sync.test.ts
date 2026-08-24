import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { createLmsCourse } from '@/lib/services/lms-course-service';
import {
  createGradebookItem,
  getCourseGradebook,
  overrideGradebookScore,
  syncLmsGradeToOfficialExam,
} from '@/lib/services/gradebook-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('COMMAND 8: LMS Gradebook Matrix, Score Overrides & Command 4 Official Exam Sync', () => {
  let institutionId: string;
  let campusId: string;
  let teacherId: string;
  let studentId: string;
  let courseId: string;
  let examId: string;
  let assessmentComponentId: string;
  let teacherActor: SessionUser;
  let tenantSlug: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const tenant = await db.tenant.create({
      data: { slug: `lms-gbk-${timestamp}`, institutionType: 'UNIVERSITY', subscriptionTier: 'ENTERPRISE', isActive: true },
    });
    tenantSlug = tenant.slug;

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Gradebook Test University',
        shortName: 'GBU',
        address: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '01711223344',
        email: `gbk-${timestamp}@eduerp.us`,
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
        employeeCode: `EMP-GBK-${timestamp}`,
        firstName: 'Faruque',
        lastName: 'Ahmed',
        designation: 'Professor',
        joiningDate: new Date('2020-01-01'),
        basicSalary: 95000,
        phone: '01700000000',
        email: `faruque-${timestamp}@eduerp.us`,
        status: 'ACTIVE',
      },
    });
    teacherId = emp.id;

    const stu = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `STU-GBK-${timestamp}`,
        admissionNumber: `ADM-GBK-${timestamp}`,
        firstName: 'Tanzil',
        lastName: 'Hasan',
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
      name: 'Prof. Faruque',
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
        code: `CSE-401-${timestamp}`,
        title: 'Compiler Design',
        primaryTeacherId: teacherId,
        status: 'PUBLISHED',
      },
      teacherActor
    );
    courseId = crs.id;

    // Command 4 Exam & Assessment Component Fixture
    const ay = await db.academicYear.create({
      data: {
        institutionId: inst.id,
        name: `Academic Year ${timestamp}`,
        code: `AY-GBK-${timestamp}`,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        status: 'ACTIVE',
      },
    });

    const session = await db.session.create({
      data: {
        academicYearId: ay.id,
        name: `Spring 2026-${timestamp}`,
        type: "SEMESTER",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-06-30"),
        status: "ACTIVE",
      },
    });

    const ex = await db.exam.create({
      data: {
        institutionId: inst.id,
        sessionId: session.id,
        name: "Spring 2026 Final Examination",
        type: "FINAL",
        startDate: new Date("2026-05-01"),
        endDate: new Date("2026-05-20"),
      },
    });
    examId = ex.id;

    const comp = await db.assessmentComponent.create({
      data: {
        institutionId: inst.id,
        name: 'Continuous Internal Assessment (CIA)',
        code: `CIA-${timestamp}`,
        
        maxMarks: 20,
        passMarks: 8,
        weight: 20,
      },
    });
    assessmentComponentId = comp.id;
  });

  it('calculates gradebook matrix, handles teacher score overrides, and synchronizes into official exam mark records', async () => {
    // 1. Create Gradebook Item (Assignment 1, 20% weight)
    const item = await createGradebookItem(
      tenantSlug,
      {
        courseId,
        itemType: 'ASSIGNMENT',
        title: 'Lexical Analyzer Implementation',
        maxScore: 100,
        weightPercent: 20,
        assessmentComponentId,
      },
      teacherActor
    );
    expect(item.id).toBeDefined();

    // 2. Override/Set Student Score to 90/100
    const score = await overrideGradebookScore(
      tenantSlug,
      {
        gradebookItemId: item.id,
        studentId,
        scoreObtained: 90,
        overrideReason: 'Full points awarded for Lex/Yacc grammar implementation.',
      },
      teacherActor
    );
    expect(score.scoreObtained).toBe(90);
    expect(score.finalWeightedScore).toBe(18); // 90% of 20 = 18 marks

    // 3. Sync Gradebook to Command 4 Official Exam
    const syncRes = await syncLmsGradeToOfficialExam(
      tenantSlug,
      {
        gradebookItemId: item.id,
        examId,
        assessmentComponentId,
      },
      teacherActor
    );
    expect(syncRes.status).toBe('SUCCESS');
    expect(syncRes.syncedCount).toBe(1);

    // 4. Verify Command 4 MarkRecord was created with scaled score (90% of 20 = 18 marks)
    const marksEntry = await db.marksEntry.findFirst({
      where: { examId, studentId },
    });
    expect(marksEntry).toBeDefined();
    expect(marksEntry?.assignmentMarks).toBe(18);
    expect(marksEntry?.workflowStatus).toBe("DRAFT");
    // REGRESSION TEST: LMS cannot inject authoritative letter grade or grade points
    expect(marksEntry?.letterGrade).toBe("PENDING");
    expect(marksEntry?.gradePoint).toBe(0);
  });
});
