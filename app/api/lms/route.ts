import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { SessionUser } from '@/lib/auth/types';
import {
  createLmsCourse,
  updateLmsCourse,
  getLmsCourses,
  getLmsCourseById,
  saveLmsSyllabus,
  addLearningOutcome,
  createCourseAnnouncement,
  copyLmsCourse,
  archiveLmsCourse,
} from '@/lib/services/lms-course-service';
import {
  createModule,
  createLesson,
  updateLessonProgress,
  getCourseContentWithProgress,
} from '@/lib/services/lesson-service';
import {
  createHomework,
  submitHomework,
  createRubric,
  createAssignment,
  submitAssignment,
  gradeAssignmentSubmission,
} from '@/lib/services/assignment-service';
import {
  createQuestionBankItem,
  approveQuestionBankItem,
  getQuestionBankList,
  generateAiQuestionsDraft,
} from '@/lib/services/question-bank-service';
import {
  createQuiz,
  getQuizStudentView,
  startQuizAttempt,
  submitQuizAttempt,
  gradeManualQuizResponse,
} from '@/lib/services/quiz-service';
import {
  scheduleOnlineClass,
  getOnlineClasses,
  recordOnlineClassAttendance,
} from '@/lib/services/online-class-service';
import {
  createDiscussion,
  createDiscussionPost,
  getDiscussions,
  getDiscussionThread,
  moderateDiscussion,
} from '@/lib/services/discussion-service';
import {
  createGradebookItem,
  getCourseGradebook,
  overrideGradebookScore,
  syncLmsGradeToOfficialExam,
} from '@/lib/services/gradebook-service';
import {
  getStudentLearningDashboard,
  getTeacherLmsDashboard,
  getGuardianLmsView,
  getCourseLearningAnalytics,
} from '@/lib/services/learning-analytics-service';

