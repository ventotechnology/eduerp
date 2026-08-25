import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { requirePlatformPermission } from '@/lib/rbac/platform-guard';
import { db } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api/safe-response';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session) {
      return apiError('AUTH_REQUIRED', 'Unauthorized: Session required', 401);
    }

    requirePlatformPermission(session, 'PAYMENT_VIEW');

    const { searchParams } = new URL(request.url);
    const gateway = searchParams.get('gateway');
    const status = searchParams.get('status');
    const limit = Math.min(Number(searchParams.get('limit')) || 25, 100);

    const where: any = {};
    if (gateway) where.gateway = gateway;
    if (status) where.status = status;

    const [saasTransactions, studentTransactions] = await Promise.all([
      db.subscriptionPaymentTransaction.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: {
              tenant: {
                include: { institution: true }
              },
              signup: true
            }
          }
        }
      }),
      db.paymentTransaction.findMany({
        where: gateway ? { gateway } : {},
        take: limit,
        orderBy: { paidAt: 'desc' },
        include: {
          invoice: {
            select: {
              invoiceNumber: true,
              student: {
                select: {
                  firstName: true,
                  lastName: true,
                  campus: { select: { institution: { select: { name: true } } } }
                }
              }
            }
          }
        }
      })
    ]);

    const unified = [
      ...saasTransactions.map(tx => ({
        id: tx.id,
        type: 'SAAS_SUBSCRIPTION',
        gateway: tx.gateway,
        paymentId: tx.paymentId,
        trxId: tx.trxId,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        payer: tx.order?.signup?.institutionName || tx.order?.tenant?.institution?.name || tx.order?.tenant?.slug || 'SaaS Customer',
        reference: tx.order?.orderNumber || tx.id,
        date: tx.createdAt
      })),
      ...studentTransactions.map(tx => ({
        id: tx.id,
        type: 'STUDENT_FEE',
        gateway: tx.gateway,
        paymentId: tx.receiptNumber,
        trxId: tx.transactionRef,
        amount: tx.amount,
        currency: 'BDT',
        status: tx.status,
        payer: `${tx.invoice?.student?.firstName || ''} ${tx.invoice?.student?.lastName || ''}`.trim() || 'Student',
        reference: tx.invoice?.invoiceNumber || tx.receiptNumber,
        date: tx.paidAt
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);

    return apiSuccess({
      transactions: unified,
      count: unified.length
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return apiError(error.code || 'SERVER_ERROR', error.message || 'Error fetching transactions', status);
  }
}
