import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import {
  createHostelMaster,
  createHostelBlock,
  createHostelRoom,
  createHostelBed,
  allocateHostelBed,
  transferHostelBed,
  checkOutHostelResident,
} from '@/lib/services/hostel-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('COMMAND 7: Hostel & Housing Management Engine', () => {
  let institutionId: string;
  let campusId: string;
  let actor: SessionUser;
  let student1Id: string;
  let student2Id: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const tenant = await db.tenant.create({
      data: {
        slug: `hst-tenant-${timestamp}`,
        institutionType: 'COLLEGE',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
      },
    });

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Hostel Test Institution',
        shortName: 'HOSTEL',
        address: 'Gazipur, Dhaka',
        district: 'Gazipur',
        division: 'Dhaka',
        upazilaThana: 'Gazipur Sadar',
        phone: '01711223344',
        email: `hostel-${timestamp}@eduerp.us`,
      },
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Residential Campus',
        code: `RC-${timestamp}`,
        address: 'Gazipur',
      },
    });
    campusId = campus.id;

    const s1 = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `STU-HST1-${timestamp}`,
        admissionNumber: `ADM-HST1-${timestamp}`,
        firstName: 'Tariq',
        lastName: 'Jamil',
        dateOfBirth: new Date('2005-01-01'),
        gender: 'Male',
        presentAddress: 'Gazipur',
        permanentAddress: 'Gazipur',
        status: 'ACTIVE',
      },
    });
    student1Id = s1.id;

    const s2 = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `STU-HST2-${timestamp}`,
        admissionNumber: `ADM-HST2-${timestamp}`,
        firstName: 'Anisul',
        lastName: 'Haque',
        dateOfBirth: new Date('2005-01-01'),
        gender: 'Male',
        presentAddress: 'Gazipur',
        permanentAddress: 'Gazipur',
        status: 'ACTIVE',
      },
    });
    student2Id = s2.id;

    actor = {
      id: 'hostel-admin-1',
      name: 'Hall Provost',
      email: 'provost@eduerp.us',
      role: 'HOSTEL_MANAGER',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };
  });

  it('manages hostel hierarchy, prevents double bed allocation, supports room transfer and checkout', async () => {
    const hostel = await createHostelMaster(
      actor.tenantId!,
      {
        campusId,
        code: `HST-${Date.now()}`,
        name: 'Fazlul Huq Muslim Hall',
        type: 'BOYS',
        capacity: 100,
        wardenName: 'Dr. Kabir',
      },
      actor
    );
    expect(hostel.id).toBeDefined();

    const block = await createHostelBlock(
      actor.tenantId!,
      {
        hostelId: hostel.id,
        name: 'East Wing',
        code: 'EW',
        totalFloors: 3,
      },
      actor
    );

    const room = await createHostelRoom(
      actor.tenantId!,
      {
        hostelId: hostel.id,
        blockId: block.id,
        roomNumber: '301',
        floorNumber: 3,
        roomType: 'DOUBLE',
        capacity: 2,
        monthlyRent: 2500,
      },
      actor
    );

    const bedA = await createHostelBed(
      actor.tenantId!,
      {
        roomId: room.id,
        bedNumber: '301-A',
        status: 'AVAILABLE',
      },
      actor
    );

    const bedB = await createHostelBed(
      actor.tenantId!,
      {
        roomId: room.id,
        bedNumber: '301-B',
        status: 'AVAILABLE',
      },
      actor
    );

    const alloc1 = await allocateHostelBed(
      actor.tenantId!,
      {
        studentId: student1Id,
        bedId: bedA.id,
        startDate: new Date().toISOString(),
        depositAmount: 5000,
        monthlyFee: 2500,
      },
      actor
    );
    expect(alloc1.status).toBe('ACTIVE');

    const bedAAfter = await db.hostelBed.findUnique({ where: { id: bedA.id } });
    expect(bedAAfter?.status).toBe('OCCUPIED');

    await expect(
      allocateHostelBed(
        actor.tenantId!,
        {
          studentId: student2Id,
          bedId: bedA.id,
          startDate: new Date().toISOString(),
        },
        actor
      )
    ).rejects.toThrow(/already occupied or unavailable/i);

    const transfer = await transferHostelBed(
      actor.tenantId!,
      {
        allocationId: alloc1.id,
        newBedId: bedB.id,
        reason: 'Maintenance repair in corner 301-A',
      },
      actor
    );
    expect(transfer.id).toBeDefined();

    const bedACheck = await db.hostelBed.findUnique({ where: { id: bedA.id } });
    const bedBCheck = await db.hostelBed.findUnique({ where: { id: bedB.id } });
    expect(bedACheck?.status).toBe('AVAILABLE');
    expect(bedBCheck?.status).toBe('OCCUPIED');

    const checkout = await checkOutHostelResident(actor.tenantId!, alloc1.id, actor);
    expect(checkout.status).toBe('VACATED');

    const bedBFinal = await db.hostelBed.findUnique({ where: { id: bedB.id } });
    expect(bedBFinal?.status).toBe('AVAILABLE');
  });
});
