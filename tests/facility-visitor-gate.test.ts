import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import {
  registerVisitor,
  checkOutVisitor,
  createStudentPickupAuthorization,
  getStudentPickupAuthorizations,
  recordVehicleGateEntry,
  recordVehicleGateExit,
} from '@/lib/services/visitor-gate-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('COMMAND 7: Visitor, Gate & Student Pickup Authorization Engine', () => {
  let institutionId: string;
  let campusId: string;
  let actor: SessionUser;
  let studentId: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const tenant = await db.tenant.create({
      data: {
        slug: `sec-tenant-${timestamp}`,
        institutionType: 'SCHOOL',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
      },
    });

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Gate Security Test Institution',
        shortName: 'SEC',
        address: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Gulshan',
        phone: '01711223344',
        email: `sec-${timestamp}@eduerp.us`,
      },
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Senior Campus',
        code: `SC-${timestamp}`,
        address: 'Dhaka',
      },
    });
    campusId = campus.id;

    const student = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `STU-SEC-${timestamp}`,
        admissionNumber: `ADM-SEC-${timestamp}`,
        firstName: 'Abrar',
        lastName: 'Fahim',
        dateOfBirth: new Date('2005-01-01'),
        gender: 'Male',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        status: 'ACTIVE',
      },
    });
    studentId = student.id;

    actor = {
      id: 'gate-staff-1',
      name: 'Main Gate Security Officer',
      email: 'security@eduerp.us',
      role: 'PRINCIPAL',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };
  });

  it('generates visitor passes, authorizes student pickups and logs vehicle gate movements', async () => {
    const visitor = await registerVisitor(
      actor.tenantId!,
      {
        campusId,
        visitorName: 'Mr. Zahid Hossain',
        phone: '01711223344',
        idProofType: 'NID',
        idProofNumber: '19842692518000123',
        organization: 'Ministry of Education',
        purpose: 'Annual Academic Inspection',
        visitingPersonType: 'EMPLOYEE',
        gateName: 'VIP Gate 1',
      },
      actor
    );
    expect(visitor.passNumber).toBeDefined();
    expect(visitor.status).toBe('CHECKED_IN');

    const checkedOut = await checkOutVisitor(actor.tenantId!, { visitorId: visitor.id }, actor);
    expect(checkedOut.status).toBe('CHECKED_OUT');
    expect(checkedOut.exitTime).toBeDefined();

    const auth = await createStudentPickupAuthorization(
      actor.tenantId!,
      {
        studentId,
        authorizedPersonName: 'Mahbubur Rahman',
        phone: '01899887766',
        relationToStudent: 'Uncle / Designated Driver',
        nidNumber: '9988776655',
      },
      actor
    );
    expect(auth.isActive).toBe(true);

    const authList = await getStudentPickupAuthorizations(actor.tenantId!, studentId);
    expect(authList.length).toBe(1);
    expect(authList[0].authorizedPersonName).toBe('Mahbubur Rahman');

    const vehicleLog = await recordVehicleGateEntry(
      actor.tenantId!,
      {
        campusId,
        vehiclePlateNumber: 'DHK-METRO-GA-12-3456',
        driverName: 'Monir',
        driverPhone: '01911223344',
        vehicleType: 'DELIVERY',
        purpose: 'Science Lab Chemical Supply Delivery',
        gateName: 'Cargo Gate 3',
      },
      actor
    );
    expect(vehicleLog.id).toBeDefined();
    expect(vehicleLog.exitTime).toBeNull();

    const exitedLog = await recordVehicleGateExit(actor.tenantId!, vehicleLog.id);
    expect(exitedLog.exitTime).toBeDefined();
  });
});
