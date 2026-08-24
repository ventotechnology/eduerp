'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SupportRootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/support/tickets');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
