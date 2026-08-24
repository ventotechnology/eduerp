import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../lib/db';
import {
  createExam,
  recordBulkMarks,
  calculateAndFinalizeExamResults,
  publishExamResults,
  correctMarkEntry,
  getPublicExamResult
} from '../lib/services/exam-service';
import { SessionUser, UserStatus } from '../lib/auth/types';

const mockAdmin: SessionUser = {
  id: 'USR-CORR-ADMIN',
  name: 'Headmaster',
  email: 'head@scholars.edu.bd',
  role: 'PRINCIPAL',
  tenantId: 'scholars-dhaka',
  status: UserStatus.ACTIVE,
  isPlatformAdmin: false
};

describe('Result Snapshots & Versioned Corrections (COMMAND 4)', () => {
  let institutionId: string;
  let sessionId: string;
  let classId: string;
  let sectionId: string;
  let subjectId: string;
  let studentId: string;
  let stStudentIdNumber: string;
  let examId: string;
  let marksEntryId: string;

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
        name: `Academic Year 2026-Snap-${ts}`,
        code: `AY-2026-SNAP-${ts}`,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31')
      }
    });

    const session = await db.session.create({
      data: {
        academicYearId: acadYear.id,
        name: `Session 2026-Snap-${ts}`,
        type: 'ANNUAL',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31')
      }
    });
    sessionId = session.id;

    const cls = await db.class.create({
      data: {
        institutionId,
        name: `Class 10-Snap-${ts}`,
        numericValue: 10,
        shift: 'Morning'
      }
    });
    classId = cls.id;

    const sec = await db.section.create({
      data: {
        classId,
        name: `Section Alpha-${ts}`
      }
    });
    sectionId = sec.id;

    const sub = await db.subject.create({
      data: {
        classId,
        name: 'General Science',
        code: `GSC-${ts.toString().slice(-4)}`,
        fullMarks: 100,
        passMarks: 33
      }
    });
    subjectId = sub.id;

    stStudentIdNumber = `ST-SNAP-${ts}`;
    const st = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: stStudentIdNumber,
        admissionNumber: `ADM-SNAP-${ts}`,
        rollNumber: '01',
        firstName: 'Tamim',
        lastName: 'Iqbal',
        dateOfBirth: new Date('2009-03-20'),
        gender: 'Male',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        sectionId
      }
    });
    studentId = st.id;

    const exam = await createExam(
      'scholars-dhaka',
      {
        sessionId,
        name: `Annual Term Evaluation 2026-${ts}`,
        type: 'ANNUAL',
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-15')
      },
      mockAdmin
    );
    examId = exam.id;

    const entries = await recordBulkMarks(
      'scholars-dhaka',
      {
        examId,
        subjectId,
        entries: [
          {
            studentId,
            theoryMarks: 65
          }
        ]
      },
      mockAdmin
    );
    marksEntryId = entries[0].id;
  });

  it('finalizes exam results and generates immutable Result Snapshot Version 1', async () => {
    const snapshots = await calculateAndFinalizeExamResults('scholars-dhaka', examId, mockAdmin);

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].version).toBe(1);
    expect(snapshots[0].isCurrent).toBe(true);
    expect(snapshots[0].gpa).toBe(3.5);
    expect(snapshots[0].letterGrade).toBe('A-');
    expect(snapshots[0].isPassed).toBe(true);

    // Publish results
    await publishExamResults(
      'scholars-dhaka',
      {
        examId,
        publicationStatus: 'PUBLISHED'
      },
      mockAdmin
    );
  });

  it('allows post-publication mark correction and increments Result Snapshot to Version 2 while preserving Version 1 history', async () => {
    // Correct mark from 65 to 85 (Grade A+ / 5.0)
    await correctMarkEntry(
      'scholars-dhaka',
      {
        marksEntryId,
        newScore: 85,
        componentName: 'TH',
        reason: 'Re-evaluation of subjective section by scrutiny committee'
      },
      mockAdmin
    );

    // Recalculate results
    const newSnapshots = await calculateAndFinalizeExamResults('scholars-dhaka', examId, mockAdmin);

    expect(newSnapshots).toHaveLength(1);
    expect(newSnapshots[0].version).toBe(2);
    expect(newSnapshots[0].isCurrent).toBe(true);
    expect(newSnapshots[0].gpa).toBe(5.0);
    expect(newSnapshots[0].letterGrade).toBe('A+');

    // Check that Version 1 snapshot is still in the database with isCurrent: false
    const allSnapshots = await db.examResultSnapshot.findMany({
      where: { examId, studentId },
      orderBy: { version: 'asc' }
    });

    expect(allSnapshots).toHaveLength(2);
    expect(allSnapshots[0].version).toBe(1);
    expect(allSnapshots[0].isCurrent).toBe(false);
    expect(allSnapshots[0].gpa).toBe(3.5);

    expect(allSnapshots[1].version).toBe(2);
    expect(allSnapshots[1].isCurrent).toBe(true);
    expect(allSnapshots[1].gpa).toBe(5.0);
  });

  it('returns updated Version 2 result on public lookup', async () => {
    const publicResult = await getPublicExamResult('scholars-dhaka', {
      studentIdNumber: stStudentIdNumber,
      examId
    });

    expect(publicResult).toBeDefined();
    expect(publicResult.studentName).toBe('Tamim Iqbal');
    expect(publicResult.gpa).toBe(5.0);
    expect(publicResult.letterGrade).toBe('A+');
    expect(publicResult.isPassed).toBe(true);
  });
});
