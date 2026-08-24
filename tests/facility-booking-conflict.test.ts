import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import {
  createFacilityBooking,
  processFacilityBookingAction,
} from '@/lib/services/facility-booking-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('COMMAND 7: Facility Booking & Academic Routine Conflict Engine', () => {
  let institutionId: string;
  let campusId: string;
  let actor: SessionUser;
  let classroomId: string;
  let facilityId: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const tenant = await db.tenant.create({
      data: {
        slug: `bkg-tenant-${timestamp}`,
        institutionType: 'UNIVERSITY',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
      },
    });

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Booking Test Institution',
        shortName: 'BKG',
        address: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '01711223344',
        email: `bkg-${timestamp}@eduerp.us`,
      },
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Main Campus',
        code: `BMC-${timestamp}`,
        address: 'Dhaka',
      },
    });
    campusId = campus.id;

    const bld = await db.building.create({
      data: {
        institutionId: inst.id,
        campusId: campus.id,
        name: 'Academic Complex 1',
        code: `B1-${timestamp}`,
      },
    });

    const room = await db.classroom.create({
      data: {
        campusId: campus.id,
        buildingId: bld.id,
        roomNumber: 'Auditorium-401',
        capacity: 250,
      },
    });
    classroomId = room.id;

    const fac = await db.facility.create({
      data: {
        institutionId: inst.id,
        campusId: campus.id,
        code: `AUD-${timestamp}`,
        name: 'Grand Auditorium',
        type: 'AUDITORIUM',
        capacity: 500,
      },
    });
    facilityId = fac.id;

    actor = {
      id: 'bkg-admin-1',
      name: 'Event Coordinator',
      email: 'events@eduerp.us',
      role: 'PRINCIPAL',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };
  });

  it('detects booking conflicts and cross-checks academic timetable routine overlaps', async () => {
    const testDate = new Date('2026-09-07T00:00:00.000Z');

    const bkg1 = await createFacilityBooking(
      actor.tenantId!,
      {
        campusId,
        facilityId,
        bookingDate: testDate.toISOString(),
        startTime: '10:00',
        endTime: '13:00',
        purpose: 'Annual IEEE Robotics Seminar',
        requestedBy: 'Prof. Hasan',
      },
      actor
    );
    expect(bkg1.bookingNumber).toBeDefined();
    expect(bkg1.status).toBe('APPROVED');

    await expect(
      createFacilityBooking(
        actor.tenantId!,
        {
          campusId,
          facilityId,
          bookingDate: testDate.toISOString(),
          startTime: '11:00',
          endTime: '14:00',
          purpose: 'Debate Club Championship',
          requestedBy: 'Student Council',
        },
        actor
      )
    ).rejects.toThrow(/facility conflict/i);

    await db.timetableEntry.create({
      data: {
        institutionId,
        classroomId,
        dayOfWeek: 'MONDAY',
                startTime: '09:00',
        endTime: '11:00',
        subjectName: 'Computer Architecture (CSE-301)',
        teacherName: 'Dr. Tarique',
      },
    });

    await expect(
      createFacilityBooking(
        actor.tenantId!,
        {
          campusId,
          classroomId,
          bookingDate: testDate.toISOString(),
          startTime: '10:30',
          endTime: '12:30',
          purpose: 'External Guest Lecture',
          requestedBy: 'Dean Office',
        },
        actor
      )
    ).rejects.toThrow(/academic timetable conflict/i);

    const validRoomBooking = await createFacilityBooking(
      actor.tenantId!,
      {
        campusId,
        classroomId,
        bookingDate: testDate.toISOString(),
        startTime: '14:00',
        endTime: '16:00',
        purpose: 'Evening Workshop',
        requestedBy: 'Dean Office',
      },
      actor
    );
    expect(validRoomBooking.status).toBe('APPROVED');
  });
});
