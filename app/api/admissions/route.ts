import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePermission } from '@/lib/rbac/guard';
import {
  createAdmissionApplication,
  getTenantAdmissionApplications,
  transitionAdmissionStatus,
  convertApplicantToStudent
} from '@/lib/services/admission-service';
import { successResponse, errorResponse } from '@/lib/errors/api-response';
import { AppError } from '@/lib/errors/app-error';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) throw AppError.unauthenticated();
    requirePermission(session, 'VIEW', 'ADMISSION');

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId') || session.tenantId;

    if (!tenantId) throw AppError.notFound('Tenant context required.');
    if (!session.isPlatformAdmin && session.tenantId !== tenantId) throw AppError.crossTenant();

    const applications = await getTenantAdmissionApplications(tenantId, searchParams.get('status') || undefined);
    return successResponse(applications);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, tenantId, applicationId, sectionId, targetStatus } = body;

    // Public Application Submission (no session required)
    if (!action || action === 'APPLY') {
      const application = await createAdmissionApplication(tenantId || 'dhaka-ideal-school', body);
      return successResponse(application, 'Admission application submitted successfully', 201);
    }

    // Authenticated Actions
    const session = await getServerSession(req);
    if (!session) throw AppError.unauthenticated();

    if (action === 'TRANSITION_STATUS') {
      requirePermission(session, 'APPROVE', 'ADMISSION');
      const updated = await transitionAdmissionStatus(
        tenantId || session.tenantId!,
        applicationId,
        targetStatus,
        session
      );
      return successResponse(updated, `Status updated to ${targetStatus}`);
    }

    if (action === 'CONVERT_TO_STUDENT') {
      requirePermission(session, 'APPROVE', 'ADMISSION');
      const student = await convertApplicantToStudent(
        tenantId || session.tenantId!,
        applicationId,
        sectionId || null,
        session
      );
      return successResponse(student, 'Applicant successfully enrolled as active student', 201);
    }

    throw AppError.validation('Unsupported admission action');
  } catch (err) {
    return errorResponse(err);
  }
}
