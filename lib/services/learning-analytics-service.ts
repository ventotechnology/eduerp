import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { getLmsCourses } from './lms-course-service';

export async function getStudentLearningDashboard(tenantIdentifier: string, studentId: string) {
  const tenant = await requireTenant(tenantIdentifier);

  const student = await db.student.findFirst({
    where: { id: studentId, campus: { institutionId: tenant.institutionId } },
  });
  if (!student) throw AppError.notFound('Student not found.');

  // Get active enrolled courses
  const courses = await getLmsCourses(tenantIdentifier, { studentId: student.id, status: 'PUBLISHED' });
  const courseIds = courses.map((c) => c.id);

  // Get course progress records
  const progressList = await db.lmsCourseProgress.findMany({
    where: { studentId: student.id, courseId: { in: courseIds } },
  });
  const progressMap = new Map(progressList.map((p) => [p.courseId, p]));

  // Pending Homeworks & Assignments
  const now = new Date();
  const homeworks = await db.lmsHomework.findMany({
    where: { courseId: { in: courseIds }, dueDate: { gte: now }, status: 'PUBLISHED' },
    include: {
      submissions: { where: { studentId: student.id } },
      course: { select: { title: true, code: true } },
    },
    orderBy: { dueDate: 'asc' },
    take: 5,
  });

  const assignments = await db.lmsAssignment.findMany({
    where: { courseId: { in: courseIds }, dueDate: { gte: now }, status: 'PUBLISHED' },
    include: {
      submissions: { where: { studentId: student.id } },
      course: { select: { title: true, code: true } },
    },
    orderBy: { dueDate: 'asc' },
    take: 5,
  });

  // Upcoming Quizzes
  const quizzes = await db.lmsQuiz.findMany({
    where: { courseId: { in: courseIds }, closeTime: { gte: now }, status: 'PUBLISHED' },
    include: {
      attempts: { where: { studentId: student.id } },
      course: { select: { title: true, code: true } },
    },
    orderBy: { closeTime: 'asc' },
    take: 5,
  });

  // Upcoming Online Classes
  const onlineClasses = await db.lmsOnlineClass.findMany({
    where: { courseId: { in: courseIds }, classDate: { gte: new Date(now.setHours(0, 0, 0, 0)) }, status: 'SCHEDULED' },
    include: {
      teacher: { select: { firstName: true, lastName: true } },
      course: { select: { title: true, code: true } },
    },
    orderBy: { classDate: 'asc' },
    take: 5,
  });

  return {
    student: {
      id: student.id,
      studentIdNumber: student.studentIdNumber,
      firstName: student.firstName,
      lastName: student.lastName,
    },
    enrolledCourses: courses.map((c) => ({
      ...c,
      progress: progressMap.get(c.id) || { progressPercentage: 0, status: 'NOT_STARTED' },
    })),
    pendingHomeworks: homeworks.map((h) => ({
      ...h,
      isSubmitted: h.submissions.length > 0,
    })),
    pendingAssignments: assignments.map((a) => ({
      ...a,
      isSubmitted: a.submissions.length > 0,
    })),
    upcomingQuizzes: quizzes.map((q) => ({
      ...q,
      hasAttempted: q.attempts.length > 0,
    })),
    upcomingOnlineClasses: onlineClasses,
  };
}

export async function getTeacherLmsDashboard(tenantIdentifier: string, teacherId: string) {
  const tenant = await requireTenant(tenantIdentifier);

  const teacher = await db.employee.findFirst({
    where: { id: teacherId, campus: { institutionId: tenant.institutionId } },
  });
  if (!teacher) throw AppError.notFound('Teacher employee not found.');

  // Courses where actor is primary teacher
  const courses = await db.lmsCourse.findMany({
    where: { primaryTeacherId: teacher.id, institutionId: tenant.institutionId },
    include: {
      _count: { select: { modules: true, assignments: true, quizzes: true, onlineClasses: true } },
    },
  });
  const courseIds = courses.map((c) => c.id);

  // Submissions pending grading
  const pendingGradingCount = await db.lmsAssignmentSubmission.count({
    where: {
      status: 'SUBMITTED',
      assignment: { courseId: { in: courseIds } },
    },
  });

  // Quizzes with pending manual evaluation
  const pendingQuizGradingCount = await db.lmsQuizResponse.count({
    where: {
      isAutoGraded: false,
      scoreAwarded: 0,
      attempt: { quiz: { courseId: { in: courseIds } } },
    },
  });

  return {
    teacher: {
      id: teacher.id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      designation: teacher.designation,
    },
    activeCourses: courses,
    metrics: {
      totalCourses: courses.length,
      pendingAssignmentGradingCount: pendingGradingCount,
      pendingQuizGradingCount: pendingQuizGradingCount,
    },
  };
}

export async function getGuardianLmsView(tenantIdentifier: string, guardianId: string, studentId: string) {
  const tenant = await requireTenant(tenantIdentifier);

  // Validate guardian linkage to student
  const link = await db.studentGuardian.findFirst({
    where: {
      guardianId,
      studentId,
      student: { campus: { institutionId: tenant.institutionId } },
    },
  });
  if (!link) {
    throw AppError.forbidden('Guardian is not authorized to access LMS records for this student.');
  }

  return getStudentLearningDashboard(tenantIdentifier, studentId);
}

export async function getCourseLearningAnalytics(tenantIdentifier: string, courseId: string) {
  const tenant = await requireTenant(tenantIdentifier);

  const course = await db.lmsCourse.findFirst({
    where: { id: courseId, institutionId: tenant.institutionId },
  });
  if (!course) throw AppError.notFound('LMS Course not found.');

  const progressRecords = await db.lmsCourseProgress.findMany({
    where: { courseId: course.id },
    include: {
      student: { select: { id: true, studentIdNumber: true, firstName: true, lastName: true } },
    },
  });

  const totalEnrolled = progressRecords.length;
  const completedCount = progressRecords.filter((p) => p.status === 'COMPLETED').length;
  const avgProgress = totalEnrolled > 0
    ? Math.round(progressRecords.reduce((sum, p) => sum + p.progressPercentage, 0) / totalEnrolled)
    : 0;

  // Deterministic early warning alerts: RULE_BASED_LEARNING_ALERT
  const earlyWarningAlerts = progressRecords
    .filter((p) => p.progressPercentage < 30)
    .map((p) => ({
      studentId: p.studentId,
      studentName: `${p.student.firstName} ${p.student.lastName}`,
      studentIdNumber: p.student.studentIdNumber,
      alertType: 'RULE_BASED_LEARNING_ALERT',
      severity: 'WARNING',
      reason: `Course progress is at ${p.progressPercentage}%, falling behind class benchmark.`,
      recommendedAction: 'Teacher intervention and peer study group assignment.',
    }));

  return {
    courseId: course.id,
    courseTitle: course.title,
    metrics: {
      totalEnrolled,
      completedCount,
      completionRatePercent: totalEnrolled > 0 ? Math.round((completedCount / totalEnrolled) * 100) : 0,
      averageProgressPercent: avgProgress,
    },
    earlyWarningAlerts,
    studentProgress: progressRecords,
  };
}
