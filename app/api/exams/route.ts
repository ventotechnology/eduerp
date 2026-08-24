import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePermission } from '@/lib/rbac/guard';
import {
  createAssessmentComponent,
  getAssessmentComponents,
  createMarkDistributionTemplate,
  getMarkDistributionTemplates,
  createExam,
  getTenantExams,
  scheduleExam,
  getExamSchedules,
  calculateStudentExamEligibility,
  overrideStudentExamEligibility,
  recordBulkMarks,
  transitionMarksWorkflow,
  correctMarkEntry,
  calculateAndFinalizeExamResults,
  publishExamResults,
  getStudentExamResults,
  getPublicExamResult,
  calculateSchoolGpa,
  calculateUniversityCgpa
} from '@/lib/services/exam-service';
import { generateReportCard, issueOfficialTranscript, getTranscriptByNumber } from '@/lib/services/transcript-service';
import { issueCertificate, verifyCertificate, revokeCertificate } from '@/lib/services/certificate-service';
import {
  previewClassPromotion,
  executeClassPromotion,
  evaluateUniversitySemesterProgression,
  evaluateUniversityGraduation,
  processUniversityGraduation
} from '@/lib/services/progression-service';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { successResponse, errorResponse } from '@/lib/errors/api-response';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser, UserStatus } from '@/lib/auth/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const action = searchParams.get('action');

    if (action === 'VERIFY_CERTIFICATE') {
      const certNumber = searchParams.get('certificateNumber');
      const hash = searchParams.get('hash') || undefined;
      if (!certNumber) throw AppError.validation('Certificate number is required.');
      const result = await verifyCertificate(certNumber, hash);
      return successResponse(result);
    }

    if (action === 'GET_TRANSCRIPT') {
      const trNumber = searchParams.get('transcriptNumber');
      if (!trNumber) throw AppError.validation('Transcript number is required.');
      const transcript = await getTranscriptByNumber(trNumber);
      return successResponse(transcript);
    }

    if (action === 'PUBLIC_RESULT') {
      const slug = searchParams.get('slug') || tenantId;
      if (!slug) throw AppError.validation('Tenant slug is required.');
      const query = {
        studentIdNumber: searchParams.get('studentIdNumber') || undefined,
        rollNumber: searchParams.get('rollNumber') || undefined,
        registrationNumber: searchParams.get('registrationNumber') || undefined,
        examId: searchParams.get('examId') || undefined
      };
      const result = await getPublicExamResult(slug, query);
      return successResponse(result);
    }

    if (!tenantId) throw AppError.validation('Tenant ID is required.');

    const session = await getServerSession(req);
    const actor: SessionUser = session || {
      id: 'ANON',
      name: 'Anonymous Query',
      email: 'anon@eduerp.us',
      role: 'PRINCIPAL',
      tenantId,
      status: UserStatus.ACTIVE,
      isPlatformAdmin: false
    };

    if (action === 'COMPONENTS') {
      const components = await getAssessmentComponents(tenantId);
      return successResponse(components);
    }

    if (action === 'TEMPLATES') {
      const templates = await getMarkDistributionTemplates(tenantId);
      return successResponse(templates);
    }

    if (action === 'SCHEDULES') {
      const examId = searchParams.get('examId');
      if (!examId) throw AppError.validation('Exam ID is required.');
      const schedules = await getExamSchedules(tenantId, examId);
      return successResponse(schedules);
    }

    if (action === 'REPORT_CARD') {
      const studentId = searchParams.get('studentId');
      const examId = searchParams.get('examId');
      if (!studentId || !examId) throw AppError.validation('Student ID and Exam ID are required.');
      const reportCard = await generateReportCard(tenantId, studentId, examId, actor);
      return successResponse(reportCard);
    }

    if (action === 'STUDENT_RESULTS') {
      const studentId = searchParams.get('studentId');
      if (!studentId) throw AppError.validation('Student ID is required.');
      const results = await getStudentExamResults(tenantId, studentId, actor);
      return successResponse(results);
    }

    if (action === 'EVAL_PROGRESSION') {
      const studentId = searchParams.get('studentId');
      if (!studentId) throw AppError.validation('Student ID is required.');
      const progression = await evaluateUniversitySemesterProgression(tenantId, studentId, actor);
      return successResponse(progression);
    }

    if (action === 'EVAL_GRADUATION') {
      const studentId = searchParams.get('studentId');
      if (!studentId) throw AppError.validation('Student ID is required.');
      const gradEval = await evaluateUniversityGraduation(tenantId, studentId, actor);
      return successResponse(gradEval);
    }

    const sessionId = searchParams.get('sessionId') || undefined;
    const exams = await getTenantExams(tenantId, sessionId);
    return successResponse(exams);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    const body = await req.json();
    const { action, tenantId, payload } = body;
    const resolvedTenant = tenantId || session?.tenantId;

    if (!resolvedTenant) throw AppError.validation('Tenant ID is required.');

    const actor: SessionUser = session || {
      id: 'USR-ADMIN',
      name: 'System Admin',
      email: 'admin@eduerp.us',
      role: 'PRINCIPAL',
      tenantId: resolvedTenant,
      status: UserStatus.ACTIVE,
      isPlatformAdmin: false
    };

    switch (action) {
      case 'CREATE_COMPONENT': {
        if (session) requirePermission(session, 'CREATE', 'EXAMINATIONS');
        const res = await createAssessmentComponent(resolvedTenant, payload, actor);
        return successResponse(res, 'Assessment component created successfully', 201);
      }
      case 'CREATE_TEMPLATE': {
        if (session) requirePermission(session, 'CREATE', 'EXAMINATIONS');
        const res = await createMarkDistributionTemplate(resolvedTenant, payload, actor);
        return successResponse(res, 'Mark distribution template created successfully', 201);
      }
      case 'CREATE_EXAM': {
        if (session) requirePermission(session, 'CREATE', 'EXAMINATIONS');
        const res = await createExam(resolvedTenant, payload, actor);
        return successResponse(res, 'Exam created successfully', 201);
      }
      case 'SCHEDULE_EXAM': {
        if (session) requirePermission(session, 'CREATE', 'TIMETABLE');
        const res = await scheduleExam(resolvedTenant, payload, actor);
        return successResponse(res, 'Exam scheduled successfully', 201);
      }
      case 'CALCULATE_ELIGIBILITY': {
        if (session) requirePermission(session, 'UPDATE', 'EXAMINATIONS');
        const { examId, requiredAttendancePercent } = payload;
        const res = await calculateStudentExamEligibility(resolvedTenant, examId, actor, requiredAttendancePercent);
        return successResponse(res, 'Student exam eligibilities calculated');
      }
      case 'OVERRIDE_ELIGIBILITY': {
        if (session) requirePermission(session, 'APPROVE', 'EXAMINATIONS');
        const res = await overrideStudentExamEligibility(resolvedTenant, payload, actor);
        return successResponse(res, 'Exam eligibility overridden successfully');
      }
      case 'RECORD_MARKS': {
        if (session) requirePermission(session, 'CREATE', 'MARKS_ENTRY');
        const res = await recordBulkMarks(resolvedTenant, payload, actor);
        return successResponse(res, 'Marks recorded successfully', 201);
      }
      case 'TRANSITION_MARKS_WORKFLOW': {
        if (session) requirePermission(session, 'UPDATE', 'MARKS_ENTRY');
        const res = await transitionMarksWorkflow(resolvedTenant, payload, actor);
        return successResponse(res, `Marks workflow transitioned to ${res.targetStatus}`);
      }
      case 'CORRECT_MARK': {
        if (session) requirePermission(session, 'UPDATE', 'MARKS_ENTRY');
        const res = await correctMarkEntry(resolvedTenant, payload, actor);
        return successResponse(res, 'Mark corrected and logged to audit trail');
      }
      case 'FINALIZE_RESULTS': {
        if (session) requirePermission(session, 'APPROVE', 'EXAMINATIONS');
        const { examId } = payload;
        const res = await calculateAndFinalizeExamResults(resolvedTenant, examId, actor);
        return successResponse(res, 'Results finalized and snapshot generated', 201);
      }
      case 'PUBLISH_RESULTS': {
        if (session) requirePermission(session, 'APPROVE', 'EXAMINATIONS');
        const res = await publishExamResults(resolvedTenant, payload, actor);
        return successResponse(res, `Results published with status: ${res.status}`);
      }
      case 'ISSUE_TRANSCRIPT': {
        if (session) requirePermission(session, 'CREATE', 'TRANSCRIPTS');
        const res = await issueOfficialTranscript(resolvedTenant, payload, actor);
        return successResponse(res, 'Official transcript issued successfully', 201);
      }
      case 'ISSUE_CERTIFICATE': {
        if (session) requirePermission(session, 'CREATE', 'TRANSCRIPTS');
        const res = await issueCertificate(resolvedTenant, payload, actor);
        return successResponse(res, 'Certificate issued successfully', 201);
      }
      case 'REVOKE_CERTIFICATE': {
        if (session) requirePermission(session, 'DELETE', 'TRANSCRIPTS');
        const res = await revokeCertificate(resolvedTenant, payload, actor);
        return successResponse(res, 'Certificate revoked successfully');
      }
      case 'PREVIEW_PROMOTION': {
        if (session) requirePermission(session, 'VIEW', 'STUDENTS');
        const res = await previewClassPromotion(resolvedTenant, payload, actor);
        return successResponse(res, 'Promotion preview calculated');
      }
      case 'EXECUTE_PROMOTION': {
        if (session) requirePermission(session, 'APPROVE', 'STUDENTS');
        const res = await executeClassPromotion(resolvedTenant, payload, actor);
        return successResponse(res, 'Class promotion executed successfully', 201);
      }
      case 'PROCESS_GRADUATION': {
        if (session) requirePermission(session, 'APPROVE', 'STUDENTS');
        const res = await processUniversityGraduation(resolvedTenant, payload, actor);
        return successResponse(res, 'University graduation processed successfully', 201);
      }
      default:
        throw AppError.validation(`Unsupported action: ${action}`);
    }
  } catch (err) {
    return errorResponse(err);
  }
}
