import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateVenominIntegrationAuth } from '@/lib/venomin/integration-auth';
import { sanitizeIntegrationPayload } from '@/lib/venomin/sanitizer';

export const dynamic = 'force-dynamic';

const FORBIDDEN_RECON_TYPES = new Set([
  'STUDENT',
  'STUDENTS',
  'GUARDIAN',
  'GUARDIANS',
  'PARENT',
  'ATTENDANCE',
  'EXAM',
  'EXAMS',
  'GRADE',
  'GRADES',
  'RESULT',
  'RESULTS',
  'TRANSCRIPT',
  'STUDENT_FEE',
  'STUDENT_PAYMENT',
  'HEALTH',
  'DISCIPLINE',
  'BIOMETRICS',
  'TEACHER_PAYROLL',
  'PAYROLL',
]);

export async function GET(req: NextRequest) {
  const auth = await validateVenominIntegrationAuth(req);
  if (!auth.authenticated) {
    return NextResponse.json(
      { status: 'UNAUTHORIZED', error: auth.error, message: auth.message },
      { status: auth.status }
    );
  }

  const { searchParams } = new URL(req.url);
  const typeParam = (searchParams.get('type') || searchParams.get('recordType') || 'TENANT').toUpperCase();
  const sinceParam = searchParams.get('since') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

  if (FORBIDDEN_RECON_TYPES.has(typeParam)) {
    return NextResponse.json(
      {
        status: 'FORBIDDEN',
        error: 'STUDENT_OR_ACADEMIC_RECONCILIATION_DENIED',
        message: `Reconciliation of ${typeParam} records is strictly excluded by privacy policy.`,
      },
      { status: 403 }
    );
  }

  try {
    const sinceDate = new Date(sinceParam);
    const validSince = isNaN(sinceDate.getTime()) ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : sinceDate;

    let items: any[] = [];

    switch (typeParam) {
      case 'TENANT':
      case 'ORGANIZATION': {
        const tenants = await db.tenant.findMany({
          where: { updatedAt: { gte: validSince } },
          orderBy: { updatedAt: 'asc' },
          take: limit,
          include: { institution: true },
        });

        items = tenants.map((t) => ({
          recordType: 'TENANT',
          recordId: t.id,
          title: `Tenant: ${t.slug}`,
          status: t.status,
          updatedAt: t.updatedAt.toISOString(),
          dataSafe: sanitizeIntegrationPayload({
            tenantId: t.id,
            tenantSlug: t.slug,
            institutionName: t.institution?.name,
            institutionType: t.institutionType,
            subscriptionTier: t.subscriptionTier,
            status: t.status,
          }),
        }));
        break;
      }
      case 'SUPPORT_TICKET': {
        const tickets = await db.supportTicket.findMany({
          where: { updatedAt: { gte: validSince } },
          orderBy: { updatedAt: 'asc' },
          take: limit,
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
            categoryCode: true,
            priority: true,
            status: true,
            tenantId: true,
            updatedAt: true,
          },
        });

        items = tickets.map((tk) => ({
          recordType: 'SUPPORT_TICKET',
          recordId: tk.id,
          title: `Ticket ${tk.ticketNumber}: ${tk.subject}`,
          status: tk.status,
          updatedAt: tk.updatedAt.toISOString(),
          dataSafe: sanitizeIntegrationPayload({
            ticketId: tk.id,
            ticketNumber: tk.ticketNumber,
            subject: tk.subject,
            categoryCode: tk.categoryCode,
            priority: tk.priority,
            status: tk.status,
            tenantId: tk.tenantId,
          }),
        }));
        break;
      }
      default:
        items = [];
    }

    const nextCursor = items.length > 0 ? items[items.length - 1].updatedAt : new Date().toISOString();

    return NextResponse.json({
      status: 'SUCCESS',
      type: typeParam,
      count: items.length,
      nextCursor,
      items,
      reconciledAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'INTERNAL_ERROR', error: 'RECONCILIATION_FAILED', message: err?.message || 'Reconciliation query failed.' },
      { status: 500 }
    );
  }
}
