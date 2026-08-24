import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth/server-auth';
import { SmsGatewayService } from '@/lib/services/sms/sms-gateway.service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session || !session.tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Active tenant session required.' }, { status: 401 });
    }

    const tenantId = session.tenantId;

    const [config, quota, tenantProviders, platformProvider] = await Promise.all([
      db.tenantSmsConfig.findUnique({
        where: { tenantId },
        include: { activeProvider: true }
      }),
      SmsGatewayService.getTenantSmsQuota(tenantId),
      db.smsProvider.findMany({
        where: { tenantId, scope: 'TENANT' },
        orderBy: { createdAt: 'desc' }
      }),
      db.smsProvider.findFirst({
        where: { scope: 'PLATFORM', isDefault: true, status: 'ACTIVE' }
      })
    ]);

    const sanitizedTenantProviders = tenantProviders.map((p) => SmsGatewayService.sanitizeProvider(p));

    return NextResponse.json({
      success: true,
      config: config || {
        serviceMode: 'PLATFORM_SHARED',
        allowFallback: false,
        activeProviderId: null,
        customSenderId: null
      },
      quota,
      tenantProviders: sanitizedTenantProviders,
      platformProvider: platformProvider ? {
        id: platformProvider.id,
        name: platformProvider.name,
        code: platformProvider.code,
        senderId: platformProvider.senderId,
        status: platformProvider.status
      } : null
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session || !session.tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Active tenant session required.' }, { status: 401 });
    }

    const tenantId = session.tenantId;
    const body = await request.json();
    const { serviceMode, activeProviderId, allowFallback, customSenderId } = body;

    const updated = await db.tenantSmsConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        serviceMode: serviceMode || 'PLATFORM_SHARED',
        activeProviderId: activeProviderId || null,
        allowFallback: Boolean(allowFallback),
        customSenderId: customSenderId || null
      },
      update: {
        serviceMode: serviceMode || undefined,
        activeProviderId: activeProviderId !== undefined ? activeProviderId : undefined,
        allowFallback: allowFallback !== undefined ? Boolean(allowFallback) : undefined,
        customSenderId: customSenderId !== undefined ? customSenderId : undefined
      }
    });

    return NextResponse.json({ success: true, config: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
