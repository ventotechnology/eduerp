import { db } from '../db';
import { AppError } from '../errors/app-error';
import { logAuditEvent } from '../audit/audit-logger';
import { SessionUser } from '../auth/types';
import { requireTenant } from '../tenant/tenant-guard';

const DEFAULT_MAX_CREDITS_PER_SEMESTER = 21.0;

/**
 * Registers a student for a university course with prerequisite & credit limit checks.
 */
export async function registerUniversityCourse(
  tenantIdentifier: string,
  studentId: string,
  courseId: string,
  semester: string,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);

  // 1. Verify student exists and belongs to tenant
  const student = await db.student.findFirst({
    where: {
      id: studentId,
      campus: { institutionId: tenant.institutionId }
    },
    include: {
      courseRegistrations: {
        include: { course: true }
      }
    }
  });

  if (!student) {
    throw AppError.notFound('Student not found in this institution.');
  }

  // 2. Verify target course exists
  const course = await db.course.findFirst({
    where: {
      id: courseId,
      program: { department: { institutionId: tenant.institutionId } }
    },
    include: {
      prerequisitesMain: {
        include: { prerequisiteCourse: true }
      }
    }
  });

  if (!course) {
    throw AppError.notFound('Course not found in this institution.');
  }

  // 3. Check duplicate registration
  const duplicate = student.courseRegistrations.find(
    (cr) => cr.courseId === courseId && cr.semester === semester && cr.status === 'ENROLLED'
  );
  if (duplicate) {
    throw AppError.conflict(`Already enrolled in course ${course.code} for semester ${semester}.`);
  }

  // 4. Check Hard Prerequisites
  for (const prereq of course.prerequisitesMain) {
    const passedPrereq = student.courseRegistrations.find(
      (cr) =>
        cr.courseId === prereq.prerequisiteCourseId &&
        cr.status === 'COMPLETED' &&
        (cr.gradePoint || 0) >= prereq.minGradePoint
    );

    if (!passedPrereq) {
      throw new AppError(
        `Prerequisite not satisfied: Must complete '${prereq.prerequisiteCourse.code} - ${prereq.prerequisiteCourse.title}' with minimum GPA ${prereq.minGradePoint.toFixed(2)} before enrolling in '${course.code}'.`,
        'PREREQUISITE_NOT_MET',
        400
      );
    }
  }

  // 5. Check Credit Limit
  const activeSemesterCredits = student.courseRegistrations
    .filter((cr) => cr.semester === semester && cr.status === 'ENROLLED')
    .reduce((sum, cr) => sum + cr.course.creditHours, 0);

  if (activeSemesterCredits + course.creditHours > DEFAULT_MAX_CREDITS_PER_SEMESTER) {
    throw new AppError(
      `Credit limit exceeded: Adding ${course.creditHours} credits would bring semester total to ${(activeSemesterCredits + course.creditHours).toFixed(1)} credits, exceeding maximum limit of ${DEFAULT_MAX_CREDITS_PER_SEMESTER}.`,
      'CREDIT_LIMIT_EXCEEDED',
      400
    );
  }

  // 6. Create Registration Record
  const registration = await db.courseRegistration.create({
    data: {
      studentId: student.id,
      courseId: course.id,
      courseOfferingId: actor && (actor as any).courseOfferingId ? (actor as any).courseOfferingId : undefined,
      semester,
      status: 'ENROLLED'
    },
    include: {
      course: true
    }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'UNIVERSITY_COURSE_REGISTERED',
    resourceType: 'CourseRegistration',
    resourceId: registration.id,
    newState: {
      studentId: student.id,
      courseCode: course.code,
      semester,
      creditHours: course.creditHours
    }
  });

  return registration;
}

export async function registerStudentCourse(
  tenantIdentifier: string,
  payload: { studentId: string; courseId: string; semester: string; courseOfferingId?: string },
  actor: SessionUser
) {
  return registerUniversityCourse(
    tenantIdentifier,
    payload.studentId,
    payload.courseId,
    payload.semester,
    { ...actor, ...(payload.courseOfferingId ? { courseOfferingId: payload.courseOfferingId } : {}) } as any
  );
}

/**
 * Drops a course for a student.
 */
export async function dropUniversityCourse(
  tenantIdentifier: string,
  studentId: string,
  registrationId: string,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);

  const registration = await db.courseRegistration.findFirst({
    where: {
      id: registrationId,
      studentId,
      student: { campus: { institutionId: tenant.institutionId } }
    },
    include: { course: true }
  });

  if (!registration) {
    throw AppError.notFound('Course registration record not found.');
  }

  const updated = await db.courseRegistration.update({
    where: { id: registration.id },
    data: { status: 'DROPPED' }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'UNIVERSITY_COURSE_DROPPED',
    resourceType: 'CourseRegistration',
    resourceId: registration.id,
    newState: {
      studentId,
      courseCode: registration.course.code,
      status: 'DROPPED'
    }
  });

  return updated;
}
