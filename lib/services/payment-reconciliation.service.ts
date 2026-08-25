import { db } from '../db';

export type ReconciliationStatus =
  | 'MATCHED'
  | 'UNMATCHED'
  | 'AMOUNT_MISMATCH'
  | 'MISSING_LOCAL'
  | 'MISSING_PROVIDER'
  | 'DUPLICATE'
  | 'MANUAL_REVIEW';

export interface ExternalSettlementItem {
  trxId: string;
  amount: number;
  fee?: number;
  date?: Date | string;
  settlementRef?: string;
  payerRef?: string;
}

export interface RunReconciliationInput {
  scope?: 'PLATFORM' | 'TENANT';
  tenantId?: string;
  gateway?: string;
  startDate?: Date;
  endDate?: Date;
  batchReference?: string;
  externalSettlements?: ExternalSettlementItem[];
}

export class PaymentReconciliationService {
  /**
   * Runs an automated reconciliation batch comparing internal records against external provider settlement items
   */
  static async runReconciliation(input: RunReconciliationInput) {
    const scope = input.scope || 'PLATFORM';
    const batchRef = input.batchReference || `REC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const dateFilter: any = {};
    if (input.startDate) dateFilter.gte = input.startDate;
    if (input.endDate) dateFilter.lte = input.endDate;

    const recordsCreated: any[] = [];

    if (scope === 'PLATFORM') {
      // 1. Fetch local successful platform subscription payment transactions
      const localTx = await db.subscriptionPaymentTransaction.findMany({
        where: {
          ...(input.gateway ? { gateway: input.gateway } : {}),
          status: 'SUCCESS',
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
        },
        include: {
          order: {
            include: {
              plan: true,
              signup: true,
              tenant: true
            }
          }
        }
      });

      const providerItems = input.externalSettlements || [];
      const matchedProviderTrxIds = new Set<string>();

      // Check each local transaction
      for (const tx of localTx) {
        const trxRef = tx.trxId || tx.paymentId || tx.id;
        const matchingProviderItem = providerItems.find(p => p.trxId === tx.trxId || (tx.paymentId && p.trxId === tx.paymentId));

        let status: ReconciliationStatus = 'MATCHED';
        let providerAmount: number | null = null;
        let feeAmount = 0;
        let settlementRef: string | null = null;
        let settlementDate: Date | null = null;

        if (providerItems.length > 0) {
          if (!matchingProviderItem) {
            status = 'MISSING_PROVIDER';
          } else {
            matchedProviderTrxIds.add(matchingProviderItem.trxId);
            providerAmount = matchingProviderItem.amount;
            feeAmount = matchingProviderItem.fee || 0;
            settlementRef = matchingProviderItem.settlementRef || null;
            settlementDate = matchingProviderItem.date ? new Date(matchingProviderItem.date) : new Date();

            if (Math.abs(matchingProviderItem.amount - tx.amount) > 0.01) {
              status = 'AMOUNT_MISMATCH';
            }
          }
        } else {
          // If no provider items supplied, verify against internal invoice/order integrity
          if (tx.order && Math.abs(tx.order.totalAmount - tx.amount) > 0.01) {
            status = 'AMOUNT_MISMATCH';
          } else if (!tx.trxId && tx.gateway !== 'BANK_TRANSFER') {
            status = 'MANUAL_REVIEW';
          }
        }

        const netAmount = (providerAmount !== null ? providerAmount : tx.amount) - feeAmount;

        const recRecord = await db.paymentReconciliationRecord.create({
          data: {
            scope: 'PLATFORM',
            gateway: tx.gateway,
            batchReference: batchRef,
            transactionRef: trxRef,
            orderId: tx.orderId,
            providerAmount: providerAmount !== null ? providerAmount : tx.amount,
            localAmount: tx.amount,
            currency: tx.currency,
            feeAmount,
            netAmount,
            status,
            reconciliationDate: new Date(),
            settlementDate,
            settlementRef,
            settlementStatus: status === 'MATCHED' ? 'SETTLED' : 'PENDING'
          }
        });

        recordsCreated.push(recRecord);
      }

      // Check for provider items missing locally (MISSING_LOCAL)
      for (const pItem of providerItems) {
        if (!matchedProviderTrxIds.has(pItem.trxId)) {
          const recRecord = await db.paymentReconciliationRecord.create({
            data: {
              scope: 'PLATFORM',
              gateway: input.gateway || 'UNKNOWN',
              batchReference: batchRef,
              transactionRef: pItem.trxId,
              providerAmount: pItem.amount,
              localAmount: null,
              currency: 'BDT',
              feeAmount: pItem.fee || 0,
              netAmount: pItem.amount - (pItem.fee || 0),
              status: 'MISSING_LOCAL',
              reconciliationDate: new Date(),
              settlementDate: pItem.date ? new Date(pItem.date) : new Date(),
              settlementRef: pItem.settlementRef || null,
              settlementStatus: 'DISPUTED',
              notes: `Provider recorded transaction ${pItem.trxId} of ${pItem.amount} BDT which was not found in EduERP local database.`
            }
          });
          recordsCreated.push(recRecord);
        }
      }
    } else {
      // TENANT scope reconciliation
      const tenantId = input.tenantId;
      if (!tenantId) throw new Error('Tenant ID is required for TENANT scope reconciliation.');

      const localTx = await db.paymentTransaction.findMany({
        where: {
          invoice: { student: { campus: { institution: { tenantId } } } },
          ...(input.gateway ? { gateway: input.gateway } : {}),
          status: 'SUCCESS',
          ...(Object.keys(dateFilter).length > 0 ? { paidAt: dateFilter } : {})
        },
        include: {
          invoice: true
        }
      });

      for (const tx of localTx) {
        const trxRef = tx.transactionRef || tx.id;
        const recRecord = await db.paymentReconciliationRecord.create({
          data: {
            scope: 'TENANT',
            tenantId,
            gateway: tx.gateway,
            batchReference: batchRef,
            transactionRef: trxRef,
            invoiceId: tx.invoiceId,
            providerAmount: tx.amount,
            localAmount: tx.amount,
            currency: 'BDT',
            feeAmount: 0,
            netAmount: tx.amount,
            status: 'MATCHED',
            reconciliationDate: new Date(),
            settlementStatus: 'SETTLED'
          }
        });
        recordsCreated.push(recRecord);
      }
    }

    return {
      success: true,
      batchReference: batchRef,
      totalProcessed: recordsCreated.length,
      matchedCount: recordsCreated.filter(r => r.status === 'MATCHED').length,
      discrepancyCount: recordsCreated.filter(r => r.status !== 'MATCHED').length,
      records: recordsCreated
    };
  }

  /**
   * Retrieves summary metrics and paginated records for the reconciliation dashboard
   */
  static async getReconciliationDashboard(params?: {
    scope?: string;
    tenantId?: string;
    gateway?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};
    if (params?.scope) where.scope = params.scope;
    if (params?.tenantId) where.tenantId = params.tenantId;
    if (params?.gateway && params.gateway !== 'ALL') where.gateway = params.gateway;
    if (params?.status && params.status !== 'ALL') where.status = params.status;

    const [totalRecords, records, allRecords] = await Promise.all([
      db.paymentReconciliationRecord.count({ where }),
      db.paymentReconciliationRecord.findMany({
        where,
        orderBy: { reconciliationDate: 'desc' },
        take: params?.limit || 50,
        skip: params?.offset || 0,
        include: {
          tenant: {
            select: {
              slug: true,
              institution: { select: { name: true } }
            }
          }
        }
      }),
      db.paymentReconciliationRecord.findMany({
        where: { ...(params?.scope ? { scope: params.scope } : {}) },
        select: {
          status: true,
          providerAmount: true,
          localAmount: true,
          feeAmount: true,
          netAmount: true
        }
      })
    ]);

    let totalGross = 0;
    let totalFees = 0;
    let totalNet = 0;
    let matchedCount = 0;
    let unmatchedCount = 0;
    let mismatchCount = 0;
    let exceptionsCount = 0;

    for (const r of allRecords) {
      const amount = r.providerAmount || r.localAmount || 0;
      totalGross += amount;
      totalFees += r.feeAmount || 0;
      totalNet += r.netAmount || (amount - (r.feeAmount || 0));

      if (r.status === 'MATCHED') matchedCount++;
      else {
        unmatchedCount++;
        if (r.status === 'AMOUNT_MISMATCH') mismatchCount++;
        else exceptionsCount++;
      }
    }

    return {
      metrics: {
        totalRecords: allRecords.length,
        totalGross,
        totalFees,
        totalNet,
        matchedCount,
        unmatchedCount,
        mismatchCount,
        exceptionsCount,
        matchRatePercent: allRecords.length > 0 ? Math.round((matchedCount / allRecords.length) * 100) : 100
      },
      pagination: {
        total: totalRecords,
        limit: params?.limit || 50,
        offset: params?.offset || 0
      },
      records
    };
  }

  /**
   * Resolves a reconciliation exception / discrepancy
   */
  static async resolveDiscrepancy(recordId: string, resolution: {
    status: ReconciliationStatus;
    notes: string;
    resolvedBy: string;
  }) {
    const record = await db.paymentReconciliationRecord.findUnique({
      where: { id: recordId }
    });

    if (!record) throw new Error('Reconciliation record not found.');

    const updated = await db.paymentReconciliationRecord.update({
      where: { id: recordId },
      data: {
        status: resolution.status,
        notes: resolution.notes,
        resolvedBy: resolution.resolvedBy,
        resolvedAt: new Date(),
        settlementStatus: resolution.status === 'MATCHED' ? 'SETTLED' : 'DISPUTED'
      }
    });

    return updated;
  }
}
