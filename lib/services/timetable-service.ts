import { db } from '../db';
import { AppError } from '../errors/app-error';
import { logAuditEvent } from '../audit/audit-logger';
import { SessionUser } from '../auth/types';
import { requireTenant } from '../tenant/tenant-guard';
import { TimetableEntryCreateSchema } from '../validations/schemas';

/**
 * Converts "HH:MM" 24h string into minutes from midnight for interval overlap calculations.
 */
export function timeToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/**
 * Checks if two time intervals [startA, endA) and [startB, endB) overlap.
 */
export function isTimeOverlapping(startA: string, endA: string, startB: string, endB: string): boolean {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);

  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

/**
 * Validates timetable slot for conflicts (Teacher, Room, Section/Cohort, Teacher Availability).
 */
export async function validateTimetableConflicts(
  institutionId: string,
  entryData: {
    id?: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    classroomId: string;
    teacherId?: string | null;
    sectionId?: string | null;
    courseOfferingId?: string | null;
  }
) {
  // 1. Check Room Conflict: Is this classroom already occupied on this day during overlapping time?
  const roomSlots = await db.timetableEntry.findMany({
    where: {
      institutionId,
      classroomId: entryData.classroomId,
      dayOfWeek: entryData.dayOfWeek,
      id: entryData.id ? { not: entryData.id } : undefined
    },
    include: { classroom: true }
  });

  for (const slot of roomSlots) {
    if (isTimeOverlapping(entryData.startTime, entryData.endTime, slot.startTime, slot.endTime)) {
      throw new AppError(
        `Room Conflict Detected: Room '${slot.classroom.roomNumber}' is already occupied from ${slot.startTime} to ${slot.endTime} on ${slot.dayOfWeek} for '${slot.subjectName}'.`,
        'ROOM_CONFLICT',
        400
      );
    }
  }

  // 2. Check Teacher Conflict: Is this teacher already teaching another class during overlapping time?
  if (entryData.teacherId) {
    const teacherSlots = await db.timetableEntry.findMany({
      where: {
        institutionId,
        teacherId: entryData.teacherId,
        dayOfWeek: entryData.dayOfWeek,
        id: entryData.id ? { not: entryData.id } : undefined
      },
      include: { classroom: true }
    });

    for (const slot of teacherSlots) {
      if (isTimeOverlapping(entryData.startTime, entryData.endTime, slot.startTime, slot.endTime)) {
        throw new AppError(
          `Teacher Conflict Detected: Teacher '${slot.teacherName}' is already assigned to '${slot.subjectName}' in Room '${slot.classroom.roomNumber}' from ${slot.startTime} to ${slot.endTime} on ${slot.dayOfWeek}.`,
          'TEACHER_CONFLICT',
          400
        );
      }
    }

    // 2b. Check Teacher Availability Constraint
    const availability = await db.teacherAvailability.findFirst({
      where: {
        teacherId: entryData.teacherId,
        dayOfWeek: entryData.dayOfWeek
      }
    });

    if (availability && !availability.isAvailable) {
      throw new AppError(
        `Teacher Availability Conflict: Teacher is marked as unavailable on ${entryData.dayOfWeek}${availability.reason ? ` (${availability.reason})` : ''}.`,
        'TEACHER_UNAVAILABLE',
        400
      );
    }
  }

  // 3. Check Section / Cohort Conflict: Is this section already assigned another subject during overlapping time?
  if (entryData.sectionId) {
    const sectionSlots = await db.timetableEntry.findMany({
      where: {
        institutionId,
        sectionId: entryData.sectionId,
        dayOfWeek: entryData.dayOfWeek,
        id: entryData.id ? { not: entryData.id } : undefined
      }
    });

    for (const slot of sectionSlots) {
      if (isTimeOverlapping(entryData.startTime, entryData.endTime, slot.startTime, slot.endTime)) {
        throw new AppError(
          `Class/Section Conflict Detected: This section is already scheduled for '${slot.subjectName}' from ${slot.startTime} to ${slot.endTime} on ${slot.dayOfWeek}.`,
          'SECTION_CONFLICT',
          400
        );
      }
    }
  }
}

/**
 * Saves or creates a timetable entry with complete server-side conflict prevention.
 */
