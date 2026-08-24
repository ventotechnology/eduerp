import { NextRequest, NextResponse } from 'next/server';
import { getKnowledgeArticleBySlug, voteArticleHelpfulness } from '@/lib/client-success/knowledge-service';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
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

    const article = await getKnowledgeArticleBySlug(slug, visibilityLevels);
    return NextResponse.json({ success: true, data: article });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { helpful } = body;

    const updated = await voteArticleHelpfulness(slug, !!helpful);
    return NextResponse.json({
      success: true,
      helpfulCount: updated.helpfulCount,
      notHelpfulCount: updated.notHelpfulCount
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
