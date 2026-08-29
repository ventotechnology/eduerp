import { db } from '@/lib/db';

export interface VenominLogEventInput {
  operation: string;
  status: 'SUCCESS' | 'FAILURE' | 'PENDING' | 'WARN';
  actorId?: string;
  safeMessage: string;
  metadata?: Record<string, unknown>;
  errorCode?: string;
}

/**
 * Sanitizes telemetry metadata to ensure zero student PII, child data,
 * guardian details, grades, attendance, exam scores, or teacher salaries are logged.
 */
function sanitizeEducationTelemetry(metadata?: Record<string, unknown>): Record<string, unknown> {
  if (!metadata) return {};
  const sanitized: Record<string, unknown> = {};

  const forbiddenKeys = [
    'student',
    'child',
    'minor',
    'guardian',
    'parent',
    'dob',
    'birthdate',
    'grade',
    'gpa',
    'exam',
    'score',
    'attendance',
    'salary',
    'payroll',
    'teacher',
    'password',
    'secret',
    'token',
  ];

  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    const isForbidden = forbiddenKeys.some((f) => lowerKey.includes(f) && !lowerKey.includes('count'));
    if (!isForbidden) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Logs a Venomin integration event to PostgreSQL audit trail in EduERP
 */
export async function logVenominIntegrationEvent(input: VenominLogEventInput): Promise<void> {
  try {
    const cleanMeta = sanitizeEducationTelemetry(input.metadata);

    await db.venominIntegrationLog.create({
      data: {
        operation: input.operation,
        status: input.status,
        actorId: input.actorId || 'SYSTEM',
        safeMessage: input.safeMessage,
        errorCode: input.errorCode || null,
        metadata: cleanMeta as any,
      },
    });
  } catch {
    // Non-blocking fallback
  }
}
