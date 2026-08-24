import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../lib/db';
import {
  createExam,
  recordBulkMarks,
  transitionMarksWorkflow,
  correctMarkEntry,
  scheduleExam
} from '../lib/services/exam-service';
import { SessionUser, UserStatus } from '../lib/auth/types';

const mockAdmin: SessionUser = {
  id: 'USR-EXAM-ADMIN',
  name: 'Exam Controller',
  email: 'controller@scholars.edu.bd',
  role: 'PRINCIPAL',
  tenantId: 'scholars-dhaka',
  status: UserStatus.ACTIVE,
  isPlatformAdmin: false
};

const mockTeacherUnassigned: SessionUser = {
  id: 'USR-TEACHER-UNASSIGNED',
  name: 'Unassigned Teacher',
  email: 'teacher2@scholars.edu.bd',
  role: 'TEACHER',
  tenantId: 'scholars-dhaka',
  status: UserStatus.ACTIVE,
  isPlatformAdmin: false
};

const mockTeacherAssigned: SessionUser = {
  id: 'USR-TEACHER-ASSIGNED',
  name: 'Assigned Teacher',
  email: 'teacher1@scholars.edu.bd',
  role: 'TEACHER',
  tenantId: 'scholars-dhaka',
  status: UserStatus.ACTIVE,
  isPlatformAdmin: false
};

