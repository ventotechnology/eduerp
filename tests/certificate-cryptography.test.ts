import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../lib/db';
import {
  issueCertificate,
  verifyCertificate,
  revokeCertificate,
  computeCertificateHash
} from '../lib/services/certificate-service';
import { SessionUser, UserStatus } from '../lib/auth/types';

const mockAdmin: SessionUser = {
  id: 'USR-CERT-ADMIN',
  name: 'Registrar Admin',
  email: 'registrar@scholars.edu.bd',
  role: 'PRINCIPAL',
  tenantId: 'scholars-dhaka',
  status: UserStatus.ACTIVE,
  isPlatformAdmin: false
};

describe('Cryptographic Certificate Issuance & Verification Engine (COMMAND 4)', () => {
  let institutionId: string;
  let studentId: string;
  let issuedCertNumber: string;
  let originalHash: string;

  beforeAll(async () => {
    const tenant = await db.tenant.upsert({
      where: { slug: 'scholars-dhaka' },
      update: {},
      create: {
        slug: 'scholars-dhaka',
        institutionType: 'SCHOOL',
        subscriptionTier: 'PROFESSIONAL',
        isActive: true
      }
    });

    const institution = await db.institution.upsert({
      where: { tenantId: tenant.id },
      update: {},
      create: {
        tenantId: tenant.id,
        name: 'Dhaka Scholars International School',
        shortName: 'DIMS',
        eiin: '108456',
        boardAffiliation: 'DHAKA',
        address: 'Dhanmondi, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '+880 1711-000000',
        email: 'info@scholars.edu.bd'
      }
    });
    institutionId = institution.id;

    const campus = await db.campus.upsert({
      where: { institutionId_code: { institutionId, code: 'MAIN' } },
      update: {},
      create: {
        institutionId,
        name: 'Main Campus',
        code: 'MAIN',
        address: 'Dhanmondi'
      }
    });

    const st = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: 'ST-CERT-001',
        admissionNumber: 'ADM-CERT-001',
        firstName: 'Shahriar',
        lastName: 'Nafees',
        dateOfBirth: new Date('2008-01-15'),
        gender: 'Male',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka'
      }
    });
    studentId = st.id;
  });

  it('issues a certificate with formatted number and cryptographic HMAC-SHA256 integrity hash', async () => {
    const cert = await issueCertificate(
      'scholars-dhaka',
      {
        studentId,
        certificateType: 'TESTIMONIAL',
        studentName: 'Shahriar Nafees',
        programOrClass: 'Secondary School Certificate (SSC)',
        gpaOrDivision: 'GPA 5.00 (Grade A+)',
        passingYear: 2026,
        signatoryTitle: 'Headmaster'
      },
      mockAdmin
    );

    expect(cert).toBeDefined();
    expect(cert.certificateNumber).toMatch(/^CERT-2026-\d{6}$/);
    expect(cert.integrityHash).toBeDefined();
    expect(cert.integrityHash.length).toBe(64); // SHA-256 hex string
    expect(cert.isRevoked).toBe(false);

    issuedCertNumber = cert.certificateNumber;
    originalHash = cert.integrityHash;
  });

  it('verifies valid authentic certificate against central database', async () => {
    const vrf = await verifyCertificate(issuedCertNumber);

    expect(vrf.isValid).toBe(true);
    expect(vrf.status).toBe('VALID');
    expect(vrf.studentName).toBe('Shahriar Nafees');
    expect(vrf.certificateType).toBe('TESTIMONIAL');
    expect(vrf.integrityHash).toBe(originalHash);
  });

  it('detects and rejects forged verification hash', async () => {
    const fakeHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const vrf = await verifyCertificate(issuedCertNumber, fakeHash);

    expect(vrf.isValid).toBe(false);
    expect(vrf.status).toBe('INVALID_HASH');
    expect(vrf.message).toMatch(/Provided verification hash does not match/);
  });

  it('revokes certificate with reason and verifies that registry status becomes officially REVOKED', async () => {
    const revoked = await revokeCertificate(
      'scholars-dhaka',
      {
        certificateNumber: issuedCertNumber,
        reason: 'Issued with clerical error in father name; superseded by new record.'
      },
      mockAdmin
    );

    expect(revoked.isRevoked).toBe(true);
    expect(revoked.revocationReason).toBe('Issued with clerical error in father name; superseded by new record.');

    // Verify on public portal
    const vrf = await verifyCertificate(issuedCertNumber);
    expect(vrf.isValid).toBe(false);
    expect(vrf.status).toBe('REVOKED');
    expect(vrf.revocationReason).toBe('Issued with clerical error in father name; superseded by new record.');
  });
});
