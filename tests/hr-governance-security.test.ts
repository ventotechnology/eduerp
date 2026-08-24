import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/lib/db';
import { createEmployee, getEmployeeProfile } from '@/lib/services/employee-service';
import { createPosition } from '@/lib/services/employee-service';
import { requirePermission } from '@/lib/rbac/guard';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('Command 6: HR Governance, Field-Level Privacy & Cross-Tenant Security', () => {
  let tenantA: string;
  let tenantB: string;
  let campusAId: string;
  let campusBId: string;
  let employeeAId: string;
  let hrUserA: SessionUser;
  let teacherUserA: SessionUser;

  beforeAll(async () => {
    const ts = Date.now();

    // Tenant A
    tenantA = `hr-gov-a-${ts}`;
    const tA = await db.tenant.create({
      data: {
        slug: tenantA,
        institutionType: 'SCHOOL',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
      },
    });

    const instA = await db.institution.create({
      data: {
        tenantId: tA.id,
        name: `Gov School Alpha ${ts}`,
        shortName: `GSA${ts.toString().slice(-4)}`,
        eiin: `EIIN-${ts.toString().slice(-5)}`,
        boardAffiliation: 'DHAKA',
        address: 'Dhanmondi',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '01711110001',
        email: `gsa-${ts}@eduerp.us`,
      },
    });

    const cA = await db.campus.create({
      data: {
        institutionId: instA.id,
        name: 'Campus Alpha',
        code: `CA-${ts.toString().slice(-4)}`,
        address: 'Dhanmondi',
      },
    });
    campusAId = cA.id;

    // Tenant B
    tenantB = `hr-gov-b-${ts}`;
    const tB = await db.tenant.create({
      data: {
        slug: tenantB,
        institutionType: 'SCHOOL',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
      },
    });

    const instB = await db.institution.create({
      data: {
        tenantId: tB.id,
        name: `Gov School Beta ${ts}`,
        shortName: `GSB${ts.toString().slice(-4)}`,
        eiin: `EIIN-${ts.toString().slice(-5)}`,
        boardAffiliation: 'DHAKA',
        address: 'Gulshan',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Gulshan',
        phone: '01711110002',
        email: `gsb-${ts}@eduerp.us`,
      },
    });

    const cB = await db.campus.create({
      data: {
        institutionId: instB.id,
        name: 'Campus Beta',
        code: `CB-${ts.toString().slice(-4)}`,
        address: 'Gulshan',
      },
    });
    campusBId = cB.id;

    hrUserA = {
      id: `USR-HR-A-${ts}`,
      name: 'HR Manager Alpha',
      email: `hr-a-${ts}@eduerp.us`,
      role: 'HR_MANAGER',
      tenantId: tenantA,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    teacherUserA = {
      id: `USR-TCH-A-${ts}`,
      name: 'Teacher John',
      email: `teacher-a-${ts}@eduerp.us`,
      role: 'TEACHER',
      tenantId: tenantA,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    const empA = await createEmployee(
      tenantA,
      {
        campusId: campusAId,
        employeeCode: `EMP-ALPHA-01`,
        firstName: 'Anisur',
        lastName: 'Zaman',
        designation: 'Senior Teacher',
        category: 'TEACHING',
        status: 'ACTIVE',
        basicSalary: 42000,
        phone: '01700001111',
        email: 'anisur@gsa.edu.bd',
        joiningDate: '2020-01-01',
      },
      hrUserA
    );
    employeeAId = empA.id;
  });

  it('strictly isolates HR and employee records across tenants', async () => {
    // Attempting to query Tenant A employee using Tenant B identifier must throw not found
    await expect(
      getEmployeeProfile(tenantB, employeeAId, hrUserA)
    ).rejects.toThrow(/not found/i);

    // Attempting to create position in Tenant B with Tenant A campus ID must fail
    await expect(
      createPosition(
        tenantB,
        {
          positionCode: 'POS-BETA-01',
          title: 'Mathematics Teacher',
          campusId: campusAId, // Belongs to Tenant A!
          category: 'TEACHING',
        },
        hrUserA
      )
    ).rejects.toThrow();
  });

  it('enforces RBAC preventing unauthorized roles from mutating HR positions and workforce records', () => {
    expect(() => {
      requirePermission(teacherUserA, 'CREATE', 'POSITION');
    }).toThrow(/FORBIDDEN/i);

    expect(() => {
      requirePermission(teacherUserA, 'APPROVE', 'LEAVES');
    }).toThrow(/FORBIDDEN/i);
  });

  it('applies field-level privacy masking sensitive financial details for non-privileged roles', async () => {
    // 1. Privileged HR Manager query sees basicSalary
    const hrView = await getEmployeeProfile(tenantA, employeeAId, hrUserA);
    expect(hrView.basicSalary).toBe(42000);

    // 2. Ordinary Teacher query has basicSalary masked to null
    const teacherView = await getEmployeeProfile(tenantA, employeeAId, teacherUserA);
    expect(teacherView.basicSalary).toBeNull();
    expect(teacherView.firstName).toBe('Anisur');
    expect(teacherView.designation).toBe('Senior Teacher');
  });
});
