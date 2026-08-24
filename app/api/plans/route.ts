import { NextRequest, NextResponse } from 'next/server';
import { SaasPlanService } from '@/lib/services/saas-plan.service';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePlatformPermission } from '@/lib/rbac/platform-guard';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');

    if (scope === 'admin') {
      const session = await getServerSession(request);
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
      }
      requirePlatformPermission(session, 'PLAN_VIEW');
      const plans = await SaasPlanService.getAllPlansAdmin();
      return NextResponse.json({ success: true, plans });
    }

    // Public active plans
    const plans = await SaasPlanService.getPublicPlans();
    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }
    requirePlatformPermission(session, 'PLAN_CREATE');

    const body = await request.json();
    const { action, sourcePlanId, newCode, newName, ...planData } = body;

    if (action === 'CLONE' && sourcePlanId && newCode && newName) {
      const plan = await SaasPlanService.clonePlan(sourcePlanId, newCode, newName);
      return NextResponse.json({ success: true, plan });
    }

    const plan = await SaasPlanService.createPlan(planData);
    return NextResponse.json({ success: true, plan }, { status: 201 });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }
    requirePlatformPermission(session, 'PLAN_UPDATE');

    const body = await request.json();
    const plan = await SaasPlanService.updatePlan(body.id, body);
    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }
    requirePlatformPermission(session, 'PLAN_ARCHIVE');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Plan ID is required' }, { status: 400 });
    }

    await SaasPlanService.deletePlan(id);
    return NextResponse.json({ success: true, message: 'Plan deleted or archived successfully' });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
