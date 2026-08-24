import { db } from '../db';
import { AppError } from '../errors/app-error';
import { logAuditEvent } from '../audit/audit-logger';
import { SessionUser } from '../auth/types';
import { requireTenant } from '../tenant/tenant-guard';
import { OfficialTranscriptIssueSchema } from '../validations/schemas';
import { calculateUniversityCgpa } from './exam-service';

export async function generateReportCard(
  tenantIdentifier: string,
  studentId: string,
  examId: string,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);

  const institution = await db.institution.findUnique({
    where: { id: tenant.institutionId },
    include: { campuses: true }
  });

  const student = await db.student.findFirst({
    where: { id: studentId, campus: { institutionId: tenant.institutionId } },
    include: {
      campus: true,
      section: { include: { class: true } },
      guardian: true,
      enrollments: { include: { class: true, academicYear: true } }
    }
  });

  if (!student) throw AppError.notFound('Student not found.');

  const exam = await db.exam.findFirst({
    where: { id: examId, institutionId: tenant.institutionId },
    include: { session: { include: { academicYear: true } } }
  });

  if (!exam) throw AppError.notFound('Exam not found.');

  // Fetch current result snapshot
  const snapshot = await db.examResultSnapshot.findFirst({
    where: { examId, studentId, isCurrent: true }
  });

  if (!snapshot) {
    throw AppError.notFound('No finalized examination result snapshot found for this student.');
  }

  // Attendance summary
  const attendances = await db.attendanceRecord.findMany({
    where: { studentId }
  });
  const totalDays = attendances.length;
  const presentDays = attendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : '100.0';

  const subjectResults = JSON.parse(snapshot.subjectResultsJson || '[]');

  const verificationUrl = `/results?tenant=${tenant.slug}&studentIdNumber=${student.studentIdNumber}&examId=${examId}`;

  const reportCardData = {
    institution: {
      name: institution?.name,
      shortName: institution?.shortName,
      eiin: institution?.eiin,
      boardAffiliation: institution?.boardAffiliation,
      address: institution?.address,
      phone: institution?.phone,
      email: institution?.email,
      logoUrl: institution?.logoUrl
    },
    student: {
      name: `${student.firstName} ${student.lastName}`,
      studentIdNumber: student.studentIdNumber,
      rollNumber: student.rollNumber,
      class: student.section?.class?.name || student.enrollments[0]?.class?.name || 'N/A',
      section: student.section?.name || 'A',
      academicYear: exam.session.academicYear.name,
      guardianName: student.guardian?.fatherName || student.guardian?.guardianName || 'N/A'
    },
    exam: {
      name: exam.name,
      termNumber: exam.termNumber,
      startDate: exam.startDate,
      endDate: exam.endDate
    },
    results: {
      gpa: snapshot.gpa,
      percentage: snapshot.percentage,
      letterGrade: snapshot.letterGrade,
      isPassed: snapshot.isPassed,
      positionInClass: snapshot.positionInClass,
      positionInSection: snapshot.positionInSection,
      subjects: subjectResults
    },
    attendance: {
      totalDays,
      presentDays,
      attendanceRate: `${attendanceRate}%`
    },
    signatories: {
      classTeacherRemark: snapshot.isPassed ? 'Satisfactory academic progress. Promoted.' : 'Needs improvement in core subjects.',
      principalHeadName: institution?.principalHeadName || 'Head of Institution',
      principalHeadTitle: institution?.principalHeadTitle || 'Principal',
      issuedDate: snapshot.approvedAt || new Date()
    },
    qrVerificationUrl: verificationUrl
  };

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'REPORT_CARD_GENERATED',
    resourceType: 'ExamResultSnapshot',
    resourceId: snapshot.id,
    newState: { studentId, examId, gpa: snapshot.gpa }
  });

  return reportCardData;
}

