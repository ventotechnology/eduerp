import { db } from '../db';
import { AppError } from '../errors/app-error';
import { logAuditEvent } from '../audit/audit-logger';
import { HifzDailyEntrySchema } from '../validations/schemas';
import { SessionUser } from '../auth/types';
import { requireTenant } from '../tenant/tenant-guard';

/**
 * Appends a daily 30-Para Hifzul Quran record maintaining historical log.
 */
export async function recordDailyHifzProgress(tenantIdentifier: string, rawData: any, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = HifzDailyEntrySchema.parse(rawData);

  const student = await db.student.findFirst({
    where: {
      id: validated.studentId,
      campus: { institutionId: tenant.institutionId }
    }
  });

  if (!student) {
    throw AppError.notFound('Madrasha student not found.');
  }

  const entry = await db.hifzDailyRecord.create({
    data: {
      studentId: student.id,
      date: new Date(validated.date),
      sabakPara: validated.sabakPara || null,
      sabakSurah: validated.sabakSurah || null,
      sabakAyatStart: validated.sabakAyatStart || null,
      sabakAyatEnd: validated.sabakAyatEnd || null,
      sabakGrade: validated.sabakGrade || 'Very Good',
      sabkiPara: validated.sabkiPara || null,
      sabkiPages: validated.sabkiPages || null,
      sabkiGrade: validated.sabkiGrade || null,
      dourParaStart: validated.dourParaStart || null,
      dourParaEnd: validated.dourParaEnd || null,
      dourGrade: validated.dourGrade || null,
      totalParasMemorized: validated.totalParasMemorized,
      teacherNotes: validated.teacherNotes || null,
      evaluatedBy: actor.name
    }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'HIFZ_DAILY_PROGRESS_RECORDED',
    resourceType: 'HifzDailyRecord',
    resourceId: entry.id,
    newState: {
      studentId: student.id,
      date: validated.date,
      sabakPara: validated.sabakPara,
      totalParasMemorized: validated.totalParasMemorized
    }
  });

  return entry;
}

/**
 * Retrieves historical Hifz log for a student.
 */
export async function getStudentHifzHistory(tenantIdentifier: string, studentId: string) {
  const tenant = await requireTenant(tenantIdentifier);

  const student = await db.student.findFirst({
    where: {
      id: studentId,
      campus: { institutionId: tenant.institutionId }
    }
  });

  if (!student) {
    throw AppError.notFound('Student not found.');
  }

  return db.hifzDailyRecord.findMany({
    where: { studentId },
    orderBy: { date: 'desc' }
  });
}
