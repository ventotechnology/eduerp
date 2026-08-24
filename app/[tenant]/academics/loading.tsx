import React from 'react';

export default function AcademicsLoading() {
  return (
    <div className="space-y-6 pb-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-96 bg-slate-100 dark:bg-slate-850 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-9 w-36 bg-blue-200 dark:bg-blue-900/50 rounded-xl" />
        </div>
      </div>

      {/* Tabs Navigation Skeleton */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-9 w-28 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0" />
        ))}
      </div>

      {/* Cards Grid / Table Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-8 w-28 bg-blue-100 dark:bg-blue-950 rounded-lg" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-6 w-20 bg-emerald-100 dark:bg-emerald-950 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
