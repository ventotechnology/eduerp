import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  FacilityBookingCreateSchema,
  FacilityBookingActionSchema,
} from '@/lib/validations/schemas';

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const DAYS_MAP = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export async function createFacilityBooking(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = FacilityBookingCreateSchema.parse(rawData);

  const campus = await db.campus.findFirst({
    where: { id: validated.campusId, institutionId: tenant.institutionId },
  });
  if (!campus) throw AppError.notFound('Selected campus not found.');

  const bookingDate = new Date(validated.bookingDate);
  bookingDate.setHours(0, 0, 0, 0);

  const reqStartMin = parseTimeToMinutes(validated.startTime);
  const reqEndMin = parseTimeToMinutes(validated.endTime);

  if (reqStartMin >= reqEndMin) {
    throw AppError.validation('End time must be strictly after start time.');
  }

  // 1. Conflict Check: Overlapping Facility Bookings
  const existingBookings = await db.facilityBooking.findMany({
    where: {
      institutionId: tenant.institutionId,
      bookingDate,
      status: { in: ['REQUESTED', 'APPROVED'] },
      OR: [
        { facilityId: validated.facilityId || undefined },
        { classroomId: validated.classroomId || undefined },
      ],
    },
  });

  for (const eb of existingBookings) {
    const ebStart = parseTimeToMinutes(eb.startTime);
    const ebEnd = parseTimeToMinutes(eb.endTime);
    if (reqStartMin < ebEnd && reqEndMin > ebStart) {
      throw AppError.conflict(
        `Facility conflict: Resource is already booked from ${eb.startTime} to ${eb.endTime} on ${bookingDate.toISOString().slice(0, 10)}.`
      );
    }
  }

  // 2. Conflict Check: Academic Timetable Routine Conflict (if booking a Classroom)
  if (validated.classroomId) {
    const dayOfWeek = DAYS_MAP[bookingDate.getDay()];
    const timetableRoutines = await db.timetableEntry.findMany({
      where: {
        institutionId: tenant.institutionId,
        classroomId: validated.classroomId,
        dayOfWeek,
      },
    });

    for (const tt of timetableRoutines) {
      const ttStart = parseTimeToMinutes(tt.startTime);
      const ttEnd = parseTimeToMinutes(tt.endTime);
      if (reqStartMin < ttEnd && reqEndMin > ttStart) {
        throw AppError.conflict(
          `Academic timetable conflict: Room is occupied by scheduled class '${tt.subjectName}' (${tt.teacherName}) from ${tt.startTime} to ${tt.endTime}.`
        );
      }
    }
  }

  const count = await db.facilityBooking.count({ where: { institutionId: tenant.institutionId } });
  const bookingNumber = `BKG-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

  const booking = await db.facilityBooking.create({
    data: {
      institutionId: tenant.institutionId,
      campusId: validated.campusId,
      bookingNumber,
      facilityId: validated.facilityId,
      classroomId: validated.classroomId,
      bookingDate,
      startTime: validated.startTime,
      endTime: validated.endTime,
      purpose: validated.purpose,
      requestedBy: validated.requestedBy,
      requesterType: validated.requesterType,
      attendeeCount: validated.attendeeCount,
      status: 'APPROVED',
      approvedBy: actor.name,
    },
    include: { facility: true, campus: true },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'FACILITY_BOOKING',
    action: 'CREATE',
    resourceId: booking.id,
    newState: {
      bookingNumber,
      purpose: booking.purpose,
      bookingDate,
      startTime: validated.startTime,
      endTime: validated.endTime,
    },
  });

  return booking;
}

export async function processFacilityBookingAction(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = FacilityBookingActionSchema.parse(rawData);

  const booking = await db.facilityBooking.findFirst({
    where: { id: validated.bookingId, institutionId: tenant.institutionId },
  });
  if (!booking) throw AppError.notFound('Facility booking record not found.');

  const updatedStatus = validated.action === 'APPROVE' ? 'APPROVED' : validated.action === 'REJECT' ? 'REJECTED' : 'CANCELLED';

  const updated = await db.facilityBooking.update({
    where: { id: booking.id },
    data: {
      status: updatedStatus,
      approvedBy: actor.name,
      reviewNotes: validated.reviewNotes,
    },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'FACILITY_BOOKING',
    action: 'UPDATE',
    resourceId: booking.id,
    newState: { action: `BOOKING_${updatedStatus}` },
  });

  return updated;
}

export async function getFacilityBookings(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);
  return db.facilityBooking.findMany({
    where: { institutionId: tenant.institutionId },
    include: { facility: true, campus: true },
    orderBy: { bookingDate: 'desc' },
  });
}
