import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { resolveTenantContext } from '@/lib/tenant/tenant-guard';
import { submitAdmissionTest } from '@/lib/services/admission-service';
import { getTenantAdmissionTests, getAdmissionTestForCandidate, createAdmissionTest } from '@/lib/services/admission-test-service';
import { successResponse, errorResponse } from '@/lib/errors/api-response';
import { AppError } from '@/lib/errors/app-error';
import { requirePermission } from '@/lib/rbac/guard';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || searchParams.get('tenantId');
    const testId = searchParams.get('testId');
    const session = await getServerSession(req);

    const tenantContext = await resolveTenantContext({
      session,
      tenantSlug,
      isPublic: !session
    });

    if (testId) {
      const test = await getAdmissionTestForCandidate(tenantContext.tenantId, testId);
      return successResponse(test);
    }

    const tests = await getTenantAdmissionTests(tenantContext.tenantId);
    return successResponse(tests);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await getServerSession(req);
    const { action, tenantSlug, tenantId, ...data } = body;

    const tenantContext = await resolveTenantContext({
      session,
      tenantSlug: tenantSlug || tenantId,
      isPublic: !session
    });

    if (action === 'CREATE_TEST') {
      if (!session) throw AppError.unauthenticated();
      requirePermission(session, 'CREATE', 'SETTINGS');
      const test = await createAdmissionTest(tenantContext.tenantId, data, session);
      return successResponse(test, 'Admission test created successfully', 201);
    }

    // Candidate test submission
    const result = await submitAdmissionTest(tenantContext.tenantId, body);
    return successResponse(result, 'Admission test evaluated and recorded successfully');
  } catch (err) {
    return errorResponse(err);
  }
}
