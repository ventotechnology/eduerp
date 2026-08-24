import { db } from '../db';
import { AppError } from '../errors/app-error';
import { logAuditEvent } from '../audit/audit-logger';
import { SessionUser } from '../auth/types';

export interface CsvStudentRow {
  studentIdNumber: string;
  admissionNumber: string;
  rollNumber?: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  phone?: string;
  email?: string;
  presentAddress: string;
  permanentAddress: string;
  guardianName: string;
  guardianPhone: string;
}

export interface CsvValidationResult {
  validRows: CsvStudentRow[];
  errors: Array<{ row: number; error: string }>;
  totalRows: number;
}

/**
 * Parses and validates CSV text format.
 */
export function parseAndValidateStudentCsv(csvContent: string): CsvValidationResult {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw AppError.validation('CSV file must contain a header row and at least one data row.');
  }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const validRows: CsvStudentRow[] = [];
  const errors: Array<{ row: number; error: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    if (cols.length < 5) {
      errors.push({ row: i + 1, error: 'Insufficient columns in row.' });
      continue;
    }

    const rowObj: any = {};
    header.forEach((h, idx) => {
      rowObj[h] = cols[idx] || '';
    });

    const studentIdNumber = rowObj['studentid'] || rowObj['student_id'] || cols[0];
    const firstName = rowObj['firstname'] || rowObj['first_name'] || cols[1];
    const lastName = rowObj['lastname'] || rowObj['last_name'] || cols[2];
    const gender = (rowObj['gender'] || cols[3] || 'Male') as any;
    const dob = rowObj['dob'] || rowObj['dateofbirth'] || cols[4] || '2010-01-01';

    if (!studentIdNumber || !firstName || !lastName) {
      errors.push({ row: i + 1, error: 'Missing required fields (Student ID or Name).' });
      continue;
    }

    validRows.push({
      studentIdNumber,
      admissionNumber: rowObj['admission_number'] || studentIdNumber,
      rollNumber: rowObj['roll'] || undefined,
      firstName,
      lastName,
      gender: ['Male', 'Female', 'Other'].includes(gender) ? gender : 'Male',
      dateOfBirth: dob,
      phone: rowObj['phone'] || undefined,
      email: rowObj['email'] || undefined,
      presentAddress: rowObj['address'] || 'Dhaka, Bangladesh',
      permanentAddress: rowObj['address'] || 'Dhaka, Bangladesh',
      guardianName: rowObj['guardian_name'] || 'Guardian of ' + firstName,
      guardianPhone: rowObj['guardian_phone'] || '+880 1700-000000'
    });
  }

  return {
    validRows,
    errors,
    totalRows: lines.length - 1
  };
}

/**
 * Batch imports validated CSV rows into the tenant database.
 */
export async function batchImportStudents(
  tenantId: string,
  campusId: string,
  rows: CsvStudentRow[],
  actor: SessionUser
) {
  const campus = await db.campus.findFirst({
    where: { id: campusId, institution: { tenantId } }
  });

  if (!campus) {
    throw AppError.notFound('Invalid campus for this institution.');
  }

  return db.$transaction(async (tx) => {
    const created = [];

    for (const row of rows) {
      // Check existing ID
      const exists = await tx.student.findFirst({
        where: {
          studentIdNumber: row.studentIdNumber,
          campus: { institution: { tenantId } }
        }
      });

      if (exists) {
        continue; // Skip existing
      }

      const guardian = await tx.guardian.create({
        data: {
          fatherName: row.guardianName,
          fatherPhone: row.guardianPhone,
          motherName: 'Mother of ' + row.firstName,
          guardianName: row.guardianName,
          guardianPhone: row.guardianPhone
        }
      });

      const student = await tx.student.create({
        data: {
          campusId: campus.id,
          studentIdNumber: row.studentIdNumber,
          admissionNumber: row.admissionNumber,
          rollNumber: row.rollNumber || null,
          firstName: row.firstName,
          lastName: row.lastName,
          dateOfBirth: new Date(row.dateOfBirth),
          gender: row.gender,
          presentAddress: row.presentAddress,
          permanentAddress: row.permanentAddress,
          phone: row.phone || null,
          email: row.email || null,
          guardianId: guardian.id,
          status: 'ACTIVE'
        }
      });

      created.push(student);
    }

    await logAuditEvent({
      tenantId,
      actor,
      action: 'CSV_STUDENTS_BATCH_IMPORTED',
      resourceType: 'Student',
      newState: {
        importedCount: created.length,
        totalSubmitted: rows.length
      }
    });

    return {
      importedCount: created.length,
      skippedCount: rows.length - created.length
    };
  });
}
