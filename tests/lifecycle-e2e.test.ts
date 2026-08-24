import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db';
import {
  createAdmissionApplication,
  transitionAdmissionStatus,
  convertApplicantToStudent
} from '@/lib/services/admission-service';
import { recordAttendanceSession, getStudentAttendanceRate } from '@/lib/services/attendance-service';
import { saveMarksEntries } from '@/lib/services/exam-service';
import { createStudentInvoice, recordInvoicePayment } from '@/lib/services/finance-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('Complete Student Lifecycle End-to-End Integration Workflow', () => {
  const adminActor: SessionUser = {
    id: 'USR-LIFECYCLE-ADMIN',
    email: 'principal@dims.edu.bd',
    name: 'Principal Mahmudur Rahman',
    role: 'PRINCIPAL',
    tenantId: 'dhaka-ideal-school',
    status: UserStatus.ACTIVE,
    isPlatformAdmin: false
  };

  it('executes: Application -> Test -> Admitted -> Attendance -> Exam Marks -> Invoicing -> Payment -> GL Posting', async () => {
    const campus = await db.campus.findFirst({
      where: { institution: { tenant: { slug: 'dhaka-ideal-school' } } }
    });
    const academicYear = await db.academicYear.findFirst({
      where: { institution: { tenant: { slug: 'dhaka-ideal-school' } } }
    });
    const subject = await db.subject.findFirst({
      where: { class: { institution: { tenant: { slug: 'dhaka-ideal-school' } } } }
    });
    const exam = await db.exam.findFirst({
      where: { session: { academicYear: { institution: { tenant: { slug: 'dhaka-ideal-school' } } } } }
    });

    if (!campus || !academicYear || !subject || !exam) {
      throw new Error('Seed data missing for lifecycle E2E test');
    }

    // Step 1: Submit Application
    const app = await createAdmissionApplication('dhaka-ideal-school', {
      campusId: campus.id,
      academicYearId: academicYear.id,
      firstName: 'Tanvir',
      lastName: 'Hossain',
      dateOfBirth: '2010-08-14',
      gender: 'Male',
      phone: '+880 1711-998877',
      presentAddress: 'Banani, Dhaka',
      permanentAddress: 'Banani, Dhaka',
      guardianName: 'Kabir Hossain',
      guardianPhone: '+880 1711-998877'
    });
    expect(app.status).toBe('SUBMITTED');

    // Step 2: Transition through Selection
    await transitionAdmissionStatus('dhaka-ideal-school', app.id, 'UNDER_REVIEW', adminActor);
    await transitionAdmissionStatus('dhaka-ideal-school', app.id, 'VERIFIED', adminActor);
    await transitionAdmissionStatus('dhaka-ideal-school', app.id, 'TEST_ELIGIBLE', adminActor);
    await transitionAdmissionStatus('dhaka-ideal-school', app.id, 'TESTED', adminActor);
    await transitionAdmissionStatus('dhaka-ideal-school', app.id, 'SELECTED', adminActor);

    // Step 3: Atomic Conversion to Student
    const student = await convertApplicantToStudent('dhaka-ideal-school', app.id, null, adminActor);
    expect(student.status).toBe('ACTIVE');
    expect(student.studentIdNumber).toMatch(/^STU-2026-\d{4}$/);

    // Step 4: Record Attendance Session
    await recordAttendanceSession(
      'dhaka-ideal-school',
      {
        campusId: campus.id,
        date: '2026-08-24',
        periodNumber: 1,
        records: [{ studentId: student.id, status: 'PRESENT' }]
      },
      adminActor
    );

    const attendanceRate = await getStudentAttendanceRate('dhaka-ideal-school', student.id);
    expect(attendanceRate.attendancePercentage).toBe(100);
    expect(attendanceRate.status).toBe('ELIGIBLE');

    // Step 5: Enter Marks & Calculate Result
    const marksResult = await saveMarksEntries(
      'dhaka-ideal-school',
      exam.id,
      subject.id,
      [
        {
          studentId: student.id,
          theoryMarks: 65,
          assignmentMarks: 18,
          attendanceMarks: 10
        }
      ],
      adminActor
    );
    expect(marksResult[0].letterGrade).toBe('A+');
    expect(marksResult[0].gradePoint).toBe(5.0);

    // Step 6: Create Monthly Fee Invoice
    const invoice = await createStudentInvoice(
      'dhaka-ideal-school',
      {
        studentId: student.id,
        title: 'Monthly Tuition Fee - September 2026',
        subTotal: 3000,
        dueDate: '2026-09-15'
      },
      adminActor
    );
    expect(invoice.dueAmount).toBe(3000);

    // Step 7: Pay Fee & Verify General Ledger Voucher Entry
    const payment = await recordInvoicePayment(
      'dhaka-ideal-school',
      {
        invoiceId: invoice.id,
        amount: 3000,
        gateway: 'BKASH',
        transactionRef: `E2E-BKASH-${Date.now()}`
      },
      adminActor
    );
    expect(payment.status).toBe('PAID');
    expect(payment.dueAmount).toBe(0);

    const journal = await db.journalEntry.findFirst({
      where: { entryNumber: payment.journalEntryNumber },
      include: { lines: true }
    });
    expect(journal).toBeDefined();
    expect(journal?.lines.length).toBe(2);

    const debit = journal?.lines.find((l) => l.debitAmount > 0)?.debitAmount;
    const credit = journal?.lines.find((l) => l.creditAmount > 0)?.creditAmount;
    expect(debit).toBe(3000);
    expect(credit).toBe(3000);
  });
});
