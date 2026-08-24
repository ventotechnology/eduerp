import { NextRequest, NextResponse } from 'next/server';
import { SaasCheckoutService } from '@/lib/services/saas-checkout.service';

export async function GET(request: NextRequest) {
  return handleCallback(request);
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}

async function handleCallback(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentID') || searchParams.get('paymentId') || '';
    const status = searchParams.get('status') || '';
    const orderId = searchParams.get('orderId') || undefined;

    // Support json body if POST webhook
    let bodyPaymentId = '';
    let bodyStatus = '';
    let bodyOrderId = '';
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        bodyPaymentId = body.paymentID || body.paymentId || '';
        bodyStatus = body.status || '';
        bodyOrderId = body.orderId || '';
      } catch {
        // query params fallback
      }
    }

    const finalPaymentId = paymentId || bodyPaymentId;
    const finalStatus = status || bodyStatus;
    const finalOrderId = orderId || bodyOrderId;

    if (!finalPaymentId) {
      return NextResponse.redirect(new URL('/payment/status/error?status=invalid_callback', request.url));
    }

    const result = await SaasCheckoutService.handleBkashCallback({
      paymentId: finalPaymentId,
      status: finalStatus,
      orderId: finalOrderId
    });

    return NextResponse.redirect(new URL(result.redirectUrl, request.url));
  } catch (error: any) {
    return NextResponse.redirect(
      new URL(`/payment/status/error?status=callback_error&error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
