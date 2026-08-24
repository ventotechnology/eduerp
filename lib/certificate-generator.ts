import QRCode from 'qrcode';

export interface CertificateMetadata {
  certificateNumber: string;
  studentName: string;
  studentIdNumber: string;
  institutionName: string;
  institutionType: string;
  certificateType: string;
  issueDate: string;
  gpaOrCgpa?: string;
  passedYear: string;
  principalName: string;
  principalTitle: string;
}

export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 256,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
}

import crypto from 'crypto';

export function generateVerificationHash(studentId: string, certType: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const raw = `${studentId}-${certType}-${timestamp}`;
  const hex = crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();
  return `VRF-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

