import { NextRequest, NextResponse } from 'next/server';
import { SaasSignupService } from '@/lib/services/saas-signup.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || '';
    const result = await SaasSignupService.validateSlug(slug);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ valid: false, slug: '', message: error.message }, { status: 500 });
  }
}
