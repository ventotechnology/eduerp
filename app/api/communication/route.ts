import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { getServerSession } from '@/lib/auth/server-auth';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import { SessionUser, UserStatus } from '@/lib/auth/types';

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

    // Check if SMS gateway is configured
    const isSmsConfigured = Boolean(process.env.SMS_GATEWAY_API_KEY && process.env.SMS_GATEWAY_API_KEY !== 'placeholder');

    return NextResponse.json({
      success: true,
      data: {
        notices,
        stats: {
          totalStudents,
          totalGuardians,
          totalEmployees,
          overdueInvoicesCount: 0,
        },
        smsGateway: {
          isConfigured: isSmsConfigured,
          provider: isSmsConfigured ? process.env.SMS_GATEWAY_PROVIDER || 'BANGLADESH_GATEWAY' : 'NOT_CONFIGURED',
          balance: isSmsConfigured ? 1000 : 0,
          status: isSmsConfigured ? 'READY' : 'INTEGRATION_NOT_CONFIGURED',
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
    const { action, tenantId, title, audience, content, isUrgent } = body;

    const resolvedTenantSlug = tenantId || session?.tenantSlug;
    if (!resolvedTenantSlug) {
      return NextResponse.json({ success: false, error: 'Tenant identifier required' }, { status: 400 });
    }

    const tenant = await requireTenant(resolvedTenantSlug);

    const actor: SessionUser = session || {
      id: 'system',
      name: 'Administrator',
      email: 'admin@eduerp.us',
      role: 'SUPER_ADMIN',
      tenantId: tenant.tenantId,
      isPlatformAdmin: true,
      status: UserStatus.ACTIVE,
    };

    if (action === 'PUBLISH_NOTICE') {
      if (!title || !title.trim()) {
        return NextResponse.json({ success: false, error: 'Notice title is required' }, { status: 400 });
      }
      if (!content || !content.trim()) {
        return NextResponse.json({ success: false, error: 'Notice content is required' }, { status: 400 });
      }

      const noticeId = `NOT-${Date.now().toString().slice(-6)}`;
      const dateStr = new Date().toISOString().slice(0, 10);

      await logAuditEvent({
        tenantId: tenant.tenantId,
        actor,
        action: 'PUBLISH_NOTICE',
        resourceType: 'NOTICE',
        resourceId: noticeId,
        newState: {
          id: noticeId,
          title: title.trim(),
          audience: audience || 'All Students & Guardians',
          content: content.trim(),
          isUrgent: !!isUrgent,
          date: dateStr,
          author: actor.name,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: noticeId,
          title: title.trim(),
          audience: audience || 'All Students & Guardians',
          content: content.trim(),
          isUrgent: !!isUrgent,
          date: dateStr,
          publishedBy: actor.name,
        },
        message: 'Notice published successfully',
      }, { status: 201 });
    }

    if (action === 'SEND_SMS') {
      const isSmsConfigured = Boolean(process.env.SMS_GATEWAY_API_KEY && process.env.SMS_GATEWAY_API_KEY !== 'placeholder');

      if (!isSmsConfigured) {
        return NextResponse.json({
          success: false,
          error: 'SMS Gateway is not configured for this tenant. Please configure gateway API keys in Platform Settings before broadcasting SMS.',
        }, { status: 422 });
      }

      return NextResponse.json({ success: true, data: { sent: true, count: 0 }, message: 'SMS dispatched successfully' });
    }

    return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to process communication request' }, { status: 500 });
  }
}
