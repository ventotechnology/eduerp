import { db } from '@/lib/db';
import { AppError } from '@/lib/errors/app-error';
import { hasPlatformPermission } from '@/lib/rbac/platform-guard';

export const VALID_SUPPORT_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'] as const;

export const VALID_TICKET_STATUSES = [
  'NEW',
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_FOR_CUSTOMER',
  'CUSTOMER_REPLIED',
  'ESCALATED',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
  'CANCELLED'
] as const;

export const VALID_TICKET_TRANSITIONS: Record<string, string[]> = {
  NEW: ['OPEN', 'ASSIGNED', 'CANCELLED'],
  OPEN: ['ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_FOR_CUSTOMER', 'RESOLVED', 'ESCALATED'],
  WAITING_FOR_CUSTOMER: ['CUSTOMER_REPLIED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  CUSTOMER_REPLIED: ['IN_PROGRESS', 'RESOLVED', 'WAITING_FOR_CUSTOMER'],
  ESCALATED: ['IN_PROGRESS', 'RESOLVED', 'WAITING_FOR_CUSTOMER'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['IN_PROGRESS', 'ASSIGNED', 'OPEN'],
  CANCELLED: []
};

async function recordSupportAuditLog(data: {
  action: string;
  resourceType: string;
  resourceId: string;
  tenantId?: string | null;
  userId?: string;
  userName: string;
  oldState?: string;
  newState?: string;
}) {
  let validTenantId: string | null = null;
  if (data.tenantId) {
    const t = await db.tenant.findFirst({
      where: { OR: [{ id: data.tenantId }, { slug: data.tenantId }] },
      select: { id: true }
    }).catch(() => null);
    if (t) validTenantId = t.id;
  }

  return db.auditLog.create({
    data: {
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      tenant: validTenantId ? { connect: { id: validTenantId } } : undefined,
      userId: data.userId || null,
      userName: data.userName,
      previousState: data.oldState || null,
      newState: data.newState || null
    }
  }).catch(() => null);
}

export async function generateTicketNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();

  const seq = await db.$transaction(async (tx) => {
    let s = await tx.supportSequence.findUnique({
      where: { id: 'ticket_seq' }
    });

    if (!s) {
      s = await tx.supportSequence.create({
        data: {
          id: 'ticket_seq',
          currentNumber: 1,
          year: currentYear
        }
      });
      return s.currentNumber;
    }

    // Reset sequence counter to 1 if year has rolled over
    if (s.year !== currentYear) {
      const updated = await tx.supportSequence.update({
        where: { id: 'ticket_seq' },
        data: {
          currentNumber: 1,
          year: currentYear
        }
      });
      return updated.currentNumber;
    }

    const updated = await tx.supportSequence.update({
      where: { id: 'ticket_seq' },
      data: {
        currentNumber: { increment: 1 }
      }
    });

    return updated.currentNumber;
  });

  const padded = String(seq).padStart(6, '0');
  return `TKT-${currentYear}-${padded}`;
}

// -------------------------------------------------------------------------------------
// REAL BUSINESS-HOURS SLA ENGINE
// -------------------------------------------------------------------------------------

export interface BusinessDayConfig {
  dayOfWeek: number; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  isWorkingDay: boolean;
  openMinutes: number;  // Minutes from midnight, e.g. 9*60 = 540 (09:00)
  closeMinutes: number; // Minutes from midnight, e.g. 18*60 = 1080 (18:00)
}

export const DEFAULT_BANGLADESH_BUSINESS_WEEK: BusinessDayConfig[] = [
  { dayOfWeek: 0, isWorkingDay: true, openMinutes: 9 * 60, closeMinutes: 18 * 60 }, // Sunday
  { dayOfWeek: 1, isWorkingDay: true, openMinutes: 9 * 60, closeMinutes: 18 * 60 }, // Monday
  { dayOfWeek: 2, isWorkingDay: true, openMinutes: 9 * 60, closeMinutes: 18 * 60 }, // Tuesday
  { dayOfWeek: 3, isWorkingDay: true, openMinutes: 9 * 60, closeMinutes: 18 * 60 }, // Wednesday
  { dayOfWeek: 4, isWorkingDay: true, openMinutes: 9 * 60, closeMinutes: 18 * 60 }, // Thursday
  { dayOfWeek: 5, isWorkingDay: false, openMinutes: 0, closeMinutes: 0 },          // Friday (Weekend)
  { dayOfWeek: 6, isWorkingDay: false, openMinutes: 0, closeMinutes: 0 }           // Saturday (Weekend)
];

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export async function getBusinessSchedule(timezone: string = 'Asia/Dhaka'): Promise<{
  schedule: Map<number, BusinessDayConfig>;
  holidays: Set<string>;
  timezone: string;
}> {
  const dbHours = await db.supportBusinessHours.findMany({
    where: { timezone }
  }).catch(() => []);

  const schedule = new Map<number, BusinessDayConfig>();
  if (dbHours.length > 0) {
    for (const h of dbHours) {
      schedule.set(h.dayOfWeek, {
        dayOfWeek: h.dayOfWeek,
        isWorkingDay: h.isWorkingDay,
        openMinutes: parseTimeToMinutes(h.openTime),
        closeMinutes: parseTimeToMinutes(h.closeTime)
      });
    }
  } else {
    for (const d of DEFAULT_BANGLADESH_BUSINESS_WEEK) {
      schedule.set(d.dayOfWeek, d);
    }
  }

  const dbHolidays = await db.supportHoliday.findMany({
    where: { isWorkingOverride: false }
  }).catch(() => []);

  const holidays = new Set<string>();
  for (const h of dbHolidays) {
    holidays.add(h.date.toISOString().split('T')[0]);
  }

  return { schedule, holidays, timezone };
}

export function calculateBusinessDueTime(
  startTime: Date,
  targetMinutes: number,
  schedule: Map<number, BusinessDayConfig>,
  holidays: Set<string>,
  timezone: string = 'Asia/Dhaka'
): Date {
  if (targetMinutes <= 0) return new Date(startTime);

  // Timezone offset helper (Bangladesh is UTC+6 = 360 mins)
  // For exact arithmetic we convert timestamp to local minutes
  const tzOffsetMinutes = timezone === 'Asia/Dhaka' ? 360 : 360;

  let currentUtc = new Date(startTime.getTime());
  let remainingMinutes = targetMinutes;
  let safetyLoop = 0;

  while (remainingMinutes > 0 && safetyLoop < 10000) {
    safetyLoop++;
    // Get local date components
    const localMs = currentUtc.getTime() + tzOffsetMinutes * 60 * 1000;
    const localDate = new Date(localMs);
    const dayOfWeek = localDate.getUTCDay();
    const dateKey = localDate.toISOString().split('T')[0];
    const currentMinsFromMidnight = localDate.getUTCHours() * 60 + localDate.getUTCMinutes();

    const dayConfig = schedule.get(dayOfWeek) || {
      dayOfWeek,
      isWorkingDay: false,
      openMinutes: 0,
      closeMinutes: 0
    };

    const isHoliday = holidays.has(dateKey);

    if (!dayConfig.isWorkingDay || isHoliday) {
      // Advance to midnight of next day (which is 00:00 local)
      const minsToMidnight = 1440 - currentMinsFromMidnight;
      currentUtc = new Date(currentUtc.getTime() + minsToMidnight * 60 * 1000);
      continue;
    }

    if (currentMinsFromMidnight < dayConfig.openMinutes) {
      // Before business hours: advance to openTime
      const minsToOpen = dayConfig.openMinutes - currentMinsFromMidnight;
      currentUtc = new Date(currentUtc.getTime() + minsToOpen * 60 * 1000);
      continue;
    }

    if (currentMinsFromMidnight >= dayConfig.closeMinutes) {
      // After business hours: advance to midnight
      const minsToMidnight = 1440 - currentMinsFromMidnight;
      currentUtc = new Date(currentUtc.getTime() + minsToMidnight * 60 * 1000);
      continue;
    }

    // Within business hours
    const availableToday = dayConfig.closeMinutes - currentMinsFromMidnight;
    if (remainingMinutes <= availableToday) {
      currentUtc = new Date(currentUtc.getTime() + remainingMinutes * 60 * 1000);
      remainingMinutes = 0;
    } else {
      currentUtc = new Date(currentUtc.getTime() + availableToday * 60 * 1000);
      remainingMinutes -= availableToday;
    }
  }

  return currentUtc;
}

export async function computeSlaDueDates(
  priority: string,
  scope?: {
    planTier?: string;
    categoryCode?: string;
    institutionType?: string;
  }
) {
  // Multi-dimensional precedence resolution:
  // 1. category + plan + institution + priority
  // 2. plan + priority
  // 3. category + priority
  // 4. institution + priority
  // 5. priority default
  const policies = await db.supportSlaPolicy.findMany({
    where: { priority, isActive: true },
    orderBy: { displayPrecedence: 'desc' }
  }).catch(() => []);

  let matchedPolicy: any = null;
  if (policies.length > 0) {
    if (scope?.categoryCode && scope?.planTier && scope?.institutionType) {
      matchedPolicy = policies.find(
        (p) =>
          p.categoryCode === scope.categoryCode &&
          p.planTier === scope.planTier &&
          p.institutionType === scope.institutionType
      );
    }
    if (!matchedPolicy && scope?.planTier) {
      matchedPolicy = policies.find((p) => p.planTier === scope.planTier && !p.categoryCode && !p.institutionType);
    }
    if (!matchedPolicy && scope?.categoryCode) {
      matchedPolicy = policies.find((p) => p.categoryCode === scope.categoryCode && !p.planTier && !p.institutionType);
    }
    if (!matchedPolicy && scope?.institutionType) {
      matchedPolicy = policies.find((p) => p.institutionType === scope.institutionType && !p.planTier && !p.categoryCode);
    }
    if (!matchedPolicy) {
      matchedPolicy = policies.find((p) => !p.planTier && !p.categoryCode && !p.institutionType) || policies[0];
    }
  }

  const firstResponseMinutes = matchedPolicy?.firstResponseTargetMinutes || (priority === 'CRITICAL' ? 60 : priority === 'URGENT' ? 120 : priority === 'HIGH' ? 240 : 480);
  const resolutionMinutes = matchedPolicy?.resolutionTargetMinutes || (priority === 'CRITICAL' ? 240 : priority === 'URGENT' ? 720 : priority === 'HIGH' ? 1440 : 2880);
  const businessHoursOnly = matchedPolicy ? matchedPolicy.businessHoursOnly : true;

  const now = new Date();

  if (!businessHoursOnly) {
    return {
      firstResponseDueAt: new Date(now.getTime() + firstResponseMinutes * 60 * 1000),
      resolutionDueAt: new Date(now.getTime() + resolutionMinutes * 60 * 1000),
      policyName: matchedPolicy?.name || `${priority} SLA`
    };
  }

  const { schedule, holidays, timezone } = await getBusinessSchedule('Asia/Dhaka');
  const firstResponseDueAt = calculateBusinessDueTime(now, firstResponseMinutes, schedule, holidays, timezone);
  const resolutionDueAt = calculateBusinessDueTime(now, resolutionMinutes, schedule, holidays, timezone);

  return {
    firstResponseDueAt,
    resolutionDueAt,
    policyName: matchedPolicy?.name || `${priority} Business Hours SLA`
  };
}

// -------------------------------------------------------------------------------------
// TICKET LIFECYCLE & WORKFLOW ENGINE
// -------------------------------------------------------------------------------------

export async function createSupportTicket(
  data: {
    subject: string;
    categoryCode: string;
    relatedModule?: string;
    priority?: string;
    description: string;
    businessImpact?: string;
    affectedUrl?: string;
    preferredContact?: string;
  },
  session: {
    userId: string;
    name: string;
    email: string;
    role: string;
    tenantId: string;
    institutionId?: string;
    isPlatformAdmin?: boolean;
  }
) {
  if (!data.subject || !data.description || !data.categoryCode) {
    throw AppError.badRequest('Subject, description, and category code are required.');
  }

  const tenantId = session.tenantId;
  if (!tenantId) {
    throw AppError.badRequest('Authenticated tenant context is required to create a ticket.');
  }

  // Priority validation
  const priority = data.priority || 'NORMAL';
  if (!VALID_SUPPORT_PRIORITIES.includes(priority as any)) {
    throw AppError.badRequest(`Invalid priority '${priority}'. Allowed: ${VALID_SUPPORT_PRIORITIES.join(', ')}`);
  }

  // Category validation
  const category = await db.supportCategory.findUnique({
    where: { code: data.categoryCode }
  });
  if (!category || !category.isActive) {
    throw AppError.badRequest(`Support category '${data.categoryCode}' does not exist or is inactive.`);
  }

  const ticketNumber = await generateTicketNumber();
  const { firstResponseDueAt, resolutionDueAt } = await computeSlaDueDates(priority, {
    categoryCode: data.categoryCode
  });

  const ticket = await db.$transaction(async (tx) => {
    const createdTicket = await tx.supportTicket.create({
      data: {
        ticketNumber,
        tenantId,
        institutionId: session.institutionId || null,
        creatorUserId: session.userId,
        creatorName: session.name || 'Tenant User',
        creatorEmail: session.email,
        creatorRole: session.role || 'USER',
        subject: data.subject,
        categoryCode: data.categoryCode,
        relatedModule: data.relatedModule || 'OTHER',
        priority,
        status: 'NEW',
        description: data.description,
        businessImpact: data.businessImpact || null,
        affectedUrl: data.affectedUrl || null,
        preferredContact: data.preferredContact || 'IN_APP',
        firstResponseDueAt,
        resolutionDueAt
      }
    });

    // Initial message
    await tx.supportTicketMessage.create({
      data: {
        ticketId: createdTicket.id,
        senderUserId: session.userId,
        senderName: session.name || 'Tenant User',
        senderEmail: session.email,
        senderRole: session.role || 'USER',
        senderType: 'CUSTOMER',
        message: data.description,
        visibility: 'PUBLIC_REPLY'
      }
    });

    // Initial status history
    await tx.supportStatusHistory.create({
      data: {
        ticketId: createdTicket.id,
        fromStatus: 'NONE',
        toStatus: 'NEW',
        changedByUserId: session.userId,
        changedByName: session.name || 'Tenant User',
        reason: 'Ticket Created'
      }
    });

    return createdTicket;
  });

  // Audit log
  await recordSupportAuditLog({
    action: 'SUPPORT_TICKET_CREATED',
    resourceType: 'SupportTicket',
    resourceId: ticket.id,
    tenantId,
    userId: session.userId,
    userName: session.name,
    newState: JSON.stringify({
      ticketNumber,
      subject: data.subject,
      categoryCode: data.categoryCode,
      priority
    })
  });

  return ticket;
}

export async function listSupportTickets(
  params: {
    status?: string;
    priority?: string;
    categoryCode?: string;
    module?: string;
    tenantId?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
  session: {
    userId: string;
    tenantId: string;
    isPlatformAdmin?: boolean;
    role?: string;
  }
) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = {};

  // Strict Tenant Isolation for customer sessions
  if (!session.isPlatformAdmin) {
    where.tenantId = session.tenantId;
  } else if (params.tenantId && params.tenantId !== 'ALL') {
    where.tenantId = params.tenantId;
  }

  if (params.status && params.status !== 'ALL') {
    where.status = params.status;
  }
  if (params.priority && params.priority !== 'ALL') {
    where.priority = params.priority;
  }
  if (params.categoryCode && params.categoryCode !== 'ALL') {
    where.categoryCode = params.categoryCode;
  }
  if (params.module && params.module !== 'ALL') {
    where.relatedModule = params.module;
  }
  if (params.search) {
    where.OR = [
      { ticketNumber: { contains: params.search, mode: 'insensitive' } },
      { subject: { contains: params.search, mode: 'insensitive' } },
      { creatorName: { contains: params.search, mode: 'insensitive' } },
      { creatorEmail: { contains: params.search, mode: 'insensitive' } }
    ];
  }

  const [total, items] = await Promise.all([
    db.supportTicket.count({ where }),
    db.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTeam: { select: { id: true, name: true, code: true } },
        _count: { select: { messages: true } },
        csat: true
      },
      skip,
      take: limit
    })
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    items
  };
}

