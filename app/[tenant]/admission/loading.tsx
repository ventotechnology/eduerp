import React from 'react';

export default function AdmissionLoading() {
  return (
    <div className="space-y-6 pb-12 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-96 bg-slate-100 dark:bg-slate-850 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-9 w-36 bg-emerald-200 dark:bg-emerald-900/50 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-6 w-12 bg-slate-300 dark:bg-slate-600 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800/40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