export async function issueOfficialTranscript(
  tenantIdentifier: string,
  rawData: unknown,
  actor: SessionUser
) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = OfficialTranscriptIssueSchema.parse(rawData);

  const student = await db.student.findFirst({
    where: { id: validated.studentId, campus: { institutionId: tenant.institutionId } },
    include: {
      campus: true,
      batch: { include: { program: true } },
      courseRegistrations: {
        include: { course: true },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!student) throw AppError.notFound('Student not found.');

  // Group course registrations by semester
  const semesterMap = new Map<string, typeof student.courseRegistrations>();
  for (const reg of student.courseRegistrations) {
    if (!semesterMap.has(reg.semester)) {
      semesterMap.set(reg.semester, []);
    }
    semesterMap.get(reg.semester)!.push(reg);
  }

  const semesterRoadmap: any[] = [];
  const allCompletedCourses: { courseCode: string; creditHours: number; gradePoint: number }[] = [];

  for (const [semName, regList] of semesterMap.entries()) {
    const courses = regList.map((r) => ({
      courseCode: r.course.code,
      title: r.course.title,
      creditHours: r.course.creditHours,
      gradePoint: r.gradePoint || 0.0,
      letterGrade: r.letterGrade || (r.status === 'ENROLLED' ? 'IP' : 'F'),
      status: r.status
    }));

    const semCalc = calculateUniversityCgpa(courses);

    semesterRoadmap.push({
      semester: semName,
      courses,
      semesterCredits: semCalc.totalCredits,
      earnedCredits: semCalc.earnedCredits,
      semesterGpa: semCalc.cgpa
    });

    for (const c of courses) {
      if (c.status === 'COMPLETED') {
        // Handle retakes: latest grade or highest grade replaces previous entry
        const existingIdx = allCompletedCourses.findIndex((ac) => ac.courseCode === c.courseCode);
        if (existingIdx >= 0) {
          allCompletedCourses[existingIdx] = {
            courseCode: c.courseCode,
            creditHours: c.creditHours,
            gradePoint: Math.max(allCompletedCourses[existingIdx].gradePoint, c.gradePoint)
          };
        } else {
          allCompletedCourses.push({
            courseCode: c.courseCode,
            creditHours: c.creditHours,
            gradePoint: c.gradePoint
          });
        }
      }
    }
  }

  const overall = calculateUniversityCgpa(allCompletedCourses);
  const transcriptNumber = `TR-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const qrUrl = `/verify/${transcriptNumber}`;

  let academicStatus = 'GOOD_STANDING';
  if (overall.cgpa < 2.0 && overall.totalCredits > 12) {
    academicStatus = 'PROBATION';
  } else if (student.status === 'GRADUATED') {
    academicStatus = 'GRADUATED';
  }

  const snapshotData = {
    transcriptNumber,
    student: {
      name: `${student.firstName} ${student.lastName}`,
      studentIdNumber: student.studentIdNumber,
      program: student.batch?.program.name || 'Undergraduate Degree',
      degreeLevel: student.batch?.program.degreeLevel || 'BACHELOR'
    },
    semesters: semesterRoadmap,
    totalCreditsCompleted: overall.earnedCredits,
    cumulativeCgpa: overall.cgpa,
    academicStatus,
    issueDate: new Date(),
    signatory: actor.name || 'Controller of Examinations'
  };

  const transcript = await db.officialTranscript.create({
    data: {
      institutionId: tenant.institutionId,
      studentId: student.id,
      transcriptType: validated.transcriptType,
      transcriptNumber,
      totalCreditsCompleted: overall.earnedCredits,
      cgpa: overall.cgpa,
      degreeAwarded: student.status === 'GRADUATED' ? student.batch?.program.name : null,
      academicStatus,
      dataSnapshotJson: JSON.stringify(snapshotData),
      issuedBy: actor.name || actor.email,
      qrVerificationUrl: qrUrl
    }
  });

  await logAuditEvent({
    tenantId: tenant.tenantId,
    actor,
    action: 'OFFICIAL_TRANSCRIPT_ISSUED',
    resourceType: 'OfficialTranscript',
    resourceId: transcript.id,
    newState: {
      transcriptNumber,
      studentId: student.id,
      cgpa: overall.cgpa,
      totalCredits: overall.earnedCredits
    }
  });

  return transcript;
}

export async function getTranscriptByNumber(transcriptNumber: string) {
  const transcript = await db.officialTranscript.findUnique({
    where: { transcriptNumber },
    include: {
      institution: true,
      student: { include: { campus: true } }
    }
  });

  if (!transcript) throw AppError.notFound('Official transcript not found.');

  return {
    ...transcript,
    snapshot: JSON.parse(transcript.dataSnapshotJson)
  };
}
