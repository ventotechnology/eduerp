import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateVenominIntegrationAuth } from '@/lib/venomin/integration-auth';
import { sanitizeIntegrationPayload } from '@/lib/venomin/sanitizer';

export const dynamic = 'force-dynamic';

const ALLOWED_RECORD_TYPES = new Set([
  'INSTITUTION',
  'ORGANIZATION',
  'TENANT',
  'SUBSCRIPTION',
  'SUPPORT_TICKET',
  'IMPLEMENTATION',
  'SYSTEM_INCIDENT',
]);

const FORBIDDEN_RECORD_TYPES = new Set([
  'STUDENT',
  'GUARDIAN',
  'PARENT',
  'APPLICANT',
  'ADMISSION',
  'ENROLLMENT',
  'ATTENDANCE',
  'EXAM',
  'GRADE',
  'RESULT',
  'TRANSCRIPT',
  'ASSESSMENT',
  'DISCIPLINARY_RECORD',
  'STUDENT_FEE',
  'STUDENT_PAYMENT',
  'MEDICAL_RECORD',
  'BIOMETRIC',
  'TEACHER_PRIVATE_RECORD',
  'EMPLOYEE_PAYROLL',
]);

export async function GET(req: NextRequest) {
  const auth = await validateVenominIntegrationAuth(req);
  if (!auth.authenticated) {
    return NextResponse.json(
      { status: 'UNAUTHORIZED', error: auth.error, message: auth.message },
      { status: auth.status }
    );
  }

  const { searchParams } = new URL(req.url);
  const rawType = searchParams.get('type') || searchParams.get('recordType') || '';
  const recordType = rawType.toUpperCase().trim();
  const recordId = searchParams.get('id') || searchParams.get('recordId') || '';

  if (!recordType || !recordId) {
    return NextResponse.json(
      { status: 'BAD_REQUEST', error: 'MISSING_PARAMETERS', message: 'Parameters type and id are required.' },
      { status: 400 }
    );
  }

  if (FORBIDDEN_RECORD_TYPES.has(recordType)) {
    return NextResponse.json(
      {
        status: 'FORBIDDEN',
        error: 'STUDENT_OR_ACADEMIC_RECORD_ACCESS_DENIED',
        message: `Direct snapshot access to ${recordType} records is strictly forbidden by privacy policy.`,
      },
      { status: 403 }
    );
  }

  if (!ALLOWED_RECORD_TYPES.has(recordType)) {
    return NextResponse.json(
      { status: 'NOT_FOUND', error: 'UNSUPPORTED_RECORD_TYPE', message: `Record type ${recordType} is not supported.` },
      { status: 404 }
    );
  }

  try {
    let record: any = null;

    switch (recordType) {
      case 'TENANT':
      case 'ORGANIZATION': {
        record = await db.tenant.findFirst({
          where: { OR: [{ id: recordId }, { slug: recordId }] },
          include: {
            institution: true,
            subscriptions: { where: { status: 'ACTIVE' }, take: 1, include: { plan: true } },
          },
        });
        break;
      }
      case 'INSTITUTION': {
        record = await db.institution.findFirst({
          where: { OR: [{ id: recordId }, { tenantId: recordId }] },
          include: { tenant: true, campuses: true },
        });
        break;
      }
      case 'SUBSCRIPTION': {
        record = await db.subscription.findFirst({
          where: { OR: [{ id: recordId }, { tenantId: recordId }] },
          include: { plan: true, tenant: true },
        });
        break;
      }
      case 'SUPPORT_TICKET': {
        record = await db.supportTicket.findFirst({
          where: { OR: [{ id: recordId }, { ticketNumber: recordId }] },
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
            categoryCode: true,
            priority: true,
            status: true,
            tenantId: true,
            institutionId: true,
            firstResponseDueAt: true,
            resolutionDueAt: true,
            resolvedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        break;
      }
      default:
        record = null;
    }

    if (!record) {
      return NextResponse.json(
        { status: 'NOT_FOUND', error: 'RECORD_NOT_FOUND', message: `Record of type ${recordType} with ID ${recordId} was not found.` },
        { status: 404 }
      );
    }

    const safeData = sanitizeIntegrationPayload(record);

    return NextResponse.json({
      status: 'SUCCESS',
      recordType,
      recordId,
      data: safeData,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'INTERNAL_ERROR', error: 'SNAPSHOT_QUERY_FAILED', message: err?.message || 'Database query failed.' },
      { status: 500 }
    );
  }
}