export async function getSupportTicket(
  ticketNumber: string,
  session: {
    userId: string;
    tenantId: string;
    isPlatformAdmin?: boolean;
    role?: string;
  }
) {
  const ticket = await db.supportTicket.findUnique({
    where: { ticketNumber },
    include: {
      assignedTeam: true,
      statusHistory: { orderBy: { changedAt: 'asc' } },
      csat: true,
      attachments: true
    }
  });

  if (!ticket) {
    throw AppError.notFound(`Ticket '${ticketNumber}' not found.`);
  }

  // Strict Tenant Isolation check
  if (!session.isPlatformAdmin && ticket.tenantId !== session.tenantId) {
    throw AppError.forbidden(`Access to ticket '${ticketNumber}' denied.`);
  }

  // Messages Query: STRICT INTERNAL NOTE ISOLATION
  const messageWhere: any = { ticketId: ticket.id };
  if (!session.isPlatformAdmin) {
    messageWhere.visibility = 'PUBLIC_REPLY';
  }

  const messages = await db.supportTicketMessage.findMany({
    where: messageWhere,
    orderBy: { createdAt: 'asc' },
    include: {
      attachments: true
    }
  });

  return {
    ...ticket,
    messages
  };
}

export async function addTicketMessage(
  ticketNumber: string,
  data: {
    message: string;
    visibility?: 'PUBLIC_REPLY' | 'INTERNAL_NOTE';
  },
  session: {
    userId: string;
    name: string;
    email: string;
    role: string;
    tenantId: string;
    isPlatformAdmin?: boolean;
  }
) {
  const ticket = await db.supportTicket.findUnique({ where: { ticketNumber } });
  if (!ticket) throw AppError.notFound(`Ticket '${ticketNumber}' not found.`);

  // Strict Tenant Isolation check
  if (!session.isPlatformAdmin && ticket.tenantId !== session.tenantId) {
    throw AppError.forbidden(`Access to ticket '${ticketNumber}' denied.`);
  }

  const visibility = data.visibility || 'PUBLIC_REPLY';

  // Granular platform permission for INTERNAL_NOTE
  if (visibility === 'INTERNAL_NOTE') {
    if (!session.isPlatformAdmin || !hasPlatformPermission(session, 'SUPPORT_INTERNAL_NOTE')) {
      throw AppError.forbidden("Permission denied: You do not have 'SUPPORT_INTERNAL_NOTE' authorization.");
    }
  }

  const senderType = session.isPlatformAdmin ? 'SUPPORT_AGENT' : 'CUSTOMER';

  const message = await db.supportTicketMessage.create({
    data: {
      ticketId: ticket.id,
      senderUserId: session.userId,
      senderName: session.name,
      senderEmail: session.email,
      senderRole: session.role,
      senderType,
      message: data.message,
      visibility
    }
  });

  // Lifecycle updates on public replies
  if (visibility === 'PUBLIC_REPLY') {
    const updateData: any = {};
    if (session.isPlatformAdmin) {
      if (!ticket.firstResponseAt) {
        updateData.firstResponseAt = new Date();
        updateData.firstResponseBreached = ticket.firstResponseDueAt ? new Date() > ticket.firstResponseDueAt : false;
      }
      if (['NEW', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'CUSTOMER_REPLIED'].includes(ticket.status)) {
        updateData.status = 'WAITING_FOR_CUSTOMER';
      }
    } else {
      // Customer replied
      if (['WAITING_FOR_CUSTOMER', 'RESOLVED'].includes(ticket.status)) {
        updateData.status = 'CUSTOMER_REPLIED';
      }
    }

    if (Object.keys(updateData).length > 0) {
      await db.supportTicket.update({
        where: { id: ticket.id },
        data: updateData
      });

      if (updateData.status && updateData.status !== ticket.status) {
        await db.supportStatusHistory.create({
          data: {
            ticketId: ticket.id,
            fromStatus: ticket.status,
            toStatus: updateData.status,
            changedByUserId: session.userId,
            changedByName: session.name,
            reason: session.isPlatformAdmin ? 'Support Agent Public Reply' : 'Customer Public Reply'
          }
        });
      }
    }
  }

  // Audit log
  await recordSupportAuditLog({
    action: visibility === 'INTERNAL_NOTE' ? 'SUPPORT_INTERNAL_NOTE_ADDED' : 'SUPPORT_REPLY_SENT',
    resourceType: 'SupportTicketMessage',
    resourceId: message.id,
    tenantId: ticket.tenantId,
    userId: session.userId,
    userName: session.name,
    newState: JSON.stringify({ ticketNumber, visibility, senderType })
  });

  return message;
}

