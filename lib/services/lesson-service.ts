import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  LmsModuleCreateSchema,
  LmsLessonCreateSchema,
  LmsLessonProgressUpdateSchema,
} from '@/lib/validations/schemas';

export async function createModule(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsModuleCreateSchema.parse(rawData);

  const course = await db.lmsCourse.findFirst({
    where: { id: validated.courseId, institutionId: tenant.institutionId },
  });
  if (!course) throw AppError.notFound('LMS Course not found.');

  const lmsModule = await db.lmsModule.create({
    data: {
      courseId: course.id,
      title: validated.title,
      description: validated.description,
      sequenceOrder: validated.sequenceOrder,
      releaseType: validated.releaseType,
      releaseDate: validated.releaseDate ? new Date(validated.releaseDate) : null,
      prerequisiteModuleId: validated.prerequisiteModuleId,
      isPublished: validated.isPublished,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CREATE',
    resourceType: 'LESSON',
    newState: { moduleId: lmsModule.id, title: lmsModule.title },
  });

  return lmsModule;
}

export async function createLesson(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsLessonCreateSchema.parse(rawData);

  const lmsModule = await db.lmsModule.findFirst({
    where: { id: validated.moduleId, course: { institutionId: tenant.institutionId } },
    include: { course: true },
  });
  if (!lmsModule) throw AppError.notFound('Module not found.');

  const lesson = await db.lmsLesson.create({
    data: {
      moduleId: lmsModule.id,
      title: validated.title,
      summary: validated.summary,
      content: validated.content,
      contentType: validated.contentType,
      fileUrl: validated.fileUrl,
      videoUrl: validated.videoUrl,
      estimatedDurationMinutes: validated.estimatedDurationMinutes,
      sequenceOrder: validated.sequenceOrder,
      completionRule: validated.completionRule,
      status: validated.status,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CREATE',
    resourceType: 'LESSON',
    newState: { lessonId: lesson.id, title: lesson.title, contentType: lesson.contentType },
  });

  return lesson;
}

export async function updateLessonProgress(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsLessonProgressUpdateSchema.parse(rawData);

  const lesson = await db.lmsLesson.findFirst({
    where: { id: validated.lessonId, module: { course: { institutionId: tenant.institutionId } } },
    include: { module: { include: { course: true } } },
  });
  if (!lesson) throw AppError.notFound('Lesson not found.');

  const student = await db.student.findFirst({
    where: { id: validated.studentId, campus: { institutionId: tenant.institutionId } },
  });
  if (!student) throw AppError.notFound('Student not found.');

  const now = new Date();
  const existing = await db.lmsLessonProgress.findUnique({
    where: {
      studentId_lessonId: {
        studentId: student.id,
        lessonId: lesson.id,
      },
    },
  });

  let progress;
  if (existing) {
    progress = await db.lmsLessonProgress.update({
      where: { id: existing.id },
      data: {
        status: validated.status,
        completedAt: validated.status === 'COMPLETED' ? now : existing.completedAt,
        lastAccessedAt: now,
      },
    });
  } else {
    progress = await db.lmsLessonProgress.create({
      data: {
        studentId: student.id,
        lessonId: lesson.id,
        status: validated.status,
        startedAt: now,
        completedAt: validated.status === 'COMPLETED' ? now : null,
        lastAccessedAt: now,
      },
    });
  }

  // Recalculate course progress
  const courseProgress = await recalculateCourseProgress(tenant.institutionId, lesson.module.course.id, student.id);

  // Log activity
  await db.lmsLearningActivityLog.create({
    data: {
      institutionId: tenant.institutionId,
      studentId: student.id,
      courseId: lesson.module.course.id,
      activityType: 'LESSON_VIEWED',
      detailsJson: JSON.stringify({ lessonId: lesson.id, lessonTitle: lesson.title, status: validated.status }),
    },
  });

  return { lessonProgress: progress, courseProgress };
}

export async function recalculateCourseProgress(institutionId: string, courseId: string, studentId: string) {
  // Count total published lessons in course
  const totalLessons = await db.lmsLesson.count({
    where: {
      status: 'PUBLISHED',
      module: { courseId, course: { institutionId }, isPublished: true },
    },
  });

  // Count total published homeworks/assignments/quizzes
  const totalAssignments = await db.lmsAssignment.count({
    where: { courseId, status: 'PUBLISHED' },
  });
  const totalQuizzes = await db.lmsQuiz.count({
    where: { courseId, status: 'PUBLISHED' },
  });

  const totalActivities = totalLessons + totalAssignments + totalQuizzes;

  // Completed lessons
  const completedLessons = await db.lmsLessonProgress.count({
    where: {
      studentId,
      status: 'COMPLETED',
      lesson: { module: { courseId } },
    },
  });

  // Completed assignments
  const completedAssignments = await db.lmsAssignmentSubmission.count({
    where: {
      studentId,
      assignment: { courseId },
      status: { in: ['SUBMITTED', 'GRADED'] },
    },
  });

  // Passed / submitted quizzes
  const completedQuizzes = await db.lmsQuizAttempt.count({
    where: {
      studentId,
      quiz: { courseId },
      status: { in: ['SUBMITTED', 'GRADED'] },
    },
  });

  const completedActivities = completedLessons + completedAssignments + completedQuizzes;
  const progressPercentage = totalActivities > 0 ? Math.min(100, Math.round((completedActivities / totalActivities) * 100)) : 0;
  const status = progressPercentage === 100 ? 'COMPLETED' : completedActivities > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';

  const existingCourseProgress = await db.lmsCourseProgress.findUnique({
    where: {
      studentId_courseId: {
        studentId,
        courseId,
      },
    },
  });

  if (existingCourseProgress) {
    return db.lmsCourseProgress.update({
      where: { id: existingCourseProgress.id },
      data: {
        completedActivitiesCount: completedActivities,
        totalActivitiesCount: totalActivities,
        progressPercentage,
        status,
        lastCalculatedAt: new Date(),
      },
    });
  } else {
    return db.lmsCourseProgress.create({
      data: {
        studentId,
        courseId,
        completedActivitiesCount: completedActivities,
        totalActivitiesCount: totalActivities,
        progressPercentage,
        status,
      },
    });
  }
}

export async function getCourseContentWithProgress(tenantIdentifier: string, courseId: string, studentId?: string) {
  const tenant = await requireTenant(tenantIdentifier);

  const modules = await db.lmsModule.findMany({
    where: { courseId, course: { institutionId: tenant.institutionId }, isPublished: true },
    orderBy: { sequenceOrder: 'asc' },
    include: {
      lessons: {
        where: { status: 'PUBLISHED' },
        orderBy: { sequenceOrder: 'asc' },
      },
    },
  });

  if (!studentId) return modules;

  const progressRecords = await db.lmsLessonProgress.findMany({
    where: { studentId, lesson: { module: { courseId } } },
  });

  const progressMap = new Map(progressRecords.map((p) => [p.lessonId, p]));

  return modules.map((mod) => ({
    ...mod,
    lessons: mod.lessons.map((les) => ({
      ...les,
      userProgress: progressMap.get(les.id) || { status: 'NOT_STARTED' },
    })),
  }));
}
