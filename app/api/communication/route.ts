import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { getServerSession } from '@/lib/auth/server-auth';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import { SessionUser, UserStatus } from '@/lib/auth/types';
import { SmsGatewayService } from '@/lib/services/sms/sms-gateway.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantParam = searchParams.get('tenantId') || searchParams.get('tenant');
    if (!tenantParam) {
      return NextResponse.json({ success: false, error: 'Tenant identifier required' }, { status: 400 });
    }

    const tenant = await requireTenant(tenantParam);
    const institutionId = tenant.institutionId;

    // Real DB Counts with correct Prisma relations
    const [totalStudents, totalGuardians, totalEmployees] = await Promise.all([
      db.student.count({ where: { campus: { institutionId } } }),
      db.guardian.count({ where: { students: { some: { campus: { institutionId } } } } }),
      db.employee.count({ where: { campus: { institutionId } } }),
    ]);

    // Query published notices from AuditLog
    const noticeLogs = await db.auditLog.findMany({
      where: {
        tenantId: tenant.tenantId,
        resourceType: 'NOTICE',
        action: 'PUBLISH_NOTICE',
      },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    const notices = noticeLogs.map((log) => {
      let state: any = {};
      try {
        state = log.newState ? JSON.parse(log.newState) : {};
      } catch {
        state = {};
      }
      return {
        id: log.resourceId || log.id,
        title: state.title || 'Institutional Notice',
        audience: state.audience || 'All Students & Guardians',
        date: state.date || log.timestamp.toISOString().slice(0, 10),
        isUrgent: !!state.isUrgent,
        content: state.content || '',
        publishedBy: log.userName,
      };
    });

    // Check real SMS gateway configuration & quota via SmsGatewayService
    const [providerResolution, quota, recentBroadcasts] = await Promise.all([
      SmsGatewayService.resolveTenantSmsProvider(tenant.tenantId),
      SmsGatewayService.getTenantSmsQuota(tenant.tenantId),
      db.smsBroadcast.findMany({
        where: { tenantId: tenant.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    const isSmsConfigured = providerResolution.status === 'PLATFORM_SHARED' || providerResolution.status === 'TENANT_OWN' || providerResolution.status === 'PLATFORM_FALLBACK';

    return NextResponse.json({
      success: true,
      data: {
        notices,
        recentBroadcasts,
        stats: {
          totalStudents,
          totalGuardians,
          totalEmployees,
          overdueInvoicesCount: 0,
        },
        smsGateway: {
          isConfigured: isSmsConfigured,
          serviceMode: providerResolution.mode,
          status: providerResolution.status,
          providerName: providerResolution.provider?.name || 'Not Configured',
          providerCode: providerResolution.provider?.code || 'NONE',
          senderId: providerResolution.senderId || providerResolution.provider?.senderId || 'None',
          quota: quota.remainingCredits,
          usedThisPeriod: quota.usedThisPeriod,
          totalAvailable: quota.totalAvailable,
          isUnlimited: quota.isUnlimited
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to load communication records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const body = await request.json();
    const { action, tenantId, title, audience, content, isUrgent, target, message } = body;

    const resolvedTenantSlug = tenantId || session?.tenantSlug;
    if (!resolvedTenantSlug) {
      return NextResponse.json({ success: false, error: 'Tenant identifier required' }, { status: 400 });
    }

    const tenant = await requireTenant(resolvedTenantSlug);

    const actor: SessionUser = session || {
      id: 'system',
      name: 'Administrator',
      email: 'admin@eduerp.us',
      role: 'PLATFORM_SUPER_ADMIN' as any,
      tenantId: tenant.tenantId,
      tenantSlug: tenant.slug,
      status: UserStatus.ACTIVE,
      isPlatformAdmin: true
    };

    if (action === 'PUBLISH_NOTICE') {
      if (!title || !content) {
        return NextResponse.json({ success: false, error: 'Notice title and content are required' }, { status: 400 });
      }

      await logAuditEvent({
        tenantId: tenant.tenantId,
        actor,
        action: 'PUBLISH_NOTICE',
        resourceType: 'NOTICE',
        resourceId: `notice-${Date.now()}`,
        newState: { title, audience, isUrgent, date: new Date().toISOString() },
      });

      return NextResponse.json({
        success: true,
        message: 'Notice published successfully',
      });
    }

    if (action === 'SEND_SMS' || action === 'SEND_SMS_BROADCAST') {
      const smsMessage = message || content;
      const audienceType = target || audience || 'ALL_GUARDIANS';

      if (!smsMessage) {
        return NextResponse.json({ success: false, error: 'SMS message text is required' }, { status: 400 });
      }

      const broadcastResult = await SmsGatewayService.sendBroadcast({
        tenantId: tenant.tenantId,
        audienceType: audienceType === 'ALL_PARENTS' ? 'ALL_GUARDIANS' : audienceType,
        message: smsMessage,
        requestedBy: actor.name || actor.email || 'Admin',
        requestedByRole: actor.role
      });

      return NextResponse.json({
        success: true,
        data: broadcastResult,
        message: `SMS broadcast processed. Total dispatches: ${broadcastResult.totalSent}.`
      });
    }

    return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to process communication request' }, { status: 500 });
  }
}
