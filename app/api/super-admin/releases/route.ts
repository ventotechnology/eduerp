import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePlatformPermission } from '@/lib/rbac/platform-guard';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    requirePlatformPermission(session, 'PLATFORM_VIEW_DASHBOARD');

    const releases = await db.releaseNote.findMany({
      orderBy: { releaseDate: 'desc' }
    });

    return NextResponse.json({ success: true, data: releases });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    requirePlatformPermission(session, 'PLATFORM_SETTINGS_MANAGE');

    const body = await request.json();
    const { version, title, slug, summary, newFeatures, improvements, bugFixes, isPublished } = body;

    const release = await db.releaseNote.create({
      data: {
        version,
        title,
        slug: slug || version.replace(/\./g, '-'),
        summary,
        newFeatures: typeof newFeatures === 'string' ? newFeatures : JSON.stringify(newFeatures || []),
        improvements: typeof improvements === 'string' ? improvements : JSON.stringify(improvements || []),
        bugFixes: typeof bugFixes === 'string' ? bugFixes : JSON.stringify(bugFixes || []),
        isPublished: isPublished !== false
      }
    });

    return NextResponse.json({ success: true, data: release }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
