import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit/audit-logger';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        tenantId: true,
        tenant: {
          select: {
            slug: true,
            institutionType: true,
            subscriptionTier: true,
            institution: {
              select: {
                name: true,
                shortName: true
              }
            }
          }
        },
        createdAt: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User account not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch user profile.' }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Name must be at least 2 characters.' }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id: session.id },
      data: {
        name: name.trim(),
        phone: phone ? phone.trim() : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true
      }
    });

    await logAuditEvent({
      tenantId: session.tenantId,
      actor: session,
      action: 'USER_PROFILE_UPDATED',
      resourceType: 'User',
      resourceId: session.id,
      newState: { name: updatedUser.name, phone: updatedUser.phone }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully.'
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ success: false, error: error.message || 'Failed to update user profile.' }, { status });
  }
}
