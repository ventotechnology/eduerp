import { NextRequest, NextResponse } from 'next/server';
import { listTrainingCourses } from '@/lib/client-success/training-service';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession(request).catch(() => null);
    const userId = session?.authenticated ? session.userId : undefined;

    const courses = await listTrainingCourses(userId);
    return NextResponse.json({ success: true, data: courses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