export async function createTimetableEntry(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = TimetableEntryCreateSchema.parse(rawData);

  // Validate classroom belongs to tenant
  const classroom = await db.classroom.findFirst({
    where: { id: validated.classroomId, campus: { institutionId: tenant.institutionId } }
  });
  if (!classroom) throw AppError.notFound('Classroom not found in this institution.');

  // Validate teacher belongs to tenant if specified
  if (validated.teacherId) {
    const teacher = await db.teacher.findFirst({
      where: { id: validated.teacherId, employee: { campus: { institutionId: tenant.institutionId } } }
    });
    if (!teacher) throw AppError.notFound('Teacher not found in this institution.');
  }

  // Run Server-Side Conflict Detection Engine
  await validateTimetableConflicts(tenant.institutionId, {
    dayOfWeek: validated.dayOfWeek,
    startTime: validated.startTime,
    endTime: validated.endTime,
    classroomId: validated.classroomId,
    teacherId: validated.teacherId,
    sectionId: validated.sectionId,
    courseOfferingId: validated.courseOfferingId
  });

  const entry = await db.timetableEntry.create({
    data: {
      institutionId: tenant.institutionId,
      academicYearId: validated.academicYearId || null,
      sessionId: validated.sessionId || null,
      campusId: validated.campusId || classroom.campusId,
      sectionId: validated.sectionId || null,
      courseOfferingId: validated.courseOfferingId || null,
      subjectId: validated.subjectId || null,
      periodId: validated.periodId || null,
      classroomId: classroom.id,
      teacherId: validated.teacherId || null,
      dayOfWeek: validated.dayOfWeek,
      startTime: validated.startTime,
      endTime: validated.endTime,
      subjectName: validated.subjectName,
      teacherName: validated.teacherName,
      isDoublePeriod: validated.isDoublePeriod
    },
    include: {
      classroom: true,
      section: true,
      period: true
    }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'TIMETABLE_ENTRY_CREATED',
    resourceType: 'TimetableEntry',
    resourceId: entry.id,
    newState: {
      dayOfWeek: entry.dayOfWeek,
      time: `${entry.startTime} - ${entry.endTime}`,
      subject: entry.subjectName,
      teacher: entry.teacherName,
      room: classroom.roomNumber
    }
  });

  return entry;
}

/**
 * Retrieves timetable entries with optional filtering.
 */
export async function getTenantTimetableEntries(
  tenantIdentifier: string,
  filters: {
    sectionId?: string;
    courseOfferingId?: string;
    teacherId?: string;
    classroomId?: string;
    dayOfWeek?: string;
  } = {}
) {
  const tenant = await requireTenant(tenantIdentifier);

  const whereClause: any = {
    institutionId: tenant.institutionId
  };

  if (filters.sectionId) whereClause.sectionId = filters.sectionId;
  if (filters.courseOfferingId) whereClause.courseOfferingId = filters.courseOfferingId;
  if (filters.teacherId) whereClause.teacherId = filters.teacherId;
  if (filters.classroomId) whereClause.classroomId = filters.classroomId;
  if (filters.dayOfWeek) whereClause.dayOfWeek = filters.dayOfWeek;

  return db.timetableEntry.findMany({
    where: whereClause,
    include: {
      classroom: true,
      section: {
        include: { class: true }
      },
      period: true,
      courseOffering: {
        include: { course: true }
      }
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
  });
}

/**
 * Deletes a timetable entry with audit logging.
 */
export async function deleteTimetableEntry(tenantIdentifier: string, entryId: string, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);

  const entry = await db.timetableEntry.findFirst({
    where: { id: entryId, institutionId: tenant.institutionId },
    include: { classroom: true }
  });
  if (!entry) throw AppError.notFound('Timetable entry not found.');

  await db.timetableEntry.delete({
    where: { id: entry.id }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'TIMETABLE_ENTRY_DELETED',
    resourceType: 'TimetableEntry',
    resourceId: entry.id,
    previousState: {
      subject: entry.subjectName,
      teacher: entry.teacherName,
      day: entry.dayOfWeek,
      room: entry.classroom.roomNumber
    }
  });

  return { success: true };
}
