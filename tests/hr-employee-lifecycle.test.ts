import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import {
  createEmployee,
  updateEmployee,
  createPosition,
  addEmployeeQualification,
  addEmployeeDocument,
  getEmployeeProfile,
} from '@/lib/services/employee-service';
import {
  promoteEmployee,
  transferEmployee,
  requestSalaryIncrement,
  requestEmployeeSeparation,
  updateExitClearance,
} from '@/lib/services/talent-lifecycle-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('Command 6: Complete Employee Master & Talent Lifecycle Engine', () => {
  let tenantSlug: string;
  let institutionId: string;
  let campusAId: string;
  let campusBId: string;
  let departmentId: string;
  let positionLecturerId: string;
  let positionAsstProfId: string;
  let hrAdminUser: SessionUser;
  let employeeId: string;

  beforeAll(async () => {
    const timestamp = Date.now();
    tenantSlug = `hr-life-${timestamp}`;

    const tenant = await db.tenant.create({
      data: {
        slug: tenantSlug,
        institutionType: 'UNIVERSITY',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
      },
    });

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: `HR Lifecycle University ${timestamp}`,
        shortName: `HLU${timestamp.toString().slice(-4)}`,
        eiin: `EIIN-${timestamp.toString().slice(-5)}`,
        boardAffiliation: 'UGC',
        address: 'Uttara, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Uttara',
        phone: '01711112222',
        email: `hr-${timestamp}@eduerp.us`,
      },
    });
    institutionId = inst.id;

    const cA = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Main Campus',
        code: `MC-${timestamp.toString().slice(-4)}`,
        address: 'Uttara',
      },
    });
    campusAId = cA.id;

    const cB = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'City Campus',
        code: `CC-${timestamp.toString().slice(-4)}`,
        address: 'Dhanmondi',
      },
    });
    campusBId = cB.id;

    const dept = await db.department.create({
      data: {
        institutionId: inst.id,
        name: 'Computer Science & Engineering',
        code: `CSE-${timestamp.toString().slice(-4)}`,
      },
    });
    departmentId = dept.id;

    hrAdminUser = {
      id: `USR-HR-${timestamp}`,
      name: 'Director of HR',
      email: `hr-director-${timestamp}@eduerp.us`,
      role: 'HR_MANAGER',
      tenantId: tenantSlug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    const pos1 = await createPosition(
      tenantSlug,
      {
        positionCode: `POS-LEC-${timestamp.toString().slice(-4)}`,
        title: 'Lecturer in Computer Science',
        campusId: campusAId,
        departmentId,
        category: 'TEACHING',
        authorizedHeadcount: 5,
      },
      hrAdminUser
    );
    positionLecturerId = pos1.id;

    const pos2 = await createPosition(
      tenantSlug,
      {
        positionCode: `POS-AP-${timestamp.toString().slice(-4)}`,
        title: 'Assistant Professor in Computer Science',
        campusId: campusAId,
        departmentId,
        category: 'TEACHING',
        authorizedHeadcount: 3,
      },
      hrAdminUser
    );
    positionAsstProfId = pos2.id;
  });

  it('creates employee master record with comprehensive demographic and employment details', async () => {
    const employee = await createEmployee(
      tenantSlug,
      {
        campusId: campusAId,
        departmentId,
        positionId: positionLecturerId,
        employeeCode: `EMP-CSE-101`,
        firstName: 'Mahmudur',
        lastName: 'Rahman',
        designation: 'Lecturer',
        category: 'TEACHING',
        academicRank: 'Lecturer',
        status: 'ACTIVE',
        employmentType: 'PERMANENT',
        basicSalary: 45000,
        phone: '01712345678',
        email: 'mahmudur@hlu.edu.bd',
        dateOfBirth: '1992-04-12',
        gender: 'Male',
        nationality: 'Bangladeshi',
        bloodGroup: 'B+',
        presentAddress: 'Sector 4, Uttara',
        permanentAddress: 'Sector 4, Uttara',
        joiningDate: '2022-01-01',
        emergencyContactName: 'Fatema Rahman',
        emergencyContactPhone: '01812345678',
        emergencyContactRelation: 'Spouse',
      },
      hrAdminUser
    );

    employeeId = employee.id;
    expect(employee.employeeCode).toBe('EMP-CSE-101');
    expect(employee.category).toBe('TEACHING');
    expect(employee.status).toBe('ACTIVE');
    expect(employee.basicSalary).toBe(45000);
  });

  it('attaches academic qualifications and professional documents', async () => {
    const qual = await addEmployeeQualification(
      tenantSlug,
      {
        employeeId,
        degree: 'M.Sc in Computer Science',
        subject: 'Artificial Intelligence',
        institution: 'University of Dhaka',
        country: 'Bangladesh',
        passingYear: 2016,
        resultGrade: 'First Class (3.92/4.00)',
      },
      hrAdminUser
    );
    expect(qual.degree).toBe('M.Sc in Computer Science');

    const doc = await addEmployeeDocument(
      tenantSlug,
      {
        employeeId,
        documentType: 'NID',
        title: 'National Identity Smart Card',
        documentNumber: '19921234567890',
        verificationStatus: 'VERIFIED',
        fileUrl: '/uploads/nid/mahmudur_nid.pdf',
      },
      hrAdminUser
    );
    expect(doc.documentType).toBe('NID');
    expect(doc.verificationStatus).toBe('VERIFIED');
  });

  it('promotes employee to Assistant Professor, preserving historical promotion logs', async () => {
    const promotion = await promoteEmployee(
      tenantSlug,
      {
        employeeId,
        effectiveDate: '2026-07-01',
        newPositionId: positionAsstProfId,
        newAcademicRank: 'Assistant Professor',
        reason: 'Exceptional teaching performance, research publications, and 4 years tenure completion',
      },
      hrAdminUser
    );

    expect(promotion.newAcademicRank).toBe('Assistant Professor');

    // Verify active employee record reflects promotion
    const profile = await getEmployeeProfile(tenantSlug, employeeId, hrAdminUser);
    expect(profile.academicRank).toBe('Assistant Professor');
    expect(profile.positionId).toBe(positionAsstProfId);
    expect(profile.promotions.length).toBe(1);
    expect(profile.promotions[0].previousAcademicRank).toBe('Lecturer');
  });

  it('transfers employee to City Campus, preserving transfer history', async () => {
    const transfer = await transferEmployee(
      tenantSlug,
      {
        employeeId,
        effectiveDate: '2026-08-01',
        newCampusId: campusBId,
        reason: 'Department expansion and laboratory leadership at City Campus',
      },
      hrAdminUser
    );

    expect(transfer.newCampusId).toBe(campusBId);

    const profile = await getEmployeeProfile(tenantSlug, employeeId, hrAdminUser);
    expect(profile.campusId).toBe(campusBId);
    expect(profile.transfers.length).toBe(1);
    expect(profile.transfers[0].previousCampusId).toBe(campusAId);
  });

  it('records salary increment request and updates compensation history', async () => {
    const increment = await requestSalaryIncrement(
      tenantSlug,
      {
        employeeId,
        effectiveDate: '2026-08-01',
        newGrossSalary: 75000,
        reason: 'Promotion grade scale adjustment to Assistant Professor Scale',
      },
      hrAdminUser
    );

    expect(increment.newGrossSalary).toBe(75000);
    expect(increment.incrementAmount).toBe(30000);
  });

  it('manages separation and multi-department exit clearance without destroying historical records', async () => {
    // 1. Employee submits resignation
    const separation = await requestEmployeeSeparation(
      tenantSlug,
      {
        employeeId,
        separationType: 'RESIGNATION',
        lastWorkingDate: '2026-09-30',
        noticePeriodDays: 60,
        reason: 'Pursuing Post-Doctoral Fellowship abroad',
      },
      hrAdminUser
    );

    expect(separation.status).toBe('SUBMITTED');

    // Verify employee status transitioned to NOTICE_PERIOD
    let emp = await db.employee.findUnique({ where: { id: employeeId } });
    expect(emp?.status).toBe('NOTICE_PERIOD');

    // 2. Multi-Department Exit Clearance
    const clearance = await updateExitClearance(
      tenantSlug,
      {
        separationId: separation.id,
        departmentCleared: true,
        libraryCleared: true,
        financeCleared: true,
        itEquipmentCleared: true,
        hostelCleared: true,
        finalPayrollInputData: JSON.stringify({ unpaidDays: 0, loanDeduction: 0, providentFundSettlement: 120000 }),
      },
      hrAdminUser
    );

    expect(clearance.overallStatus).toBe('FULLY_CLEARED');

    // Verify employee status is updated to RESIGNED and record is preserved
    emp = await db.employee.findUnique({ where: { id: employeeId } });
    expect(emp?.status).toBe('RESIGNED');
    expect(emp?.employeeCode).toBe('EMP-CSE-101');
  });
});
