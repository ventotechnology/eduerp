import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePlatformPermission } from '@/lib/rbac/platform-guard';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    requirePlatformPermission(session, 'SUPPORT_SLA_MANAGE');

    const policies = await db.supportSlaPolicy.findMany({ orderBy: { displayPrecedence: 'desc' } });
    const businessHours = await db.supportBusinessHours.findMany({ orderBy: { dayOfWeek: 'asc' } });
    const holidays = await db.supportHoliday.findMany({ orderBy: { date: 'asc' } });
    const escalationRules = await db.supportEscalationRule.findMany({ orderBy: { createdAt: 'asc' } });

    return NextResponse.json({
      success: true,
      data: {
        policies,
        businessHours,
        holidays,
        escalationRules
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    requirePlatformPermission(session, 'SUPPORT_SLA_MANAGE');

    const body = await request.json();
    const { id, priority, name, firstResponseTargetMinutes, resolutionTargetMinutes, businessHoursOnly, isActive, planTier, categoryCode, institutionType, displayPrecedence } = body;

    let policy;
    if (id) {
      policy = await db.supportSlaPolicy.update({
        where: { id },
        data: {
          name,
          firstResponseTargetMinutes: Number(firstResponseTargetMinutes),
          resolutionTargetMinutes: Number(resolutionTargetMinutes),
          businessHoursOnly: !!businessHoursOnly,
          isActive: isActive !== false,
          planTier: planTier || null,
          categoryCode: categoryCode || null,
          institutionType: institutionType || null,
          displayPrecedence: Number(displayPrecedence) || 0,
          updatedAt: new Date()
        }
      });
    } else {
      policy = await db.supportSlaPolicy.create({
        data: {
          priority,
          name,
          firstResponseTargetMinutes: Number(firstResponseTargetMinutes),
          resolutionTargetMinutes: Number(resolutionTargetMinutes),
          businessHoursOnly: !!businessHoursOnly,
          isActive: isActive !== false,
          planTier: planTier || null,
          categoryCode: categoryCode || null,
          institutionType: institutionType || null,
          displayPrecedence: Number(displayPrecedence) || 0
        }
      });
    }

    return NextResponse.json({ success: true, data: policy });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
