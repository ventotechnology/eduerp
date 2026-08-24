import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db';
import {
  createAdmissionApplication,
  transitionAdmissionStatus,
  convertApplicantToStudent
} from '@/lib/services/admission-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('Admission Engine & Atomic Student Conversion', () => {
  const actor: SessionUser = {
    id: 'USR-ADMIN',
    email: 'admin@dims.edu.bd',
    name: 'Principal Mahmud',
    role: 'PRINCIPAL',
    tenantId: 'dhaka-ideal-school',
    status: UserStatus.ACTIVE,
    isPlatformAdmin: false
  };

  it('submits admission application and enforces strict status transition machine', async () => {
    const inst = await db.institution.findFirst({ where: { tenant: { slug: "dhaka-ideal-school" } } });
    const campus = await db.campus.findFirst({ where: { institutionId: inst?.id } });
    const academicYear = await db.academicYear.findFirst();

    if (!campus || !academicYear) {
      throw new Error('Seed data missing campus or academicYear');
    }

    const app = await createAdmissionApplication('dhaka-ideal-school', {
      campusId: campus.id,
      academicYearId: academicYear.id,
      firstName: 'Khadija',
      lastName: 'Akter',
      dateOfBirth: '2010-02-20',
      gender: 'Female',
      phone: '+880 1700-112233',
      presentAddress: 'Dhanmondi, Dhaka',
      permanentAddress: 'Dhanmondi, Dhaka',
      guardianName: 'Anwar Hossain',
      guardianPhone: '+880 1700-112233'
    });

    expect(app.applicationNumber).toMatch(/^APP-2026-[\d-]+$/);
    expect(app.status).toBe('SUBMITTED');

    // Valid transition: SUBMITTED -> UNDER_REVIEW
    const reviewed = await transitionAdmissionStatus('dhaka-ideal-school', app.id, 'UNDER_REVIEW', actor);
    expect(reviewed.status).toBe('UNDER_REVIEW');

    // Invalid transition: UNDER_REVIEW -> ADMITTED (must pass tests/selection)
    await expect(
      transitionAdmissionStatus('dhaka-ideal-school', app.id, 'ADMITTED', actor)
    ).rejects.toThrow(/Invalid lifecycle transition/);
  });

  it('converts selected applicant to student atomically in a transaction and prevents duplicate conversion', async () => {
    const inst = await db.institution.findFirst({ where: { tenant: { slug: "dhaka-ideal-school" } } });
    const campus = await db.campus.findFirst({ where: { institutionId: inst?.id } });
    const academicYear = await db.academicYear.findFirst();

    const app = await createAdmissionApplication('dhaka-ideal-school', {
      campusId: campus!.id,
      academicYearId: academicYear!.id,
      firstName: 'Sajid',
      lastName: 'Hasan',
      dateOfBirth: '2011-06-12',
      gender: 'Male',
      phone: '+880 1700-445566',
      presentAddress: 'Mirpur, Dhaka',
      permanentAddress: 'Mirpur, Dhaka',
      guardianName: 'Farid Hasan',
      guardianPhone: '+880 1700-445566'
    });

    // Convert to student
    const student = await convertApplicantToStudent('dhaka-ideal-school', app.id, null, actor);

    expect(student.studentIdNumber).toMatch(/^[A-Z0-9]+-2026-\d{4}$/);
    expect(student.firstName).toBe('Sajid');
    expect(student.status).toBe('ACTIVE');

    // Check application marked as ADMITTED
    const checkApp = await db.admissionApplication.findUnique({ where: { id: app.id } });
    expect(checkApp?.status).toBe('ADMITTED');

    // Duplicate conversion attempt must fail
    await expect(
      convertApplicantToStudent('dhaka-ideal-school', app.id, null, actor)
    ).rejects.toThrow(/Applicant has already been admitted/);
  });
});
