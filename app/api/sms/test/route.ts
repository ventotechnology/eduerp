import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { SmsGatewayService } from '@/lib/services/sms/sms-gateway.service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session || !session.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { providerId } = body;

    if (!providerId) {
      // Test the resolved active provider for this tenant
      const resolution = await SmsGatewayService.resolveTenantSmsProvider(session.tenantId);
      if (!resolution.provider) {
        return NextResponse.json({
          success: false,
          error: `SMS Gateway is not configured (Status: ${resolution.status}).`
        }, { status: 400 });
      }

      const res = await SmsGatewayService.testProvider(resolution.provider.id);
      return NextResponse.json({ success: res.status === 'CONNECTED', result: res });
    }

    const res = await SmsGatewayService.testProvider(providerId);
    return NextResponse.json({ success: res.status === 'CONNECTED', result: res });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
