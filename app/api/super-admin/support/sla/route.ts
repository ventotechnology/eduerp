import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePlatformPermission } from '@/lib/rbac/platform-guard';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    requirePlatformPermission(session, 'SUPPORT_SLA_MANAGE');

    const policies = await db.supportSlaPolicy.findMany({ orderBy: { priority: 'asc' } });
    return NextResponse.json({ success: true, data: policies });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    requirePlatformPermission(session, 'SUPPORT_SLA_MANAGE');

    const body = await request.json();
    const { priority, name, firstResponseTargetMinutes, resolutionTargetMinutes, businessHoursOnly, isActive } = body;

    const policy = await db.supportSlaPolicy.upsert({
      where: { priority },
      create: {
        priority,
        name,
        firstResponseTargetMinutes: Number(firstResponseTargetMinutes),
        resolutionTargetMinutes: Number(resolutionTargetMinutes),
        businessHoursOnly: !!businessHoursOnly,
        isActive: isActive !== false
      },
      update: {
        name,
        firstResponseTargetMinutes: Number(firstResponseTargetMinutes),
        resolutionTargetMinutes: Number(resolutionTargetMinutes),
        businessHoursOnly: !!businessHoursOnly,
        isActive: isActive !== false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, data: policy });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
