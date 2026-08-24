import { NextRequest, NextResponse } from 'next/server';
import { MediaStorageService } from '@/lib/services/media/media-storage.service';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Media ID required.' }, { status: 400 });
    }

    const session = await getAuthSession(req);
    // If authenticated, pass tenantId to enforce isolation, otherwise public photos (admission preview) can resolve
    const requestedTenantId = session?.isPlatformAdmin ? null : session?.tenantId || null;

    const { mediaAsset, buffer } = await MediaStorageService.getMediaAsset(id, requestedTenantId);

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': mediaAsset.mimeType || 'image/jpeg',
        'Content-Length': buffer.length.toString(),
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=86400, must-revalidate'
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Media not found.' },
      { status: error.statusCode || 404 }
    );
  }
}
