import { NextRequest, NextResponse } from 'next/server';
import {
  getSupportTicket,
  addTicketMessage,
  updateTicketStatus,
  assignTicket
} from '@/lib/client-success/ticket-service';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketNumber: string }> }
) {
  try {
    const { ticketNumber } = await params;
    const session = await getAuthSession(request);
    if (!session?.authenticated) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const ticket = await getSupportTicket(ticketNumber, {
      userId: session.userId,
      tenantId: session.tenantId,
      isPlatformAdmin: session.isPlatformAdmin
    });

    return NextResponse.json({ success: true, data: ticket });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

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
    const { message, visibility } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Message content is required.' }, { status: 400 });
    }

    const newMessage = await addTicketMessage(
      ticketNumber,
      { message: message.trim(), visibility },
      {
        userId: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
        tenantId: session.tenantId,
        isPlatformAdmin: session.isPlatformAdmin
      }
    );

    return NextResponse.json({ success: true, data: newMessage }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function PATCH(
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
    const { action, status, reason, resolutionSummary, agentId, agentName, agentEmail, teamId } = body;

    if (action === 'ASSIGN') {
      const assigned = await assignTicket(
        ticketNumber,
        { agentId, agentName, agentEmail, teamId },
        { userId: session.userId, name: session.name, isPlatformAdmin: session.isPlatformAdmin }
      );
      return NextResponse.json({ success: true, data: assigned });
    }

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required.' }, { status: 400 });
    }

    const updated = await updateTicketStatus(
      ticketNumber,
      { status, reason, resolutionSummary },
      {
        userId: session.userId,
        name: session.name,
        tenantId: session.tenantId,
        isPlatformAdmin: session.isPlatformAdmin
      }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
