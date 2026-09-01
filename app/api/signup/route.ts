import { NextRequest, NextResponse } from 'next/server';
import { SaasSignupService } from '@/lib/services/saas-signup.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Explicitly destructure only allowed public fields; reject/ignore public synthetic spoofing
    const {
      institutionName,
      institutionType,
      contactPerson,
      email,
      phone,
      country,
      address,
      desiredSlug,
      password,
      planIdOrCode,
      billingCycle,
      promoCode,
      isTrial,
    } = body;

    const result = await SaasSignupService.createSignupApplication({
      institutionName,
      institutionType,
      contactPerson,
      email,
      phone,
      country,
      address,
      desiredSlug,
      password,
      planIdOrCode,
      billingCycle,
      promoCode,
      isTrial,
      isSynthetic: false, // Public signups are strictly non-synthetic
    });

    return NextResponse.json({
      ...result,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process signup application.',
    }, { status: 400 });
  }
}
