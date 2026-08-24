import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, institutionName, email, phone, institutionType, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, error: 'Name, email, and message are required.' }, { status: 400 });
    }

    // Persist to AuditLog / System Lead
    await db.auditLog.create({
      data: {
        action: 'CONTACT_LEAD_SUBMITTED',
        resourceType: 'ContactLead',
        resourceId: email,
        userName: name || 'Public Inquiry Lead',
        newState: JSON.stringify({
          name,
          institutionName,
          email,
          phone,
          institutionType,
          subject,
          message,
          submittedAt: new Date().toISOString()
        })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you. Your inquiry has been received. An educational solutions specialist will contact you within 2 business hours.'
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
