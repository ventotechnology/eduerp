import crypto from 'crypto';
import { db } from '../db';
import { AppError } from '../errors/app-error';
import { logAuditEvent } from '../audit/audit-logger';
import { SessionUser } from '../auth/types';
import { requireTenant } from '../tenant/tenant-guard';
import { ENV } from '../env';
import { CertificateIssueSchema, CertificateRevokeSchema } from '../validations/schemas';

/**
 * Computes a cryptographic integrity hash (HMAC-SHA256) for certificate authenticity.
 */
export function computeCertificateHash(data: {
  certificateNumber: string;
  institutionId: string;
  studentId: string;
  certificateType: string;
  issueDate: string;
}): string {
  const payload = `${data.certificateNumber}:${data.institutionId}:${data.studentId}:${data.certificateType}:${data.issueDate}`;
  return crypto
    .createHmac('sha256', ENV.AUTH_SECRET)
    .update(payload)
    .digest('hex');
}

export async function issueCertificate(
  tenantIdentifier: string,
  rawData: unknown,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = CertificateIssueSchema.parse(rawData);

  const student = await db.student.findFirst({
    where: { id: validated.studentId, campus: { institutionId: tenant.institutionId } },
    include: {
      guardian: true,
      enrollments: { include: { class: true } },
      batch: { include: { program: true } }
    }
  });

  if (!student) throw AppError.notFound('Student not found.');

  const year = new Date().getFullYear();
  const certificateNumber = `CERT-${year}-${Date.now().toString().slice(-6)}`;
  const issueDate = new Date();
  const issueDateStr = issueDate.toISOString().slice(0, 10);

  const integrityHash = computeCertificateHash({
    certificateNumber,
    institutionId: tenant.institutionId,
    studentId: student.id,
    certificateType: validated.certificateType,
    issueDate: issueDateStr
  });

  const qrVerificationUrl = `/verify/${certificateNumber}`;

  const studentName = validated.studentName || `${student.firstName} ${student.lastName}`;
  const fatherName = validated.fatherName || student.guardian?.fatherName;
  const motherName = validated.motherName || student.guardian?.motherName;
  const programOrClass = validated.programOrClass || student.batch?.program.name || student.enrollments[0]?.class?.name || 'General Course';

  const certificate = await db.certificate.create({
    data: {
      institutionId: tenant.institutionId,
      studentId: student.id,
      certificateType: validated.certificateType,
      certificateNumber,
      studentName,
      fatherName,
      motherName,
      programOrClass,
      gpaOrDivision: validated.gpaOrDivision,
      passingYear: validated.passingYear || year,
      issueDate,
      integrityHash,
      qrVerificationUrl,
      isRevoked: false,
      signatoryTitle: validated.signatoryTitle || 'Principal',
      metadataJson: validated.customRemarks ? JSON.stringify({ remarks: validated.customRemarks }) : null
    }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CERTIFICATE_ISSUED',
    resourceType: 'Certificate',
    resourceId: certificate.id,
    newState: {
      certificateNumber,
      studentId: student.id,
      certificateType: validated.certificateType,
      integrityHash
    }
  });

  return certificate;
}

export async function verifyCertificate(certificateNumber: string, hashToVerify?: string) {
  const certificate = await db.certificate.findUnique({
    where: { certificateNumber },
    include: {
      institution: true,
      student: { include: { campus: true } }
    }
  });

  if (!certificate) {
    return {
      isValid: false,
      status: 'NOT_FOUND',
      message: 'Certificate not found in central registry.'
    };
  }

  if (certificate.isRevoked) {
    return {
      isValid: false,
      status: 'REVOKED',
      certificateNumber: certificate.certificateNumber,
      certificateType: certificate.certificateType,
      institutionName: certificate.institution.name,
      studentName: certificate.studentName,
      revocationReason: certificate.revocationReason || 'Revoked by institution authority.',
      revokedAt: certificate.revokedAt,
      message: 'This certificate was officially REVOKED and is no longer valid.'
    };
  }

  // Verify internal cryptographic integrity hash
  const expectedHash = computeCertificateHash({
    certificateNumber: certificate.certificateNumber,
    institutionId: certificate.institutionId,
    studentId: certificate.studentId,
    certificateType: certificate.certificateType,
    issueDate: certificate.issueDate.toISOString().slice(0, 10)
  });

  const isHashValid = certificate.integrityHash === expectedHash;
  if (!isHashValid) {
    return {
      isValid: false,
      status: 'TAMPERED',
      message: 'Cryptographic integrity check failed. Certificate may be altered or forged.'
    };
  }

  if (hashToVerify && hashToVerify !== certificate.integrityHash) {
    return {
      isValid: false,
      status: 'INVALID_HASH',
      message: 'Provided verification hash does not match the official digital seal.'
    };
  }

  return {
    isValid: true,
    status: 'VALID',
    certificateNumber: certificate.certificateNumber,
    certificateType: certificate.certificateType,
    institutionName: certificate.institution.name,
    studentName: certificate.studentName,
    programOrClass: certificate.programOrClass,
    gpaOrDivision: certificate.gpaOrDivision,
    passingYear: certificate.passingYear,
    issueDate: certificate.issueDate,
    signatoryTitle: certificate.signatoryTitle,
    integrityHash: certificate.integrityHash,
    message: 'Official Certificate Verified Authentically.'
  };
}

export async function revokeCertificate(
  tenantIdentifier: string,
  rawData: unknown,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = CertificateRevokeSchema.parse(rawData);

  const certificate = await db.certificate.findFirst({
    where: {
      certificateNumber: validated.certificateNumber,
      institutionId: tenant.institutionId
    }
  });

  if (!certificate) throw AppError.notFound('Certificate not found.');

  const updated = await db.certificate.update({
    where: { id: certificate.id },
    data: {
      isRevoked: true,
      revocationReason: validated.reason,
      revokedBy: actor.name || actor.email,
      revokedAt: new Date()
    }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'CERTIFICATE_REVOKED',
    resourceType: 'Certificate',
    resourceId: certificate.id,
    newState: {
      certificateNumber: certificate.certificateNumber,
      reason: validated.reason,
      revokedBy: actor.name || actor.email
    }
  });

  return updated;
}
