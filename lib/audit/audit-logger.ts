import { db } from '../db';
import { SessionUser } from '../auth/types';

export interface AuditEventParams {
  tenantId?: string | null;
  actor: SessionUser | { id: string; name: string; role: string };
  action: string; // e.g. "MARKS_UPDATED", "FEE_INVOICE_CREATED", "SALARY_DISBURSED"
  resourceType: string; // e.g. "Student", "Invoice", "MarksEntry", "Settings"
  resourceId?: string;
  previousState?: any;
  newState?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Creates an immutable audit log entry in the database.
 */
export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        tenantId: params.tenantId || null,
        userId: params.actor.id,
        userName: params.actor.name,
        userRole: params.actor.role,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId || null,
        previousState: params.previousState ? JSON.stringify(params.previousState) : null,
        newState: params.newState ? JSON.stringify(params.newState) : null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null
      }
    });
  } catch (err) {
    console.error('CRITICAL: Failed to write to audit log', err);
    // Never fail the primary transaction silently, but log to stderr
  }
}
