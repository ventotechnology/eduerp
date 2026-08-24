import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePermission } from '@/lib/rbac/guard';
import { registerUniversityCourse, dropUniversityCourse } from '@/lib/services/course-registration-service';
import { successResponse, errorResponse } from '@/lib/errors/api-response';
import { AppError } from '@/lib/errors/app-error';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) throw AppError.unauthenticated();

    const body = await req.json();
    const { studentId, courseId, semester, tenantId } = body;
    const resolvedTenantId = tenantId || session.tenantId;

    if (!resolvedTenantId) throw AppError.notFound('Tenant context required.');

    const registration = await registerUniversityCourse(
      resolvedTenantId,
      studentId,
      courseId,
      semester,
      session
    );

    return successResponse(registration, 'Course enrolled successfully', 201);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) throw AppError.unauthenticated();

    const body = await req.json();
    const { studentId, registrationId, tenantId } = body;
    const resolvedTenantId = tenantId || session.tenantId;

    if (!resolvedTenantId) throw AppError.notFound('Tenant context required.');

    const result = await dropUniversityCourse(resolvedTenantId, studentId, registrationId, session);
    return successResponse(result, 'Course dropped successfully');
  } catch (err) {
    return errorResponse(err);
  }
}
