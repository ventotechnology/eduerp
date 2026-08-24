import { NextResponse } from 'next/server';
import { listReleaseNotes } from '@/lib/client-success/knowledge-service';

export async function GET() {
  try {
    const releases = await listReleaseNotes();
    return NextResponse.json({ success: true, data: releases });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
