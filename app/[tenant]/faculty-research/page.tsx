'use client';

import React, { useState } from 'react';
import { useTenant } from '@/lib/tenant-context';
import { THESIS_DEFENSE_RECORDS, RESEARCH_PROJECTS, UNIVERSITY_TRANSCRIPT_SAMPLE } from '@/lib/mock-data';
import {
  Microscope,
  Award,
  BookOpen,
  CheckCircle2,
  Calendar,
  DollarSign,
  FileText,
  Layers,
  GraduationCap,
  Sparkles,
  Plus,
  ShieldCheck
} from 'lucide-react';

export default function FacultyResearchPage() {
  const { branding } = useTenant();
  const [activeTab, setActiveTab] = useState<'thesis' | 'research' | 'addDrop'>('thesis');
  const [theses, setTheses] = useState(THESIS_DEFENSE_RECORDS);

  // Add/Drop Simulator State
  const [enrolledCourses, setEnrolledCourses] = useState([
    { code: 'CSE-401', title: 'Compiler Design & Construction', credits: 3.0, status: 'ENROLLED' },
    { code: 'CSE-402', title: 'Compiler Design Lab', credits: 1.5, status: 'ENROLLED' },
    { code: 'CSE-405', title: 'Computer Networks & Distributed Systems', credits: 3.0, status: 'ENROLLED' },
    { code: 'CSE-409', title: 'Cloud Computing & Microservices Architecture', credits: 3.0, status: 'ENROLLED' }
  ]);

  const handleDropCourse = (code: string) => {
    setEnrolledCourses(
      enrolledCourses.map((c) => (c.code === code ? { ...c, status: 'DROPPED' } : c))
    );
  };

  const handleAddCourse = (course: { code: string; title: string; credits: number }) => {
    if (enrolledCourses.some((c) => c.code === course.code)) return;
    setEnrolledCourses([...enrolledCourses, { ...course, status: 'ENROLLED' }]);
  };

  const totalEnrolledCredits = enrolledCourses
    .filter((c) => c.status === 'ENROLLED')
    .reduce((sum, c) => sum + c.credits, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-700/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-600/40">
              University Specialized Engine
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Higher Education, Semester Credit Hours & Research Portal
          </h1>
          <p className="text-xs text-indigo-100/80 mt-1 max-w-2xl">
            Facilitates undergraduate/graduate semester course registration, Add/Drop protocols, Thesis supervisor defense evaluations, and UGC/Ministry research grants.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-indigo-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('thesis')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'thesis' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Thesis & Defense
          </button>
          <button
            onClick={() => setActiveTab('research')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'research' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Research & Grants
          </button>
          <button
            onClick={() => setActiveTab('addDrop')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'addDrop' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Course Add / Drop
          </button>
        </div>
      </div>

      {/* Tab 1: Thesis Defense Workflow */}
      {activeTab === 'thesis' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                Undergraduate & Graduate Thesis Defense Roster
              </h3>
              <p className="text-xs text-slate-500">
                Tracking proposal submissions, Turnitin plagiarism index, supervisor sign-offs, and defense jury scoring
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {theses.length} Active Candidates
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {theses.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {item.program}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        item.defenseStatus === 'DEFENDED_PASSED'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {item.defenseStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                    {item.thesisTitle}
                  </h4>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <p>
                      <strong className="text-slate-800 dark:text-slate-200">Candidate:</strong> {item.studentName} ({item.studentIdNumber})
                    </p>
                    <p>
                      <strong className="text-slate-800 dark:text-slate-200">Faculty Supervisor:</strong> {item.supervisorName}
                    </p>
                    <p>
                      <strong className="text-slate-800 dark:text-slate-200">Defense Date:</strong> {item.defenseDate}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-500">
                    <span>Plagiarism Index:</span>
                    <span className="font-bold text-emerald-600">{item.plagiarismPercent}% (Turnitin)</span>
                  </div>
                  {item.score ? (
                    <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      Score: {item.score}/100
                    </span>
                  ) : (
                    <button className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs">
                      Grade Defense
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Research Grants */}
      {activeTab === 'research' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                Institutional Research Grants & Projects
              </h3>
              <p className="text-xs text-slate-500">
                Funded by UGC Bangladesh, ICT Innovation Fund & International Partners
              </p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>Submit Project Proposal</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RESEARCH_PROJECTS.map((proj) => (
              <div
                key={proj.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ৳ {proj.grantAmount.toLocaleString()} Grant
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {proj.status}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {proj.title}
                </h4>

                <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <p><strong>Principal Investigator:</strong> {proj.principalInvestigator}</p>
                  <p><strong>Department:</strong> {proj.department}</p>
                  <p><strong>Funding Body:</strong> {proj.fundingAgency}</p>
                  <p><strong>Indexed Publications:</strong> {proj.publicationsCount} Scopus/IEEE Papers</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Semester Credit Add / Drop Simulator */}
      {activeTab === 'addDrop' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Semester Course Registration & Add / Drop Portal
              </h3>
              <p className="text-xs text-slate-500">
                Student: Tanveer Ahmed (MUST-2023-CSE-0042) • BSc in CSE (Semester 7)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
                <span className="text-slate-500 block text-[10px]">Registered Credits</span>
                <span className="font-black text-indigo-700 dark:text-indigo-300 text-sm">
                  {totalEnrolledCredits} / 15.0 Limit
                </span>
              </div>
            </div>
          </div>

          {/* Current Enrolled Courses */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Enrolled Courses for Spring 2026
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              {enrolledCourses.map((c) => (
                <div key={c.code} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <div>
                    <span className="font-bold text-indigo-600 mr-2">{c.code}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{c.title}</span>
                    <span className="text-slate-400 ml-2">({c.credits} Credits)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-bold text-[10px] px-2 py-0.5 rounded ${
                        c.status === 'ENROLLED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {c.status}
                    </span>
                    {c.status === 'ENROLLED' && (
                      <button
                        onClick={() => handleDropCourse(c.code)}
                        className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800 text-[11px] font-bold"
                      >
                        Drop Course
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Available Electives to Add */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Available Open Electives
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">CSE-415: Cyber Security & Cryptography</span>
                  <p className="text-slate-400 text-[11px]">3.0 Credits • Prereq: CSE-305</p>
                </div>
                <button
                  onClick={() => handleAddCourse({ code: 'CSE-415', title: 'Cyber Security & Cryptography', credits: 3.0 })}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  + Add
                </button>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">CSE-422: Natural Language Processing</span>
                  <p className="text-slate-400 text-[11px]">3.0 Credits • Prereq: CSE-310</p>
                </div>
                <button
                  onClick={() => handleAddCourse({ code: 'CSE-422', title: 'Natural Language Processing', credits: 3.0 })}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
