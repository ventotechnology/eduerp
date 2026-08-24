import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db';
import { registerUniversityCourse } from '@/lib/services/course-registration-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('University Course Registration & Prerequisite Validation Engine', () => {
  const actor: SessionUser = {
    id: 'USR-DEAN',
    email: 'dean@must.edu.bd',
    name: 'Dean Shamim',
    role: 'DEAN',
    tenantId: 'metropolitan-university',
    status: UserStatus.ACTIVE,
    isPlatformAdmin: false
  };

  it('strictly REJECTS course registration when hard prerequisites are not satisfied', async () => {
    // Metropolitan University student
    const campus = await db.campus.findFirst({
      where: { institution: { tenant: { slug: 'metropolitan-university' } } }
    });
    const cse302 = await db.course.findFirst({ where: { code: 'CSE-302' } });
    const cse201 = await db.course.findFirst({ where: { code: 'CSE-201' } });

    if (!campus || !cse302 || !cse201) {
      throw new Error('Seed data missing university campus or course');
    }

    await db.coursePrerequisite.upsert({
      where: {
        courseId_prerequisiteCourseId: {
          courseId: cse302.id,
          prerequisiteCourseId: cse201.id
        }
      },
      update: {},
      create: {
        courseId: cse302.id,
        prerequisiteCourseId: cse201.id,
        minGradePoint: 2.0
      }
    });

    // Create a new university student without prerequisites
    const student = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: 'MUST-2026-0099',
        admissionNumber: 'ADM-MUST-0099',
        firstName: 'Farhana',
        lastName: 'Yeasmin',
        dateOfBirth: new Date('2003-01-01'),
        gender: 'Female',
        presentAddress: 'Sylhet, Bangladesh',
        permanentAddress: 'Sylhet, Bangladesh',
        status: 'ACTIVE'
      }
    });

    // Attempt to register CSE-302 directly (requires CSE-201)
    await expect(
      registerUniversityCourse('metropolitan-university', student.id, cse302.id, 'Spring 2026', actor)
    ).rejects.toThrow(/Prerequisite not satisfied/);
  });
});
