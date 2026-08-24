import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePermission } from '@/lib/rbac/guard';
import { resolveTenantContext } from '@/lib/tenant/tenant-guard';
import { getAdmissionSettings, updateAdmissionSettings } from '@/lib/services/admission-service';
import { successResponse, errorResponse } from '@/lib/errors/api-response';
import { AppError } from '@/lib/errors/app-error';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || searchParams.get('tenantId');
    const session = await getServerSession(req);

    const tenantContext = await resolveTenantContext({
      session,
      tenantSlug,
      isPublic: !session
    });

    const settings = await getAdmissionSettings(tenantContext.tenantId);
    return successResponse(settings);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) throw AppError.unauthenticated();
    requirePermission(session, 'UPDATE', 'SETTINGS');

    const body = await req.json();
    const tenantContext = await resolveTenantContext({
      session,
      tenantSlug: body.tenantSlug || body.tenantId
    });

    const updated = await updateAdmissionSettings(tenantContext.tenantId, body, session);
    return successResponse(updated, 'Admission settings updated successfully');
  } catch (err) {
    return errorResponse(err);
  }
}
