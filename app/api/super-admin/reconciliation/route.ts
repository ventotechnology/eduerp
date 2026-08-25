import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePlatformPermission } from '@/lib/rbac/platform-guard';
import { PaymentReconciliationService } from '@/lib/services/payment-reconciliation.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin session required' }, { status: 401 });
    }
    requirePlatformPermission(session, 'PAYMENT_MANAGE');

    const { searchParams } = new URL(request.url);
    const scope = (searchParams.get('scope') as 'PLATFORM' | 'TENANT') || 'PLATFORM';
    const gateway = searchParams.get('gateway') || undefined;
    const tenantId = searchParams.get('tenantId') || undefined;
    const status = searchParams.get('status') || undefined;

    const data = await PaymentReconciliationService.getReconciliationDashboard({
      scope,
      gateway,
      tenantId,
      status
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve reconciliation data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin session required' }, { status: 401 });
    }
    requirePlatformPermission(session, 'PAYMENT_MANAGE');

    const body = await request.json();
    const { action } = body;

    if (action === 'RUN_RECONCILIATION') {
      const { scope = 'PLATFORM', gateway, startDate, endDate, externalSettlements } = body;
      const result = await PaymentReconciliationService.runReconciliation({
        scope,
        gateway: gateway === 'ALL' ? undefined : gateway,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        externalSettlements
      });

      return NextResponse.json(result);
    }

    if (action === 'RESOLVE_DISCREPANCY') {
      const { recordId, status, notes } = body;
      if (!recordId || !status) {
        return NextResponse.json({ success: false, error: 'Record ID and resolution status are required.' }, { status: 400 });
      }

      const updated = await PaymentReconciliationService.resolveDiscrepancy(recordId, {
        status,
        notes: notes || 'Resolved by Super Admin',
        resolvedBy: session.email || session.name || 'SUPER_ADMIN'
      });

      return NextResponse.json({ success: true, record: updated });
    }

    return NextResponse.json({ success: false, error: 'Invalid reconciliation action.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Reconciliation action failed.'
    }, { status: 500 });
  }
}
