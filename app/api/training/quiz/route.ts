import { NextRequest, NextResponse } from 'next/server';
import { submitQuizAttempt } from '@/lib/client-success/training-service';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request);
    if (!session?.authenticated) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const { quizId, answers } = body;

    if (!quizId || !answers) {
      return NextResponse.json({ success: false, error: 'quizId and answers are required.' }, { status: 400 });
    }

    const result = await submitQuizAttempt(quizId, answers, {
      id: session.userId,
      email: session.email,
      name: session.name
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