export async function updateTicketStatus(
  ticketNumber: string,
  data: {
    status: string;
    reason?: string;
    resolutionSummary?: string;
  },
  session: {
    userId: string;
    name: string;
    tenantId: string;
    isPlatformAdmin?: boolean;
    role?: string;
  }
) {
  const ticket = await db.supportTicket.findUnique({ where: { ticketNumber } });
  if (!ticket) throw AppError.notFound(`Ticket '${ticketNumber}' not found.`);

  const newStatus = data.status;

  // Validate state transition in state machine
  const allowedNext = VALID_TICKET_TRANSITIONS[ticket.status] || [];
  if (!allowedNext.includes(newStatus)) {
    throw AppError.badRequest(
      `Invalid ticket transition from '${ticket.status}' to '${newStatus}'. Allowed: ${allowedNext.join(', ') || 'none'}`
    );
  }

  // Customer status rights enforcement
  if (!session.isPlatformAdmin) {
    if (ticket.tenantId !== session.tenantId) {
      throw AppError.forbidden(`Access to ticket '${ticketNumber}' denied.`);
    }

    // Customers can ONLY:
    // 1. Confirm resolution: RESOLVED -> CLOSED
    // 2. Reopen: RESOLVED / CLOSED -> REOPENED
    // 3. Cancel: NEW / OPEN -> CANCELLED
    const allowedCustomerStatuses = ['CLOSED', 'REOPENED', 'CANCELLED'];
    if (!allowedCustomerStatuses.includes(newStatus)) {
      throw AppError.forbidden(`Customers cannot set ticket status to '${newStatus}'. Only support staff may resolve or assign tickets.`);
    }
  } else {
    // Platform staff requires SUPPORT_TICKET_STATUS permission
    if (!hasPlatformPermission(session, 'SUPPORT_TICKET_STATUS')) {
      throw AppError.forbidden("Permission denied: Requires 'SUPPORT_TICKET_STATUS' authorization.");
    }
  }

  if (newStatus === 'RESOLVED' && !data.resolutionSummary && !ticket.resolutionSummary) {
    throw AppError.badRequest('A resolution summary is required when resolving a ticket.');
  }

  const updateData: any = {
    status: newStatus,
    updatedAt: new Date()
  };

  if (newStatus === 'RESOLVED') {
    updateData.resolvedAt = new Date();
    updateData.resolutionSummary = data.resolutionSummary || ticket.resolutionSummary;
    updateData.resolutionBreached = ticket.resolutionDueAt ? new Date() > ticket.resolutionDueAt : false;
  } else if (newStatus === 'CLOSED') {
    updateData.closedAt = new Date();
  } else if (newStatus === 'REOPENED') {
    updateData.reopenedAt = new Date();
    updateData.reopenCount = { increment: 1 };
  }

  const updatedTicket = await db.supportTicket.update({
    where: { id: ticket.id },
    data: updateData
  });

  await db.supportStatusHistory.create({
    data: {
      ticketId: ticket.id,
      fromStatus: ticket.status,
      toStatus: newStatus,
      changedByUserId: session.userId,
      changedByName: session.name,
      reason: data.reason || (newStatus === 'RESOLVED' ? data.resolutionSummary : `Status transitioned to ${newStatus}`)
    }
  });

  await recordSupportAuditLog({
    action: newStatus === 'RESOLVED' ? 'SUPPORT_RESOLVED' : newStatus === 'REOPENED' ? 'SUPPORT_REOPENED' : 'SUPPORT_STATUS_CHANGED',
    resourceType: 'SupportTicket',
    resourceId: ticket.id,
    tenantId: ticket.tenantId,
    userId: session.userId,
    userName: session.name,
    oldState: JSON.stringify({ status: ticket.status }),
    newState: JSON.stringify({ status: newStatus })
  });

  return updatedTicket;
}

