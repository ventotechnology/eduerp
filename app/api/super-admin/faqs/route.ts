import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePlatformPermission } from '@/lib/rbac/platform-guard';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    requirePlatformPermission(session, 'KNOWLEDGE_MANAGE');

    const faqs = await db.faqItem.findMany({
      orderBy: { displayOrder: 'asc' },
      include: { category: true }
    });

    return NextResponse.json({ success: true, data: faqs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    requirePlatformPermission(session, 'KNOWLEDGE_MANAGE');

    const body = await request.json();
    const { categoryId, question, answer, relatedModule, displayOrder } = body;

    const faq = await db.faqItem.create({
      data: {
        categoryId,
        question,
        answer,
        relatedModule: relatedModule || 'OTHER',
        displayOrder: Number(displayOrder) || 0
      }
    });

    return NextResponse.json({ success: true, data: faq }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
