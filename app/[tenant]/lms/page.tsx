'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/lib/tenant-context';
import {
  BookOpen,
  Layers,
  FileText,
  FileQuestion,
  Video,
  MessagesSquare,
  Award,
  BarChart3,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  Play,
  Download,
  Share2,
  Sparkles,
  Lock,
  Unlock,
  Pin,
  RefreshCw,
  Send,
  Eye,
  Check,
  ChevronRight,
  User,
  GraduationCap,
  X,
  Link as LinkIcon
} from 'lucide-react';

export default function LmsPage() {
  const { branding, tenantSlug } = useTenant();
  const [activeTab, setActiveTab] = useState<
    'courses' | 'assignments' | 'questions' | 'quizzes' | 'classes' | 'discussions' | 'gradebook' | 'analytics'
  >('courses');

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  // Dynamic Data State
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [gradebookData, setGradebookData] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [onlineClasses, setOnlineClasses] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);

  // Modals state
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showCreateModuleModal, setShowCreateModuleModal] = useState(false);
  const [showCreateLessonModal, setShowCreateLessonModal] = useState(false);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [showCreateQuizModal, setShowCreateQuizModal] = useState(false);
  const [showScheduleClassModal, setShowScheduleClassModal] = useState(false);

  // Selected Module for Lesson Creation
  const [targetModuleId, setTargetModuleId] = useState<string | null>(null);

  // Academic Reference data for Course Creation
  const [academicMetadata, setAcademicMetadata] = useState<{
    campuses: any[];
    academicYears: any[];
    classes: any[];
    sections: any[];
    subjects: any[];
    teachers: any[];
  }>({
    campuses: [],
    academicYears: [],
    classes: [],
    sections: [],
    subjects: [],
    teachers: []
  });

  // Create Course Form State
  const [courseForm, setCourseForm] = useState({
    title: '',
    code: '',
    description: '',
    term: 'Annual 2026',
    campusId: '',
    academicYearId: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    primaryTeacherId: ''
  });

  // Create Module Form State
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    sequenceOrder: 1,
    isPublished: true
  });

  // Create Lesson Form State
  const [lessonForm, setLessonForm] = useState({
    title: '',
    lessonType: 'VIDEO',
    durationMinutes: 45,
    contentUrl: 'https://www.youtube.com/watch?v=sample',
    textContent: 'Comprehensive lesson notes and derivations for this topic.'
  });

  // Create Assignment Form State
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: 'Solve problems 1 through 10 from Chapter 3 and submit your handwritten PDF.',
    totalMarks: 20,
    weightPercent: 10,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    submissionType: 'FILE_UPLOAD',
    lateSubmissionPolicy: 'GRACE_PERIOD_24H'
  });

  // Create Quiz Form State
  const [quizForm, setQuizForm] = useState({
    title: 'Chapter 3 MCQ Checkpoint Test',
    durationMinutes: 30,
    passMarks: 10,
    totalMarks: 20,
    shuffleQuestions: true
  });

  // Schedule Online Class Form State
  const [classForm, setClassForm] = useState({
    title: 'Interactive Problem Solving Session',
    meetingPlatform: 'ZOOM',
    meetingUrl: 'https://zoom.us/j/9876543210',
    scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    durationMinutes: 60
  });

  // Question Bank AI State
  const [aiTopic, setAiTopic] = useState('Newtonian Mechanics & Momentum');
  const [aiDifficulty, setAiDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Discussions State
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load Courses
  async function loadCourses() {
    setLoading(true);
    try {
      const res = await fetch(`/api/lms?tenant=${tenantSlug}&action=COURSES`, { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.data) {
        setCourses(data.data);
        if (data.data.length > 0) {
          if (!selectedCourse || !data.data.find((c: any) => c.id === selectedCourse.id)) {
            setSelectedCourse(data.data[0]);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load courses', e);
    } finally {
      setLoading(false);
    }
  }

  // Load Academic Metadata for Creation dropdowns
  async function loadAcademicMetadata() {
    try {
      const res = await fetch(`/api/academics?tenantSlug=${tenantSlug}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.data) {
        setAcademicMetadata({
          campuses: data.data.campuses || [],
          academicYears: data.data.academicYears || [],
          classes: data.data.classes || [],
          sections: data.data.sections || [],
          subjects: data.data.subjects || [],
          teachers: data.data.teachers || []
        });

        // Prepopulate course form defaults
        if (data.data.campuses?.[0]) setCourseForm((f) => ({ ...f, campusId: data.data.campuses[0].id }));
        if (data.data.academicYears?.[0]) setCourseForm((f) => ({ ...f, academicYearId: data.data.academicYears[0].id }));
        if (data.data.classes?.[0]) setCourseForm((f) => ({ ...f, classId: data.data.classes[0].id }));
        if (data.data.sections?.[0]) setCourseForm((f) => ({ ...f, sectionId: data.data.sections[0].id }));
        if (data.data.subjects?.[0]) setCourseForm((f) => ({ ...f, subjectId: data.data.subjects[0].id }));
        if (data.data.teachers?.[0]) setCourseForm((f) => ({ ...f, primaryTeacherId: data.data.teachers[0].id }));
      }
    } catch (e) {
      console.error('Failed to load academic metadata', e);
    }
  }

  useEffect(() => {
    loadCourses();
    loadAcademicMetadata();
  }, [tenantSlug]);

  // Fetch course-specific subdata when selectedCourse changes
  useEffect(() => {
    if (!selectedCourse?.id) return;

    async function loadCourseDetails() {
      try {
        const [anRes, gbRes, ocRes, dcRes, qbRes] = await Promise.all([
          fetch(`/api/lms?tenant=${tenantSlug}&action=COURSE_ANALYTICS&courseId=${selectedCourse.id}`, { credentials: 'include' }),
          fetch(`/api/lms?tenant=${tenantSlug}&action=GRADEBOOK&courseId=${selectedCourse.id}`, { credentials: 'include' }),
          fetch(`/api/lms?tenant=${tenantSlug}&action=ONLINE_CLASSES&courseId=${selectedCourse.id}`, { credentials: 'include' }),
          fetch(`/api/lms?tenant=${tenantSlug}&action=DISCUSSIONS&courseId=${selectedCourse.id}`, { credentials: 'include' }),
          fetch(`/api/lms?tenant=${tenantSlug}&action=QUESTION_BANK`, { credentials: 'include' })
        ]);

        const anData = await anRes.json();
        if (anData.success) setAnalyticsData(anData.data);

        const gbData = await gbRes.json();
        if (gbData.success) setGradebookData(gbData.data);

        const ocData = await ocRes.json();
        if (ocData.success) setOnlineClasses(ocData.data);

        const dcData = await dcRes.json();
        if (dcData.success) setDiscussions(dcData.data);

        const qbData = await qbRes.json();
        if (qbData.success) setQuestions(qbData.data || []);
      } catch (err) {
        console.error('Failed to fetch course sub-details', err);
      }
    }

    loadCourseDetails();
  }, [selectedCourse?.id, tenantSlug]);

  // Handler: Create Course Space
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        title: courseForm.title,
        code: courseForm.code,
        description: courseForm.description,
        term: courseForm.term,
        campusId: courseForm.campusId || academicMetadata.campuses[0]?.id,
        academicYearId: courseForm.academicYearId || academicMetadata.academicYears[0]?.id,
        classId: courseForm.classId || academicMetadata.classes[0]?.id,
        sectionId: courseForm.sectionId || academicMetadata.sections[0]?.id,
        subjectId: courseForm.subjectId || academicMetadata.subjects[0]?.id,
        primaryTeacherId: courseForm.primaryTeacherId || academicMetadata.teachers[0]?.id
      };

      const res = await fetch(`/api/lms?tenant=${tenantSlug}&action=CREATE_COURSE`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create course space.');
      }

      setShowCreateCourseModal(false);
      await loadCourses();
    } catch (err: any) {
      setFormError(err.message || 'Creation error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Create Module
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse?.id) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/lms?tenant=${tenantSlug}&action=CREATE_MODULE`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          title: moduleForm.title,
          description: moduleForm.description,
          sequenceOrder: Number(moduleForm.sequenceOrder),
          isPublished: moduleForm.isPublished
        }),
        credentials: 'include'
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create module.');

      setShowCreateModuleModal(false);
      await loadCourses();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Create Lesson
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetModuleId) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/lms?tenant=${tenantSlug}&action=CREATE_LESSON`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: targetModuleId,
          title: lessonForm.title,
          lessonType: lessonForm.lessonType,
          durationMinutes: Number(lessonForm.durationMinutes),
          contentUrl: lessonForm.contentUrl,
          textContent: lessonForm.textContent,
          sequenceOrder: 1,
          isPublished: true
        }),
        credentials: 'include'
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create lesson.');

      setShowCreateLessonModal(false);
      await loadCourses();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Create Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse?.id) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/lms?tenant=${tenantSlug}&action=CREATE_ASSIGNMENT`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          title: assignmentForm.title,
          description: assignmentForm.description,
          totalMarks: Number(assignmentForm.totalMarks),
          weightPercent: Number(assignmentForm.weightPercent),
          dueDate: new Date(assignmentForm.dueDate).toISOString(),
          submissionType: assignmentForm.submissionType,
          lateSubmissionPolicy: assignmentForm.lateSubmissionPolicy
        }),
        credentials: 'include'
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create assignment.');

      setShowCreateAssignmentModal(false);
      await loadCourses();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Create Quiz
  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse?.id) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/lms?tenant=${tenantSlug}&action=CREATE_QUIZ`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          title: quizForm.title,
          durationMinutes: Number(quizForm.durationMinutes),
          passMarks: Number(quizForm.passMarks),
          totalMarks: Number(quizForm.totalMarks),
          shuffleQuestions: quizForm.shuffleQuestions,
          allowReview: true
        }),
        credentials: 'include'
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create quiz.');

      setShowCreateQuizModal(false);
      await loadCourses();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Schedule Online Class
  const handleScheduleClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse?.id) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/lms?tenant=${tenantSlug}&action=SCHEDULE_ONLINE_CLASS`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          title: classForm.title,
          meetingPlatform: classForm.meetingPlatform,
          meetingUrl: classForm.meetingUrl,
          scheduledAt: new Date(classForm.scheduledAt).toISOString(),
          durationMinutes: Number(classForm.durationMinutes)
        }),
        credentials: 'include'
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to schedule class.');

      setShowScheduleClassModal(false);
      if (json.data) setOnlineClasses((prev) => [json.data, ...prev]);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: AI Question Generation
  const handleGenerateAi = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch(`/api/lms?tenant=${tenantSlug}&action=GENERATE_AI_QUESTIONS`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          count: 5,
          difficulty: aiDifficulty
        }),
        credentials: 'include'
      });

      const json = await res.json();
      if (json.success && json.data) {
        setQuestions((prev) => [...(Array.isArray(json.data) ? json.data : [json.data]), ...prev]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Handler: Create Discussion Topic
  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse?.id || !newTopicTitle) return;

    try {
      const res = await fetch(`/api/lms?tenant=${tenantSlug}&action=CREATE_DISCUSSION`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          title: newTopicTitle,
          initialPostContent: newTopicDesc || 'Let us discuss this course topic.'
        }),
        credentials: 'include'
      });

      const json = await res.json();
      if (json.success && json.data) {
        setDiscussions((prev) => [json.data, ...prev]);
        setNewTopicTitle('');
        setNewTopicDesc('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Command 8 & 11B — Academic LMS & Digital Education
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {branding.name} — Learning Management Platform
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Course spaces, syllabus outcomes, digital lessons, homework, rubric assignments, question bank, live classes & gradebook.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => loadCourses()}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCourseForm({
                title: 'Higher Physics - Wave Optics & Nuclear Dynamics',
                code: 'PHY-201',
                description: 'Comprehensive curriculum coverage of wave optics, polarization, and nuclear physics.',
                term: 'Annual 2026',
                campusId: academicMetadata.campuses[0]?.id || '',
                academicYearId: academicMetadata.academicYears[0]?.id || '',
                classId: academicMetadata.classes[0]?.id || '',
                sectionId: academicMetadata.sections[0]?.id || '',
                subjectId: academicMetadata.subjects[0]?.id || '',
                primaryTeacherId: academicMetadata.teachers[0]?.id || ''
              });
              setShowCreateCourseModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Course Space</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'courses', label: 'Course Spaces & Lessons', icon: BookOpen },
          { id: 'assignments', label: 'Homework & Assignments', icon: FileText },
          { id: 'questions', label: 'Question Bank & AI Generator', icon: FileQuestion },
          { id: 'quizzes', label: 'Quizzes & Online Tests', icon: Award },
          { id: 'classes', label: 'Online Live Classes', icon: Video },
          { id: 'discussions', label: 'Course Discussions', icon: MessagesSquare },
          { id: 'gradebook', label: 'Gradebook & Official Sync', icon: Layers },
          { id: 'analytics', label: 'Learning Analytics', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Course Selector if courses exist */}
      {courses.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-600 dark:text-slate-300">Active Course Space:</span>
            <select
              value={selectedCourse?.id || ''}
              onChange={(e) => {
                const c = courses.find((x) => x.id === e.target.value);
                if (c) setSelectedCourse(c);
              }}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setModuleForm({
                  title: `Module ${selectedCourse?.modules?.length ? selectedCourse.modules.length + 1 : 1}: Core Mechanics`,
                  description: 'Conceptual foundations, mathematical derivations and laboratory experiments.',
                  sequenceOrder: (selectedCourse?.modules?.length || 0) + 1,
                  isPublished: true
                });
                setShowCreateModuleModal(true);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 flex items-center gap-1 border border-blue-200 dark:border-blue-800"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Module</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: COURSES & DIGITAL LESSONS */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.length > 0 ? (
              courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-xs flex flex-col justify-between cursor-pointer transition ${
                    selectedCourse?.id === course.id
                      ? 'border-blue-600 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {course.status}
                      </span>
                      <span className="text-xs font-bold text-blue-600">
                        {course.modules?.length || 0} Modules • {course.assignments?.length || 0} Assignments
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{course.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Instructor: {course.primaryTeacher ? `${course.primaryTeacher.firstName} ${course.primaryTeacher.lastName}` : 'Assigned Faculty'}
                    </p>
                    <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs space-y-1.5">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Code: {course.code}</span>
                        <span>Term: {course.term || '2026'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">OBE Outcomes Linked</span>
                    <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                      <span>Explore</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No active LMS course spaces provisioned yet.</p>
                <p className="text-xs text-slate-500 mt-1">Click &quot;Create Course Space&quot; above to link academic subjects to digital learning spaces.</p>
              </div>
            )}
          </div>

          {/* Detailed Course Content / Modules view */}
          {selectedCourse && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedCourse.title} — Syllabus Modules & Lessons
                  </h2>
                  <p className="text-xs text-slate-500">{selectedCourse.description || 'Interactive digital lessons, readings and evaluations.'}</p>
                </div>
                <button
                  onClick={() => {
                    setModuleForm({
                      title: `Module ${selectedCourse.modules?.length ? selectedCourse.modules.length + 1 : 1}: Core Dynamics`,
                      description: 'Classroom explanations, formulas and problem sets.',
                      sequenceOrder: (selectedCourse.modules?.length || 0) + 1,
                      isPublished: true
                    });
                    setShowCreateModuleModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Module</span>
                </button>
              </div>

              {selectedCourse.modules?.length > 0 ? (
                <div className="space-y-4">
                  {selectedCourse.modules.map((mod: any, mIdx: number) => (
                    <div key={mod.id || mIdx} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                            {mIdx + 1}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{mod.title}</h4>
                        </div>
                        <button
                          onClick={() => {
                            setTargetModuleId(mod.id);
                            setLessonForm({
                              title: 'Lesson: Concepts & Formulas',
                              lessonType: 'VIDEO',
                              durationMinutes: 45,
                              contentUrl: 'https://www.youtube.com/watch?v=sample',
                              textContent: 'Core notes and mathematical examples.'
                            });
                            setShowCreateLessonModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Lesson</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">{mod.description}</p>

                      {mod.lessons?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {mod.lessons.map((les: any, lIdx: number) => (
                            <div key={les.id || lIdx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <Play className="w-3.5 h-3.5 text-blue-600" />
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{les.title}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">{les.durationMinutes || 45}m</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No lessons added to this module yet.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500">No modules created for this course yet. Click &quot;Add Module&quot; above.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HOMEWORK & ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Course Homework & Formal Assignment Register
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAssignmentForm({
                    title: 'Weekly Homework Problem Set 3',
                    description: 'Complete problem exercises 1 to 5.',
                    totalMarks: 10,
                    weightPercent: 5,
                    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
                    submissionType: 'FILE_UPLOAD',
                    lateSubmissionPolicy: 'GRACE_PERIOD_24H'
                  });
                  setShowCreateAssignmentModal(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
              >
                + Create Homework
              </button>
              <button
                onClick={() => {
                  setAssignmentForm({
                    title: 'Midterm Research Term Paper & Rubric Evaluation',
                    description: 'Submit an in-depth analytical study with citations and experimental graphs.',
                    totalMarks: 30,
                    weightPercent: 15,
                    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
                    submissionType: 'FILE_UPLOAD',
                    lateSubmissionPolicy: 'DEDUCT_10_PERCENT_PER_DAY'
                  });
                  setShowCreateAssignmentModal(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500"
              >
                + Create Rubric Assignment
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Title & Type</th>
                  <th className="p-3">Course Space</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Total Marks</th>
                  <th className="p-3">Late Policy</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedCourse?.assignments?.length > 0 ? (
                  selectedCourse.assignments.map((asg: any) => (
                    <tr key={asg.id}>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {asg.title}
                        <span className="block text-[10px] font-normal text-purple-600">{asg.submissionType}</span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{selectedCourse.code}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{new Date(asg.dueDate).toLocaleDateString()}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{asg.totalMarks} Marks ({asg.weightPercent || 10}%)</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{asg.lateSubmissionPolicy || 'GRACE_PERIOD_24H'}</td>
                      <td className="p-3 text-right">
                        <button className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold">
                          Submissions
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No assignments published for this course space. Click &quot;+ Create Rubric Assignment&quot; above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: QUESTION BANK & AI DRAFT GENERATOR */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          {/* AI Generator Box */}
          <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900">
            <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-bold text-sm mb-1">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>AI Question Bank Assistant</span>
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-400">
              Generate structured multi-type question drafts categorized by Bloom Taxonomy with required teacher review before publication.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Enter topic..."
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-xs flex-1 min-w-[200px]"
              />
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value as any)}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-xs font-bold"
              >
                <option value="EASY">Easy (Remembering & Recall)</option>
                <option value="MEDIUM">Medium (Application & Analysis)</option>
                <option value="HARD">Hard (Synthesis & Evaluation)</option>
              </select>
              <button
                onClick={handleGenerateAi}
                disabled={isGeneratingAi}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingAi ? 'Drafting Questions...' : 'Generate 5 Multi-Type Drafts'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Structured Question Repository</h3>
            <div className="space-y-3">
              {questions.length > 0 ? (
                questions.map((q: any, idx: number) => (
                  <div key={q.id || idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-600 uppercase text-[10px]">{q.questionType || 'MCQ'} • {q.difficulty || 'MEDIUM'}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                        {q.status || 'APPROVED'}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{q.stemText || q.question}</p>
                    {q.options && (
                      <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                        {Array.isArray(q.options) ? q.options.map((opt: any, oIdx: number) => (
                          <div key={oIdx} className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                            {typeof opt === 'string' ? opt : opt.text}
                          </div>
                        )) : null}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No questions found in repository. Generate questions using the AI generator above.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: QUIZZES */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active Online Quizzes</h2>
            <button
              onClick={() => setShowCreateQuizModal(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500"
            >
              + Create Online Quiz
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedCourse?.quizzes?.length > 0 ? (
              selectedCourse.quizzes.map((quiz: any) => (
                <div key={quiz.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{quiz.title}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">ACTIVE</span>
                  </div>
                  <p className="text-slate-500">Duration: {quiz.durationMinutes} mins • Pass Marks: {quiz.passMarks} / {quiz.totalMarks}</p>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No quizzes configured for this course space.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ONLINE LIVE CLASSES */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Scheduled Live Digital Classrooms</h2>
            <button
              onClick={() => setShowScheduleClassModal(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 flex items-center gap-1"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Schedule Live Class</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {onlineClasses.length > 0 ? (
              onlineClasses.map((cls: any, idx: number) => (
                <div key={cls.id || idx} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{cls.title}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">{cls.meetingPlatform || 'ZOOM'}</span>
                  </div>
                  <p className="text-slate-500">Scheduled: {new Date(cls.scheduledAt).toLocaleString()} ({cls.durationMinutes || 60} mins)</p>
                  <a
                    href={cls.meetingUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Class Room</span>
                  </a>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No live classes scheduled. Click &quot;Schedule Live Class&quot; above.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: DISCUSSIONS */}
      {activeTab === 'discussions' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Start New Discussion Thread</h3>
            <form onSubmit={handleCreateDiscussion} className="space-y-3">
              <input
                type="text"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                placeholder="Topic Title (e.g., Doubts on Lecture 4 - Conservation of Energy)..."
                required
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <textarea
                value={newTopicDesc}
                onChange={(e) => setNewTopicDesc(e.target.value)}
                placeholder="Discussion details and questions..."
                rows={2}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Thread</span>
              </button>
            </form>
          </div>

          <div className="space-y-3">
            {discussions.map((dc: any, idx: number) => (
              <div key={dc.id || idx} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white">{dc.title}</h4>
                  <span className="text-slate-400 text-[10px]">{new Date(dc.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">{dc.initialPostContent || dc.description || 'Active class discussion thread.'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: GRADEBOOK */}
      {activeTab === 'gradebook' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Official Course Gradebook
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Student ID</th>
                  <th className="p-3">Total Weighted Score</th>
                  <th className="p-3">Percentage</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {gradebookData?.roster?.length > 0 ? (
                  gradebookData.roster.map((r: any, idx: number) => (
                    <tr key={r.studentId || idx}>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{r.studentName}</td>
                      <td className="p-3 font-mono text-slate-500">{r.studentIdNumber}</td>
                      <td className="p-3 font-bold text-blue-600">{r.totalWeightedScore} / {r.totalMaxPossible}</td>
                      <td className="p-3 font-bold">{r.percentage}%</td>
                      <td className="p-3 text-right">
                        <button className="text-xs text-blue-600 hover:underline font-bold">Override Score</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No gradebook records available for this course space.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: LEARNING ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-bold">Average Progress</span>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {analyticsData?.metrics?.averageProgressPercent ?? 0}%
              </p>
              <span className="text-[10px] text-slate-500">Database-backed calculation</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-bold">Course Completion Rate</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {analyticsData?.metrics?.completionRatePercent ?? 0}%
              </p>
              <span className="text-[10px] text-slate-500">
                {analyticsData?.metrics?.completedCount ?? 0} / {analyticsData?.metrics?.totalEnrolled ?? 0} Completed
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-bold">Total Enrolled Students</span>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {analyticsData?.metrics?.totalEnrolled ?? 0}
              </p>
              <span className="text-[10px] text-purple-600 font-bold">Active Academic Roster</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-bold">Early Warning Alerts</span>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                {analyticsData?.earlyWarningAlerts?.length ?? 0} Alerts
              </p>
              <span className="text-[10px] text-rose-600 font-bold">RULE_BASED_LEARNING_ALERT</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* CREATE COURSE MODAL */}
      {showCreateCourseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Create Digital LMS Course Space</h3>
              <button onClick={() => setShowCreateCourseModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  placeholder="e.g. Higher Physics 1st Paper - Mechanics"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Course Code *</label>
                  <input
                    type="text"
                    required
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                    placeholder="e.g. PHY-201"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Term / Semester</label>
                  <input
                    type="text"
                    value={courseForm.term}
                    onChange={(e) => setCourseForm({ ...courseForm, term: e.target.value })}
                    placeholder="e.g. Annual 2026"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Class / Grade</label>
                  <select
                    value={courseForm.classId}
                    onChange={(e) => setCourseForm({ ...courseForm, classId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    {academicMetadata.classes.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Section</label>
                  <select
                    value={courseForm.sectionId}
                    onChange={(e) => setCourseForm({ ...courseForm, sectionId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    {academicMetadata.sections.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                <select
                  value={courseForm.subjectId}
                  onChange={(e) => setCourseForm({ ...courseForm, subjectId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {academicMetadata.subjects.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Course Description</label>
                <textarea
                  rows={2}
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  placeholder="Outline syllabus learning goals and topics..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateCourseModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Course Space...' : 'Create Course Space'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MODULE MODAL */}
      {showCreateModuleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Add Syllabus Module</h3>
              <button onClick={() => setShowCreateModuleModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && <p className="text-xs text-rose-600">{formError}</p>}

            <form onSubmit={handleCreateModule} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Module Title *</label>
                <input
                  type="text"
                  required
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowCreateModuleModal(false)} className="px-4 py-2 font-bold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold">
                  {isSubmitting ? 'Saving...' : 'Save Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE LESSON MODAL */}
      {showCreateLessonModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Add Digital Lesson</h3>
              <button onClick={() => setShowCreateLessonModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && <p className="text-xs text-rose-600">{formError}</p>}

            <form onSubmit={handleCreateLesson} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lesson Title *</label>
                <input
                  type="text"
                  required
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Lesson Type</label>
                  <select
                    value={lessonForm.lessonType}
                    onChange={(e) => setLessonForm({ ...lessonForm, lessonType: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="VIDEO">Video Lecture</option>
                    <option value="DOCUMENT">PDF / Presentation</option>
                    <option value="ARTICLE">Interactive Article</option>
                    <option value="LINK">External Resource</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Est. Minutes</label>
                  <input
                    type="number"
                    value={lessonForm.durationMinutes}
                    onChange={(e) => setLessonForm({ ...lessonForm, durationMinutes: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Content URL / Video Link</label>
                <input
                  type="url"
                  value={lessonForm.contentUrl}
                  onChange={(e) => setLessonForm({ ...lessonForm, contentUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowCreateLessonModal(false)} className="px-4 py-2 font-bold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold">
                  {isSubmitting ? 'Saving...' : 'Add Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ASSIGNMENT MODAL */}
      {showCreateAssignmentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Create Course Assignment</h3>
              <button onClick={() => setShowCreateAssignmentModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && <p className="text-xs text-rose-600">{formError}</p>}

            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={assignmentForm.totalMarks}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, totalMarks: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={assignmentForm.dueDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Assignment Instructions</label>
                <textarea
                  rows={2}
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowCreateAssignmentModal(false)} className="px-4 py-2 font-bold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold">
                  {isSubmitting ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE LIVE CLASS MODAL */}
      {showScheduleClassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Schedule Live Digital Class</h3>
              <button onClick={() => setShowScheduleClassModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleClass} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Class Title *</label>
                <input
                  type="text"
                  required
                  value={classForm.title}
                  onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Platform</label>
                  <select
                    value={classForm.meetingPlatform}
                    onChange={(e) => setClassForm({ ...classForm, meetingPlatform: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="ZOOM">Zoom Meetings</option>
                    <option value="GOOGLE_MEET">Google Meet</option>
                    <option value="MS_TEAMS">Microsoft Teams</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={classForm.durationMinutes}
                    onChange={(e) => setClassForm({ ...classForm, durationMinutes: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Meeting Link / URL *</label>
                <input
                  type="url"
                  required
                  value={classForm.meetingUrl}
                  onChange={(e) => setClassForm({ ...classForm, meetingUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Scheduled Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={classForm.scheduledAt}
                  onChange={(e) => setClassForm({ ...classForm, scheduledAt: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowScheduleClassModal(false)} className="px-4 py-2 font-bold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold">
                  {isSubmitting ? 'Scheduling...' : 'Schedule Live Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE QUIZ MODAL */}
      {showCreateQuizModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Create Online Quiz</h3>
              <button onClick={() => setShowCreateQuizModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuiz} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Quiz Title *</label>
                <input
                  type="text"
                  required
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold mb-1">Duration (m)</label>
                  <input
                    type="number"
                    value={quizForm.durationMinutes}
                    onChange={(e) => setQuizForm({ ...quizForm, durationMinutes: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Pass Marks</label>
                  <input
                    type="number"
                    value={quizForm.passMarks}
                    onChange={(e) => setQuizForm({ ...quizForm, passMarks: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={quizForm.totalMarks}
                    onChange={(e) => setQuizForm({ ...quizForm, totalMarks: Number(e.target.value) })}
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowCreateQuizModal(false)} className="px-4 py-2 font-bold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold">
                  {isSubmitting ? 'Creating...' : 'Create Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
