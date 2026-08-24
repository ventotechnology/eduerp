import { NextRequest, NextResponse } from 'next/server';
import { listKnowledgeArticles, listKnowledgeCategories } from '@/lib/client-success/knowledge-service';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categorySlug = searchParams.get('category') || undefined;
    const relatedModule = searchParams.get('module') || undefined;
    const search = searchParams.get('search') || undefined;
    const featuredOnly = searchParams.get('featured') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const session = await getAuthSession(request).catch(() => null);
    const visibilityLevels = ['PUBLIC'];
    if (session?.authenticated) {
      visibilityLevels.push('AUTHENTICATED');
      if (session.isPlatformAdmin) {
        visibilityLevels.push('PLATFORM_STAFF', 'INTERNAL_SUPPORT', 'TENANT_ADMIN');
      } else if (['SUPER_ADMIN', 'PRINCIPAL', 'DEAN', 'ADMIN'].includes(session.role)) {
        visibilityLevels.push('TENANT_ADMIN');
      }
    }

    const [articlesResult, categories] = await Promise.all([
      listKnowledgeArticles({
        categorySlug,
        module: relatedModule,
        search,
        featuredOnly,
        visibilityLevels,
        page,
        limit
      }),
      listKnowledgeCategories()
    ]);

    return NextResponse.json({
      success: true,
      categories,
      ...articlesResult
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
