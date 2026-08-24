import { NextRequest, NextResponse } from 'next/server';
import { submitTicketCsat } from '@/lib/client-success/ticket-service';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketNumber: string }> }
) {
  try {
    const { ticketNumber } = await params;
    const session = await getAuthSession(request);
    if (!session?.authenticated) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const { rating, comment } = body;

    const csat = await submitTicketCsat(
      ticketNumber,
      { rating, comment },
      { userId: session.userId, tenantId: session.tenantId }
    );

    return NextResponse.json({ success: true, data: csat });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
