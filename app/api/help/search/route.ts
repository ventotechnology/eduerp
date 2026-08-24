import { NextRequest, NextResponse } from 'next/server';
import { searchHelpCenter } from '@/lib/client-success/knowledge-service';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q') || '';
    const session = await getAuthSession(request).catch(() => null);

    const allowedVisibilities = ['PUBLIC'];
    if (session?.authenticated) {
      allowedVisibilities.push('AUTHENTICATED');
      if (session.isPlatformAdmin) {
        allowedVisibilities.push('PLATFORM_STAFF', 'INTERNAL_SUPPORT', 'TENANT_ADMIN');
      } else if (['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'ADMIN'].includes(session.role)) {
        allowedVisibilities.push('TENANT_ADMIN');
      }
    }

    const results = await searchHelpCenter(q, allowedVisibilities);
    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
