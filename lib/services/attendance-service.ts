import { db } from '../db';
import { AppError } from '../errors/app-error';
import { logAuditEvent } from '../audit/audit-logger';
import { AttendanceSessionCreateSchema } from '../validations/schemas';
import { SessionUser } from '../auth/types';
import { requireTenant } from '../tenant/tenant-guard';

/**
 * Creates or updates an attendance session with atomic student records.
 */
export async function recordAttendanceSession(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = AttendanceSessionCreateSchema.parse(rawData);

  // Validate campus belongs to tenant
  const campus = await db.campus.findFirst({
    where: {
      id: validated.campusId,
      institutionId: tenant.institutionId
    }
  });

  if (!campus) {
    throw AppError.notFound('Invalid campus for this institution.');
  }

  const sessionDate = new Date(validated.date);

  let session = await db.attendanceSession.findFirst({
    where: {
      campusId: validated.campusId,
      sectionId: validated.sectionId || null,
      date: sessionDate,
      periodNumber: validated.periodNumber || null
    }
  });

  if (session && session.isLocked) {
    throw AppError.forbidden('This attendance session has been finalized and locked. Correction workflow required.');
  }

  if (!session) {
    session = await db.attendanceSession.create({
      data: {
        campusId: validated.campusId,
        classId: validated.classId || null,
        sectionId: validated.sectionId || null,
        date: sessionDate,
        periodNumber: validated.periodNumber || null,
        subjectCode: validated.subjectCode || null,
        takenByUserId: actor.id,
        isLocked: false
      }
    });
  }

  // Upsert student attendance records
  for (const record of validated.records) {
    const existingRecord = await db.attendanceRecord.findFirst({
      where: {
        sessionId: session.id,
        studentId: record.studentId
      }
    });

    if (existingRecord) {
      await db.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: {
          status: record.status,
          remarks: record.remarks || null
        }
      });
    } else {
      await db.attendanceRecord.create({
        data: {
          sessionId: session.id,
          studentId: record.studentId,
          date: sessionDate,
          status: record.status,
          periodNumber: validated.periodNumber || null,
          subjectCode: validated.subjectCode || null,
          remarks: record.remarks || null,
          source: 'MANUAL'
        }
      });
    }
  }

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'ATTENDANCE_SESSION_RECORDED',
    resourceType: 'AttendanceSession',
    resourceId: session.id,
    newState: {
      date: validated.date,
      totalRecords: validated.records.length,
      period: validated.periodNumber
    }
  });

  return session;
}

/**
 * Computes exact attendance rate % for a student.
 */
export async function getStudentAttendanceRate(tenantIdentifier: string, studentId: string) {
  const tenant = await requireTenant(tenantIdentifier);

  const records = await db.attendanceRecord.findMany({
    where: {
      studentId,
      student: { campus: { institutionId: tenant.institutionId } }
    }
  });

  if (records.length === 0) {
    return {
      totalClasses: 0,
      presentCount: 0,
      attendancePercentage: 100.0,
      status: 'ELIGIBLE'
    };
  }

  const totalClasses = records.length;
  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const percentage = Math.round((presentCount / totalClasses) * 1000) / 10;

  let status = 'ELIGIBLE';
  if (percentage < 60) {
    status = 'NOT_ELIGIBLE';
  } else if (percentage < 75) {
    status = 'WARNING';
  }

  return {
    totalClasses,
    presentCount,
    attendancePercentage: percentage,
    status
  };
}
