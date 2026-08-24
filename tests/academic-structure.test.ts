import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../lib/db';
import {
  createAcademicYear,
  createAcademicSession,
  createShift,
  createAcademicGroup,
  createSchoolClass,
  createSchoolSection,
  createSchoolSubject,
  duplicateAcademicYearStructure,
  getTenantAcademicStructure
} from '../lib/services/academic-structure-service';
import { SessionUser, UserStatus } from '../lib/auth/types';

const mockAdmin: SessionUser = {
  id: 'USR-ACAD-ADMIN',
  name: 'Academic Dean',
  email: 'dean@scholars.edu.bd',
  role: 'PRINCIPAL',
  tenantId: 'scholars-dhaka',
  status: UserStatus.ACTIVE,
  isPlatformAdmin: false
};

describe('Academic Structure Engine (COMMAND 3)', () => {
  beforeAll(async () => {
    // Ensure tenant exists
    await db.tenant.upsert({
      where: { slug: 'scholars-dhaka' },
      update: {},
      create: {
        slug: 'scholars-dhaka',
        institutionType: 'SCHOOL',
        subscriptionTier: 'PROFESSIONAL',
        isActive: true
      }
    });

    const tenant = await db.tenant.findUnique({ where: { slug: 'scholars-dhaka' } });
    await db.institution.upsert({
      where: { tenantId: tenant!.id },
      update: {},
      create: {
        tenantId: tenant!.id,
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

    // Clean up any test records from prior runs
    const inst = await db.institution.findFirst({ where: { tenantId: tenant!.id } });
    if (inst) {
      await db.timetableEntry.deleteMany({ where: { institutionId: inst.id } });
      await db.subject.deleteMany({ where: { class: { institutionId: inst.id } } });
      await db.section.deleteMany({ where: { class: { institutionId: inst.id } } });
      await db.class.deleteMany({ where: { institutionId: inst.id, name: 'Grade 8 Test' } });
      await db.shift.deleteMany({ where: { institutionId: inst.id, code: 'SFT-DAY-TEST' } });
      await db.subjectCombinationTemplate.deleteMany({ where: { institutionId: inst.id } });
      await db.academicGroup.deleteMany({ where: { institutionId: inst.id, code: 'HUM-TEST' } });
      await db.session.deleteMany({ where: { academicYear: { name: { in: ['2028-TEST', '2029-TEST'] } } } });
      await db.academicYear.deleteMany({ where: { institutionId: inst.id, name: { in: ['2028-TEST', '2029-TEST'] } } });
    }
  });

  it('creates an Academic Year with status DRAFT and updates active year', async () => {
    const year = await createAcademicYear(
      'scholars-dhaka',
      {
        name: '2028-TEST',
        code: 'AY-2028',
        startDate: '2028-01-01',
        endDate: '2028-12-31',
        status: 'ACTIVE',
        isCurrent: true
      },
      mockAdmin
    );

    expect(year).toBeDefined();
    expect(year.name).toBe('2028-TEST');
    expect(year.isCurrent).toBe(true);
  });

  it('creates an Academic Session attached to an Academic Year', async () => {
    const year = await db.academicYear.findFirst({
      where: { name: '2028-TEST' }
    });

    const session = await createAcademicSession(
      'scholars-dhaka',
      {
        academicYearId: year!.id,
        name: 'Annual Term 2028',
        type: 'ANNUAL',
        startDate: '2028-01-01',
        endDate: '2028-12-31',
        status: 'ACTIVE',
        isCurrent: true
      },
      mockAdmin
    );

    expect(session).toBeDefined();
    expect(session.name).toBe('Annual Term 2028');
  });

  it('creates Shifts with start and end times', async () => {
    const shift = await createShift(
      'scholars-dhaka',
      {
        name: 'Day Shift Test',
        code: 'SFT-DAY-TEST',
        startTime: '12:45',
        endTime: '17:30',
        breakStartTime: '15:00',
        breakEndTime: '15:30',
        isActive: true
      },
      mockAdmin
    );

    expect(shift).toBeDefined();
    expect(shift.code).toBe('SFT-DAY-TEST');
  });

  it('creates Academic Groups (Science / Commerce / Humanities)', async () => {
    const group = await createAcademicGroup(
      'scholars-dhaka',
      {
        name: 'Humanities Stream',
        code: 'HUM-TEST',
        description: 'Arts & Humanities Stream'
      },
      mockAdmin
    );

    expect(group).toBeDefined();
    expect(group.code).toBe('HUM-TEST');
  });

  it('creates Classes, Sections, and Subjects with mark distribution breakdown', async () => {
    const cls = await createSchoolClass(
      'scholars-dhaka',
      {
        name: 'Grade 8 Test',
        numericValue: 8,
        sequence: 8,
        stage: 'SECONDARY',
        shift: 'Morning'
      },
      mockAdmin
    );

    const sec = await createSchoolSection(
      'scholars-dhaka',
      {
        classId: cls.id,
        name: 'Section Blue',
        capacity: 35
      },
      mockAdmin
    );

    const sub = await createSchoolSubject(
      'scholars-dhaka',
      {
        classId: cls.id,
        name: 'General Science',
        code: 'SCI-08',
        type: 'COMPULSORY',
        fullMarks: 100,
        passMarks: 33,
        theoryMarks: 60,
        practicalMarks: 20,
        assignmentMarks: 10,
        attendanceMarks: 10
      },
      mockAdmin
    );

    expect(cls.name).toBe('Grade 8 Test');
    expect(sec.capacity).toBe(35);
    expect(sub.practicalMarks).toBe(20);
  });

  it('duplicates entire academic year structure for next-year setup in DRAFT status', async () => {
    const sourceYear = await db.academicYear.findFirst({
      where: { name: '2028-TEST' }
    });

    const nextYear = await duplicateAcademicYearStructure(
      'scholars-dhaka',
      sourceYear!.id,
      '2029-TEST',
      mockAdmin
    );

    expect(nextYear).toBeDefined();
    expect(nextYear.name).toBe('2029-TEST');
    expect(nextYear.status).toBe('DRAFT');
    expect(nextYear.isCurrent).toBe(false);
    expect(nextYear.sessions.length).toBeGreaterThanOrEqual(1);
  });

  it('fetches full tenant aggregate academic structure', async () => {
    const structure = await getTenantAcademicStructure('scholars-dhaka');
    expect(structure).toBeDefined();
    expect(structure.academicYears.length).toBeGreaterThan(0);
    expect(structure.shifts.length).toBeGreaterThan(0);
    expect(structure.classes.length).toBeGreaterThan(0);
  });
});
