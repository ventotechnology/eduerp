import { NextRequest, NextResponse } from 'next/server';
import { SaasCheckoutService } from '@/lib/services/saas-checkout.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required.' }, { status: 400 });
    }

    // Determine host URL for callback
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'eduerp.us';
    const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const hostUrl = `${proto}://${host}`;

    const result = await SaasCheckoutService.initiateBkashCheckout(orderId, hostUrl);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to initiate bKash payment session.'
    }, { status: 400 });
  }
}
