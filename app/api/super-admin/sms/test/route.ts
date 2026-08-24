import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePlatformPermission } from '@/lib/rbac/platform-guard';
import { SmsGatewayService } from '@/lib/services/sms/sms-gateway.service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    requirePlatformPermission(session, 'GATEWAY_MANAGE');

    const body = await request.json();
    const { providerId } = body;

    if (!providerId) {
      return NextResponse.json({ success: false, error: 'Provider ID is required.' }, { status: 400 });
    }

    const result = await SmsGatewayService.testProvider(providerId);

    return NextResponse.json({
      success: result.status === 'CONNECTED',
      result
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
