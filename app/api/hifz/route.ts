import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePermission } from '@/lib/rbac/guard';
import { recordDailyHifzProgress, getStudentHifzHistory } from '@/lib/services/hifz-service';
import { successResponse, errorResponse } from '@/lib/errors/api-response';
import { AppError } from '@/lib/errors/app-error';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) throw AppError.unauthenticated();
    requirePermission(session, 'VIEW', 'HIFZ_TRACKER');

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const tenantId = searchParams.get('tenantId') || session.tenantId;

    if (!studentId || !tenantId) throw AppError.validation('Student ID and Tenant ID are required.');

    const history = await getStudentHifzHistory(tenantId, studentId);
    return successResponse(history);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) throw AppError.unauthenticated();
    requirePermission(session, 'CREATE', 'HIFZ_TRACKER');

    const body = await req.json();
    const tenantId = body.tenantId || session.tenantId;
    if (!tenantId) throw AppError.notFound('Tenant context required.');

    const entry = await recordDailyHifzProgress(tenantId, body, session);
    return successResponse(entry, 'Hifz daily progress recorded successfully', 201);
  } catch (err) {
    return errorResponse(err);
  }
}
