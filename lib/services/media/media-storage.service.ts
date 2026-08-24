import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { AppError } from '@/lib/errors/app-error';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { logAuditEvent } from '@/lib/audit/audit-logger';

export interface UploadMediaOptions {
  tenantIdentifier: string;
  entityType: 'STUDENT' | 'GUARDIAN' | 'ADMISSION_APPLICATION' | 'STAFF' | 'INSTITUTION';
  entityId?: string | null;
  category: 'PROFILE_PHOTO' | 'FATHER_PHOTO' | 'MOTHER_PHOTO' | 'GUARDIAN_PHOTO' | 'DOCUMENT' | 'ID_CARD_PHOTO';
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  uploadedByUserId?: string | null;
  source?: 'ADMISSION_PORTAL' | 'SIS_DIRECT' | 'STUDENT_PROFILE' | 'GUARDIAN_PROFILE' | 'DIRECT_UPLOAD';
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]);

const FORBIDDEN_EXTENSIONS = new Set([
  '.svg', '.html', '.htm', '.js', '.ts', '.php', '.exe', '.sh', '.bat', '.cmd', '.vbs', '.py', '.bin'
]);

function getUploadBaseDir(): string {
  return process.env.MEDIA_STORAGE_DIR || process.env.ATTACHMENT_STORAGE_DIR || path.join(process.cwd(), 'uploads');
}

/**
 * Validates magic bytes against claimed image MIME type to prevent disguised file execution
 */
export function validateImageMagicBytes(buffer: Buffer, claimedMime: string): boolean {
  if (!buffer || buffer.length < 3) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return claimedMime === 'image/jpeg' || claimedMime === 'image/jpg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A (needs at least 8 bytes)
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return claimedMime === 'image/png';
  }

  // WebP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP) (needs at least 12 bytes)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return claimedMime === 'image/webp';
  }

  return false;
}