export async function assignTicket(
  ticketNumber: string,
  data: {
    agentId?: string;
    agentName?: string;
    agentEmail?: string;
    teamId?: string;
  },
  session: {
    userId: string;
    name: string;
    isPlatformAdmin?: boolean;
    role?: string;
  }
) {
  if (!session.isPlatformAdmin || !hasPlatformPermission(session, 'SUPPORT_TICKET_ASSIGN')) {
    throw AppError.forbidden("Permission denied: Requires 'SUPPORT_TICKET_ASSIGN' authorization.");
  }

  const ticket = await db.supportTicket.findUnique({ where: { ticketNumber } });
  if (!ticket) throw AppError.notFound(`Ticket '${ticketNumber}' not found.`);

  const updateData: any = {
    assignedAgentId: data.agentId || null,
    assignedAgentName: data.agentName || null,
    assignedAgentEmail: data.agentEmail || null,
    assignedTeamId: data.teamId || null,
    status: data.agentId && (ticket.status === 'NEW' || ticket.status === 'OPEN') ? 'ASSIGNED' : ticket.status
  };

  const updated = await db.supportTicket.update({
    where: { id: ticket.id },
    data: updateData
  });

  await recordSupportAuditLog({
    action: 'SUPPORT_TICKET_ASSIGNED',
    resourceType: 'SupportTicket',
    resourceId: ticket.id,
    tenantId: ticket.tenantId,
    userId: session.userId,
    userName: session.name,
    newState: JSON.stringify(updateData)
  });

  return updated;
}

