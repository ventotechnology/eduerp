import { NextRequest, NextResponse } from 'next/server';
import { SaasSignupService } from '@/lib/services/saas-signup.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await SaasSignupService.createSignupApplication(body);
    return NextResponse.json({
      success: true,
      ...result
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process signup application.'
    }, { status: 400 });
  }
}
