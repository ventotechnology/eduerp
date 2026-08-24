import { NextRequest, NextResponse } from 'next/server';
import { MediaStorageService } from '@/lib/services/media/media-storage.service';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const { id: studentId } = await params;
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const tenantSlug = (formData.get('tenantSlug') as string) || (session as any).tenantSlug || (session as any).institutionSlug || session.tenantId;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No photo file provided.' }, { status: 400 });
    }

    if (!tenantSlug) {
      return NextResponse.json({ success: false, error: 'Tenant context required.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await MediaStorageService.updateStudentPhoto(
      tenantSlug,
      studentId,
      buffer,
      file.name,
      file.type || 'image/jpeg',
      session.userId
    );

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update student photo.' },
      { status: error.statusCode || 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(req);
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const { id: studentId } = await params;
    const url = new URL(req.url);
    const tenantSlug = url.searchParams.get('tenantSlug') || (session as any).tenantSlug || (session as any).institutionSlug || session.tenantId;

    if (!tenantSlug) {
      return NextResponse.json({ success: false, error: 'Tenant context required.' }, { status: 400 });
    }

    await MediaStorageService.removeStudentPhoto(tenantSlug, studentId, session.userId);

    return NextResponse.json({
      success: true,
      message: 'Student photo removed successfully.'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to remove student photo.' },
      { status: error.statusCode || 400 }
    );
  }
}
