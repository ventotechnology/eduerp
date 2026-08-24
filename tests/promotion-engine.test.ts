import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../lib/db';
import {
  previewClassPromotion,
  executeClassPromotion,
  evaluateUniversitySemesterProgression,
  evaluateUniversityGraduation,
  processUniversityGraduation
} from '../lib/services/progression-service';
import { calculateAndFinalizeExamResults, createExam, recordBulkMarks } from '../lib/services/exam-service';
import { SessionUser, UserStatus } from '../lib/auth/types';

const mockAdmin: SessionUser = {
  id: 'USR-PROM-ADMIN',
  name: 'Academic Dean',
  email: 'dean@scholars.edu.bd',
  role: 'PRINCIPAL',
  tenantId: 'scholars-dhaka',
  status: UserStatus.ACTIVE,
  isPlatformAdmin: false
};

describe('Promotion, Semester Progression & Graduation Engine (COMMAND 4)', () => {
  let institutionId: string;
  let academicYear2025Id: string;
  let academicYear2026Id: string;
  let class7Id: string;
  let class8Id: string;
  let student1Id: string;
  let student2Id: string;
  let examId: string;

  // University fixtures
  let uniInstitutionId: string;
  let programId: string;
  let uniStudentId: string;
  let course1Id: string;
  let course2Id: string;

  beforeAll(async () => {
    // 1. School Setup
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

    // 2 Academic Years
    const ts = Date.now();
    const ay25 = await db.academicYear.create({
      data: {
        institutionId,
        name: `Academic Year 2025-${ts}`,
        code: `AY-2025-P-${ts}`,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31')
      }
    });
    academicYear2025Id = ay25.id;

    const ay26 = await db.academicYear.create({
      data: {
        institutionId,
        name: `Academic Year 2026-${ts}`,
        code: `AY-2026-P-${ts}`,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31')
      }
    });
    academicYear2026Id = ay26.id;

    const sess25 = await db.session.create({
      data: {
        academicYearId: ay25.id,
        name: `Session 2025-${ts}`,
        type: 'ANNUAL',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31')
      }
    });

    // Classes 7 and 8
    const cls7 = await db.class.create({
      data: {
        institutionId,
        name: `Class 7-P-${ts}`,
        numericValue: 7,
        shift: 'Morning'
      }
    });
    class7Id = cls7.id;

    const cls8 = await db.class.create({
      data: {
        institutionId,
        name: `Class 8-P-${ts}`,
        numericValue: 8,
        shift: 'Morning'
      }
    });
    class8Id = cls8.id;

    const sub = await db.subject.create({
      data: {
        classId: cls7.id,
        name: 'Mathematics',
        code: `MTH-${ts.toString().slice(-4)}`,
        fullMarks: 100,
        passMarks: 33
      }
    });

    // Students enrolled in Class 7 for 2025
    const st1 = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `ST-PROM-${ts}-1`,
        admissionNumber: `ADM-PROM-${ts}-1`,
        rollNumber: '01',
        firstName: 'Ahsan',
        lastName: 'Habib',
        dateOfBirth: new Date('2011-04-10'),
        gender: 'Male',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        enrollments: {
          create: {
            academicYearId: ay25.id,
            classId: cls7.id,
            enrollmentDate: new Date('2025-01-10'),
            rollNumber: '01',
            status: 'ACTIVE'
          }
        }
      }
    });
    student1Id = st1.id;

    const st2 = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `ST-PROM-${ts}-2`,
        admissionNumber: `ADM-PROM-${ts}-2`,
        rollNumber: '02',
        firstName: 'Sadia',
        lastName: 'Afrin',
        dateOfBirth: new Date('2011-09-15'),
        gender: 'Female',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        enrollments: {
          create: {
            academicYearId: ay25.id,
            classId: cls7.id,
            enrollmentDate: new Date('2025-01-10'),
            rollNumber: '02',
            status: 'ACTIVE'
          }
        }
      }
    });
    student2Id = st2.id;

    // Exam & Marks in 2025
    const ex = await createExam(
      'scholars-dhaka',
      {
        sessionId: sess25.id,
        name: `Final Annual Exam 2025-${ts}`,
        type: 'ANNUAL',
        startDate: new Date('2025-11-10'),
        endDate: new Date('2025-11-25')
      },
      mockAdmin
    );
    examId = ex.id;

    // St1 scores 80 (A+ / 5.0), St2 scores 25 (F / 0.0)
    await recordBulkMarks(
      'scholars-dhaka',
      {
        examId: ex.id,
        subjectId: sub.id,
        entries: [
          { studentId: st1.id, theoryMarks: 80 },
          { studentId: st2.id, theoryMarks: 25 }
        ]
      },
      mockAdmin
    );
    await calculateAndFinalizeExamResults('scholars-dhaka', ex.id, mockAdmin);

    // 2. University Setup
    const uniTenant = await db.tenant.upsert({
      where: { slug: 'green-university' },
      update: {},
      create: {
        slug: 'green-university',
        institutionType: 'UNIVERSITY',
        subscriptionTier: 'ENTERPRISE',
        isActive: true
      }
    });

    const uniInst = await db.institution.upsert({
      where: { tenantId: uniTenant.id },
      update: {},
      create: {
        tenantId: uniTenant.id,
        name: 'Green University of Bangladesh',
        shortName: 'GUB',
        eiin: '136789',
        boardAffiliation: 'UGC',
        address: 'Purbachal, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Rupganj',
        phone: '+880 1700-111222',
        email: 'info@green.edu.bd'
      }
    });
    uniInstitutionId = uniInst.id;

    const uniCampus = await db.campus.upsert({
      where: { institutionId_code: { institutionId: uniInstitutionId, code: 'PERM' } },
      update: {},
      create: {
        institutionId: uniInstitutionId,
        name: 'Permanent Campus',
        code: 'PERM',
        address: 'Purbachal'
      }
    });

    const fac = await db.faculty.create({
      data: {
        institutionId: uniInstitutionId,
        name: 'Faculty of Science & Engineering',
        code: 'FSE'
      }
    });

    const dept = await db.department.create({
      data: {
        institutionId: uniInstitutionId,
        facultyId: fac.id,
        name: 'Department of Computer Science & Engineering',
        code: 'CSE'
      }
    });

    const prog = await db.program.create({
      data: {
        departmentId: dept.id,
        name: 'BSc in Computer Science and Engineering',
        code: 'BSC-CSE',
        degreeLevel: 'BACHELOR',
        durationYears: 4.0,
        totalCredits: 6.0 // set low for test threshold
      }
    });
    programId = prog.id;

    const batch = await db.batch.create({
      data: {
        programId: prog.id,
        name: 'Batch 2022',
        year: 2022
      }
    });

    const c1 = await db.course.create({
      data: {
        programId: prog.id,
        code: 'CSE-401',
        title: 'Artificial Intelligence',
        creditHours: 3.0
      }
    });
    course1Id = c1.id;

    const c2 = await db.course.create({
      data: {
        programId: prog.id,
        code: 'CSE-402',
        title: 'Compiler Design',
        creditHours: 3.0
      }
    });
    course2Id = c2.id;

    const uniStudent = await db.student.create({
      data: {
        campusId: uniCampus.id,
        studentIdNumber: 'UG-221-001',
        admissionNumber: 'ADM-UG-221',
        firstName: 'Mahfuz',
        lastName: 'Anam',
        dateOfBirth: new Date('2002-07-11'),
        gender: 'Male',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        batchId: batch.id,
        courseRegistrations: {
          create: [
            {
              courseId: c1.id,
              semester: '8th Semester',
              status: 'COMPLETED',
              gradePoint: 3.75,
              letterGrade: 'A'
            },
            {
              courseId: c2.id,
              semester: '8th Semester',
              status: 'COMPLETED',
              gradePoint: 4.00,
              letterGrade: 'A+'
            }
          ]
        }
      }
    });
    uniStudentId = uniStudent.id;
  });

  it('previews class promotion recommendations accurately based on academic performance', async () => {
    const preview = await previewClassPromotion(
      'scholars-dhaka',
      {
        fromAcademicYearId: academicYear2025Id,
        toAcademicYearId: academicYear2026Id,
        fromClassId: class7Id,
        toClassId: class8Id,
        minimumPassingGpa: 1.0,
        maxAllowedFailedSubjects: 0
      },
      mockAdmin
    );

    expect(preview.totalStudents).toBe(2);

    const st1Preview = preview.students.find((s) => s.studentId === student1Id);
    expect(st1Preview).toBeDefined();
    expect(st1Preview!.recommendedStatus).toBe('PROMOTED');
    expect(st1Preview!.gpa).toBe(5.0);

    const st2Preview = preview.students.find((s) => s.studentId === student2Id);
    expect(st2Preview).toBeDefined();
    expect(st2Preview!.recommendedStatus).toBe('REPEAT');
    expect(st2Preview!.gpa).toBe(0.0);
  });

  it('executes bulk promotion inside a transaction without overwriting past enrollment history', async () => {
    const batch = await executeClassPromotion(
      'scholars-dhaka',
      {
        fromAcademicYearId: academicYear2025Id,
        toAcademicYearId: academicYear2026Id,
        fromClassId: class7Id,
        toClassId: class8Id,
        minimumPassingGpa: 1.0,
        maxAllowedFailedSubjects: 0
      },
      mockAdmin
    );

    expect(batch).toBeDefined();
    expect(batch.promotedCount).toBe(1);
    expect(batch.repeatedCount).toBe(1);

    // Verify Student 1 (Promoted to Class 8)
    const st1Enrollments = await db.enrollment.findMany({
      where: { studentId: student1Id },
      orderBy: { enrollmentDate: 'asc' }
    });
    expect(st1Enrollments).toHaveLength(2);
    // Historical 2025 enrollment preserved as COMPLETED
    expect(st1Enrollments[0].academicYearId).toBe(academicYear2025Id);
    expect(st1Enrollments[0].classId).toBe(class7Id);
    expect(st1Enrollments[0].status).toBe('COMPLETED');
    // New 2026 enrollment created as ACTIVE in Class 8
    expect(st1Enrollments[1].academicYearId).toBe(academicYear2026Id);
    expect(st1Enrollments[1].classId).toBe(class8Id);
    expect(st1Enrollments[1].status).toBe('ACTIVE');

    // Verify Student 2 (Repeating Class 7)
    const st2Enrollments = await db.enrollment.findMany({
      where: { studentId: student2Id },
      orderBy: { enrollmentDate: 'asc' }
    });
    expect(st2Enrollments).toHaveLength(2);
    expect(st2Enrollments[0].status).toBe('COMPLETED');
    expect(st2Enrollments[1].academicYearId).toBe(academicYear2026Id);
    expect(st2Enrollments[1].classId).toBe(class7Id);
    expect(st2Enrollments[1].status).toBe('ACTIVE');
  });

  it('evaluates University semester progression and standing', async () => {
    const prog = await evaluateUniversitySemesterProgression(
      'green-university',
      uniStudentId,
      mockAdmin
    );

    expect(prog).toBeDefined();
    expect(prog.totalEarnedCredits).toBe(6.0);
    expect(prog.cgpa).toBe(3.88);
    expect(prog.academicStanding).toBe('GOOD_STANDING');
    expect(prog.failedCoursesToRetake).toHaveLength(0);
  });

  it('evaluates university graduation eligibility and processes final GraduationRecord with degree classification', async () => {
    const gradEval = await evaluateUniversityGraduation(
      'green-university',
      uniStudentId,
      mockAdmin
    );

    expect(gradEval.isEligible).toBe(true);
    expect(gradEval.isCreditsFulfilled).toBe(true);
    expect(gradEval.isCgpaFulfilled).toBe(true);
    expect(gradEval.degreeClassification).toBe('Distinction / First Class with Honors');

    // Process graduation
    const gradRecord = await processUniversityGraduation(
      'green-university',
      {
        studentId: uniStudentId,
        programId,
        graduationDate: new Date('2026-08-15'),
        thesisTitle: 'Deep Learning for Edge AI Devices',
        convocationBatch: '12th Convocation'
      },
      mockAdmin
    );

    expect(gradRecord).toBeDefined();
    expect(gradRecord.finalCgpa).toBe(3.88);
    expect(gradRecord.totalCreditsCompleted).toBe(6.0);
    expect(gradRecord.degreeClassification).toBe('Distinction / First Class with Honors');

    // Verify student status is updated to GRADUATED
    const student = await db.student.findUnique({ where: { id: uniStudentId } });
    expect(student?.status).toBe('GRADUATED');
  });
});
