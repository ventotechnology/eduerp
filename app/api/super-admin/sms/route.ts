import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePlatformPermission } from '@/lib/rbac/platform-guard';
import { encryptSmsCredentials, decryptSmsCredentials, maskSmsCredentials } from '@/lib/services/sms/sms-crypto';
import { SmsGatewayService } from '@/lib/services/sms/sms-gateway.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    requirePlatformPermission(session, 'GATEWAY_MANAGE');

    const [providers, addonPackages, recentBroadcasts, totalUsage] = await Promise.all([
      db.smsProvider.findMany({
        where: { scope: 'PLATFORM' },
        orderBy: { createdAt: 'desc' }
      }),
      db.smsAddonPackage.findMany({
        orderBy: { displayOrder: 'asc' }
      }),
      db.smsBroadcast.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { tenant: { select: { slug: true } } }
      }),
      db.smsUsageLedger.aggregate({
        _sum: { quantity: true, totalCost: true }
      })
    ]);

    const sanitizedProviders = providers.map((p) => {
      let creds = {};
      try {
        creds = maskSmsCredentials(decryptSmsCredentials(p.encryptedCredentials));
      } catch {
        creds = { encrypted: true };
      }
      return { ...p, credentials: creds };
    });

    return NextResponse.json({
      success: true,
      providers: sanitizedProviders,
      addonPackages,
      recentBroadcasts,
      metrics: {
        totalSmsConsumed: totalUsage._sum.quantity || 0,
        totalPlatformCost: totalUsage._sum.totalCost || 0,
        activeProvidersCount: providers.filter((p) => p.status === 'ACTIVE').length
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    requirePlatformPermission(session, 'GATEWAY_MANAGE');

    const body = await request.json();
    const { name, code, type = 'HTTP_API', baseUrl, senderId, credentials, isDefault, supportsUnicode = true, supportsBulk = true } = body;

    if (!name || !code || !credentials) {
      return NextResponse.json({ success: false, error: 'Name, provider code, and credentials are required.' }, { status: 400 });
    }

    const encryptedCredentials = encryptSmsCredentials(credentials);

    // If marked default, unset other platform defaults
    if (isDefault) {
      await db.smsProvider.updateMany({
        where: { scope: 'PLATFORM' },
        data: { isDefault: false }
      });
    }

    const provider = await db.smsProvider.create({
      data: {
        scope: 'PLATFORM',
        name,
        code: code.toUpperCase(),
        type,
        baseUrl,
        senderId,
        encryptedCredentials,
        isDefault: Boolean(isDefault),
        supportsUnicode: Boolean(supportsUnicode),
        supportsBulk: Boolean(supportsBulk),
        status: 'ACTIVE'
      }
    });

    // Auto-test newly created provider
    const testResult = await SmsGatewayService.testProvider(provider.id).catch(() => null);

    return NextResponse.json({
      success: true,
      provider: SmsGatewayService.sanitizeProvider(provider),
      testResult
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    requirePlatformPermission(session, 'GATEWAY_MANAGE');

    const body = await request.json();
    const { id, name, baseUrl, senderId, credentials, isDefault, status, supportsUnicode, supportsBulk } = body;

    if (!id) return NextResponse.json({ success: false, error: 'Provider ID is required.' }, { status: 400 });

    if (isDefault) {
      await db.smsProvider.updateMany({
        where: { scope: 'PLATFORM', id: { not: id } },
        data: { isDefault: false }
      });
    }

    const updateData: any = {
      ...(name && { name }),
      ...(baseUrl !== undefined && { baseUrl }),
      ...(senderId !== undefined && { senderId }),
      ...(isDefault !== undefined && { isDefault: Boolean(isDefault) }),
      ...(status && { status }),
      ...(supportsUnicode !== undefined && { supportsUnicode: Boolean(supportsUnicode) }),
      ...(supportsBulk !== undefined && { supportsBulk: Boolean(supportsBulk) })
    };

    if (credentials && Object.keys(credentials).length > 0) {
      // Check if credentials contain real new values or just masked ones
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
    return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    requirePlatformPermission(session, 'GATEWAY_MANAGE');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'Provider ID is required.' }, { status: 400 });

    await db.smsProvider.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Provider deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 500 });
  }
}
