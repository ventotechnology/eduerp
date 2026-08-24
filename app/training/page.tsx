'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PublicFooter } from '@/components/layout/public-footer';
import {
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Users,
  ShieldCheck,
  PlayCircle
} from 'lucide-react';

export default function TrainingAcademyPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/training/courses')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCourses(data.data || []);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
              E
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white">
                EduERP
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase -mt-1">
                Training Academy & Certification
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/help" className="text-slate-300 hover:text-white transition">
              Help Center
            </Link>
            <Link href="/support/tickets" className="text-slate-300 hover:text-white transition">
              Support Desk
            </Link>
            <Link href="/login" className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition">
              Sign In to Track Progress
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
            <Award className="w-3.5 h-3.5" />
            <span>EduERP Certified Professional Programs</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Master the EduERP Platform with Guided Academy Courses
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto">
            Self-paced product certification curricula designed for institution principals, admission staff, teachers, and accountants.
          </p>
        </div>
      </div>

      {/* Course Catalog */}
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Available Certification Programs</h2>
            <p className="text-xs text-slate-400">Complete curriculum lessons and quizzes to earn verifiable digital credentials.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono">Loading training courses...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const enrollment = course.enrollment;
              const isCompleted = enrollment?.status === 'COMPLETED';

              return (
                <div
                  key={course.id}
                  className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition flex flex-col justify-between space-y-6 shadow-xl group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold uppercase tracking-wider">
                        {course.difficulty}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{course.durationMinutes} mins</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800/80">
                      <p><span className="text-slate-500 font-medium">Target Audience:</span> {course.audience}</p>
                      <p><span className="text-slate-500 font-medium">Curriculum:</span> {course.totalModules} Modules • {course.totalLessons} Lessons</p>
                    </div>

                    {enrollment && (
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-[10px] font-semibold">
                          <span className="text-slate-400">Progress</span>
                          <span className="text-emerald-400">{enrollment.progressPercent}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${enrollment.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/training/courses/${course.slug}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition transform active:scale-95"
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>View Certificate & Lessons</span>
                        </>
                      ) : enrollment ? (
                        <>
                          <PlayCircle className="w-4 h-4" />
                          <span>Continue Course ({enrollment.progressPercent}%)</span>
                        </>
                      ) : (
                        <>
                          <span>Start Course & Get Certified</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
