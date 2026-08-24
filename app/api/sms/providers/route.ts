import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth/server-auth';
import { encryptSmsCredentials } from '@/lib/services/sms/sms-crypto';
import { SmsGatewayService } from '@/lib/services/sms/sms-gateway.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session || !session.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providers = await db.smsProvider.findMany({
      where: { tenantId: session.tenantId, scope: 'TENANT' },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      providers: providers.map((p) => SmsGatewayService.sanitizeProvider(p))
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session || !session.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, code, type = 'HTTP_API', baseUrl, senderId, credentials } = body;

    if (!name || !code || !credentials) {
      return NextResponse.json({ success: false, error: 'Name, code, and credentials are required.' }, { status: 400 });
    }

    const encryptedCredentials = encryptSmsCredentials(credentials);

    const provider = await db.smsProvider.create({
      data: {
        scope: 'TENANT',
        tenantId: session.tenantId,
        name,
        code: code.toUpperCase(),
        type,
        baseUrl,
        senderId,
        encryptedCredentials,
        status: 'ACTIVE'
      }
    });

    // Automatically set as active provider in tenant config
    await db.tenantSmsConfig.upsert({
      where: { tenantId: session.tenantId },
      create: {
        tenantId: session.tenantId,
        serviceMode: 'TENANT_OWN',
        activeProviderId: provider.id
      },
      update: {
        serviceMode: 'TENANT_OWN',
        activeProviderId: provider.id
      }
    });

    const testRes = await SmsGatewayService.testProvider(provider.id).catch(() => null);

    return NextResponse.json({
      success: true,
      provider: SmsGatewayService.sanitizeProvider(provider),
      testResult: testRes
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session || !session.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, baseUrl, senderId, credentials, status } = body;

    if (!id) return NextResponse.json({ success: false, error: 'Provider ID required' }, { status: 400 });

    const existing = await db.smsProvider.findFirst({
      where: { id, tenantId: session.tenantId }
    });
    if (!existing) return NextResponse.json({ success: false, error: 'Provider not found.' }, { status: 404 });

    const updateData: any = {
      ...(name && { name }),
      ...(baseUrl !== undefined && { baseUrl }),
      ...(senderId !== undefined && { senderId }),
      ...(status && { status })
    };

    if (credentials && Object.keys(credentials).length > 0) {
      const hasRealUpdate = Object.values(credentials).some((v: any) => typeof v === 'string' && !v.includes('••••'));
      if (hasRealUpdate) {
        updateData.encryptedCredentials = encryptSmsCredentials(credentials);
      }
    }

    const updated = await db.smsProvider.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, provider: SmsGatewayService.sanitizeProvider(updated) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session || !session.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Provider ID required' }, { status: 400 });

    await db.smsProvider.deleteMany({
      where: { id, tenantId: session.tenantId }
    });

    return NextResponse.json({ success: true, message: 'Provider deleted.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
