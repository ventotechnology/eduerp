import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { ROLE_PERMISSIONS } from '@/lib/rbac/permissions';

export async function GET(req: NextRequest) {
  const session = await getServerSession(req);

  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const permissions = ROLE_PERMISSIONS[session.role] || {};

  return NextResponse.json({
    authenticated: true,
    user: session,
    permissions
  });
}
