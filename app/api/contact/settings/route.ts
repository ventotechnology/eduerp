import { NextRequest, NextResponse } from 'next/server';
import { getPlatformContactSettings, updatePlatformContactSettings } from '@/lib/client-success/contact-service';
import { requirePlatformPermission } from '@/lib/rbac/platform-guard';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function GET() {
  try {
    const settings = await getPlatformContactSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    requirePlatformPermission(session, 'CONTACT_SETTINGS_MANAGE');

    const body = await request.json();
    const updated = await updatePlatformContactSettings(body, session.userId, session.name);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
