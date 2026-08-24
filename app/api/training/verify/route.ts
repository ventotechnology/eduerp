import { NextRequest, NextResponse } from 'next/server';
import { verifyTrainingCertificate } from '@/lib/client-success/training-service';

export async function GET(request: NextRequest) {
  try {
    const certificateNumber = request.nextUrl.searchParams.get('certificateNumber') || '';
    if (!certificateNumber) {
      return NextResponse.json({ success: false, error: 'Certificate number is required.' }, { status: 400 });
    }

    const cert = await verifyTrainingCertificate(certificateNumber);
    return NextResponse.json({ success: true, data: cert });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
