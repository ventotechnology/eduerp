import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { TenantOnboardingService } from '@/lib/services/tenant-onboarding.service';
import { AppError } from '@/lib/errors/app-error';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session || !session.tenantId) {
      return NextResponse.json({ success: false, error: 'Authentication and tenant context required.' }, { status: 401 });
    }

    const data = await TenantOnboardingService.getOnboardingProgress(session.tenantId);
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch onboarding progress.' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session || !session.tenantId) {
      return NextResponse.json({ success: false, error: 'Authentication and tenant context required.' }, { status: 401 });
    }

    const body = await req.json();
    const { action, stepNumber, templateType } = body;

    if (action === 'COMPLETE_STEP') {
      if (typeof stepNumber !== 'number') {
        return NextResponse.json({ success: false, error: 'Valid stepNumber is required.' }, { status: 400 });
      }
      const progress = await TenantOnboardingService.completeStep(session.tenantId, stepNumber, body.data);
      return NextResponse.json({ success: true, progress });
    }

    if (action === 'APPLY_TEMPLATE') {
      if (!templateType) {
        return NextResponse.json({ success: false, error: 'templateType is required.' }, { status: 400 });
      }
      const result = await TenantOnboardingService.applyAcademicTemplate(session.tenantId, templateType);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: `Unsupported action '${action}'` }, { status: 400 });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ success: false, error: error.message || 'Failed to process onboarding action.' }, { status });
  }
}
