import { NextRequest, NextResponse } from 'next/server';
import { createContactInquiry, getPlatformContactSettings } from '@/lib/client-success/contact-service';

export async function GET() {
  try {
    const settings = await getPlatformContactSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      name,
      institutionName,
      email,
      phone,
      whatsapp,
      institutionType,
      district,
      country,
      studentCount,
      campusCount,
      subject,
      category,
      preferredContact,
      preferredDemoDate,
      requirements,
      message
    } = body;

    const contactName = fullName || name;
    const inquirySubject = subject || 'Product Demo Request';
    const inquiryCategory = category || 'Product Demo';
    const inquiryReqs = requirements || message;

    if (!contactName || !email) {
      return NextResponse.json({
        success: false,
        error: 'Name and email are required to submit an inquiry.'
      }, { status: 400 });
    }

    const inquiry = await createContactInquiry({
      fullName: contactName,
      institutionName: institutionName || 'Prospective Institution',
      email,
      phone: phone || '',
      whatsapp: whatsapp || phone,
      institutionType: institutionType || 'SCHOOL',
      district: district || 'Dhaka',
      country: country || 'Bangladesh',
      studentCount: studentCount ? Number(studentCount) : undefined,
      campusCount: campusCount ? Number(campusCount) : 1,
      subject: inquirySubject,
      category: inquiryCategory,
      preferredContact: preferredContact || 'EMAIL',
      preferredDemoDate,
      requirements: inquiryReqs
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you. Your inquiry has been recorded. An educational solutions specialist will contact you shortly.',
      inquiryNumber: inquiry.inquiryNumber,
      data: inquiry
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
