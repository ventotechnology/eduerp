import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { AppError } from '@/lib/errors/app-error';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ success: false, error: 'New password must be at least 8 characters long.' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: session.id }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User account not found.' }, { status: 404 });
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json({ success: false, error: 'Current password does not match.' }, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        forcePasswordChange: false,
        passwordChangedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ success: false, error: error.message || 'Failed to change password.' }, { status });
  }
}
