import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  LmsQuizCreateSchema,
  LmsQuizStartAttemptSchema,
  LmsQuizSubmitAttemptSchema,
  LmsQuizGradeResponseSchema,
} from '@/lib/validations/schemas';
import { recalculateCourseProgress } from './lesson-service';

export async function createQuiz(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsQuizCreateSchema.parse(rawData);

  const course = await db.lmsCourse.findFirst({
    where: { id: validated.courseId, institutionId: tenant.institutionId },
  });
  if (!course) throw AppError.notFound('LMS Course not found.');

  const quiz = await db.lmsQuiz.create({
    data: {
      courseId: course.id,
      title: validated.title,
      instructions: validated.instructions,
      openTime: validated.openTime ? new Date(validated.openTime) : new Date(),
      closeTime: new Date(validated.closeTime),
      durationMinutes: validated.durationMinutes,
      maxAttempts: validated.maxAttempts,
      totalMarks: validated.totalMarks,
      passMark: validated.passMark,
      shuffleQuestions: validated.shuffleQuestions,
      shuffleOptions: validated.shuffleOptions,
      showResultsPolicy: validated.showResultsPolicy,
      negativeMarkingRatio: validated.negativeMarkingRatio,
      questions: {
        create: validated.questions.map((q, idx) => ({
          questionBankId: q.questionBankId,
          questionText: q.questionText,
          questionType: q.questionType,
          optionsJson: q.options ? JSON.stringify(q.options) : null,
          correctAnswerJson: JSON.stringify(q.correctAnswer),
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          sequenceOrder: q.sequenceOrder || (idx + 1),
        })),
      },
    },
    include: { questions: true },
  });

  // Automatically register in LMS Gradebook
  await db.lmsGradebookItem.create({
    data: {
      courseId: course.id,
      itemType: 'QUIZ',
      referenceId: quiz.id,
      title: quiz.title,
      maxScore: quiz.totalMarks,
      weightPercent: 10,
      isPublished: true,
    },
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CREATE',
    resourceType: 'QUIZ',
    newState: { quizId: quiz.id, title: quiz.title, totalMarks: quiz.totalMarks },
  });

  return quiz;
}

/**
 * Returns student-safe quiz view without correct answers
 */
export async function getQuizStudentView(tenantIdentifier: string, quizId: string) {
  const tenant = await requireTenant(tenantIdentifier);
  const quiz = await db.lmsQuiz.findFirst({
    where: { id: quizId, course: { institutionId: tenant.institutionId } },
    include: {
      questions: {
        orderBy: { sequenceOrder: 'asc' },
        select: {
          id: true,
          quizId: true,
          questionText: true,
          questionType: true,
          optionsJson: true,
          marks: true,
          sequenceOrder: true,
          // Correct answer is excluded for security!
        },
      },
    },
  });
  if (!quiz) throw AppError.notFound('Quiz not found.');

  return {
    ...quiz,
    questions: quiz.questions.map((q) => ({
      ...q,
      options: q.optionsJson ? JSON.parse(q.optionsJson) : null,
    })),
  };
}

export async function startQuizAttempt(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsQuizStartAttemptSchema.parse(rawData);

  const quiz = await db.lmsQuiz.findFirst({
    where: { id: validated.quizId, course: { institutionId: tenant.institutionId } },
    include: { questions: true },
  });
  if (!quiz) throw AppError.notFound('Quiz not found.');

  const now = new Date();
  if (now < quiz.openTime) {
    throw AppError.forbidden('This quiz has not opened yet.');
  }
  if (now > quiz.closeTime) {
    throw AppError.forbidden('This quiz has already closed.');
  }

  // Count prior attempts
  const priorAttempts = await db.lmsQuizAttempt.count({
    where: { quizId: quiz.id, studentId: validated.studentId },
  });

  if (priorAttempts >= quiz.maxAttempts) {
    throw AppError.badRequest(`Maximum allowed quiz attempts (${quiz.maxAttempts}) reached.`);
  }

  const nextAttemptNumber = priorAttempts + 1;
  const serverExpiryAt = new Date(now.getTime() + quiz.durationMinutes * 60 * 1000);

  const attempt = await db.lmsQuizAttempt.create({
    data: {
      quizId: quiz.id,
      studentId: validated.studentId,
      attemptNumber: nextAttemptNumber,
      startedAt: now,
      serverExpiryAt,
      status: 'IN_PROGRESS',
      totalMarks: quiz.totalMarks,
    },
  });

  // Log activity
  await db.lmsLearningActivityLog.create({
    data: {
      institutionId: tenant.institutionId,
      studentId: validated.studentId,
      courseId: quiz.courseId,
      activityType: 'QUIZ_ATTEMPTED',
      detailsJson: JSON.stringify({ quizId: quiz.id, attemptId: attempt.id, attemptNumber: nextAttemptNumber }),
    },
  });

  return attempt;
}

