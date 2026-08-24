import { NextRequest, NextResponse } from 'next/server';
import { getTrainingCourseBySlug, enrollInCourse } from '@/lib/client-success/training-service';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getAuthSession(request).catch(() => null);
    const userId = session?.authenticated ? session.userId : undefined;

    const course = await getTrainingCourseBySlug(slug, userId);
    return NextResponse.json({ success: true, data: course });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getAuthSession(request);
    if (!session?.authenticated) {
      return NextResponse.json({ success: false, error: 'Authentication required to enroll in course.' }, { status: 401 });
    }

    const course = await getTrainingCourseBySlug(slug, session.userId);
    const enrollment = await enrollInCourse(course.id, {
      id: session.userId,
      email: session.email,
      name: session.name,
      tenantId: session.tenantId
    });

    return NextResponse.json({ success: true, data: enrollment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
