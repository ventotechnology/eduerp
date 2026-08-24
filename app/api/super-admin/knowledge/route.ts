import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePlatformPermission } from '@/lib/rbac/platform-guard';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    requirePlatformPermission(session, 'KNOWLEDGE_MANAGE');

    const [articles, categories] = await Promise.all([
      db.knowledgeArticle.findMany({
        orderBy: { updatedAt: 'desc' },
        include: { category: true }
      }),
      db.knowledgeCategory.findMany({ orderBy: { displayOrder: 'asc' } })
    ]);

    return NextResponse.json({ success: true, articles, categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    requirePlatformPermission(session, 'KNOWLEDGE_MANAGE');

    const body = await request.json();
    const { title, slug, summary, body: content, categoryId, tags, relatedModule, visibility, isPublished, isFeatured } = body;

    const article = await db.knowledgeArticle.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        summary,
        body: content,
        categoryId,
        tags: typeof tags === 'string' ? tags : JSON.stringify(tags || []),
        relatedModule: relatedModule || 'OTHER',
        visibility: visibility || 'PUBLIC',
        isPublished: isPublished !== false,
        isFeatured: !!isFeatured,
        publishedAt: isPublished ? new Date() : null,
        authorName: session.name || 'EduERP Product Team'
      }
    });

    return NextResponse.json({ success: true, data: article }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    requirePlatformPermission(session, 'KNOWLEDGE_MANAGE');

    const body = await request.json();
    const { id, ...data } = body;

    const updated = await db.knowledgeArticle.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
