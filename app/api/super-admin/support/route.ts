import { NextRequest, NextResponse } from 'next/server';
import { getSupportAnalytics } from '@/lib/client-success/ticket-service';
import { requirePlatformPermission } from '@/lib/rbac/platform-guard';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    requirePlatformPermission(session, 'SUPPORT_TICKET_VIEW');

    const analytics = await getSupportAnalytics();
    return NextResponse.json({ success: true, data: analytics });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
