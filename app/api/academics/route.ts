import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePermission } from '@/lib/rbac/guard';
import { resolveTenantContext } from '@/lib/tenant/tenant-guard';
import {
  getTenantAcademicStructure,
  createAcademicYear,
  createAcademicSession,
  createShift,
  createAcademicGroup,
  createSubjectCombination,
  createSchoolClass,
  createSchoolSection,
  createSchoolSubject,
  createFaculty,
  createDepartment,
  createProgram,
  createUniversityCourse,
  createCourseOffering,
  createCurriculum,
  createCurriculumVersion,
  createBuilding,
  createClassroom,
  createPeriod,
  setTeacherAvailability,
  createTechnologyTrade,
  recordWorkshopLog,
  recordIndustrialAttachment,
  createAcademicCalendarEvent,
  duplicateAcademicYearStructure
} from '@/lib/services/academic-structure-service';
import { successResponse, errorResponse } from '@/lib/errors/api-response';
import { AppError } from '@/lib/errors/app-error';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || searchParams.get('tenantId');
    const session = await getServerSession(req);

    const tenantContext = await resolveTenantContext({
      session,
      tenantSlug,
      isPublic: !session
    });

    const structure = await getTenantAcademicStructure(tenantContext.tenantId);
    return successResponse(structure);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) throw AppError.unauthenticated();

    const body = await req.json();
    const { action, tenantId, ...data } = body;
    const resolvedTenant = tenantId || session.tenantId;

    if (!resolvedTenant) throw AppError.notFound('Tenant context is required.');
    if (!session.isPlatformAdmin && session.tenantId !== resolvedTenant) throw AppError.crossTenant();

    let result;

    switch (action) {
      case 'CREATE_ACADEMIC_YEAR':
        requirePermission(session, 'CREATE', 'ACADEMIC_YEARS');
        result = await createAcademicYear(resolvedTenant, data, session);
        break;

      case 'CREATE_SESSION':
        requirePermission(session, 'CREATE', 'ACADEMIC_YEARS');
        result = await createAcademicSession(resolvedTenant, data, session);
        break;

      case 'CREATE_SHIFT':
        requirePermission(session, 'CREATE', 'SETTINGS');
        result = await createShift(resolvedTenant, data, session);
        break;

      case 'CREATE_GROUP':
        requirePermission(session, 'CREATE', 'SETTINGS');
        result = await createAcademicGroup(resolvedTenant, data, session);
        break;

      case 'CREATE_COMBINATION':
        requirePermission(session, 'CREATE', 'SETTINGS');
        result = await createSubjectCombination(resolvedTenant, data, session);
        break;

      case 'CREATE_CLASS':
        requirePermission(session, 'CREATE', 'SETTINGS');
        result = await createSchoolClass(resolvedTenant, data, session);
        break;

      case 'CREATE_SECTION':
        requirePermission(session, 'CREATE', 'SETTINGS');
        result = await createSchoolSection(resolvedTenant, data, session);
        break;

      case 'CREATE_SUBJECT':
        requirePermission(session, 'CREATE', 'SETTINGS');
        result = await createSchoolSubject(resolvedTenant, data, session);
        break;

      case 'CREATE_FACULTY':
        requirePermission(session, 'CREATE', 'FACULTY_RESEARCH');
        result = await createFaculty(resolvedTenant, data, session);
        break;

      case 'CREATE_DEPARTMENT':
        requirePermission(session, 'CREATE', 'FACULTY_RESEARCH');
        result = await createDepartment(resolvedTenant, data, session);
        break;

      case 'CREATE_PROGRAM':
        requirePermission(session, 'CREATE', 'SETTINGS');
        result = await createProgram(resolvedTenant, data, session);
        break;

      case 'CREATE_COURSE':
        requirePermission(session, 'CREATE', 'SETTINGS');
        result = await createUniversityCourse(resolvedTenant, data, session);
        break;

      case 'CREATE_COURSE_OFFERING':
        requirePermission(session, 'CREATE', 'SETTINGS');
        result = await createCourseOffering(resolvedTenant, data, session);
        break;

      case 'CREATE_CURRICULUM':
        requirePermission(session, 'CREATE', 'SETTINGS');
        result = await createCurriculum(resolvedTenant, data, session);
        break;

      case 'CREATE_CURRICULUM_VERSION':
        requirePermission(session, 'CREATE', 'SETTINGS');
        result = await createCurriculumVersion(resolvedTenant, data, session);
        break;

      case 'CREATE_BUILDING':
        requirePermission(session, 'CREATE', 'FACILITIES');
        result = await createBuilding(resolvedTenant, data, session);
        break;

      case 'CREATE_CLASSROOM':
        requirePermission(session, 'CREATE', 'FACILITIES');
        result = await createClassroom(resolvedTenant, data, session);
        break;

      case 'CREATE_PERIOD':
        requirePermission(session, 'CREATE', 'SETTINGS');
        result = await createPeriod(resolvedTenant, data, session);
        break;

      case 'SET_TEACHER_AVAILABILITY':
        requirePermission(session, 'CREATE', 'SETTINGS');
        result = await setTeacherAvailability(resolvedTenant, data, session);
        break;

      case 'CREATE_TRADE':
        requirePermission(session, 'CREATE', 'SETTINGS');
        result = await createTechnologyTrade(resolvedTenant, data, session);
        break;

      case 'RECORD_WORKSHOP_LOG':
        requirePermission(session, 'CREATE', 'ACADEMICS');
        result = await recordWorkshopLog(resolvedTenant, data, session);
        break;

      case 'RECORD_INDUSTRIAL_ATTACHMENT':
        requirePermission(session, 'CREATE', 'ACADEMICS');
        result = await recordIndustrialAttachment(resolvedTenant, data, session);
        break;

      case 'CREATE_CALENDAR_EVENT':
        requirePermission(session, 'CREATE', 'ACADEMICS');
        result = await createAcademicCalendarEvent(resolvedTenant, data, session);
        break;

      case 'DUPLICATE_ACADEMIC_YEAR':
        requirePermission(session, 'CREATE', 'ACADEMIC_YEARS');
        result = await duplicateAcademicYearStructure(
          resolvedTenant,
          data.sourceYearId,
          data.newYearName,
          session
        );
        break;

      default:
        throw AppError.validation(`Unsupported academic action: '${action}'`);
    }

    return successResponse(result, 'Academic entity processed successfully', 201);
  } catch (err) {
    return errorResponse(err);
  }
}
