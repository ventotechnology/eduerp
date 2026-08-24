import { db } from '../db';
import { AppError } from '../errors/app-error';
import { logAuditEvent } from '../audit/audit-logger';
import { SessionUser } from '../auth/types';
import { requireTenant } from '../tenant/tenant-guard';

export interface AdmissionTestCreateInput {
  title: string;
  durationMinutes?: number;
  totalMarks?: number;
  passMarks?: number;
  questions: Array<{
    id: string;
    text: string;
    options: string[];
    correct: string;
    marks?: number;
  }>;
}

/**
 * Retrieves all active admission tests for an institution.
 */
export async function getTenantAdmissionTests(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);

  const tests = await db.admissionTest.findMany({
    where: {
      institutionId: tenant.institutionId,
      isActive: true
    },
    include: {
      attempts: {
        take: 10,
        orderBy: { submittedAt: 'desc' }
      }
    },
    orderBy: { title: 'asc' }
  });

  return tests.map((t) => {
    let questions = [];
    try {
      questions = JSON.parse(t.questionsJson);
    } catch {
      questions = [];
    }
    return {
      ...t,
      questionCount: questions.length,
      // For security, do not expose correct answers to public candidate lists
      questions: questions.map((q: any) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        marks: q.marks
      }))
    };
  });
}

/**
 * Retrieves a specific test by ID for candidate exam taking.
 */
export async function getAdmissionTestForCandidate(tenantIdentifier: string, testId: string) {
  const tenant = await requireTenant(tenantIdentifier);

  const test = await db.admissionTest.findFirst({
    where: {
      id: testId,
      institutionId: tenant.institutionId,
      isActive: true
    }
  });

  if (!test) {
    throw AppError.notFound('Admission test not found or is currently inactive.');
  }

  let questions = [];
  try {
    questions = JSON.parse(test.questionsJson);
  } catch {
    questions = [];
  }

  return {
    id: test.id,
    title: test.title,
    durationMinutes: test.durationMinutes,
    totalMarks: test.totalMarks,
    passMarks: test.passMarks,
    questions: questions.map((q: any) => ({
      id: q.id,
      text: q.text,
      options: q.options,
      marks: q.marks
    }))
  };
}

/**
 * Creates a persistent admission test for the institution.
 */
export async function createAdmissionTest(
  tenantIdentifier: string,
  input: AdmissionTestCreateInput,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);

  if (!input.title || !input.title.trim()) {
    throw AppError.validation('Test title is required.');
  }

  if (!Array.isArray(input.questions) || input.questions.length === 0) {
    throw AppError.validation('At least one question is required for the admission test.');
  }

  const test = await db.admissionTest.create({
    data: {
      institutionId: tenant.institutionId,
      title: input.title.trim(),
      durationMinutes: input.durationMinutes || 30,
      totalMarks: input.totalMarks || (input.questions.length * 10),
      passMarks: input.passMarks || Math.round((input.questions.length * 10) * 0.4),
      questionsJson: JSON.stringify(input.questions),
      isActive: true
    }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'ADMISSION_TEST_CREATED',
    resourceType: 'AdmissionTest',
    resourceId: test.id,
    newState: { title: test.title, totalMarks: test.totalMarks, questionCount: input.questions.length }
  });

  return test;
}
