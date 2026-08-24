import React from 'react';

export default function HrLoading() {
  return (
    <div className="space-y-6 pb-12 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-96 bg-slate-100 dark:bg-slate-850 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-9 w-28 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-8 w-12 bg-slate-300 dark:bg-slate-600 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
