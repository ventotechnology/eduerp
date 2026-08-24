import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePermission } from '@/lib/rbac/guard';
import {
  getTenantTimetableEntries,
  createTimetableEntry,
  deleteTimetableEntry
} from '@/lib/services/timetable-service';
import { successResponse, errorResponse } from '@/lib/errors/api-response';
import { AppError } from '@/lib/errors/app-error';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const sectionId = searchParams.get('sectionId') || undefined;
    const courseOfferingId = searchParams.get('courseOfferingId') || undefined;
    const teacherId = searchParams.get('teacherId') || undefined;
    const classroomId = searchParams.get('classroomId') || undefined;
    const dayOfWeek = searchParams.get('dayOfWeek') || undefined;

    if (!tenantId) throw AppError.validation('Tenant ID is required.');

    const entries = await getTenantTimetableEntries(tenantId, {
      sectionId,
      courseOfferingId,
      teacherId,
      classroomId,
      dayOfWeek
    });

    return successResponse(entries);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) throw AppError.unauthenticated();
    requirePermission(session, 'CREATE', 'ACADEMICS');

    const body = await req.json();
    const { tenantId, ...data } = body;
    const resolvedTenant = tenantId || session.tenantId;

    if (!resolvedTenant) throw AppError.notFound('Tenant context is required.');
    if (!session.isPlatformAdmin && session.tenantId !== resolvedTenant) throw AppError.crossTenant();

    const entry = await createTimetableEntry(resolvedTenant, data, session);
    return successResponse(entry, 'Timetable slot created successfully with 0 conflicts', 201);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) throw AppError.unauthenticated();
    requirePermission(session, 'DELETE', 'ACADEMICS');

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const tenantId = searchParams.get('tenantId') || session.tenantId;

    if (!id) throw AppError.validation('Timetable Entry ID is required.');
    if (!tenantId) throw AppError.notFound('Tenant context is required.');
    if (!session.isPlatformAdmin && session.tenantId !== tenantId) throw AppError.crossTenant();

    const result = await deleteTimetableEntry(tenantId, id, session);
    return successResponse(result, 'Timetable entry removed successfully');
  } catch (err) {
    return errorResponse(err);
  }
}
