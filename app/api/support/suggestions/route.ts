import { NextRequest, NextResponse } from 'next/server';
import { suggestArticlesForTicket } from '@/lib/client-success/knowledge-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subject = searchParams.get('subject') || '';
    const category = searchParams.get('category') || undefined;
    const relatedModule = searchParams.get('module') || undefined;

    const suggestions = await suggestArticlesForTicket({ subject, category, module: relatedModule });
    return NextResponse.json({ success: true, data: suggestions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