export async function submitTicketCsat(
  ticketNumber: string,
  data: { rating: number; comment?: string },
  session: { userId: string; tenantId: string }
) {
  const ticket = await db.supportTicket.findUnique({ where: { ticketNumber } });
  if (!ticket) throw AppError.notFound(`Ticket '${ticketNumber}' not found.`);

  if (ticket.tenantId !== session.tenantId) {
    throw AppError.forbidden('You can only rate tickets belonging to your institution.');
  }

  // CSAT Eligibility: Only allowed on RESOLVED or CLOSED tickets
  if (ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') {
    throw AppError.badRequest('CSAT feedback is only available after a ticket has been resolved or closed.');
  }

  const rating = Math.max(1, Math.min(5, Number(data.rating) || 5));

  return db.supportCsat.upsert({
    where: { ticketId: ticket.id },
    create: {
      ticketId: ticket.id,
      userId: session.userId,
      rating,
      comment: data.comment || null
    },
    update: {
      rating,
      comment: data.comment || null,
      submittedAt: new Date()
    }
  });
}

export async function getSupportAnalytics() {
  const [
    totalTickets,
    openTickets,
    unassignedTickets,
    urgentTickets,
    resolvedTickets,
    csatStats
  ] = await Promise.all([
    db.supportTicket.count(),
    db.supportTicket.count({ where: { status: { in: ['NEW', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'CUSTOMER_REPLIED'] } } }),
    db.supportTicket.count({ where: { assignedAgentId: null, status: { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] } } }),
    db.supportTicket.count({ where: { priority: { in: ['URGENT', 'CRITICAL'] }, status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
    db.supportTicket.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
    db.supportCsat.aggregate({
      _avg: { rating: true },
      _count: { id: true }
    })
  ]);

  const totalCsatResponses = csatStats._count.id;
  const averageCsat = totalCsatResponses > 0 && csatStats._avg.rating
    ? Number(csatStats._avg.rating.toFixed(1))
    : null; // null if no ratings yet

  return {
    totalTickets,
    openTickets,
    unassignedTickets,
    urgentTickets,
    resolvedTickets,
    averageCsat,
    totalCsatResponses
  };
}

export async function evaluateEscalationRules() {
  const rules = await db.supportEscalationRule.findMany({
    where: { isActive: true }
  });

  if (rules.length === 0) return { evaluatedCount: 0, escalatedCount: 0 };

  const openTickets = await db.supportTicket.findMany({
    where: { status: { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] } }
  });

  let escalatedCount = 0;
  const now = new Date();

  for (const ticket of openTickets) {
    for (const rule of rules) {
      let matches = true;

      if (rule.priority && ticket.priority !== rule.priority) matches = false;
      if (rule.status && ticket.status !== rule.status) matches = false;
      if (rule.categoryCode && ticket.categoryCode !== rule.categoryCode) matches = false;
      if (rule.reopenCountThreshold && ticket.reopenCount < rule.reopenCountThreshold) matches = false;

      if (rule.unassignedMinutes && !ticket.assignedAgentId) {
        const unassignedMins = Math.floor((now.getTime() - ticket.createdAt.getTime()) / (60 * 1000));
        if (unassignedMins < rule.unassignedMinutes) matches = false;
      }

      if (rule.firstResponseRemainingMinutes && ticket.firstResponseDueAt && !ticket.firstResponseAt) {
        const remaining = Math.floor((ticket.firstResponseDueAt.getTime() - now.getTime()) / (60 * 1000));
        if (remaining > rule.firstResponseRemainingMinutes) matches = false;
      }

      if (rule.resolutionRemainingMinutes && ticket.resolutionDueAt && !ticket.resolvedAt) {
        const remaining = Math.floor((ticket.resolutionDueAt.getTime() - now.getTime()) / (60 * 1000));
        if (remaining > rule.resolutionRemainingMinutes) matches = false;
      }

      if (matches) {
        const updates: any = { isEscalated: true, escalatedAt: now, escalationReason: `Auto-escalated by rule: ${rule.name}` };
        if (rule.actionType === 'ESCALATE_PRIORITY' && rule.targetPriority) {
          updates.priority = rule.targetPriority;
        }
        if (rule.actionType === 'ASSIGN_TEAM' && rule.targetTeamId) {
          updates.assignedTeamId = rule.targetTeamId;
        }

        await db.supportTicket.update({
          where: { id: ticket.id },
          data: updates
        });

        await db.supportStatusHistory.create({
          data: {
            ticketId: ticket.id,
            fromStatus: ticket.status,
            toStatus: 'ESCALATED',
            changedByUserId: 'SYSTEM_ESCALATION',
            changedByName: 'SLA Escalation Engine',
            reason: `Auto-escalation rule '${rule.name}' triggered.`
          }
        });

        escalatedCount++;
        break; // Match one rule per ticket
      }
    }
  }

  return { evaluatedCount: openTickets.length, escalatedCount };
}
