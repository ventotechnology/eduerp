import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../lib/db';
import {
  createTechnologyTrade,
  recordWorkshopLog,
  recordIndustrialAttachment
} from '../lib/services/academic-structure-service';
import { SessionUser, UserStatus } from '../lib/auth/types';

const mockAdmin: SessionUser = {
  id: 'USR-POLY-HEAD',
  name: 'Chief Instructor',
  email: 'instructor@polytechnic.edu.bd',
  role: 'PRINCIPAL',
  tenantId: 'scholars-dhaka',
  status: UserStatus.ACTIVE,
  isPlatformAdmin: false
};

describe('Polytechnic & Vocational Engine (COMMAND 3)', () => {
  let testStudentId: string;

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

    const campus = await db.campus.upsert({
      where: {
        institutionId_code: {
          institutionId: institution.id,
          code: 'CMP-MAIN'
        }
      },
      update: {},
      create: {
        institutionId: institution.id,
        name: 'DIMS Main Campus',
        code: 'CMP-MAIN',
        address: 'Dhanmondi, Dhaka',
        isMain: true
      }
    });

    // Cleanup test trade and student records from prior runs
    await db.workshopLogEntry.deleteMany({});
    await db.industrialAttachment.deleteMany({});
    await db.technologyTrade.deleteMany({ where: { institutionId: institution.id, code: 'CIVIL-TEST' } });

    const user = await db.user.create({
      data: {
        email: `poly.student.${Date.now()}@polytechnic.edu.bd`,
        passwordHash: 'hash',
        name: 'Tanvir Ahmed',
        role: 'STUDENT'
      }
    });

    const student = await db.student.create({
      data: {
        campusId: campus.id,
        userId: user.id,
        studentIdNumber: `POLY-2026-${Date.now().toString().slice(-4)}`,
        admissionNumber: `ADM-POLY-${Date.now().toString().slice(-4)}`,
        firstName: 'Tanvir',
        lastName: 'Ahmed',
        dateOfBirth: new Date('2006-05-20'),
        gender: 'Male',
        presentAddress: 'Tejgaon, Dhaka',
        permanentAddress: 'Tejgaon, Dhaka',
        status: 'ACTIVE'
      }
    });
    testStudentId = student.id;
  });

  it('creates BTEB Technology Trade with duration and curriculum code', async () => {
    const trade = await createTechnologyTrade(
      'scholars-dhaka',
      {
        name: 'Civil Technology',
        code: 'CIVIL-TEST',
        btebCode: '664',
        durationSemesters: 8,
        description: 'BTEB 4-Year Diploma in Civil Engineering Technology'
      },
      mockAdmin
    );

    expect(trade).toBeDefined();
    expect(trade.name).toBe('Civil Technology');
    expect(trade.btebCode).toBe('664');
    expect(trade.durationSemesters).toBe(8);
  });

  it('records practical workshop logbook entries with task and instructor score', async () => {
    const log = await recordWorkshopLog(
      'scholars-dhaka',
      {
        studentId: testStudentId,
        date: '2026-08-15',
        taskTitle: 'Surveying & Levelling Experiment 3: Total Station Operation',
        instructorName: 'Engr. Shahadat Hossain',
        completionStatus: 'COMPLETED',
        score: 95.0,
        teacherRemarks: 'Excellent precision in station setup and coordinate reading.'
      },
      mockAdmin
    );

    expect(log).toBeDefined();
    expect(log.score).toBe(95.0);
    expect(log.completionStatus).toBe('COMPLETED');
  });

  it('records Industrial Attachment placement and evaluation tracking', async () => {
    const attachment = await recordIndustrialAttachment(
      'scholars-dhaka',
      {
        studentId: testStudentId,
        organizationName: 'Building Technology & Ideas (BTI) Ltd.',
        supervisorName: 'Engr. Mahbubul Alam',
        startDate: '2026-06-01',
        endDate: '2026-08-31',
        evaluationScore: 92.5,
        reportStatus: 'SUBMITTED'
      },
      mockAdmin
    );

    expect(attachment).toBeDefined();
    expect(attachment.organizationName).toBe('Building Technology & Ideas (BTI) Ltd.');
    expect(attachment.evaluationScore).toBe(92.5);
    expect(attachment.reportStatus).toBe('SUBMITTED');
  });
});