export async function submitQuizAttempt(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsQuizSubmitAttemptSchema.parse(rawData);

  const attempt = await db.lmsQuizAttempt.findFirst({
    where: { id: validated.attemptId, quiz: { course: { institutionId: tenant.institutionId } } },
    include: {
      quiz: { include: { questions: true } },
    },
  });
  if (!attempt) throw AppError.notFound('Quiz attempt not found.');

  if (attempt.status !== 'IN_PROGRESS') {
    throw AppError.conflict('This quiz attempt has already been submitted or completed.');
  }

  const now = new Date();
  // Server-side timing verification (with 30s network grace buffer)
  const isExpired = now.getTime() > (attempt.serverExpiryAt.getTime() + 30000);

  let totalScore = 0;
  let hasSubjectiveQuestions = false;

  for (const question of attempt.quiz.questions) {
    const studentAnswer = validated.answers[question.id];
    let isAutoGraded = false;
    let scoreAwarded = 0;

    const correctAnswer = JSON.parse(question.correctAnswerJson);

    if (question.questionType === 'MCQ_SINGLE' || question.questionType === 'TRUE_FALSE') {
      isAutoGraded = true;
      if (studentAnswer !== undefined && studentAnswer !== null) {
        if (String(studentAnswer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase()) {
          scoreAwarded = question.marks;
        } else if (attempt.quiz.negativeMarkingRatio > 0) {
          scoreAwarded = -(question.marks * attempt.quiz.negativeMarkingRatio);
        }
      }
    } else if (question.questionType === 'MCQ_MULTIPLE' && Array.isArray(correctAnswer)) {
      isAutoGraded = true;
      if (Array.isArray(studentAnswer)) {
        const sortedStudent = [...studentAnswer].sort().join(',');
        const sortedCorrect = [...correctAnswer].sort().join(',');
        if (sortedStudent === sortedCorrect) {
          scoreAwarded = question.marks;
        } else if (attempt.quiz.negativeMarkingRatio > 0) {
          scoreAwarded = -(question.marks * attempt.quiz.negativeMarkingRatio);
        }
      }
    } else if (question.questionType === 'SHORT_ANSWER' || question.questionType === 'FILL_BLANK') {
      if (typeof correctAnswer === 'string' && studentAnswer) {
        isAutoGraded = true;
        if (String(studentAnswer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase()) {
          scoreAwarded = question.marks;
        }
      } else {
        hasSubjectiveQuestions = true;
      }
    } else {
      // Subjective: ESSAY, LONG_ANSWER, FILE_RESPONSE
      hasSubjectiveQuestions = true;
    }

    totalScore += scoreAwarded;

    await db.lmsQuizResponse.create({
      data: {
        attemptId: attempt.id,
        questionId: question.id,
        studentAnswerJson: studentAnswer !== undefined ? JSON.stringify(studentAnswer) : null,
        isAutoGraded,
        scoreAwarded: Math.max(0, scoreAwarded),
      },
    });
  }

  const finalScore = Math.max(0, totalScore);
  const percentage = attempt.quiz.totalMarks > 0 ? (finalScore / attempt.quiz.totalMarks) * 100 : 0;
  const passed = finalScore >= attempt.quiz.passMark;
  const finalStatus = isExpired ? 'EXPIRED' : hasSubjectiveQuestions ? 'SUBMITTED' : 'GRADED';

  const updatedAttempt = await db.lmsQuizAttempt.update({
    where: { id: attempt.id },
    data: {
      submittedAt: now,
      scoreObtained: finalScore,
      percentage,
      passed,
      status: finalStatus,
    },
  });

  // If fully graded, update gradebook score
  if (finalStatus === 'GRADED') {
    const gradebookItem = await db.lmsGradebookItem.findFirst({
      where: { referenceId: attempt.quizId, itemType: 'QUIZ' },
    });

    if (gradebookItem) {
      const weightedScore = (finalScore / attempt.quiz.totalMarks) * gradebookItem.weightPercent;
      await db.lmsGradebookScore.upsert({
        where: {
          gradebookItemId_studentId: {
            gradebookItemId: gradebookItem.id,
            studentId: attempt.studentId,
          },
        },
        update: { scoreObtained: finalScore, finalWeightedScore: weightedScore },
        create: {
          gradebookItemId: gradebookItem.id,
          studentId: attempt.studentId,
          scoreObtained: finalScore,
          finalWeightedScore: weightedScore,
        },
      });
    }

    await recalculateCourseProgress(tenant.institutionId, attempt.quiz.courseId, attempt.studentId);
  }

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CREATE',
    resourceType: 'QUIZ',
    newState: { attemptId: attempt.id, scoreObtained: finalScore, status: finalStatus },
  });

  return updatedAttempt;
}

export async function gradeManualQuizResponse(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LmsQuizGradeResponseSchema.parse(rawData);

  const response = await db.lmsQuizResponse.findFirst({
    where: {
      attemptId: validated.attemptId,
      questionId: validated.questionId,
      attempt: { quiz: { course: { institutionId: tenant.institutionId } } },
    },
    include: {
      question: true,
      attempt: { include: { quiz: true } },
    },
  });
  if (!response) throw AppError.notFound('Quiz response not found.');

  if (validated.scoreAwarded > response.question.marks) {
    throw AppError.badRequest(`Score cannot exceed question marks (${response.question.marks}).`);
  }

  await db.lmsQuizResponse.update({
    where: { id: response.id },
    data: {
      scoreAwarded: validated.scoreAwarded,
      teacherComments: validated.teacherComments,
      gradedByEmployeeId: actor.id,
    },
  });

  // Re-sum total score for the attempt
  const allResponses = await db.lmsQuizResponse.findMany({
    where: { attemptId: response.attemptId },
  });
  const newTotal = allResponses.reduce((sum, r) => sum + r.scoreAwarded, 0);
  const percentage = (newTotal / response.attempt.quiz.totalMarks) * 100;
  const passed = newTotal >= response.attempt.quiz.passMark;

  const updatedAttempt = await db.lmsQuizAttempt.update({
    where: { id: response.attemptId },
    data: {
      scoreObtained: newTotal,
      percentage,
      passed,
      status: 'GRADED',
    },
  });

  return updatedAttempt;
}
