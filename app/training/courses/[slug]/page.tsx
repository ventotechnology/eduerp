'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PublicFooter } from '@/components/layout/public-footer';
import {
  ArrowLeft,
  CheckCircle2,
  PlayCircle,
  Award,
  Clock,
  BookOpen,
  Lock,
  ChevronRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function CourseViewPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || '';

  const [course, setCourse] = useState<any | null>(null);
  const [activeLesson, setActiveLesson] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/training/courses/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCourse(data.data);
          // Set initial active lesson to first lesson in first module
          const firstLesson = data.data.modules?.[0]?.lessons?.[0];
          if (firstLesson) setActiveLesson(firstLesson);
        } else {
          setError(data.error || 'Course not found');
        }
      })
      .catch(() => setError('Failed to load course details'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleEnroll = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/training/courses/${slug}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        // Refresh course
        const cRes = await fetch(`/api/training/courses/${slug}`);
        const cData = await cRes.json();
        if (cData.success) setCourse(cData.data);
      } else if (res.status === 401) {
        router.push(`/login?redirect=/training/courses/${slug}`);
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteLesson = async (lessonId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/training/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, lessonId })
      });
      const data = await res.json();
      if (data.success) {
        // Refresh course
        const cRes = await fetch(`/api/training/courses/${slug}`);
        const cData = await cRes.json();
        if (cData.success) setCourse(cData.data);
      } else if (res.status === 401) {
        router.push(`/login?redirect=/training/courses/${slug}`);
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold text-white mb-2">{error || 'Course Not Found'}</h2>
        <Link href="/training" className="px-4 py-2 bg-emerald-600 rounded-xl text-xs font-bold text-white">
          Back to Training Academy
        </Link>
      </div>
    );
  }

  const completedIds = course.completedLessonIds || [];
  const isLessonCompleted = activeLesson ? completedIds.includes(activeLesson.id) : false;
  const certificate = course.certificate;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/training" className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">
                {course.audience}
              </span>
              <h1 className="font-extrabold text-sm md:text-base text-white truncate max-w-md">
                {course.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {certificate && (
              <Link
                href={`/verify/training/${certificate.certificateNumber}`}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-600/30 transition"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Verified Certificate</span>
              </Link>
            )}
            {!course.enrollment && (
              <button
                onClick={handleEnroll}
                disabled={actionLoading}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-md"
              >
                Enroll in Course
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-0 border-x border-slate-800 min-h-[calc(100vh-64px)]">
        {/* Left Lesson Navigation Sidebar */}
        <aside className="lg:col-span-4 border-r border-slate-800 bg-slate-900/40 flex flex-col justify-between">
          <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Curriculum Outline</h3>
              <p className="text-[11px] text-slate-400">Complete all required modules to earn your certificate.</p>
            </div>

            {/* Course Modules */}
            <div className="space-y-4">
              {course.modules.map((mod: any, mIdx: number) => (
                <div key={mod.id} className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Module {mIdx + 1}: {mod.title}
                  </span>
                  <div className="space-y-1">
                    {mod.lessons.map((les: any) => {
                      const isActive = activeLesson?.id === les.id;
                      const isDone = completedIds.includes(les.id);

                      return (
                        <button
                          key={les.id}
                          onClick={() => setActiveLesson(les)}
                          className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs transition ${
                            isActive
                              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 font-bold'
                              : 'text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <PlayCircle className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                            <span className="truncate">{les.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                            {les.durationMinutes}m
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certificate Progress Footer */}
          {course.enrollment && (
            <div className="p-4 border-t border-slate-800 bg-slate-900/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-300">Course Progress</span>
                <span className="font-bold text-emerald-400">{course.enrollment.progressPercent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all rounded-full"
                  style={{ width: `${course.enrollment.progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </aside>

        {/* Right Active Lesson Content Area */}
        <main className="lg:col-span-8 p-6 md:p-10 flex flex-col justify-between space-y-8 bg-slate-950">
          {activeLesson ? (
            <div className="space-y-6">
              {/* Lesson Header */}
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-emerald-400">
                    Lesson {activeLesson.displayOrder}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Est. Duration: {activeLesson.durationMinutes} minutes
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  {activeLesson.title}
                </h2>
              </div>

              {/* Video placeholder if lessonType is video */}
              {activeLesson.lessonType === 'VIDEO' && (
                <div className="aspect-video w-full rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <PlayCircle className="w-12 h-12 text-emerald-400/80" />
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-300">
                    Video Tutorial Stream Available
                  </span>
                </div>
              )}

              {/* Lesson Instructions & Content */}
              <div className="prose prose-invert prose-emerald max-w-none text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {activeLesson.content}
              </div>
            </div>
          ) : (
            <div className="text-center py-24 text-slate-500">
              Select a lesson from the curriculum outline to begin.
            </div>
          )}

          {/* Lesson Completion Bar */}
          {activeLesson && (
            <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
              <div>
                {isLessonCompleted ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Lesson Completed</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">Review lesson to mark complete</span>
                )}
              </div>

              <button
                onClick={() => handleCompleteLesson(activeLesson.id)}
                disabled={actionLoading || isLessonCompleted}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
              >
                {isLessonCompleted ? (
                  <span>Completed</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Lesson Complete</span>
                  </>
                )}
              </button>
            </div>
          )}
        </main>
      </div>

      <PublicFooter />
    </div>
  );
}