function getActor(req: NextRequest, tenantId: string): SessionUser {
  return {
    id: req.headers.get('x-user-id') || 'demo-actor-id',
    name: req.headers.get('x-user-name') || 'Demo Instructor',
    email: req.headers.get('x-user-email') || 'instructor@eduerp.us',
    role: (req.headers.get('x-user-role') as any) || 'TEACHER',
    tenantId,
    isPlatformAdmin: req.headers.get('x-is-platform-admin') === 'true',
    status: 'ACTIVE' as any,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenant') || 'dhaka-ideal-school';
    const action = searchParams.get('action') || 'COURSES';
    const courseId = searchParams.get('courseId');
    const studentId = searchParams.get('studentId');
    const teacherId = searchParams.get('teacherId');
    const guardianId = searchParams.get('guardianId');
    const quizId = searchParams.get('quizId');
    const discussionId = searchParams.get('discussionId');

    const actor = getActor(req, tenantSlug);

    switch (action) {
      case 'COURSES': {
        const list = await getLmsCourses(tenantSlug, { studentId: studentId || undefined, teacherId: teacherId || undefined });
        return NextResponse.json({ success: true, data: list });
      }
      case 'COURSE_DETAIL': {
        if (!courseId) return NextResponse.json({ success: false, error: 'courseId required' }, { status: 400 });
        const detail = await getLmsCourseById(tenantSlug, courseId, actor);
        return NextResponse.json({ success: true, data: detail });
      }
      case 'COURSE_CONTENT': {
        if (!courseId) return NextResponse.json({ success: false, error: 'courseId required' }, { status: 400 });
        const content = await getCourseContentWithProgress(tenantSlug, courseId, studentId || undefined);
        return NextResponse.json({ success: true, data: content });
      }
      case 'QUESTION_BANK': {
        const questions = await getQuestionBankList(tenantSlug, {}, actor);
        return NextResponse.json({ success: true, data: questions });
      }
      case 'QUIZ_VIEW': {
        if (!quizId) return NextResponse.json({ success: false, error: 'quizId required' }, { status: 400 });
        const quiz = await getQuizStudentView(tenantSlug, quizId);
        return NextResponse.json({ success: true, data: quiz });
      }
      case 'ONLINE_CLASSES': {
        if (!courseId) return NextResponse.json({ success: false, error: 'courseId required' }, { status: 400 });
        const classes = await getOnlineClasses(tenantSlug, courseId, actor);
        return NextResponse.json({ success: true, data: classes });
      }
      case 'DISCUSSIONS': {
        if (!courseId) return NextResponse.json({ success: false, error: 'courseId required' }, { status: 400 });
        const discussions = await getDiscussions(tenantSlug, courseId);
        return NextResponse.json({ success: true, data: discussions });
      }
      case 'DISCUSSION_THREAD': {
        if (!discussionId) return NextResponse.json({ success: false, error: 'discussionId required' }, { status: 400 });
        const thread = await getDiscussionThread(tenantSlug, discussionId);
        return NextResponse.json({ success: true, data: thread });
      }
      case 'GRADEBOOK': {
        if (!courseId) return NextResponse.json({ success: false, error: 'courseId required' }, { status: 400 });
        const gradebook = await getCourseGradebook(tenantSlug, courseId);
        return NextResponse.json({ success: true, data: gradebook });
      }
      case 'STUDENT_DASHBOARD': {
        if (!studentId) return NextResponse.json({ success: false, error: 'studentId required' }, { status: 400 });
        const dash = await getStudentLearningDashboard(tenantSlug, studentId);
        return NextResponse.json({ success: true, data: dash });
      }
      case 'TEACHER_DASHBOARD': {
        if (!teacherId) return NextResponse.json({ success: false, error: 'teacherId required' }, { status: 400 });
        const dash = await getTeacherLmsDashboard(tenantSlug, teacherId);
        return NextResponse.json({ success: true, data: dash });
      }
      case 'GUARDIAN_VIEW': {
        if (!guardianId || !studentId) return NextResponse.json({ success: false, error: 'guardianId & studentId required' }, { status: 400 });
        const dash = await getGuardianLmsView(tenantSlug, guardianId, studentId);
        return NextResponse.json({ success: true, data: dash });
      }
      case 'COURSE_ANALYTICS': {
        if (!courseId) return NextResponse.json({ success: false, error: 'courseId required' }, { status: 400 });
        const analytics = await getCourseLearningAnalytics(tenantSlug, courseId);
        return NextResponse.json({ success: true, data: analytics });
      }
      default:
        return NextResponse.json({ success: false, error: 'Unknown LMS query action' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'LMS fetch error' }, { status: err.statusCode || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenant') || 'dhaka-ideal-school';
    const action = searchParams.get('action') || 'CREATE_COURSE';

    const actor = getActor(req, tenantSlug);
    const body = await req.json();

    let result;
    switch (action) {
      case 'CREATE_COURSE':
        result = await createLmsCourse(tenantSlug, body, actor);
        break;
      case 'UPDATE_COURSE':
        result = await updateLmsCourse(tenantSlug, body, actor);
        break;
      case 'SAVE_SYLLABUS':
        result = await saveLmsSyllabus(tenantSlug, body, actor);
        break;
      case 'ADD_LEARNING_OUTCOME':
        result = await addLearningOutcome(tenantSlug, body, actor);
        break;
      case 'CREATE_MODULE':
        result = await createModule(tenantSlug, body, actor);
        break;
      case 'CREATE_LESSON':
        result = await createLesson(tenantSlug, body, actor);
        break;
      case 'UPDATE_LESSON_PROGRESS':
        result = await updateLessonProgress(tenantSlug, body, actor);
        break;
      case 'CREATE_ANNOUNCEMENT':
        result = await createCourseAnnouncement(tenantSlug, body, actor);
        break;
      case 'CREATE_HOMEWORK':
        result = await createHomework(tenantSlug, body, actor);
        break;
      case 'SUBMIT_HOMEWORK':
        result = await submitHomework(tenantSlug, body, actor);
        break;
      case 'CREATE_RUBRIC':
        result = await createRubric(tenantSlug, body, actor);
        break;
      case 'CREATE_ASSIGNMENT':
        result = await createAssignment(tenantSlug, body, actor);
        break;
      case 'SUBMIT_ASSIGNMENT':
        result = await submitAssignment(tenantSlug, body, actor);
        break;
      case 'GRADE_ASSIGNMENT':
        result = await gradeAssignmentSubmission(tenantSlug, body, actor);
        break;
      case 'CREATE_QUESTION':
        result = await createQuestionBankItem(tenantSlug, body, actor);
        break;
      case 'APPROVE_QUESTION':
        result = await approveQuestionBankItem(tenantSlug, body.questionId, actor);
        break;
      case 'GENERATE_AI_QUESTIONS':
        result = await generateAiQuestionsDraft(tenantSlug, body, actor);
        break;
      case 'CREATE_QUIZ':
        result = await createQuiz(tenantSlug, body, actor);
        break;
      case 'START_QUIZ_ATTEMPT':
        result = await startQuizAttempt(tenantSlug, body, actor);
        break;
      case 'SUBMIT_QUIZ_ATTEMPT':
        result = await submitQuizAttempt(tenantSlug, body, actor);
        break;
      case 'GRADE_QUIZ_RESPONSE':
        result = await gradeManualQuizResponse(tenantSlug, body, actor);
        break;
      case 'SCHEDULE_ONLINE_CLASS':
        result = await scheduleOnlineClass(tenantSlug, body, actor);
        break;
      case 'RECORD_ONLINE_CLASS_ATTENDANCE':
        result = await recordOnlineClassAttendance(tenantSlug, body, actor);
        break;
      case 'CREATE_DISCUSSION':
        result = await createDiscussion(tenantSlug, body, actor);
        break;
      case 'CREATE_DISCUSSION_POST':
        result = await createDiscussionPost(tenantSlug, body, actor);
        break;
      case 'MODERATE_DISCUSSION':
        result = await moderateDiscussion(tenantSlug, body, actor);
        break;
      case 'CREATE_GRADEBOOK_ITEM':
        result = await createGradebookItem(tenantSlug, body, actor);
        break;
      case 'OVERRIDE_GRADEBOOK_SCORE':
        result = await overrideGradebookScore(tenantSlug, body, actor);
        break;
      case 'SYNC_TO_OFFICIAL_EXAM':
        result = await syncLmsGradeToOfficialExam(tenantSlug, body, actor);
        break;
      case 'COPY_COURSE':
        result = await copyLmsCourse(tenantSlug, body, actor);
        break;
      case 'ARCHIVE_COURSE':
        result = await archiveLmsCourse(tenantSlug, body.courseId, actor);
        break;
      default:
        return NextResponse.json({ success: false, error: 'Unknown LMS action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'LMS execution error' }, { status: err.statusCode || 500 });
  }
}
