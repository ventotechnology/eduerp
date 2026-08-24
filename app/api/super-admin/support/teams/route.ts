import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePlatformPermission } from '@/lib/rbac/platform-guard';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    requirePlatformPermission(session, 'SUPPORT_TICKET_VIEW');

    const teams = await db.supportTeam.findMany({
      where: { isActive: true },
      include: {
        members: true,
        _count: {
          select: {
            tickets: {
              where: { status: { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] } }
            }
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: teams });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
