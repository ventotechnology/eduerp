import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePermission } from '@/lib/rbac/guard';
import { resolveTenantContext } from '@/lib/tenant/tenant-guard';
import { getTenantStudentById, updateTenantStudent } from '@/lib/services/student-service';
import { successResponse, errorResponse } from '@/lib/errors/api-response';
import { AppError } from '@/lib/errors/app-error';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(req);
    if (!session) throw AppError.unauthenticated();
    requirePermission(session, 'VIEW', 'STUDENTS');

    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || searchParams.get('tenantId');
    const tenantContext = await resolveTenantContext({ session, tenantSlug });

    const student = await getTenantStudentById(tenantContext.tenantId, params.id);
    return successResponse(student);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(req);
    if (!session) throw AppError.unauthenticated();
    requirePermission(session, 'UPDATE', 'STUDENTS');

    const body = await req.json();
    const tenantContext = await resolveTenantContext({
      session,
      tenantSlug: body.tenantSlug || body.tenantId
    });

    const updated = await updateTenantStudent(tenantContext.tenantId, params.id, body, session);
    return successResponse(updated, 'Student profile updated successfully');
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  return PUT(req, props);
}
