import { NextRequest, NextResponse } from 'next/server';
import { MediaStorageService } from '@/lib/services/media/media-storage.service';
import { getAuthSession } from '@/lib/auth/get-auth-session';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const tenantSlug = (formData.get('tenantSlug') as string) || '';
    const entityType = ((formData.get('entityType') as string) || 'STUDENT') as any;
    const entityId = (formData.get('entityId') as string) || null;
    const category = ((formData.get('category') as string) || 'PROFILE_PHOTO') as any;
    const source = ((formData.get('source') as string) || 'DIRECT_UPLOAD') as any;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided.' }, { status: 400 });
    }

    if (!tenantSlug) {
      return NextResponse.json({ success: false, error: 'Tenant identifier is required.' }, { status: 400 });
    }

    const session = await getAuthSession(req);

    // ArrayBuffer to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await MediaStorageService.uploadMedia({
      tenantIdentifier: tenantSlug,
      entityType,
      entityId,
      category,
      fileBuffer: buffer,
      fileName: file.name,
      mimeType: file.type || 'image/jpeg',
      uploadedByUserId: session?.userId || null,
      source
    });

    return NextResponse.json({
      success: true,
      data: {
        mediaId: result.mediaAsset.id,
        url: result.url,
        objectKey: result.objectKey,
        fileName: result.mediaAsset.fileName,
        fileSize: result.mediaAsset.fileSize,
        mimeType: result.mediaAsset.mimeType
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Media upload failed.' },
      { status: error.statusCode || 400 }
    );
  }
}
