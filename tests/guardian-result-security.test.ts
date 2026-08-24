import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../lib/db';
import {
  createExam,
  recordBulkMarks,
  calculateAndFinalizeExamResults,
  publishExamResults,
  getStudentExamResults
} from '../lib/services/exam-service';
import { SessionUser, UserStatus } from '../lib/auth/types';

describe('Guardian & Student Result Access Control & Isolation (COMMAND 4)', () => {
  let institutionId: string;
  let examId: string;
  let studentAId: string;
  let studentBId: string;

  const mockAdmin: SessionUser = {
    id: 'USR-SEC-ADMIN',
    name: 'Admin User',
    email: 'admin@scholars.edu.bd',
    role: 'PRINCIPAL',
    tenantId: 'scholars-dhaka',
    status: UserStatus.ACTIVE,
    isPlatformAdmin: false
  };

  const mockGuardianA: SessionUser = {
    id: 'USR-GUARD-A',
    name: 'Guardian A',
    email: 'parentA@scholars.edu.bd',
    role: 'PARENT',
    tenantId: 'scholars-dhaka',
    status: UserStatus.ACTIVE,
    isPlatformAdmin: false
  };

  const mockStudentAUser: SessionUser = {
    id: 'USR-STUD-A',
    name: 'Student A',
    email: 'studentA@scholars.edu.bd',
    role: 'STUDENT',
    tenantId: 'scholars-dhaka',
    status: UserStatus.ACTIVE,
    isPlatformAdmin: false
  };

  const mockStudentBUser: SessionUser = {
    id: 'USR-STUD-B',
    name: 'Student B',
    email: 'studentB@scholars.edu.bd',
    role: 'STUDENT',
    tenantId: 'scholars-dhaka',
    status: UserStatus.ACTIVE,
    isPlatformAdmin: false
  };

  beforeAll(async () => {
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

    await db.user.upsert({
      where: { id: mockGuardianA.id },
      update: {},
      create: {
        id: mockGuardianA.id,
        tenantId: tenant.id,
        email: mockGuardianA.email,
        name: mockGuardianA.name,
        role: mockGuardianA.role,
        passwordHash: 'dummy',
        status: 'ACTIVE'
      }
    });

    await db.user.upsert({
      where: { id: mockStudentAUser.id },
      update: {},
      create: {
        id: mockStudentAUser.id,
        tenantId: tenant.id,
        email: mockStudentAUser.email,
        name: mockStudentAUser.name,
        role: mockStudentAUser.role,
        passwordHash: 'dummy',
        status: 'ACTIVE'
      }
    });

    await db.user.upsert({
      where: { id: mockStudentBUser.id },
      update: {},
      create: {
        id: mockStudentBUser.id,
        tenantId: tenant.id,
        email: mockStudentBUser.email,
        name: mockStudentBUser.name,
        role: mockStudentBUser.role,
        passwordHash: 'dummy',
        status: 'ACTIVE'
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

    const ts = Date.now();
    const acadYear = await db.academicYear.create({
      data: {
        institutionId,
        name: `Academic Year 2026-Sec-${ts}`,
        code: `AY-2026-SEC-${ts}`,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31')
      }
    });

    const session = await db.session.create({
      data: {
        academicYearId: acadYear.id,
        name: `Session 2026-Sec-${ts}`,
        type: 'ANNUAL',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31')
      }
    });

    const cls = await db.class.create({
      data: {
        institutionId,
        name: `Class 6-Sec-${ts}`,
        numericValue: 6,
        shift: 'Morning'
      }
    });

    const sub = await db.subject.create({
      data: {
        classId: cls.id,
        name: 'English',
        code: `ENG-${ts.toString().slice(-4)}`,
        fullMarks: 100,
        passMarks: 33
      }
    });

    // Create Guardian A
    const guardA = await db.guardian.upsert({
      where: { userId: mockGuardianA.id },
      update: {},
      create: {
        userId: mockGuardianA.id,
        fatherName: 'Mr. Rafiqul A',
        fatherPhone: `+880 1711-${ts.toString().slice(-6)}`,
        motherName: 'Mrs. Fatema A',
        guardianName: 'Mr. Rafiqul A',
        guardianPhone: `+880 1711-${ts.toString().slice(-6)}`,
        guardianRelation: 'Father'
      }
    });

    // Create Student A (Linked to Guardian A)
    const stA = await db.student.upsert({
      where: { userId: mockStudentAUser.id },
      update: { guardianId: guardA.id },
      create: {
        campusId: campus.id,
        userId: mockStudentAUser.id,
        studentIdNumber: `ST-SEC-${ts}-1`,
        admissionNumber: `ADM-SEC-${ts}-1`,
        firstName: 'Zubair',
        lastName: 'Ahmed',
        dateOfBirth: new Date('2012-02-10'),
        gender: 'Male',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        guardianId: guardA.id
      }
    });
    studentAId = stA.id;

    // Create Student B (Unrelated, no link to Guardian A)
    const stB = await db.student.upsert({
      where: { userId: mockStudentBUser.id },
      update: {},
      create: {
        campusId: campus.id,
        userId: mockStudentBUser.id,
        studentIdNumber: `ST-SEC-${ts}-2`,
        admissionNumber: `ADM-SEC-${ts}-2`,
        firstName: 'Anika',
        lastName: 'Tabassum',
        dateOfBirth: new Date('2012-06-15'),
        gender: 'Female',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka'
      }
    });
    studentBId = stB.id;

    // Exam & Marks
    const ex = await createExam(
      'scholars-dhaka',
      {
        sessionId: session.id,
        name: 'Midterm 2026-Sec',
        type: 'MIDTERM',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-10')
      },
      mockAdmin
    );
    examId = ex.id;

    await recordBulkMarks(
      'scholars-dhaka',
      {
        examId: ex.id,
        subjectId: sub.id,
        entries: [
          { studentId: stA.id, theoryMarks: 78 },
          { studentId: stB.id, theoryMarks: 85 }
        ]
      },
      mockAdmin
    );

    await calculateAndFinalizeExamResults('scholars-dhaka', ex.id, mockAdmin);
    await publishExamResults(
      'scholars-dhaka',
      {
        examId: ex.id,
        publicationStatus: 'PUBLISHED'
      },
      mockAdmin
    );
  });

  it('allows Guardian A to view published results of their linked child Student A', async () => {
    const results = await getStudentExamResults('scholars-dhaka', studentAId, mockGuardianA, examId);

    expect(results).toHaveLength(1);
    expect(results[0].studentId).toBe(studentAId);
    expect(results[0].gpa).toBe(4.0); // 78% => A (4.0)
  });

  it('strictly forbids Guardian A from accessing results of unrelated Student B', async () => {
    await expect(
      getStudentExamResults('scholars-dhaka', studentBId, mockGuardianA, examId)
    ).rejects.toThrow(/Access denied: You are not authorized/);
  });

  it('allows Student A to view their own results but forbids Student A from viewing Student B', async () => {
    const selfResults = await getStudentExamResults('scholars-dhaka', studentAId, mockStudentAUser, examId);
    expect(selfResults).toHaveLength(1);
    expect(selfResults[0].studentId).toBe(studentAId);

    await expect(
      getStudentExamResults('scholars-dhaka', studentBId, mockStudentAUser, examId)
    ).rejects.toThrow(/Access denied: You can only view your own results/);
  });
});
