import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePermission } from '@/lib/rbac/guard';
import { recordAttendanceSession, getStudentAttendanceRate } from '@/lib/services/attendance-service';
import { successResponse, errorResponse } from '@/lib/errors/api-response';
import { AppError } from '@/lib/errors/app-error';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) throw AppError.unauthenticated();
    requirePermission(session, 'VIEW', 'ATTENDANCE');

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const tenantId = searchParams.get('tenantId') || session.tenantId;

    if (!studentId || !tenantId) {
      throw AppError.validation('Student ID and Tenant ID are required.');
    }

    const rate = await getStudentAttendanceRate(tenantId, studentId);
    return successResponse(rate);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) throw AppError.unauthenticated();
    requirePermission(session, 'CREATE', 'ATTENDANCE');

    const body = await req.json();
    const tenantId = body.tenantId || session.tenantId;
    if (!tenantId) throw AppError.notFound('Tenant context required.');

    const attendanceSession = await recordAttendanceSession(tenantId, body, session);
    return successResponse(attendanceSession, 'Attendance session saved successfully', 201);
  } catch (err) {
    return errorResponse(err);
  }
}
