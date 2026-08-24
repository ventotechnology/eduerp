import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePermission } from '@/lib/rbac/guard';
import { requireTenantLimit } from '@/lib/rbac/entitlement-guard';
import { resolveTenantContext } from '@/lib/tenant/tenant-guard';
import { getTenantStudents, createTenantStudent } from '@/lib/services/student-service';
import { successResponse, errorResponse } from '@/lib/errors/api-response';
import { AppError } from '@/lib/errors/app-error';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) throw AppError.unauthenticated();
    requirePermission(session, 'VIEW', 'STUDENTS');

    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || searchParams.get('tenantId');
    const tenantContext = await resolveTenantContext({ session, tenantSlug });

    const result = await getTenantStudents(tenantContext.tenantId, {
      search: searchParams.get('search') || undefined,
      classId: searchParams.get('classId') || undefined,
      sectionId: searchParams.get('sectionId') || undefined,
      campusId: searchParams.get('campusId') || undefined,
      academicYearId: searchParams.get('academicYearId') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!, 10) : 20
    });

    return successResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) throw AppError.unauthenticated();
    requirePermission(session, 'CREATE', 'STUDENTS');

    const body = await req.json();
    const tenantContext = await resolveTenantContext({
      session,
      tenantSlug: body.tenantSlug || body.tenantId
    });

    if (!session.isPlatformAdmin && tenantContext.tenantId) {
      await requireTenantLimit(tenantContext.tenantId, 'STUDENTS');
    }

    const student = await createTenantStudent(tenantContext.tenantId, body, session);
    return successResponse(student, 'Student record created successfully with academic enrollment', 201);
  } catch (err) {
    return errorResponse(err);
  }
}