export class MediaStorageService {
  /**
   * Validates a file buffer's size, extension, MIME type, and magic bytes
   */
  static validateFileBuffer(
    buffer: Buffer,
    fileName: string,
    claimedMime: string,
    maxSizeMb: number = 5
  ): { isValid: boolean; detectedMime?: string; error?: string } {
    if (!buffer || buffer.length === 0) {
      return { isValid: false, error: 'Empty file buffer.' };
    }

    const maxBytes = maxSizeMb * 1024 * 1024;
    if (buffer.length > maxBytes) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed limit of ${maxSizeMb} MB.`
      };
    }

    const ext = path.extname(fileName).toLowerCase();
    if (FORBIDDEN_EXTENSIONS.has(ext)) {
      return {
        isValid: false,
        error: `File extension '${ext}' is not permitted for security reasons.`
      };
    }

    const normalizedMime = claimedMime.toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
      return {
        isValid: false,
        error: `Unsupported media format '${claimedMime}'. Allowed formats: JPEG, PNG, WebP.`
      };
    }

    const isMagicValid = validateImageMagicBytes(buffer, normalizedMime);
    if (!isMagicValid) {
      return {
        isValid: false,
        error: 'Corrupt or unrecognized image magic bytes. Potential disguised file upload.'
      };
    }

    return { isValid: true, detectedMime: normalizedMime };
  }
  /**
   * Validates storage quota for a tenant
   */
  static async checkTenantStorageQuota(tenantId: string, additionalBytes: number): Promise<void> {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          take: 1
        }
      }
    });

    if (!tenant) throw AppError.notFound('Tenant not found.');

    const activePlan = tenant.subscriptions[0]?.plan;
    const maxStorageGb = activePlan?.maxStorageGb || 50; // Default 50GB if unassigned
    const maxStorageBytes = maxStorageGb * 1024 * 1024 * 1024;

    const aggregateResult = await db.mediaAsset.aggregate({
      where: { tenantId },
      _sum: { fileSize: true }
    });

    const currentBytes = aggregateResult._sum.fileSize || 0;

    if (currentBytes + additionalBytes > maxStorageBytes) {
      throw AppError.forbidden(
        `STORAGE_QUOTA_EXCEEDED: Institution storage quota limit of ${maxStorageGb} GB reached. Please upgrade your subscription plan.`
      );
    }
  }

  /**
   * Uploads and securely stores a photo/media asset with tenant isolation
   */
  static async uploadMedia(options: UploadMediaOptions) {
    const tenant = await requireTenant(options.tenantIdentifier);

    const normalizedMime = options.mimeType.toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
      throw AppError.badRequest(
        `Unsupported media format '${options.mimeType}'. Allowed formats: JPEG, PNG, WebP.`
      );
    }

    const ext = path.extname(options.fileName).toLowerCase();
    if (FORBIDDEN_EXTENSIONS.has(ext)) {
      throw AppError.badRequest(`File extension '${ext}' is not permitted for security reasons.`);
    }

    // Magic byte signature validation
    const isValidSignature = validateImageMagicBytes(options.fileBuffer, normalizedMime);
    if (!isValidSignature) {
      throw AppError.badRequest('Invalid or corrupted image file signature.');
    }

    // Size validation
    const maxBytes = 5 * 1024 * 1024; // 5 MB
    if (options.fileBuffer.length > maxBytes) {
      throw AppError.badRequest('File size exceeds the 5 MB maximum limit.');
    }

    // Tenant storage quota check
    await this.checkTenantStorageQuota(tenant.tenantId, options.fileBuffer.length);

    // Generate random UUIDs and tenant-isolated path
    const fileId = crypto.randomUUID();
    const safeExtension = normalizedMime === 'image/png' ? '.png' : normalizedMime === 'image/webp' ? '.webp' : '.jpg';
    const relativeObjectDir = path.join(
      'tenants',
      tenant.tenantId,
      options.entityType.toLowerCase(),
      options.entityId || 'general',
      options.category.toLowerCase()
    );

    const relativeFilePath = path.join(relativeObjectDir, `${fileId}${safeExtension}`);
    const absoluteFilePath = path.join(getUploadBaseDir(), relativeFilePath);

    // Ensure directory exists
    await fs.mkdir(path.dirname(absoluteFilePath), { recursive: true });

    // Write file to durable disk
    await fs.writeFile(absoluteFilePath, options.fileBuffer);

    // Calculate checksum
    const checksum = crypto.createHash('sha256').update(options.fileBuffer).digest('hex');

    // Create MediaAsset database record
    const mediaAsset = await db.mediaAsset.create({
      data: {
        tenantId: tenant.tenantId,
        entityType: options.entityType,
        entityId: options.entityId || null,
        category: options.category,
        objectKey: relativeFilePath.replace(/\\/g, '/'),
        filePath: relativeFilePath,
        fileName: options.fileName || `${fileId}${safeExtension}`,
        mimeType: normalizedMime,
        fileSize: options.fileBuffer.length,
        checksum,
        uploadedByUserId: options.uploadedByUserId || null,
        source: options.source || 'DIRECT_UPLOAD'
      }
    });

    const publicMediaUrl = `/api/media/${mediaAsset.id}`;

    return {
      mediaAsset,
      url: publicMediaUrl,
      objectKey: mediaAsset.objectKey
    };
  }

  /**
   * Retrieves media asset file buffer with tenant isolation
   */
  static async getMediaAsset(mediaId: string, requestedTenantId?: string | null) {
    const mediaAsset = await db.mediaAsset.findUnique({
      where: { id: mediaId }
    });

    if (!mediaAsset) {
      throw AppError.notFound('Media asset not found.');
    }

    if (requestedTenantId && mediaAsset.tenantId !== requestedTenantId) {
      throw AppError.forbidden('Access to media asset from another tenant is forbidden.');
    }

    const absoluteFilePath = path.join(/*turbopackIgnore: true*/ getUploadBaseDir(), mediaAsset.filePath);

    try {
      const buffer = await fs.readFile(/*turbopackIgnore: true*/ absoluteFilePath);
      return {
        mediaAsset,
        buffer
      };
    } catch {
      throw AppError.notFound('Media file not found on storage volume.');
    }
  }

  /**
   * Attaches or replaces a Student photograph
   */
  static async updateStudentPhoto(
    tenantIdentifier: string,
    studentId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    actorUserId: string
  ) {
    const tenant = await requireTenant(tenantIdentifier);

    const student = await db.student.findFirst({
      where: {
        id: studentId,
        campus: { institutionId: tenant.institutionId }
      }
    });

    if (!student) throw AppError.notFound('Student not found.');

    const { mediaAsset, url } = await this.uploadMedia({
      tenantIdentifier,
      entityType: 'STUDENT',
      entityId: student.id,
      category: 'PROFILE_PHOTO',
      fileBuffer,
      fileName,
      mimeType,
      uploadedByUserId: actorUserId,
      source: 'STUDENT_PROFILE'
    });

    const previousPhotoUrl = student.photoUrl;

    // Update Student record
    await db.student.update({
      where: { id: student.id },
      data: { photoUrl: url }
    });

    // Record audit log
    await logAuditEvent({
      tenantId: tenant.tenantId,
      actor: { id: actorUserId || 'system', name: actorUserId || 'System User', role: 'ADMIN' },
      action: previousPhotoUrl ? 'STUDENT_PHOTO_REPLACED' : 'STUDENT_PHOTO_UPLOADED',
      resourceType: 'Student',
      resourceId: student.id,
      previousState: { photoUrl: previousPhotoUrl },
      newState: { photoUrl: url, mediaAssetId: mediaAsset.id }
    });

    return { photoUrl: url, mediaAssetId: mediaAsset.id, studentId: student.id };
  }

  /**
   * Removes a Student photograph
   */
  static async removeStudentPhoto(tenantIdentifier: string, studentId: string, actorUserId: string) {
    const tenant = await requireTenant(tenantIdentifier);

    const student = await db.student.findFirst({
      where: {
        id: studentId,
        campus: { institutionId: tenant.institutionId }
      }
    });

    if (!student) throw AppError.notFound('Student not found.');

    const oldPhotoUrl = student.photoUrl;

    await db.student.update({
      where: { id: student.id },
      data: { photoUrl: null }
    });

    await logAuditEvent({
      tenantId: tenant.tenantId,
      actor: { id: actorUserId || 'system', name: actorUserId || 'System User', role: 'ADMIN' },
      action: 'STUDENT_PHOTO_REMOVED',
      resourceType: 'Student',
      resourceId: student.id,
      previousState: { photoUrl: oldPhotoUrl },
      newState: { photoUrl: null }
    });

    return { success: true };
  }

  /**
   * Attaches or replaces a Guardian photograph (Father, Mother, or Legal Guardian)
   */
  static async updateGuardianPhoto(
    tenantIdentifier: string,
    guardianId: string,
    relationRole: 'FATHER' | 'MOTHER' | 'GUARDIAN',
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    actorUserId: string
  ) {
    const tenant = await requireTenant(tenantIdentifier);

    const guardian = await db.guardian.findUnique({
      where: { id: guardianId }
    });

    if (!guardian) throw AppError.notFound('Guardian record not found.');

    const categoryMap = {
      FATHER: 'FATHER_PHOTO',
      MOTHER: 'MOTHER_PHOTO',
      GUARDIAN: 'GUARDIAN_PHOTO'
    } as const;

    const { mediaAsset, url } = await this.uploadMedia({
      tenantIdentifier,
      entityType: 'GUARDIAN',
      entityId: guardian.id,
      category: categoryMap[relationRole],
      fileBuffer,
      fileName,
      mimeType,
      uploadedByUserId: actorUserId,
      source: 'GUARDIAN_PROFILE'
    });

    const updateData: any = {};
    if (relationRole === 'FATHER') {
      updateData.fatherPhotoUrl = url;
      updateData.photoUrl = url;
    } else if (relationRole === 'MOTHER') {
      updateData.motherPhotoUrl = url;
    } else {
      updateData.guardianPhotoUrl = url;
      updateData.photoUrl = url;
    }

    await db.guardian.update({
      where: { id: guardian.id },
      data: updateData
    });

    await logAuditEvent({
      tenantId: tenant.tenantId,
      actor: { id: actorUserId || 'system', name: actorUserId || 'System User', role: 'ADMIN' },
      action: 'GUARDIAN_PHOTO_UPLOADED',
      resourceType: 'Guardian',
      resourceId: guardian.id,
      newState: {
        relationRole,
        mediaAssetId: mediaAsset.id,
        photoUrl: url
      }
    });

    return { photoUrl: url, mediaAssetId: mediaAsset.id, guardianId: guardian.id };
  }

  /**
   * Removes a Guardian photograph
   */
  static async removeGuardianPhoto(
    tenantIdentifier: string,
    guardianId: string,
    relationRole: 'FATHER' | 'MOTHER' | 'GUARDIAN',
    actorUserId: string
  ) {
    const tenant = await requireTenant(tenantIdentifier);

    const guardian = await db.guardian.findUnique({
      where: { id: guardianId }
    });

    if (!guardian) throw AppError.notFound('Guardian record not found.');

    const updateData: any = {};
    if (relationRole === 'FATHER') {
      updateData.fatherPhotoUrl = null;
    } else if (relationRole === 'MOTHER') {
      updateData.motherPhotoUrl = null;
    } else {
      updateData.guardianPhotoUrl = null;
      updateData.photoUrl = null;
    }

    await db.guardian.update({
      where: { id: guardian.id },
      data: updateData
    });

    await logAuditEvent({
      tenantId: tenant.tenantId,
      actor: { id: actorUserId || 'system', name: actorUserId || 'System User', role: 'ADMIN' },
      action: 'GUARDIAN_PHOTO_REMOVED',
      resourceType: 'Guardian',
      resourceId: guardian.id,
      previousState: { relationRole },
      newState: updateData
    });

    return { success: true };
  }
}
