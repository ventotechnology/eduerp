import { NextRequest, NextResponse } from 'next/server';
import { createSupportTicket, listSupportTickets } from '@/lib/client-success/ticket-service';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session?.authenticated) {
      return NextResponse.json({ success: false, error: 'Authentication required to view support tickets.' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const categoryCode = searchParams.get('category') || undefined;
    const relatedModule = searchParams.get('module') || undefined;
    const search = searchParams.get('search') || undefined;
    const tenantId = searchParams.get('tenantId') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await listSupportTickets(
      { status, priority, categoryCode, module: relatedModule, search, tenantId, page, limit },
      {
        userId: session.userId,
        tenantId: session.tenantId,
        isPlatformAdmin: session.isPlatformAdmin
      }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session?.authenticated) {
      return NextResponse.json({ success: false, error: 'Authentication required to create support ticket.' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, categoryCode, relatedModule, priority, description, businessImpact, affectedUrl, preferredContact } = body;

    const ticket = await createSupportTicket(
      {
        subject,
        categoryCode,
        relatedModule,
        priority,
        description,
        businessImpact,
        affectedUrl,
        preferredContact
      },
      {
        userId: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
        tenantId: session.tenantId,
        institutionId: session.institutionId,
        isPlatformAdmin: session.isPlatformAdmin
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully.',
      ticketNumber: ticket.ticketNumber,
      data: ticket
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
