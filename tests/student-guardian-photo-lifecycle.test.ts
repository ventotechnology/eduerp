import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MediaStorageService } from '../lib/services/media/media-storage.service';
import { getEncryptionKey, encryptSensitiveValue, decryptSensitiveValue } from '../lib/services/sms/sms-crypto';
import { db } from '../lib/db';

describe('Command 12A.5: Student & Guardian Photo Lifecycle & Media Storage Service', () => {
  // Sample valid magic byte buffers
  const validJpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
  const validPngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
  const validWebpBuffer = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // RIFF
    0x24, 0x00, 0x00, 0x00,
    0x57, 0x45, 0x42, 0x50  // WEBP
  ]);
  const fakePhpBuffer = Buffer.from('<?php echo "evil"; ?>');
  const fakeSvgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  const fakeExeBuffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00]); // MZ header

  describe('1. Security & Magic Bytes File Validation', () => {
    it('should validate genuine JPEG, PNG, and WebP buffers', () => {
      const jpegResult = MediaStorageService.validateFileBuffer(validJpegBuffer, 'photo.jpg', 'image/jpeg');
      expect(jpegResult.isValid).toBe(true);
      expect(jpegResult.detectedMime).toBe('image/jpeg');

      const pngResult = MediaStorageService.validateFileBuffer(validPngBuffer, 'student.png', 'image/png');
      expect(pngResult.isValid).toBe(true);
      expect(pngResult.detectedMime).toBe('image/png');

      const webpResult = MediaStorageService.validateFileBuffer(validWebpBuffer, 'avatar.webp', 'image/webp');
      expect(webpResult.isValid).toBe(true);
      expect(webpResult.detectedMime).toBe('image/webp');
    });

    it('should reject disguised files and malicious scripts', () => {
      const phpResult = MediaStorageService.validateFileBuffer(fakePhpBuffer, 'script.php.jpg', 'image/jpeg');
      expect(phpResult.isValid).toBe(false);
      expect(phpResult.error).toContain('Corrupt or unrecognized image magic bytes');

      const svgResult = MediaStorageService.validateFileBuffer(fakeSvgBuffer, 'vector.svg', 'image/svg+xml');
      expect(svgResult.isValid).toBe(false);

      const exeResult = MediaStorageService.validateFileBuffer(fakeExeBuffer, 'game.exe', 'application/x-msdownload');
      expect(exeResult.isValid).toBe(false);
    });

    it('should reject files exceeding maximum allowed size', () => {
      const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024); // 6 MB
      oversizedBuffer[0] = 0xFF;
      oversizedBuffer[1] = 0xD8;
      oversizedBuffer[2] = 0xFF;

      const result = MediaStorageService.validateFileBuffer(oversizedBuffer, 'huge.jpg', 'image/jpeg', 5);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed limit');
    });
  });

  describe('2. Fail-Closed SMS Crypto Security Verification', () => {
    it('should throw descriptive error when no encryption secret is present (fail closed)', () => {
      const originalSms = process.env.SMS_ENCRYPTION_SECRET;
      const originalEnc = process.env.ENCRYPTION_KEY;
      const originalSess = process.env.SESSION_SECRET;

      delete process.env.SMS_ENCRYPTION_SECRET;
      delete process.env.ENCRYPTION_KEY;
      delete process.env.SESSION_SECRET;

      expect(() => getEncryptionKey()).toThrow(/CRITICAL SECURITY ERROR/);

      // Restore
      if (originalSms) process.env.SMS_ENCRYPTION_SECRET = originalSms;
      if (originalEnc) process.env.ENCRYPTION_KEY = originalEnc;
      if (originalSess) process.env.SESSION_SECRET = originalSess;
    });

    it('should properly encrypt and decrypt credentials when key is configured', () => {
      process.env.SMS_ENCRYPTION_SECRET = 'test-secret-key-at-least-32-chars-long-2026-prod';
      const secret = 'my-gateway-api-key-998877';
      const encrypted = encryptSensitiveValue(secret);

      expect(encrypted).not.toBe(secret);
      expect(encrypted).toContain(':');

      const decrypted = decryptSensitiveValue(encrypted);
      expect(decrypted).toBe(secret);
    });
  });

  describe('3. Tenant Storage Isolation & Media Asset Upload', () => {
    it('should upload media asset and enforce tenant isolation', async () => {
      const tenant = await db.tenant.findFirst();
      if (!tenant) return;

      const uploadResult = await MediaStorageService.uploadMedia({
        tenantIdentifier: tenant.slug,
        entityType: 'STUDENT',
        category: 'PROFILE_PHOTO',
        fileBuffer: validJpegBuffer,
        fileName: 'test-profile.jpg',
        mimeType: 'image/jpeg',
        source: 'DIRECT_UPLOAD'
      });

      expect(uploadResult.mediaAsset.id).toBeDefined();
      expect(uploadResult.url).toBe(`/api/media/${uploadResult.mediaAsset.id}`);
      expect(uploadResult.objectKey).toContain(`tenants/${tenant.id}/student/general/profile_photo/`);

      // Verify cross-tenant isolation
      const retrieved = await MediaStorageService.getMediaAsset(uploadResult.mediaAsset.id, tenant.id);
      expect(retrieved.mediaAsset.id).toBe(uploadResult.mediaAsset.id);

      // Attempt access with different tenant ID should fail
      await expect(
        MediaStorageService.getMediaAsset(uploadResult.mediaAsset.id, 'other-tenant-uuid-9999')
      ).rejects.toThrow(/Access to media asset from another tenant is forbidden/);
    });
  });

  describe('4. Student Photo Lifecycle & Guardian Photo Support', () => {
    it('should update and remove student photo with audit logging', async () => {
      const tenant = await db.tenant.findFirst({ include: { institution: true } });
      if (!tenant) return;

      const institutionId = tenant.institution?.id || tenant.id;

      let campus = await db.campus.findFirst({ where: { institutionId } });
      if (!campus) {
        campus = await db.campus.create({
          data: {
            institutionId,
            name: 'Test Campus',
            code: 'TC',
            address: 'Dhaka, Bangladesh',
            type: 'MAIN'
          }
        });
      }

      let student = await db.student.findFirst({
        where: { campusId: campus.id }
      });
      if (!student) {
        student = await db.student.create({
          data: {
            campusId: campus.id,
            studentIdNumber: `STD-TEST-${Date.now().toString().slice(-4)}`,
            admissionNumber: `ADM-TEST-${Date.now().toString().slice(-4)}`,
            firstName: 'Test',
            lastName: 'Applicant',
            dateOfBirth: new Date('2012-01-01'),
            gender: 'Male',
            presentAddress: 'Dhaka',
            permanentAddress: 'Dhaka'
          }
        });
      }

      const updated = await MediaStorageService.updateStudentPhoto(
        tenant.slug,
        student.id,
        validPngBuffer,
        'new-avatar.png',
        'image/png',
        'test-user-id'
      );

      expect(updated.studentId).toBe(student.id);
      expect(updated.photoUrl).toContain('/api/media/');

      // Verify db student record was updated
      const freshStudent = await db.student.findUnique({ where: { id: student.id } });
      expect(freshStudent?.photoUrl).toBe(updated.photoUrl);

      // Remove photo
      await MediaStorageService.removeStudentPhoto(tenant.slug, student.id, 'test-user-id');
      const clearedStudent = await db.student.findUnique({ where: { id: student.id } });
      expect(clearedStudent?.photoUrl).toBeNull();
    });

    it('should support optional father and mother photos on Guardian record', async () => {
      const tenant = await db.tenant.findFirst();
      if (!tenant) return;

      let guardian = await db.guardian.findFirst();
      if (!guardian) {
        guardian = await db.guardian.create({
          data: {
            fatherName: 'Test Father',
            fatherPhone: '01711111111',
            motherName: 'Test Mother',
            guardianName: 'Test Father',
            guardianPhone: '01711111111'
          }
        });
      }

      // Update Father Photo
      const fatherUpdate = await MediaStorageService.updateGuardianPhoto(
        tenant.slug,
        guardian.id,
        'FATHER',
        validWebpBuffer,
        'father.webp',
        'image/webp',
        'test-user-id'
      );

      expect(fatherUpdate.guardianId).toBe(guardian.id);
      expect(fatherUpdate.photoUrl).toContain('/api/media/');

      const freshGuardian = await db.guardian.findUnique({ where: { id: guardian.id } });
      expect(freshGuardian?.fatherPhotoUrl).toBe(fatherUpdate.photoUrl);

      // Remove Father Photo
      await MediaStorageService.removeGuardianPhoto(tenant.slug, guardian.id, 'FATHER', 'test-user-id');
      const clearedGuardian = await db.guardian.findUnique({ where: { id: guardian.id } });
      expect(clearedGuardian?.fatherPhotoUrl).toBeNull();
    });
  });
});