describe('Marks Workflow & Moderation Engine (COMMAND 4)', () => {
  let institutionId: string;
  let academicYearId: string;
  let sessionId: string;
  let classId: string;
  let sectionId: string;
  let subjectId: string;
  let student1Id: string;
  let student2Id: string;
  let examId: string;
  let teacherProfileId: string;

  beforeAll(async () => {
    // Ensure tenant exists
    const tenant = await db.tenant.upsert({
      where: { slug: 'scholars-dhaka' },
      update: {},
      create: {
        slug: 'scholars-dhaka',
        institutionType: 'SCHOOL',
        subscriptionTier: 'PROFESSIONAL',
        isActive: true
      }
    });

    const institution = await db.institution.upsert({
      where: { tenantId: tenant.id },
      update: {},
      create: {
        tenantId: tenant.id,
        name: 'Dhaka Scholars International School',
        shortName: 'DIMS',
        eiin: '108456',
        boardAffiliation: 'DHAKA',
        address: 'Dhanmondi, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '+880 1711-000000',
        email: 'info@scholars.edu.bd'
      }
    });
    institutionId = institution.id;

    // Campus
    const campus = await db.campus.upsert({
      where: { institutionId_code: { institutionId, code: 'MAIN' } },
      update: {},
      create: {
        institutionId,
        name: 'Main Campus',
        code: 'MAIN',
        address: 'Dhanmondi'
      }
    });

    // Academic Year & Session
    const ts = Date.now();
    const acadYear = await db.academicYear.create({
      data: {
        institutionId,
        name: `Academic Year 2026-Marks-${ts}`,
        code: `AY-2026-M-${ts}`,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31')
      }
    });
    academicYearId = acadYear.id;

    const session = await db.session.create({
      data: {
        academicYearId,
        name: `Session 2026-Marks-${ts}`,
        type: 'ANNUAL',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31')
      }
    });
    sessionId = session.id;

    // Class, Section & Subject
    const cls = await db.class.create({
      data: {
        institutionId,
        name: `Class 9-Marks-${ts}`,
        numericValue: 9,
        shift: 'Morning'
      }
    });
    classId = cls.id;

    const sec = await db.section.create({
      data: {
        classId,
        name: `Section A-Marks-${ts}`
      }
    });
    sectionId = sec.id;

    const sub = await db.subject.create({
      data: {
        classId,
        name: 'Physics',
        code: `PHY-${ts.toString().slice(-4)}`,
        fullMarks: 100,
        passMarks: 33,
        theoryMarks: 70,
        practicalMarks: 25,
        assignmentMarks: 5
      }
    });
    subjectId = sub.id;

    // Students
    const st1 = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `ST-PHY-${ts}-1`,
        admissionNumber: `ADM-PHY-${ts}-1`,
        firstName: 'Farhan',
        lastName: 'Ahmed',
        dateOfBirth: new Date('2010-05-12'),
        gender: 'Male',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        sectionId
      }
    });
    student1Id = st1.id;

    const st2 = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `ST-PHY-${ts}-2`,
        admissionNumber: `ADM-PHY-${ts}-2`,
        firstName: 'Nabila',
        lastName: 'Islam',
        dateOfBirth: new Date('2010-08-20'),
        gender: 'Female',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        sectionId
      }
    });
    student2Id = st2.id;

    // Upsert User records for teachers
    await db.user.upsert({
      where: { id: mockTeacherAssigned.id },
      update: {},
      create: {
        id: mockTeacherAssigned.id,
        tenantId: tenant.id,
        email: mockTeacherAssigned.email,
        name: mockTeacherAssigned.name,
        role: mockTeacherAssigned.role,
        passwordHash: 'dummy',
        status: 'ACTIVE'
      }
    });

    await db.user.upsert({
      where: { id: mockTeacherUnassigned.id },
      update: {},
      create: {
        id: mockTeacherUnassigned.id,
        tenantId: tenant.id,
        email: mockTeacherUnassigned.email,
        name: mockTeacherUnassigned.name,
        role: mockTeacherUnassigned.role,
        passwordHash: 'dummy',
        status: 'ACTIVE'
      }
    });

    // Create Teacher Profiles
    const emp1 = await db.employee.upsert({
      where: { userId: mockTeacherAssigned.id },
      update: {},
      create: {
        campusId: campus.id,
        userId: mockTeacherAssigned.id,
        employeeCode: `EMP-C1-${ts}`,
        firstName: 'Assigned',
        lastName: 'Teacher',
        designation: 'Senior Teacher',
        department: 'Science',
        email: `assigned-${ts}@scholars.edu.bd`,
        phone: '+880 1700-111111',
        basicSalary: 35000,
        joiningDate: new Date()
      }
    });

    const teacher = await db.teacher.upsert({
      where: { employeeId: emp1.id },
      update: {},
      create: {
        employeeId: emp1.id,
        specialization: 'Physics',
        qualification: 'MSc in Physics'
      }
    });
    teacherProfileId = teacher.id;

    // Assign teacher to subject
    await db.teacherAssignment.create({
      data: {
        academicYearId,
        teacherId: teacher.id,
        classId,
        sectionId,
        subjectId
      }
    });

    // Unassigned teacher
    const emp2 = await db.employee.upsert({
      where: { userId: mockTeacherUnassigned.id },
      update: {},
      create: {
        campusId: campus.id,
        userId: mockTeacherUnassigned.id,
        employeeCode: `EMP-C2-${ts}`,
        firstName: 'Unassigned',
        lastName: 'Teacher',
        designation: 'Teacher',
        department: 'Arts',
        email: `unassigned-${ts}@scholars.edu.bd`,
        phone: '+880 1700-222222',
        basicSalary: 25000,
        joiningDate: new Date()
      }
    });
    await db.teacher.upsert({
      where: { employeeId: emp2.id },
      update: {},
      create: {
        employeeId: emp2.id,
        specialization: 'History',
        qualification: 'MA in History'
      }
    });

    // Create Exam
    const exam = await createExam(
      'scholars-dhaka',
      {
        sessionId,
        name: 'Midterm Physics Exam 2026',
        type: 'MIDTERM',
        targetClassId: classId,
        startDate: new Date('2026-06-10'),
        endDate: new Date('2026-06-20')
      },
      mockAdmin
    );
    examId = exam.id;
  });

  it('enforces teacher assignment server-side: rejects unassigned teacher entering marks', async () => {
    await expect(
      recordBulkMarks(
        'scholars-dhaka',
        {
          examId,
          subjectId,
          entries: [
            {
              studentId: student1Id,
              theoryMarks: 60,
              practicalMarks: 20
            }
          ]
        },
        mockTeacherUnassigned
      )
    ).rejects.toThrow(/Unauthorized: You are not assigned/);
  });

  it('allows authorized assigned teacher to record valid student marks in DRAFT workflow status', async () => {
    const entries = await recordBulkMarks(
      'scholars-dhaka',
      {
        examId,
        subjectId,
        entries: [
          {
            studentId: student1Id,
            theoryMarks: 62,
            practicalMarks: 22,
            assignmentMarks: 4,
            attendanceMarks: 0
          },
          {
            studentId: student2Id,
            markStatus: 'ABSENT',
            theoryMarks: 0,
            practicalMarks: 0
          }
        ]
      },
      mockTeacherAssigned
    );

    expect(entries).toHaveLength(2);

    const farhan = entries.find((e) => e.studentId === student1Id);
    expect(farhan).toBeDefined();
    expect(farhan!.totalMarks).toBe(88);
    expect(farhan!.letterGrade).toBe('A+');
    expect(farhan!.gradePoint).toBe(5.0);
    expect(farhan!.status).toBe('PASS');
    expect(farhan!.workflowStatus).toBe('DRAFT');

    const nabila = entries.find((e) => e.studentId === student2Id);
    expect(nabila).toBeDefined();
    expect(nabila!.markStatus).toBe('ABSENT');
    expect(nabila!.letterGrade).toBe('ABSENT');
    expect(nabila!.status).toBe('FAIL');
  });

  it('transitions marks workflow: DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED -> LOCKED', async () => {
    // 1. Submit
    const submitRes = await transitionMarksWorkflow(
      'scholars-dhaka',
      {
        examId,
        subjectId,
        targetStatus: 'SUBMITTED'
      },
      mockTeacherAssigned
    );
    expect(submitRes.targetStatus).toBe('SUBMITTED');

    let mark = await db.marksEntry.findFirst({ where: { examId, studentId: student1Id, subjectId } });
    expect(mark?.workflowStatus).toBe('SUBMITTED');
    expect(mark?.submittedBy).toBe('Assigned Teacher');

    // 2. Review
    await transitionMarksWorkflow(
      'scholars-dhaka',
      {
        examId,
        subjectId,
        targetStatus: 'UNDER_REVIEW'
      },
      mockAdmin
    );
    mark = await db.marksEntry.findFirst({ where: { examId, studentId: student1Id, subjectId } });
    expect(mark?.workflowStatus).toBe('UNDER_REVIEW');

    // 3. Approve
    await transitionMarksWorkflow(
      'scholars-dhaka',
      {
        examId,
        subjectId,
        targetStatus: 'APPROVED'
      },
      mockAdmin
    );
    mark = await db.marksEntry.findFirst({ where: { examId, studentId: student1Id, subjectId } });
    expect(mark?.workflowStatus).toBe('APPROVED');

    // 4. Lock
    await transitionMarksWorkflow(
      'scholars-dhaka',
      {
        examId,
        subjectId,
        targetStatus: 'LOCKED'
      },
      mockAdmin
    );
    mark = await db.marksEntry.findFirst({ where: { examId, studentId: student1Id, subjectId } });
    expect(mark?.workflowStatus).toBe('LOCKED');
    expect(mark?.isLocked).toBe(true);
  });

  it('prevents direct modification of locked marks', async () => {
    await expect(
      recordBulkMarks(
        'scholars-dhaka',
        {
          examId,
          subjectId,
          entries: [
            {
              studentId: student1Id,
              theoryMarks: 50
            }
          ]
        },
        mockTeacherAssigned
      )
    ).rejects.toThrow(/Marks for this student have already been LOCKED/);
  });

  it('allows authorized mark correction with immutable MarkAuditLog', async () => {
    const mark = await db.marksEntry.findFirst({ where: { examId, studentId: student1Id, subjectId } });
    expect(mark).toBeDefined();

    const corrected = await correctMarkEntry(
      'scholars-dhaka',
      {
        marksEntryId: mark!.id,
        newScore: 92,
        componentName: 'TH',
        reason: 'Recounting error during board paper scrutiny'
      },
      mockAdmin
    );

    expect(corrected.totalMarks).toBe(92);
    expect(corrected.letterGrade).toBe('A+');
    expect(corrected.gradePoint).toBe(5.0);

    // Verify Audit Trail in DB
    const auditLogs = await db.markAuditLog.findMany({
      where: { marksEntryId: mark!.id }
    });
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].previousScore).toBe(88);
    expect(auditLogs[0].newScore).toBe(92);
    expect(auditLogs[0].reason).toBe('Recounting error during board paper scrutiny');
    expect(auditLogs[0].changedByName).toBe('Exam Controller');
  });
});
