import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePermission } from '@/lib/rbac/guard';
import { resolveTenantContext } from '@/lib/tenant/tenant-guard';
import {
  createAdmissionApplication,
  getTenantAdmissionApplications,
  getAdmissionApplicationById,
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
    const tenantSlug = searchParams.get('tenantSlug') || searchParams.get('tenantId');
    const tenantContext = await resolveTenantContext({ session, tenantSlug });

    const applicationId = searchParams.get('id');
    if (applicationId) {
      const application = await getAdmissionApplicationById(tenantContext.tenantId, applicationId);
      return successResponse(application);
    }

    const applications = await getTenantAdmissionApplications(tenantContext.tenantId, {
      status: searchParams.get('status') || undefined,
      campusId: searchParams.get('campusId') || undefined,
      classId: searchParams.get('classId') || undefined,
      programId: searchParams.get('programId') || undefined,
      academicYearId: searchParams.get('academicYearId') || undefined,
      search: searchParams.get('search') || undefined
    });

    return successResponse(applications);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, tenantSlug, tenantId, applicationId, sectionId, targetStatus, notes, interviewScore, customRollNumber } = body;

    // 1. Public or Direct Application Submission
    if (!action || action === 'APPLY') {
      const session = await getServerSession(req);
      const identifier = tenantSlug || tenantId;
      const tenantContext = await resolveTenantContext({
        session,
        tenantSlug: identifier,
        isPublic: !session
      });

      const application = await createAdmissionApplication(tenantContext.tenantId, body, session || undefined);
      return successResponse(application, 'Admission application submitted successfully', 201);
    }

    // 2. Authenticated Administrative Actions
    const session = await getServerSession(req);
    if (!session) throw AppError.unauthenticated();

    const tenantContext = await resolveTenantContext({
      session,
      tenantSlug: tenantSlug || tenantId
    });

    if (action === 'TRANSITION_STATUS') {
      requirePermission(session, 'APPROVE', 'ADMISSION');
      if (!applicationId || !targetStatus) {
        throw AppError.validation('applicationId and targetStatus are required for status transition.');
      }
      const updated = await transitionAdmissionStatus(
        tenantContext.tenantId,
        applicationId,
        targetStatus,
        session,
        notes,
        interviewScore
      );
      return successResponse(updated, `Status updated to ${targetStatus}`);
    }

    if (action === 'CONVERT_TO_STUDENT') {
      requirePermission(session, 'APPROVE', 'ADMISSION');
      if (!applicationId) {
        throw AppError.validation('applicationId is required to admit student.');
      }
      const result = await convertApplicantToStudent(
        tenantContext.tenantId,
        applicationId,
        sectionId || null,
        session,
        {
          customRollNumber,
          createPortalAccount: body.createPortalAccount,
          createGuardianAccount: body.createGuardianAccount
        }
      );
      return successResponse(result, 'Applicant successfully enrolled as active student', 201);
    }

    throw AppError.validation(`Unsupported admission action '${action}'`);
  } catch (err) {
    return errorResponse(err);
  }
}
