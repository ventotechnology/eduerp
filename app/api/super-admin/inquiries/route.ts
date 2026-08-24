import { NextRequest, NextResponse } from 'next/server';
import { listContactInquiries, updateInquiryStatus } from '@/lib/client-success/contact-service';
import { requirePlatformPermission } from '@/lib/rbac/platform-guard';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    requirePlatformPermission(session, 'CONTACT_INQUIRY_MANAGE');

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await listContactInquiries({ search, status, category, page, limit });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    requirePlatformPermission(session, 'CONTACT_INQUIRY_MANAGE');

    const body = await request.json();
    const { id, status, internalNotes, assignedToUserId, assignedToName } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Inquiry ID is required.' }, { status: 400 });
    }

    const updated = await updateInquiryStatus(
      id,
      { status, internalNotes, assignedToUserId, assignedToName },
      session.userId,
      session.name
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
