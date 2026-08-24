import { NextRequest, NextResponse } from 'next/server';
import { SaasCheckoutService } from '@/lib/services/saas-checkout.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await SaasCheckoutService.submitBankTransferPayment(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
