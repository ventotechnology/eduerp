import React from 'react';

export default function StudentsLoading() {
  return (
    <div className="space-y-6 pb-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-72 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-96 bg-slate-100 dark:bg-slate-850 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-9 w-32 bg-indigo-200 dark:bg-indigo-900/50 rounded-xl" />
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] h-9 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="w-36 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="w-36 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="w-32 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 grid grid-cols-7 gap-4">
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded ml-auto" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 grid grid-cols-7 gap-4 items-center">
              <div className="h-4 w-24 bg-indigo-100 dark:bg-indigo-950 rounded" />
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-4 w-28 bg-slate-100 dark:bg-slate-850 rounded" />
              <div className="h-4 w-16 bg-slate-100 dark:bg-slate-850 rounded" />
              <div className="h-4 w-8 bg-slate-100 dark:bg-slate-850 rounded" />
              <div className="h-4 w-20 bg-slate-100 dark:bg-slate-850 rounded" />
              <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
