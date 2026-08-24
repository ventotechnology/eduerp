import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth/get-auth-session';
import { AppError } from '@/lib/errors/app-error';

const ALLOWED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.pdf',
  '.txt',
  '.csv',
  '.docx',
  '.xlsx'
]);

const BLOCKED_EXTENSIONS = new Set([
  '.exe',
  '.sh',
  '.js',
  '.php',
  '.bat',
  '.cmd',
  '.scr',
  '.jar',
  '.vbs',
  '.py',
  '.bin',
  '.com'
]);

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.ms-excel'
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const UPLOAD_DIR = process.env.ATTACHMENT_STORAGE_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), 'uploads', 'support');

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ ticketNumber: string }> }
) {
  try {
    const session = await getAuthSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const { ticketNumber } = await params;
    const ticket = await db.supportTicket.findUnique({ where: { ticketNumber } });
    if (!ticket) {
      return NextResponse.json({ success: false, error: `Ticket '${ticketNumber}' not found.` }, { status: 404 });
    }

    // Tenant authorization check
    if (!session.isPlatformAdmin && ticket.tenantId !== session.tenantId) {
      return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const messageId = (formData.get('messageId') as string) || null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided for upload.' }, { status: 400 });
    }

    const originalName = file.name || 'attachment';
    const ext = path.extname(originalName).toLowerCase();

    if (BLOCKED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { success: false, error: `Executable or script extension '${ext}' is blocked for security.` },
        { status: 400 }
      );
    }

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type '${ext}'. Allowed: PNG, JPG, WEBP, PDF, TXT, CSV, DOCX, XLSX.` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File exceeds maximum allowed size of 10MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).` },
        { status: 400 }
      );
    }

    const mimeType = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME_TYPES.has(mimeType) && !mimeType.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: `MIME type '${mimeType}' is not permitted.` },
        { status: 400 }
      );
    }

    // Ensure private upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Generate safe storage filename
    const safeKey = `${crypto.randomUUID()}${ext}`;
    const targetFilePath = path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, safeKey);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(targetFilePath, buffer);

    const attachment = await db.supportTicketAttachment.create({
      data: {
        ticketId: ticket.id,
        messageId,
        fileName: originalName,
        fileSize: file.size,
        mimeType,
        filePath: safeKey, // Store private key/relative filename
        uploadedByUserId: session.userId
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: attachment.id,
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
        createdAt: attachment.createdAt,
        downloadUrl: `/api/support/tickets/${ticketNumber}/attachments/${attachment.id}`
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Attachment upload failed.' },
      { status: error.statusCode || 500 }
    );
  }
}
