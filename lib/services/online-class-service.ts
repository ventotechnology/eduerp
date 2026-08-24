import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  LmsOnlineClassCreateSchema,
  LmsOnlineClassAttendanceSchema,
} from '@/lib/validations/schemas';
import { checkStudentCourseAccess } from './lms-course-service';

export async function scheduleOnlineClass(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsOnlineClassCreateSchema.parse(rawData);

  const course = await db.lmsCourse.findFirst({
    where: { id: validated.courseId, institutionId: tenant.institutionId },
  });
  if (!course) throw AppError.notFound('LMS Course not found.');

  const teacher = await db.employee.findFirst({
    where: { id: validated.teacherEmployeeId, campus: { institutionId: tenant.institutionId } },
  });
  if (!teacher) throw AppError.notFound('Teacher employee record not found.');

  const onlineClass = await db.lmsOnlineClass.create({
    data: {
      courseId: course.id,
      title: validated.title,
      topic: validated.topic,
      teacherEmployeeId: teacher.id,
      classDate: new Date(validated.classDate),
      startTime: validated.startTime,
      endTime: validated.endTime,
      meetingProvider: validated.meetingProvider,
      meetingUrl: validated.meetingUrl,
      meetingPasscode: validated.meetingPasscode,
      status: 'SCHEDULED',
    },
    include: { teacher: true },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CREATE',
    resourceType: 'ONLINE_CLASS',
    newState: { classId: onlineClass.id, title: onlineClass.title, provider: onlineClass.meetingProvider },
  });

  return {
    ...onlineClass,
    integrationClassification: 'MEETING_LINK_SUPPORT_REAL; MEETING_PROVIDER_API_INTEGRATION_PENDING',
  };
}

export async function getOnlineClasses(tenantIdentifier: string, courseId: string, actor?: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);

  const course = await db.lmsCourse.findFirst({
    where: { id: courseId, institutionId: tenant.institutionId },
  });
  if (!course) throw AppError.notFound('LMS Course not found.');

  // Access check: if student actor, verify enrollment before returning class list & meeting URLs
  if (actor && actor.role === 'STUDENT') {
    const student = await db.student.findFirst({
      where: { userId: actor.id, campus: { institutionId: tenant.institutionId } },
    });
    if (student) {
      const isEnrolled = await checkStudentCourseAccess(tenant.institutionId, course, student.id);
      if (!isEnrolled) {
        throw AppError.forbidden('You are not enrolled in this course.');
      }
    }
  }

  const classes = await db.lmsOnlineClass.findMany({
    where: { courseId: course.id },
    include: {
      teacher: {
        select: { id: true, firstName: true, lastName: true, designation: true },
      },
      _count: { select: { attendanceRecords: true } },
    },
    orderBy: { classDate: 'asc' },
  });

  return classes;
}

export async function recordOnlineClassAttendance(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsOnlineClassAttendanceSchema.parse(rawData);

  const onlineClass = await db.lmsOnlineClass.findFirst({
    where: { id: validated.onlineClassId, course: { institutionId: tenant.institutionId } },
    include: { course: true },
  });
  if (!onlineClass) throw AppError.notFound('Online class session not found.');

  const student = await db.student.findFirst({
    where: { id: validated.studentId, campus: { institutionId: tenant.institutionId } },
  });
  if (!student) throw AppError.notFound('Student not found.');

  const record = await db.lmsOnlineClassAttendance.upsert({
    where: {
      onlineClassId_studentId: {
        onlineClassId: onlineClass.id,
        studentId: student.id,
      },
    },
    update: {
      attendanceStatus: validated.attendanceStatus,
      durationMinutes: validated.durationMinutes,
      source: validated.source,
      joinedAt: new Date(),
    },
    create: {
      onlineClassId: onlineClass.id,
      studentId: student.id,
      attendanceStatus: validated.attendanceStatus,
      durationMinutes: validated.durationMinutes,
      source: validated.source,
      joinedAt: new Date(),
    },
  });

  // Log activity
  await db.lmsLearningActivityLog.create({
    data: {
      institutionId: tenant.institutionId,
      studentId: student.id,
      courseId: onlineClass.courseId,
      activityType: 'CLASS_JOINED',
      detailsJson: JSON.stringify({ onlineClassId: onlineClass.id, status: validated.attendanceStatus }),
    },
  });

  return record;
}
