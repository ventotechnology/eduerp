import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth/get-auth-session';

const UPLOAD_DIR = process.env.ATTACHMENT_STORAGE_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), 'uploads', 'support');

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketNumber: string; attachmentId: string }> }
) {
  try {
    const session = await getAuthSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const { ticketNumber, attachmentId } = await params;
    const ticket = await db.supportTicket.findUnique({ where: { ticketNumber } });
    if (!ticket) {
      return NextResponse.json({ success: false, error: `Ticket '${ticketNumber}' not found.` }, { status: 404 });
    }

    // Tenant isolation authorization check
    if (!session.isPlatformAdmin && ticket.tenantId !== session.tenantId) {
      return NextResponse.json({ success: false, error: 'Access to this attachment is forbidden.' }, { status: 403 });
    }

    const attachment = await db.supportTicketAttachment.findUnique({
      where: { id: attachmentId }
    });

    if (!attachment || attachment.ticketId !== ticket.id) {
      return NextResponse.json({ success: false, error: 'Attachment not found.' }, { status: 404 });
    }

    const filePath = path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, attachment.filePath);

    try {
      const fileBuffer = await fs.readFile(/*turbopackIgnore: true*/ filePath);
      const isImage = attachment.mimeType.startsWith('image/');
      const disposition = isImage ? 'inline' : `attachment; filename="${encodeURIComponent(attachment.fileName)}"`;

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': attachment.mimeType || 'application/octet-stream',
          'Content-Length': fileBuffer.length.toString(),
          'Content-Disposition': disposition,
          'Cache-Control': 'private, no-cache, no-store, must-revalidate'
        }
      });
    } catch {
      return NextResponse.json({ success: false, error: 'Attachment file not found in storage.' }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to download attachment.' },
      { status: error.statusCode || 500 }
    );
  }
}
