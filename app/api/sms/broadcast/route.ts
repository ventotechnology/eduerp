import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { SmsGatewayService } from '@/lib/services/sms/sms-gateway.service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session || !session.tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Active tenant session required.' }, { status: 401 });
    }

    const body = await request.json();
    const { audienceType, message, customRecipients, classId, sectionId } = body;

    if (!audienceType || !message) {
      return NextResponse.json({ success: false, error: 'Audience type and message content are required.' }, { status: 400 });
    }

    const result = await SmsGatewayService.sendBroadcast({
      tenantId: session.tenantId,
      audienceType,
      message,
      customRecipients,
      classId,
      sectionId,
      requestedBy: session.name || session.email || 'Staff User',
      requestedByRole: session.role
    });

    return NextResponse.json({
      success: true,
      broadcast: result
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 500 });
  }
}
