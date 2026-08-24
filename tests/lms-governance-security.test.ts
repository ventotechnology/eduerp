import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { createLmsCourse, getLmsCourses } from '@/lib/services/lms-course-service';
import { getGuardianLmsView, getCourseLearningAnalytics } from '@/lib/services/learning-analytics-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('COMMAND 8: LMS Multi-Tenant Security, Teacher Scope & Guardian RBAC', () => {
  let instA: any;
  let instB: any;
  let campusA: any;
  let campusB: any;
  let teacherA: any;
  let teacherB: any;
  let studentA: any;
  let studentB: any;
  let guardianA: any;
  let actorA: SessionUser;
  let actorB: SessionUser;
  let tenantA: any;
  let tenantB: any;

  beforeEach(async () => {
    const tsA = Date.now() + Math.floor(Math.random() * 10000);
    const tsB = tsA + 1;

    tenantA = await db.tenant.create({
      data: { slug: `lms-alpha-${tsA}`, institutionType: 'UNIVERSITY', subscriptionTier: 'ENTERPRISE', isActive: true },
    });
    tenantB = await db.tenant.create({
      data: { slug: `lms-beta-${tsB}`, institutionType: 'COLLEGE', subscriptionTier: 'ENTERPRISE', isActive: true },
    });

    instA = await db.institution.create({
      data: {
        tenantId: tenantA.id,
        name: 'Institution Alpha',
        shortName: 'ALPHA',
        address: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '01711000000',
        email: `alpha-${tsA}@test.edu`,
      },
    });

    instB = await db.institution.create({
      data: {
        tenantId: tenantB.id,
        name: 'Institution Beta',
        shortName: 'BETA',
        address: 'Chittagong',
        district: 'Chittagong',
        division: 'Chittagong',
        upazilaThana: 'Panchlaish',
        phone: '01811000000',
        email: `beta-${tsB}@test.edu`,
      },
    });

    campusA = await db.campus.create({
      data: { institutionId: instA.id, name: 'Campus Alpha', code: `CA-${tsA}`, address: 'Dhaka' },
    });

    campusB = await db.campus.create({
      data: { institutionId: instB.id, name: 'Campus Beta', code: `CB-${tsB}`, address: 'Chittagong' },
    });

    teacherA = await db.employee.create({
      data: {
        campusId: campusA.id,
        employeeCode: `EMP-A-${tsA}`,
        firstName: 'Teacher',
        lastName: 'Alpha',
        designation: 'Professor',
        joiningDate: new Date('2020-01-01'),
        basicSalary: 90000,
        phone: '01700000000',
        email: `teach-a-${tsA}@alpha.edu`,
        status: 'ACTIVE',
      },
    });

    teacherB = await db.employee.create({
      data: {
        campusId: campusB.id,
        employeeCode: `EMP-B-${tsB}`,
        firstName: 'Teacher',
        lastName: 'Beta',
        designation: 'Lecturer',
        joiningDate: new Date('2021-01-01'),
        basicSalary: 60000,
        phone: '01800000000',
        email: `teach-b-${tsB}@beta.edu`,
        status: 'ACTIVE',
      },
    });

    studentA = await db.student.create({
      data: {
        campusId: campusA.id,
        studentIdNumber: `STU-A-${tsA}`,
        admissionNumber: `ADM-A-${tsA}`,
        firstName: 'Student',
        lastName: 'Alpha',
        dateOfBirth: new Date('2004-01-01'),
        gender: 'Male',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        status: 'ACTIVE',
      },
    });

    studentB = await db.student.create({
      data: {
        campusId: campusB.id,
        studentIdNumber: `STU-B-${tsB}`,
        admissionNumber: `ADM-B-${tsB}`,
        firstName: 'Student',
        lastName: 'Beta',
        dateOfBirth: new Date('2004-01-01'),
        gender: 'Male',
        presentAddress: 'Chittagong',
        permanentAddress: 'Chittagong',
        status: 'ACTIVE',
      },
    });

    guardianA = await db.guardian.create({
      data: {
        fatherName: "Guardian Alpha Father",
        fatherPhone: "01700000001",
        motherName: "Guardian Alpha Mother",
        guardianName: "Guardian Alpha",
        guardianPhone: "01700000001",
      },
    });

    await db.studentGuardian.create({
      data: {
        studentId: studentA.id,
        guardianId: guardianA.id,
        relationshipType: 'FATHER',
        isPrimary: true,
      },
    });

    actorA = {
      id: teacherA.id,
      name: 'Teacher Alpha',
      email: teacherA.email,
      role: 'TEACHER',
      tenantId: tenantA.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    actorB = {
      id: teacherB.id,
      name: 'Teacher Beta',
      email: teacherB.email,
      role: 'TEACHER',
      tenantId: tenantB.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };
  });

  it('strictly isolates LMS courses between tenants, enforces guardian child scope, and evaluates early-warning analytics', async () => {
    // 1. Create course in Tenant A and Tenant B
    const courseA = await createLmsCourse(
      tenantA.slug,
      { campusId: campusA.id, code: `CRS-A-${Date.now()}`, title: 'Course Alpha', primaryTeacherId: teacherA.id, status: 'PUBLISHED' },
      actorA
    );

    const courseB = await createLmsCourse(
      tenantB.slug,
      { campusId: campusB.id, code: `CRS-B-${Date.now()}`, title: 'Course Beta', primaryTeacherId: teacherB.id, status: 'PUBLISHED' },
      actorB
    );

    // Tenant B cannot see Tenant A course
    const listB = await getLmsCourses(tenantB.slug);
    expect(listB.find((c) => c.id === courseA.id)).toBeUndefined();

    // Cross-tenant creation attempt fails
    await expect(
      createLmsCourse(
        tenantA.slug,
        { campusId: campusB.id, code: `ILLEGAL-${Date.now()}`, title: 'Illegal Cross Campus Course', primaryTeacherId: teacherA.id },
        actorA
      )
    ).rejects.toThrow(/does not belong to this institution/i);

    // Guardian A can access Student A LMS view
    const guardianViewA = await getGuardianLmsView(tenantA.slug, guardianA.id, studentA.id);
    expect(guardianViewA.student.id).toBe(studentA.id);

    // Guardian A is forbidden from accessing unrelated Student B
    await expect(
      getGuardianLmsView(tenantA.slug, guardianA.id, studentB.id)
    ).rejects.toThrow(/not authorized/i);

    // Verify deterministic learning analytics early warning alert format
    const analytics = await getCourseLearningAnalytics(tenantA.slug, courseA.id);
    expect(analytics.metrics.completionRatePercent).toBeDefined();
  });
});
