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
  GraduationCap
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

  // Question Bank AI State
  const [aiTopic, setAiTopic] = useState('Newtonian Mechanics & Momentum');
  const [aiDifficulty, setAiDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Discussions State
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');

  // Fetch courses on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/lms?tenant=${tenantSlug}&action=COURSES`);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setCourses(data.data);
          setSelectedCourse(data.data[0]);
        }
      } catch (e) {
        console.error('Failed to load courses', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tenantSlug]);

  // Fetch course-specific subdata when selectedCourse changes
  useEffect(() => {
    if (!selectedCourse?.id) return;

    async function loadCourseDetails() {
      try {
        // Analytics
        const anRes = await fetch(`/api/lms?tenant=${tenantSlug}&action=COURSE_ANALYTICS&courseId=${selectedCourse.id}`);
        const anData = await anRes.json();
        if (anData.success) {
          setAnalyticsData(anData.data);
        }

        // Gradebook
        const gbRes = await fetch(`/api/lms?tenant=${tenantSlug}&action=GRADEBOOK&courseId=${selectedCourse.id}`);
        const gbData = await gbRes.json();
        if (gbData.success) {
          setGradebookData(gbData.data);
        }

        // Online Classes
        const ocRes = await fetch(`/api/lms?tenant=${tenantSlug}&action=ONLINE_CLASSES&courseId=${selectedCourse.id}`);
        const ocData = await ocRes.json();
        if (ocData.success) {
          setOnlineClasses(ocData.data);
        }

        // Discussions
        const dcRes = await fetch(`/api/lms?tenant=${tenantSlug}&action=DISCUSSIONS&courseId=${selectedCourse.id}`);
        const dcData = await dcRes.json();
        if (dcData.success) {
          setDiscussions(dcData.data);
        }
      } catch (err) {
        console.error('Failed to fetch course sub-details', err);
      }
    }

    loadCourseDetails();
  }, [selectedCourse?.id, tenantSlug]);

  // Trigger AI Question Draft Generation
  const handleGenerateAiDraft = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch(`/api/lms?tenant=${tenantSlug}&action=GENERATE_AI_QUESTIONS`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedCourse?.subjectId || 'General Science',
          topic: aiTopic,
          difficulty: aiDifficulty,
          count: 3,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setQuestions((prev) => [...data.data, ...prev]);
      }
    } catch (e) {
      console.error('AI Draft generation failed', e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Command 8 — Academic LMS & Digital Education
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
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition">
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
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
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
                {c.code} — {c.title} ({c.primaryTeacher?.firstName} {c.primaryTeacher?.lastName})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* TAB 1: COURSES & DIGITAL LESSONS */}
      {activeTab === 'courses' && (
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
                      {course._count?.modules || 0} Modules • {course._count?.assignments || 0} Assignments
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{course.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Instructor: {course.primaryTeacher ? `${course.primaryTeacher.firstName} ${course.primaryTeacher.lastName}` : 'Unassigned'}
                  </p>
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Code: {course.code}</span>
                      <span>Campus: {course.campus?.name}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">OBE Outcomes Defined</span>
                  <button className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                    <span>View Modules</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No active LMS course spaces provisioned yet.</p>
              <p className="text-xs text-slate-500 mt-1">Click &quot;Create Course Space&quot; to link academic subjects to digital learning spaces.</p>
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
              <button className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                + Create Homework
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold">
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
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{asg.totalMarks} Marks ({asg.weightPercent}%)</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{asg.lateSubmissionPolicy}</td>
                      <td className="p-3 text-right">
                        <button className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold">
                          Grade Submissions
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No assignments published for this course space.
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
              <span>AI Question Bank Assistant (Workflow Real / Provider Integration Pending)</span>
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-400">
              Generate structured multi-type question drafts categorized by Bloom Taxonomy with required teacher review before publication.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Topic / Chapter</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Difficulty</label>
                <select
                  value={aiDifficulty}
                  onChange={(e: any) => setAiDifficulty(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium"
                >
                  <option value="EASY">Easy (Remember / Understand)</option>
                  <option value="MEDIUM">Medium (Apply / Analyze)</option>
                  <option value="HARD">Hard (Evaluate / Create)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleGenerateAiDraft}
                  disabled={isGeneratingAi}
                  className="w-full p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  {isGeneratingAi ? 'Generating Drafts...' : 'Draft 3 Questions with AI'}
                </button>
              </div>
            </div>
          </div>

          {/* Question List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Approved Question Bank Repository</span>
              <span className="text-xs font-normal text-slate-500">Secure Answer Keys Encrypted</span>
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {questions.length > 0 ? (
                questions.map((q) => (
                  <div key={q.id} className="py-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold">
                        {q.questionType}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                        {q.difficulty}
                      </span>
                      <span className="text-xs font-bold text-slate-500">Bloom: {q.bloomTaxonomy}</span>
                      <span className="ml-auto text-xs font-bold text-emerald-600">{q.status}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white pt-1">{q.questionText}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Question bank entries loaded from repository. Use AI Assistant or manual form to add items.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: QUIZZES */}
      {activeTab === 'quizzes' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active Online Quizzes & Timed Assessments</h2>
              <p className="text-xs text-slate-500">Server-authoritative timer enforcement & randomized question delivery.</p>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold">
              + Create Timed Quiz
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedCourse?.quizzes?.length > 0 ? (
              selectedCourse.quizzes.map((qz: any) => (
                <div key={qz.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">{qz.status}</span>
                    <span className="text-xs font-bold text-slate-500">{qz.durationMinutes} Mins Duration</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{qz.title}</h3>
                  <p className="text-xs text-slate-500">
                    Total Marks: {qz.totalMarks} • Pass Mark: {qz.passMark} • {Math.round(qz.negativeMarkingRatio * 100)}% Negative Marking
                  </p>
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Max Attempts: {qz.maxAttempts}</span>
                    <button className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      <span>Start Attempt</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-slate-500 text-xs">
                No active quizzes scheduled for this course space.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: LIVE CLASSES */}
      {activeTab === 'classes' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Live Online Class Sessions</h2>
              <p className="text-xs text-slate-500">
                Zoom, Google Meet, and MS Teams class links with access restricted to enrolled students.
              </p>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold flex items-center gap-1">
              <Video className="w-4 h-4" />
              <span>Schedule Live Class</span>
            </button>
          </div>

          <div className="space-y-3">
            {onlineClasses.length > 0 ? (
              onlineClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-purple-200 text-purple-800 text-[10px] font-bold">
                        {cls.meetingProvider}
                      </span>
                      <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                        {new Date(cls.classDate).toLocaleDateString()} at {cls.startTime} - {cls.endTime}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-purple-950 dark:text-white mt-1">{cls.title}</h3>
                    <p className="text-xs text-purple-800 dark:text-purple-300">
                      Instructor: {cls.teacher?.firstName} {cls.teacher?.lastName} • {cls.topic}
                    </p>
                  </div>
                  <a
                    href={cls.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shrink-0 flex items-center gap-1"
                  >
                    <span>Join Class</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                No live online classes scheduled for this course space.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: DISCUSSIONS */}
      {activeTab === 'discussions' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Course Discussions & Collaboration</h2>
            <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold">
              + New Discussion Topic
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {discussions.length > 0 ? (
              discussions.map((d) => (
                <div key={d.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {d.isPinned && <Pin className="w-3.5 h-3.5 text-blue-600" />}
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{d.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Started by {d.authorName} ({d.authorRole}) • {d._count?.posts || 0} replies
                    </p>
                  </div>
                  <button className="text-xs font-bold text-blue-600 hover:underline">View Thread</button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                No discussion threads created yet. Start a topic to collaborate with students.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: GRADEBOOK */}
      {activeTab === 'gradebook' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">LMS Continuous Assessment Gradebook</h2>
              <p className="text-xs text-slate-500">
                Calculated weighted continuous scores with controlled sync into Command 4 Official Exam Mark Records.
              </p>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync to Official Exam</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Student Name / ID</th>
                  {gradebookData?.items?.map((it: any) => (
                    <th key={it.id} className="p-3 text-center">
                      {it.title} ({it.weightPercent}%)
                    </th>
                  ))}
                  <th className="p-3 text-center font-bold text-blue-600">Total Weighted</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {gradebookData?.roster?.length > 0 ? (
                  gradebookData.roster.map((r: any) => (
                    <tr key={r.student.id}>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {r.student.firstName} {r.student.lastName}
                        <span className="block text-[10px] font-normal text-slate-500">{r.student.studentIdNumber}</span>
                      </td>
                      {r.scores?.map((sc: any, idx: number) => (
                        <td key={idx} className="p-3 text-center font-medium">
                          {sc.scoreObtained} / {sc.maxScore}
                        </td>
                      ))}
                      <td className="p-3 text-center font-bold text-blue-600 text-sm">
                        {r.totalWeightedScore} / {r.totalMaxPossible} ({r.percentage}%)
                      </td>
                      <td className="p-3 text-right">
                        <button className="text-xs text-blue-600 hover:underline font-bold">Override Score</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
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

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Deterministic Early Warning Learning Alerts
            </h3>
            {analyticsData?.earlyWarningAlerts?.length > 0 ? (
              <div className="space-y-3">
                {analyticsData.earlyWarningAlerts.map((alt: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs flex items-start gap-3"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-900 dark:text-amber-200">
                        Student Alert: {alt.studentName} (ID: {alt.studentIdNumber})
                      </span>
                      <p className="text-amber-800 dark:text-amber-300 mt-0.5">
                        {alt.reason} • {alt.recommendedAction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>No early warning at-risk alerts flagged for current enrolled students. All students on track.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
