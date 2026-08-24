import { NextRequest, NextResponse } from 'next/server';
import { SaasPlanService } from '@/lib/services/saas-plan.service';
import { getServerSession } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');

    if (scope === 'admin') {
      const session = await getServerSession(request);
      if (!session?.isPlatformAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 403 });
      }
      const plans = await SaasPlanService.getAllPlansAdmin();
      return NextResponse.json({ success: true, plans });
    }

    // Public active plans
    const plans = await SaasPlanService.getPublicPlans();
    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.isPlatformAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const plan = await SaasPlanService.updatePlan(body.id, body);
    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.isPlatformAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const plan = await SaasPlanService.updatePlan(body.id, body);
    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
