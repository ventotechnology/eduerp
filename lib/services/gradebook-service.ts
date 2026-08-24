import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  LmsGradebookItemCreateSchema,
  LmsGradebookScoreOverrideSchema,
  LmsGradebookSyncToOfficialSchema,
} from '@/lib/validations/schemas';
import { getCourseEnrolledStudents } from './lms-course-service';

export async function createGradebookItem(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsGradebookItemCreateSchema.parse(rawData);

  const course = await db.lmsCourse.findFirst({
    where: { id: validated.courseId, institutionId: tenant.institutionId },
  });
  if (!course) throw AppError.notFound('LMS Course not found.');

  const item = await db.lmsGradebookItem.create({
    data: {
      courseId: course.id,
      itemType: validated.itemType,
      referenceId: validated.referenceId,
      title: validated.title,
      maxScore: validated.maxScore,
      weightPercent: validated.weightPercent,
      assessmentComponentId: validated.assessmentComponentId,
      isPublished: true,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CREATE',
    resourceType: 'GRADEBOOK',
    newState: { itemId: item.id, title: item.title, maxScore: item.maxScore },
  });

  return item;
}

export async function getCourseGradebook(tenantIdentifier: string, courseId: string) {
  const tenant = await requireTenant(tenantIdentifier);

  const course = await db.lmsCourse.findFirst({
    where: { id: courseId, institutionId: tenant.institutionId },
  });
  if (!course) throw AppError.notFound('LMS Course not found.');

  const items = await db.lmsGradebookItem.findMany({
    where: { courseId: course.id },
    include: { scores: true },
    orderBy: { createdAt: 'asc' },
  });

  const students = await getCourseEnrolledStudents(tenantIdentifier, courseId);

  // Compute student summary scores
  const roster = students.map((stu) => {
    let totalWeightedScore = 0;
    let totalMaxPossible = 0;

    const studentScores = items.map((item) => {
      const scoreObj = item.scores.find((s) => s.studentId === stu.id);
      const scoreObtained = scoreObj?.scoreObtained ?? 0;
      const finalWeighted = scoreObj?.finalWeightedScore ?? 0;
      totalWeightedScore += finalWeighted;
      totalMaxPossible += item.weightPercent;

      return {
        itemId: item.id,
        itemTitle: item.title,
        itemType: item.itemType,
        maxScore: item.maxScore,
        scoreObtained,
        weightedScore: finalWeighted,
        isOverridden: scoreObj?.isOverridden ?? false,
      };
    });

    return {
      student: {
        id: stu.id,
        studentIdNumber: stu.studentIdNumber,
        firstName: stu.firstName,
        lastName: stu.lastName,
      },
      scores: studentScores,
      totalWeightedScore: Math.round(totalWeightedScore * 100) / 100,
      totalMaxPossible,
      percentage: totalMaxPossible > 0 ? Math.round((totalWeightedScore / totalMaxPossible) * 100) : 0,
    };
  });

  return { course, items, roster };
}

export async function overrideGradebookScore(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsGradebookScoreOverrideSchema.parse(rawData);

  const item = await db.lmsGradebookItem.findFirst({
    where: { id: validated.gradebookItemId, course: { institutionId: tenant.institutionId } },
  });
  if (!item) throw AppError.notFound('Gradebook item not found.');

  if (validated.scoreObtained > item.maxScore) {
    throw AppError.badRequest(`Score cannot exceed item maximum score (${item.maxScore}).`);
  }

  const weightedScore = (validated.scoreObtained / item.maxScore) * item.weightPercent;

  const score = await db.lmsGradebookScore.upsert({
    where: {
      gradebookItemId_studentId: {
        gradebookItemId: item.id,
        studentId: validated.studentId,
      },
    },
    update: {
      scoreObtained: validated.scoreObtained,
      finalWeightedScore: weightedScore,
      isOverridden: true,
      overrideReason: validated.overrideReason,
      overriddenByEmployeeId: actor.id,
    },
    create: {
      gradebookItemId: item.id,
      studentId: validated.studentId,
      scoreObtained: validated.scoreObtained,
      finalWeightedScore: weightedScore,
      isOverridden: true,
      overrideReason: validated.overrideReason,
      overriddenByEmployeeId: actor.id,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'UPDATE',
    resourceType: 'GRADEBOOK',
    newState: { gradebookItemId: item.id, studentId: validated.studentId, newScore: validated.scoreObtained, reason: validated.overrideReason },
  });

  return score;
}

/**
 * Controlled synchronization from LMS Gradebook to Command 4 official Examination MarkRecord
 */
export async function syncLmsGradeToOfficialExam(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsGradebookSyncToOfficialSchema.parse(rawData);

  const item = await db.lmsGradebookItem.findFirst({
    where: { id: validated.gradebookItemId, course: { institutionId: tenant.institutionId } },
    include: { scores: true, course: true },
  });
  if (!item) throw AppError.notFound('Gradebook item not found.');

  // Validate official exam
  const exam = await db.exam.findFirst({
    where: { id: validated.examId, institutionId: tenant.institutionId },
  });
  if (!exam) throw AppError.notFound('Official Exam not found.');

  // Prevent modifying locked/published exam results
  if (exam.isPublished || exam.publicationStatus === 'PUBLISHED' || exam.publicationStatus === 'LOCKED') {
    throw AppError.forbidden('Cannot sync grades to an exam that is locked or published.');
  }

  // Validate assessment component
  const component = await db.assessmentComponent.findFirst({
    where: { id: validated.assessmentComponentId, institutionId: tenant.institutionId },
  });
  if (!component) throw AppError.notFound('Assessment component not found.');

  let syncedCount = 0;

  // Sync scores for each student
  for (const scoreRecord of item.scores) {
    const student = await db.student.findUnique({ where: { id: scoreRecord.studentId } });
    if (!student) continue;

    // Check if official mark record exists
    const existingEntry = await db.marksEntry.findFirst({
      where: {
        examId: exam.id,
        studentId: student.id,
      },
    });

    // Scale score to component max marks
    const scaledMarks = (scoreRecord.scoreObtained / item.maxScore) * component.maxMarks;

    if (existingEntry) {
      if (!existingEntry.isLocked && existingEntry.workflowStatus !== "LOCKED") {
        await db.marksEntry.update({
          where: { id: existingEntry.id },
          data: {
            assignmentMarks: scaledMarks,
            remarks: `Auto-synced from LMS ${item.itemType}: ${item.title}`,
          },
        });
        syncedCount++;
      }
    } else {
      await db.marksEntry.create({
        data: {
          examId: exam.id,
          studentId: student.id,
          assignmentMarks: scaledMarks,
          totalMarks: 0,
          letterGrade: "PENDING",
          gradePoint: 0.0,
          workflowStatus: "DRAFT",
          remarks: `Auto-synced from LMS ${item.itemType}: ${item.title}`,
        },
      });
      syncedCount++;
    }
  }

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'UPDATE',
    resourceType: 'GRADEBOOK',
    newState: { action: 'SYNC_TO_OFFICIAL_EXAM', gradebookItemId: item.id, examId: exam.id, syncedCount },
  });

  return { syncedCount, status: 'SUCCESS' };
}
