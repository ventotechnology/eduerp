import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  LmsHomeworkCreateSchema,
  LmsHomeworkSubmitSchema,
  LmsAssignmentCreateSchema,
  LmsRubricCreateSchema,
  LmsAssignmentSubmitSchema,
  LmsAssignmentGradeSchema,
} from '@/lib/validations/schemas';

// ==========================================
// HOMEWORK ENGINE
// ==========================================

export async function createHomework(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsHomeworkCreateSchema.parse(rawData);

  const course = await db.lmsCourse.findFirst({
    where: { id: validated.courseId, institutionId: tenant.institutionId },
  });
  if (!course) throw AppError.notFound('LMS Course not found.');

  const homework = await db.lmsHomework.create({
    data: {
      courseId: course.id,
      title: validated.title,
      instructions: validated.instructions,
      assignedDate: validated.assignedDate ? new Date(validated.assignedDate) : new Date(),
      dueDate: new Date(validated.dueDate),
      attachmentUrl: validated.attachmentUrl,
      maxMarks: validated.maxMarks,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CREATE',
    resourceType: 'HOMEWORK',
    newState: { homeworkId: homework.id, title: homework.title },
  });

  return homework;
}

export async function submitHomework(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsHomeworkSubmitSchema.parse(rawData);

  const homework = await db.lmsHomework.findFirst({
    where: { id: validated.homeworkId, course: { institutionId: tenant.institutionId } },
  });
  if (!homework) throw AppError.notFound('Homework not found.');

  const student = await db.student.findFirst({
    where: { id: validated.studentId, campus: { institutionId: tenant.institutionId } },
  });
  if (!student) throw AppError.notFound('Student not found.');

  const now = new Date();
  const isLate = now > homework.dueDate;

  const existing = await db.lmsHomeworkSubmission.findUnique({
    where: {
      homeworkId_studentId: {
        homeworkId: homework.id,
        studentId: student.id,
      },
    },
  });

  let submission;
  if (existing) {
    submission = await db.lmsHomeworkSubmission.update({
      where: { id: existing.id },
      data: {
        contentText: validated.contentText,
        attachmentUrl: validated.attachmentUrl,
        submittedAt: now,
        status: isLate ? 'LATE' : 'SUBMITTED',
      },
    });
  } else {
    submission = await db.lmsHomeworkSubmission.create({
      data: {
        homeworkId: homework.id,
        studentId: student.id,
        contentText: validated.contentText,
        attachmentUrl: validated.attachmentUrl,
        submittedAt: now,
        status: isLate ? 'LATE' : 'SUBMITTED',
      },
    });
  }

  return submission;
}

// ==========================================
// RUBRIC ENGINE
// ==========================================

export async function createRubric(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsRubricCreateSchema.parse(rawData);

  const rubric = await db.lmsRubric.create({
    data: {
      institutionId: tenant.institutionId,
      title: validated.title,
      description: validated.description,
      totalPoints: validated.totalPoints,
      criteria: {
        create: validated.criteria.map((c) => ({
          title: c.title,
          description: c.description,
          maxPoints: c.maxPoints,
          levels: {
            create: c.levels.map((lvl) => ({
              title: lvl.title,
              description: lvl.description,
              points: lvl.points,
            })),
          },
        })),
      },
    },
    include: {
      criteria: {
        include: { levels: true },
      },
    },
  });

  return rubric;
}

// ==========================================
// FORMAL ASSIGNMENTS
// ==========================================

export async function createAssignment(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsAssignmentCreateSchema.parse(rawData);

  const course = await db.lmsCourse.findFirst({
    where: { id: validated.courseId, institutionId: tenant.institutionId },
  });
  if (!course) throw AppError.notFound('LMS Course not found.');

  const assignment = await db.lmsAssignment.create({
    data: {
      courseId: course.id,
      title: validated.title,
      instructions: validated.instructions,
      totalMarks: validated.totalMarks,
      weightPercent: validated.weightPercent,
      startDate: validated.startDate ? new Date(validated.startDate) : new Date(),
      dueDate: new Date(validated.dueDate),
      lateDeadline: validated.lateDeadline ? new Date(validated.lateDeadline) : null,
      lateSubmissionPolicy: validated.lateSubmissionPolicy,
      latePenaltyPercent: validated.latePenaltyPercent,
      submissionType: validated.submissionType,
      maxAttempts: validated.maxAttempts,
      rubricId: validated.rubricId,
    },
    include: { rubric: { include: { criteria: { include: { levels: true } } } } },
  });

  // Automatically register in LMS Gradebook
  await db.lmsGradebookItem.create({
    data: {
      courseId: course.id,
      itemType: 'ASSIGNMENT',
      referenceId: assignment.id,
      title: assignment.title,
      maxScore: assignment.totalMarks,
      weightPercent: assignment.weightPercent,
      isPublished: true,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CREATE',
    resourceType: 'ASSIGNMENT',
    newState: { assignmentId: assignment.id, title: assignment.title },
  });

  return assignment;
}

export async function submitAssignment(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsAssignmentSubmitSchema.parse(rawData);

  const assignment = await db.lmsAssignment.findFirst({
    where: { id: validated.assignmentId, course: { institutionId: tenant.institutionId } },
  });
  if (!assignment) throw AppError.notFound('Assignment not found.');

  if (assignment.isLocked) {
    throw AppError.forbidden('This assignment is locked and is no longer accepting submissions.');
  }

  const now = new Date();
  const isAfterDue = now > assignment.dueDate;
  const isAfterLateDeadline = assignment.lateDeadline && now > assignment.lateDeadline;

  if (isAfterLateDeadline || (isAfterDue && assignment.lateSubmissionPolicy === 'NOT_ALLOWED')) {
    throw AppError.forbidden('The deadline for this assignment has passed.');
  }

  // Count prior attempts
  const priorAttemptsCount = await db.lmsAssignmentSubmission.count({
    where: { assignmentId: assignment.id, studentId: validated.studentId },
  });

  if (priorAttemptsCount >= assignment.maxAttempts) {
    throw AppError.badRequest(`Maximum allowed submission attempts (${assignment.maxAttempts}) reached for this assignment.`);
  }

  const nextAttemptNumber = priorAttemptsCount + 1;
  const isLate = isAfterDue;
  const penaltyDeducted = isLate && assignment.lateSubmissionPolicy === 'PENALTY_PERCENT'
    ? (assignment.totalMarks * (assignment.latePenaltyPercent / 100))
    : 0;

  const submission = await db.lmsAssignmentSubmission.create({
    data: {
      assignmentId: assignment.id,
      studentId: validated.studentId,
      attemptNumber: nextAttemptNumber,
      submittedAt: now,
      contentText: validated.contentText,
      fileUrls: validated.fileUrls ? JSON.stringify(validated.fileUrls) : null,
      status: 'SUBMITTED',
      isLate,
      penaltyDeducted,
    },
  });

  // Log activity
  await db.lmsLearningActivityLog.create({
    data: {
      institutionId: tenant.institutionId,
      studentId: validated.studentId,
      courseId: assignment.courseId,
      activityType: 'ASSIGNMENT_SUBMITTED',
      detailsJson: JSON.stringify({ assignmentId: assignment.id, attemptNumber: nextAttemptNumber, isLate }),
    },
  });

  return submission;
}

export async function gradeAssignmentSubmission(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsAssignmentGradeSchema.parse(rawData);

  const submission = await db.lmsAssignmentSubmission.findFirst({
    where: { id: validated.submissionId, assignment: { course: { institutionId: tenant.institutionId } } },
    include: {
      assignment: { include: { rubric: { include: { criteria: true } } } },
    },
  });
  if (!submission) throw AppError.notFound('Assignment submission not found.');

  // Verify teacher score does not exceed maximum
  if (validated.score > submission.assignment.totalMarks) {
    throw AppError.badRequest(`Score cannot exceed assignment total marks (${submission.assignment.totalMarks}).`);
  }

  // Calculate final score after late penalty deduction
  const finalScore = Math.max(0, validated.score - submission.penaltyDeducted);

  const updated = await db.lmsAssignmentSubmission.update({
    where: { id: submission.id },
    data: {
      score: finalScore,
      rubricScoresJson: validated.rubricScores ? JSON.stringify(validated.rubricScores) : null,
      feedbackText: validated.feedbackText,
      gradedByEmployeeId: actor.id,
      gradedAt: new Date(),
      status: validated.status,
    },
  });

  // Update Gradebook entry
  const gradebookItem = await db.lmsGradebookItem.findFirst({
    where: { referenceId: submission.assignmentId, itemType: 'ASSIGNMENT' },
  });

  if (gradebookItem && validated.status === 'GRADED') {
    const weightedScore = (finalScore / submission.assignment.totalMarks) * gradebookItem.weightPercent;
    
    await db.lmsGradebookScore.upsert({
      where: {
        gradebookItemId_studentId: {
          gradebookItemId: gradebookItem.id,
          studentId: submission.studentId,
        },
      },
      update: {
        scoreObtained: finalScore,
        finalWeightedScore: weightedScore,
      },
      create: {
        gradebookItemId: gradebookItem.id,
        studentId: submission.studentId,
        scoreObtained: finalScore,
        finalWeightedScore: weightedScore,
      },
    });
  }

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'UPDATE',
    resourceType: 'ASSIGNMENT',
    newState: { submissionId: submission.id, score: finalScore, status: validated.status },
  });

  return updated;
}
