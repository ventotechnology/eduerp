import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  LmsCourseCreateSchema,
  LmsCourseUpdateSchema,
  LmsSyllabusSaveSchema,
  LmsLearningOutcomeCreateSchema,
  LmsAnnouncementCreateSchema,
  LmsCourseCopySchema,
} from '@/lib/validations/schemas';

/**
 * Creates a new LMS Course Space linked to academic structure (Class/Section/Subject or University CourseOffering)
 */
export async function createLmsCourse(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsCourseCreateSchema.parse(rawData);

  // Validate campus
  const campus = await db.campus.findFirst({
    where: { id: validated.campusId, institutionId: tenant.institutionId },
  });
  if (!campus) throw AppError.notFound('Campus not found or does not belong to this institution.');

  // Validate primary teacher
  let teacherId = validated.primaryTeacherId;
  if (!teacherId) {
    const actorEmp = await db.employee.findFirst({
      where: { userId: actor.id }
    });
    if (actorEmp) {
      teacherId = actorEmp.id;
    } else {
      const anyEmp = await db.employee.findFirst({
        where: { campus: { institutionId: tenant.institutionId } }
      });
      if (anyEmp) teacherId = anyEmp.id;
    }
  }

  const teacher = teacherId
    ? await db.employee.findFirst({
        where: { id: teacherId, campus: { institutionId: tenant.institutionId } },
      })
    : null;

  // Course space uniqueness check: prevent duplicate active course spaces for the same period, subject/offering and section
  if (validated.classId && validated.sectionId && validated.subjectId) {
    const existing = await db.lmsCourse.findFirst({
      where: {
        institutionId: tenant.institutionId,
        academicYearId: validated.academicYearId,
        classId: validated.classId,
        sectionId: validated.sectionId,
        subjectId: validated.subjectId,
        status: { not: 'ARCHIVED' },
      },
    });
    if (existing) {
      throw AppError.conflict('An active LMS course space already exists for this class, section, and subject in this academic year.');
    }
  } else if (validated.courseOfferingId) {
    const existing = await db.lmsCourse.findFirst({
      where: {
        institutionId: tenant.institutionId,
        courseOfferingId: validated.courseOfferingId,
        status: { not: 'ARCHIVED' },
      },
    });
    if (existing) {
      throw AppError.conflict('An active LMS course space already exists for this university course offering.');
    }
  }

  const course = await db.lmsCourse.create({
    data: {
      institutionId: tenant.institutionId,
      campusId: validated.campusId,
      code: validated.code,
      title: validated.title,
      description: validated.description,
      coverImageUrl: validated.coverImageUrl,
      academicYearId: validated.academicYearId,
      sessionId: validated.sessionId,
      classId: validated.classId,
      sectionId: validated.sectionId,
      subjectId: validated.subjectId,
      courseOfferingId: validated.courseOfferingId,
      primaryTeacherId: validated.primaryTeacherId,
      coTeacherIds: validated.coTeacherIds ? JSON.stringify(validated.coTeacherIds) : null,
      coordinatorId: validated.coordinatorId,
      status: validated.status,
    },
    include: {
      primaryTeacher: true,
      campus: true,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CREATE',
    resourceType: 'LMS_COURSE',
    newState: { courseId: course.id, code: course.code, title: course.title },
  });

  return course;
}

export async function updateLmsCourse(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsCourseUpdateSchema.parse(rawData);

  const course = await db.lmsCourse.findFirst({
    where: { id: validated.courseId, institutionId: tenant.institutionId },
  });
  if (!course) throw AppError.notFound('LMS Course not found.');

  // Teacher scope check: if actor is teacher, verify they are primary or co-teacher
  if (actor.role === 'TEACHER' || actor.role === 'FACULTY') {
    const isPrimary = course.primaryTeacherId === actor.id;
    const coTeachers: string[] = course.coTeacherIds ? JSON.parse(course.coTeacherIds) : [];
    const isCo = coTeachers.includes(actor.id);
    if (!isPrimary && !isCo && !actor.isPlatformAdmin) {
      throw AppError.forbidden('You are not authorized to update this course space.');
    }
  }

  const updated = await db.lmsCourse.update({
    where: { id: course.id },
    data: {
      title: validated.title,
      description: validated.description !== undefined ? validated.description : course.description,
      coverImageUrl: validated.coverImageUrl !== undefined ? validated.coverImageUrl : course.coverImageUrl,
      primaryTeacherId: validated.primaryTeacherId || course.primaryTeacherId,
      coTeacherIds: validated.coTeacherIds ? JSON.stringify(validated.coTeacherIds) : course.coTeacherIds,
      coordinatorId: validated.coordinatorId !== undefined ? validated.coordinatorId : course.coordinatorId,
      status: validated.status || course.status,
    },
    include: { primaryTeacher: true },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'UPDATE',
    resourceType: 'LMS_COURSE',
    newState: { courseId: updated.id, status: updated.status },
  });

  return updated;
}

export async function getLmsCourses(tenantIdentifier: string, filter?: { campusId?: string; status?: string; studentId?: string; teacherId?: string }) {
  const tenant = await requireTenant(tenantIdentifier);

  const where: any = { institutionId: tenant.institutionId };
  if (filter?.campusId) where.campusId = filter.campusId;
  if (filter?.status) where.status = filter.status;
  if (filter?.teacherId) where.primaryTeacherId = filter.teacherId;

  // If filtered by student, find courses for the student's enrollments or course registrations
  if (filter?.studentId) {
    const enrollments = await db.enrollment.findMany({
      where: { studentId: filter.studentId, status: 'ACTIVE' },
    });
    const classIds = enrollments.map((e) => e.classId).filter(Boolean) as string[];
    const sectionIds = enrollments.map((e) => e.sectionId).filter(Boolean) as string[];

    const registrations = await db.courseRegistration.findMany({
      where: { studentId: filter.studentId, status: { in: ['REGISTERED', 'APPROVED'] } },
    });
    const offeringIds = registrations.map((r) => r.courseOfferingId);

    where.OR = [
      { classId: { in: classIds }, sectionId: { in: sectionIds } },
      { courseOfferingId: { in: offeringIds } },
    ];
    // Students only see PUBLISHED courses
    where.status = 'PUBLISHED';
  }

  return db.lmsCourse.findMany({
    where,
    include: {
      primaryTeacher: true,
      campus: true,
      _count: {
        select: {
          modules: true,
          assignments: true,
          quizzes: true,
          onlineClasses: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getLmsCourseById(tenantIdentifier: string, courseId: string, actor?: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);

  const course = await db.lmsCourse.findFirst({
    where: { id: courseId, institutionId: tenant.institutionId },
    include: {
      primaryTeacher: true,
      campus: true,
      syllabus: true,
      learningOutcomes: true,
      modules: {
        orderBy: { sequenceOrder: 'asc' },
        include: {
          lessons: { orderBy: { sequenceOrder: 'asc' } },
        },
      },
      homeworks: { orderBy: { dueDate: 'asc' } },
      assignments: { orderBy: { dueDate: 'asc' } },
      quizzes: { orderBy: { closeTime: 'asc' } },
      onlineClasses: { orderBy: { classDate: 'asc' } },
      announcements: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!course) throw AppError.notFound('LMS Course not found.');

  // If student actor, verify they are enrolled in this course
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

  return course;
}

export async function checkStudentCourseAccess(institutionId: string, course: any, studentId: string): Promise<boolean> {
  if (course.courseOfferingId) {
    const reg = await db.courseRegistration.findFirst({
      where: {
        studentId,
        courseOfferingId: course.courseOfferingId,
        status: { in: ['REGISTERED', 'APPROVED'] },
      },
    });
    return !!reg;
  }

  if (course.classId && course.sectionId) {
    const enrollment = await db.enrollment.findFirst({
      where: {
        studentId,
        classId: course.classId,
        sectionId: course.sectionId,
        status: 'ACTIVE',
      },
    });
    return !!enrollment;
  }

  // Fallback to active student in same campus
  const stu = await db.student.findFirst({
    where: { id: studentId, campusId: course.campusId, status: 'ACTIVE' },
  });
  return !!stu;
}

export async function getCourseEnrolledStudents(tenantIdentifier: string, courseId: string) {
  const tenant = await requireTenant(tenantIdentifier);
  const course = await db.lmsCourse.findFirst({
    where: { id: courseId, institutionId: tenant.institutionId },
  });
  if (!course) throw AppError.notFound('LMS Course not found.');

  if (course.courseOfferingId) {
    const registrations = await db.courseRegistration.findMany({
      where: { courseOfferingId: course.courseOfferingId, status: { in: ['REGISTERED', 'APPROVED'] } },
      include: { student: true },
    });
    return registrations.map((r) => r.student);
  }

  if (course.classId && course.sectionId) {
    const enrollments = await db.enrollment.findMany({
      where: { classId: course.classId, sectionId: course.sectionId, status: 'ACTIVE' },
      include: { student: true },
    });
    return enrollments.map((e) => e.student);
  }

  // Fallback to campus students
  return db.student.findMany({
    where: { campusId: course.campusId, status: 'ACTIVE' },
  });
}

export async function saveLmsSyllabus(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsSyllabusSaveSchema.parse(rawData);

  const course = await db.lmsCourse.findFirst({
    where: { id: validated.courseId, institutionId: tenant.institutionId },
  });
  if (!course) throw AppError.notFound('Course not found.');

  const existingSyllabus = await db.lmsSyllabus.findUnique({
    where: { courseId: course.id },
  });

  let syllabus;
  if (existingSyllabus) {
    syllabus = await db.lmsSyllabus.update({
      where: { courseId: course.id },
      data: {
        overview: validated.overview,
        objectives: validated.objectives,
        learningOutcomesDesc: validated.learningOutcomesDesc,
        requiredMaterials: validated.requiredMaterials,
        assessmentBreakdown: validated.assessmentBreakdown,
        policies: validated.policies,
        officeHours: validated.officeHours,
        version: existingSyllabus.version + 1,
      },
    });
  } else {
    syllabus = await db.lmsSyllabus.create({
      data: {
        courseId: course.id,
        overview: validated.overview,
        objectives: validated.objectives,
        learningOutcomesDesc: validated.learningOutcomesDesc,
        requiredMaterials: validated.requiredMaterials,
        assessmentBreakdown: validated.assessmentBreakdown,
        policies: validated.policies,
        officeHours: validated.officeHours,
        version: 1,
      },
    });
  }

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'UPDATE',
    resourceType: 'LMS_COURSE',
    newState: { courseId: course.id, syllabusVersion: syllabus.version },
  });

  return syllabus;
}

export async function addLearningOutcome(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsLearningOutcomeCreateSchema.parse(rawData);

  const course = await db.lmsCourse.findFirst({
    where: { id: validated.courseId, institutionId: tenant.institutionId },
  });
  if (!course) throw AppError.notFound('Course not found.');

  return db.lmsLearningOutcome.create({
    data: {
      courseId: course.id,
      code: validated.code,
      description: validated.description,
      bloomLevel: validated.bloomLevel,
    },
  });
}

export async function createCourseAnnouncement(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsAnnouncementCreateSchema.parse(rawData);

  const course = await db.lmsCourse.findFirst({
    where: { id: validated.courseId, institutionId: tenant.institutionId },
  });
  if (!course) throw AppError.notFound('Course not found.');

  return db.lmsCourseAnnouncement.create({
    data: {
      courseId: course.id,
      title: validated.title,
      content: validated.content,
      targetSectionId: validated.targetSectionId,
      authorName: actor.name,
      authorId: actor.id,
      isPinned: validated.isPinned,
      expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
    },
  });
}

/**
 * Copies course structure (modules, lessons, syllabus, outcomes) to a new academic period without copying student submissions or grades
 */
export async function copyLmsCourse(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsCourseCopySchema.parse(rawData);

  const source = await db.lmsCourse.findFirst({
    where: { id: validated.sourceCourseId, institutionId: tenant.institutionId },
    include: {
      syllabus: true,
      learningOutcomes: true,
      modules: {
        include: { lessons: true },
      },
    },
  });
  if (!source) throw AppError.notFound('Source LMS course not found.');

  // Create new course space
  const newCourse = await db.lmsCourse.create({
    data: {
      institutionId: tenant.institutionId,
      campusId: source.campusId,
      code: validated.newCode,
      title: validated.newTitle,
      description: source.description,
      coverImageUrl: source.coverImageUrl,
      academicYearId: validated.targetAcademicYearId || source.academicYearId,
      sessionId: validated.targetSessionId || source.sessionId,
      classId: source.classId,
      sectionId: validated.targetSectionId || source.sectionId,
      subjectId: source.subjectId,
      courseOfferingId: validated.targetCourseOfferingId || source.courseOfferingId,
      primaryTeacherId: validated.primaryTeacherId,
      status: 'DRAFT',
    },
  });

  // Copy syllabus
  if (source.syllabus) {
    await db.lmsSyllabus.create({
      data: {
        courseId: newCourse.id,
        overview: source.syllabus.overview,
        objectives: source.syllabus.objectives,
        learningOutcomesDesc: source.syllabus.learningOutcomesDesc,
        requiredMaterials: source.syllabus.requiredMaterials,
        assessmentBreakdown: source.syllabus.assessmentBreakdown,
        policies: source.syllabus.policies,
        officeHours: source.syllabus.officeHours,
        version: 1,
      },
    });
  }

  // Copy learning outcomes
  for (const lo of source.learningOutcomes) {
    await db.lmsLearningOutcome.create({
      data: {
        courseId: newCourse.id,
        code: lo.code,
        description: lo.description,
        bloomLevel: lo.bloomLevel,
      },
    });
  }

  // Copy modules and lessons
  for (const mod of source.modules) {
    const newMod = await db.lmsModule.create({
      data: {
        courseId: newCourse.id,
        title: mod.title,
        description: mod.description,
        sequenceOrder: mod.sequenceOrder,
        releaseType: mod.releaseType,
        isPublished: true,
      },
    });

    for (const les of mod.lessons) {
      await db.lmsLesson.create({
        data: {
          moduleId: newMod.id,
          title: les.title,
          summary: les.summary,
          content: les.content,
          contentType: les.contentType,
          fileUrl: les.fileUrl,
          videoUrl: les.videoUrl,
          estimatedDurationMinutes: les.estimatedDurationMinutes,
          sequenceOrder: les.sequenceOrder,
          completionRule: les.completionRule,
          status: 'PUBLISHED',
        },
      });
    }
  }

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CREATE',
    resourceType: 'LMS_COURSE',
    newState: { action: 'COURSE_COPY', sourceCourseId: source.id, newCourseId: newCourse.id },
  });

  return newCourse;
}

export async function archiveLmsCourse(tenantIdentifier: string, courseId: string, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const course = await db.lmsCourse.findFirst({
    where: { id: courseId, institutionId: tenant.institutionId },
  });
  if (!course) throw AppError.notFound('LMS Course not found.');

  const archived = await db.lmsCourse.update({
    where: { id: course.id },
    data: { status: 'ARCHIVED' },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'UPDATE',
    resourceType: 'LMS_COURSE',
    newState: { action: 'ARCHIVE', courseId: course.id },
  });

  return archived;
}
