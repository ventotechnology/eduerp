import { NextRequest, NextResponse } from 'next/server';
import { listFaqs, voteFaqHelpfulness } from '@/lib/client-success/knowledge-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categorySlug = searchParams.get('category') || undefined;
    const relatedModule = searchParams.get('module') || undefined;
    const search = searchParams.get('search') || undefined;

    const faqs = await listFaqs({ categorySlug, module: relatedModule, search });
    return NextResponse.json({ success: true, data: faqs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, helpful } = body;
    if (!id) return NextResponse.json({ success: false, error: 'FAQ ID required' }, { status: 400 });

    const updated = await voteFaqHelpfulness(id, !!helpful);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
