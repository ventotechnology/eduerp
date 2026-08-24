import { db } from '@/lib/db';
import { AppError } from '@/lib/errors/app-error';

export interface PlatformContactSettingsInput {
  companyName?: string;
  productName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  generalEmail?: string;
  supportEmail?: string;
  salesEmail?: string;
  billingEmail?: string;
  privacyEmail?: string;
  phone?: string;
  whatsapp?: string;
  businessHours?: string;
  timezone?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  websiteUrl?: string;
}

export const DEFAULT_CONTACT_SETTINGS = {
  id: 'default',
  companyName: 'Vento Technology',
  productName: 'EduERP',
  address: 'House 2/B, Road 8, Nikunja-2, Khilkhet',
  city: 'Dhaka',
  postalCode: '1229',
  country: 'Bangladesh',
  generalEmail: 'teamhimu@gmail.com',
  supportEmail: 'teamhimu@gmail.com',
  salesEmail: 'teamhimu@gmail.com',
  billingEmail: 'teamhimu@gmail.com',
  privacyEmail: 'teamhimu@gmail.com',
  phone: '+8801335556688',
  whatsapp: '+8801335556688',
  businessHours: 'Sunday - Thursday, 9:00 AM - 6:00 PM BST',
  timezone: 'Asia/Dhaka',
  facebookUrl: 'https://facebook.com/ventotechnology',
  linkedinUrl: 'https://linkedin.com/company/ventotechnology',
  youtubeUrl: 'https://youtube.com/@ventotechnology',
  websiteUrl: 'https://eduerp.us'
};

export const INQUIRY_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'DEMO_SCHEDULED',
  'PROPOSAL_SENT',
  'CONVERTED_TO_TENANT',
  'CONVERTED_TO_TICKET',
  'CLOSED',
  'REJECTED',
  'SPAM'
] as const;

export async function getPlatformContactSettings() {
  let settings = await db.platformContactSettings.findUnique({
    where: { id: 'default' }
  });

  if (!settings) {
    settings = await db.platformContactSettings.create({
      data: DEFAULT_CONTACT_SETTINGS
    });
  }

  return settings;
}

export async function syncProductionContactSettings() {
  const current = await getPlatformContactSettings();
  const updates: any = {};

  if (current.supportEmail === 'support@eduerp.us') updates.supportEmail = 'teamhimu@gmail.com';
  if (current.salesEmail === 'sales@eduerp.us') updates.salesEmail = 'teamhimu@gmail.com';
  if (current.billingEmail === 'billing@eduerp.us') updates.billingEmail = 'teamhimu@gmail.com';
  if (current.privacyEmail === 'privacy@eduerp.us') updates.privacyEmail = 'teamhimu@gmail.com';

  if (Object.keys(updates).length > 0) {
    return db.platformContactSettings.update({
      where: { id: 'default' },
      data: updates
    });
  }
  return current;
}

export async function updatePlatformContactSettings(
  input: PlatformContactSettingsInput,
  actorUserId?: string,
  actorName?: string
) {
  const current = await getPlatformContactSettings();
  const updated = await db.platformContactSettings.update({
    where: { id: 'default' },
    data: {
      ...input,
      updatedAt: new Date()
    }
  });

  // Audit Log
  await db.auditLog.create({
    data: {
      action: 'CONTACT_SETTINGS_UPDATED',
      resourceType: 'PlatformContactSettings',
      resourceId: 'default',
      userId: actorUserId || 'SYSTEM',
      userName: actorName || 'Platform Super Admin',
      previousState: JSON.stringify(current),
      newState: JSON.stringify(updated)
    }
  });

  return updated;
}

export async function generateInquiryNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();

  // Atomic increment on sequence record with year rollover
  const seq = await db.$transaction(async (tx) => {
    let s = await tx.inquirySequence.findUnique({
      where: { id: 'inquiry_seq' }
    });

    if (!s) {
      s = await tx.inquirySequence.create({
        data: {
          id: 'inquiry_seq',
          currentNumber: 1,
          year: currentYear
        }
      });
      return s.currentNumber;
    }

    if (s.year !== currentYear) {
      const updated = await tx.inquirySequence.update({
        where: { id: 'inquiry_seq' },
        data: {
          currentNumber: 1,
          year: currentYear
        }
      });
      return updated.currentNumber;
    }

    const updated = await tx.inquirySequence.update({
      where: { id: 'inquiry_seq' },
      data: {
        currentNumber: { increment: 1 }
      }
    });

    return updated.currentNumber;
  });

  const padded = String(seq).padStart(6, '0');
  return `INQ-${currentYear}-${padded}`;
}

export async function createContactInquiry(data: {
  fullName: string;
  institutionName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  institutionType?: any;
  district?: string;
  country?: string;
  studentCount?: number;
  campusCount?: number;
  subject: string;
  category: string;
  preferredContact?: string;
  preferredDemoDate?: Date | string;
  requirements?: string;
}) {
  if (!data.fullName || !data.email || !data.subject) {
    throw AppError.badRequest('Full name, email, and inquiry subject are required.');
  }

  const inquiryNumber = await generateInquiryNumber();

  const inquiry = await db.contactInquiry.create({
    data: {
      inquiryNumber,
      fullName: data.fullName,
      institutionName: data.institutionName || 'Prospective Institution',
      email: data.email,
      phone: data.phone || '',
      whatsapp: data.whatsapp || data.phone || null,
      institutionType: data.institutionType || 'SCHOOL',
      district: data.district || 'Dhaka',
      country: data.country || 'Bangladesh',
      studentCount: data.studentCount ? Number(data.studentCount) : null,
      campusCount: data.campusCount ? Number(data.campusCount) : 1,
      subject: data.subject,
      category: data.category || 'Product Demo',
      preferredContact: data.preferredContact || 'EMAIL',
      preferredDemoDate: data.preferredDemoDate ? new Date(data.preferredDemoDate) : null,
      requirements: data.requirements || null,
      status: 'NEW'
    }
  });

  // Audit Log
  await db.auditLog.create({
    data: {
      action: 'CONTACT_INQUIRY_CREATED',
      resourceType: 'ContactInquiry',
      resourceId: inquiry.id,
      userName: data.fullName,
      newState: JSON.stringify({
        inquiryNumber,
        email: data.email,
        category: data.category,
        subject: data.subject
      })
    }
  });

  return inquiry;
}

export async function listContactInquiries(params?: {
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params?.page || 1);
  const limit = Math.min(100, Math.max(1, params?.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (params?.status && params.status !== 'ALL') {
    where.status = params.status;
  }
  if (params?.category && params.category !== 'ALL') {
    where.category = params.category;
  }
  if (params?.search) {
    where.OR = [
      { inquiryNumber: { contains: params.search, mode: 'insensitive' } },
      { fullName: { contains: params.search, mode: 'insensitive' } },
      { institutionName: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
      { subject: { contains: params.search, mode: 'insensitive' } }
    ];
  }

  const [total, items] = await Promise.all([
    db.contactInquiry.count({ where }),
    db.contactInquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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

export async function updateInquiryStatus(
  id: string,
  update: {
    status?: string;
    internalNotes?: string;
    assignedToUserId?: string;
    assignedToName?: string;
  },
  actorUserId?: string,
  actorName?: string
) {
  const current = await db.contactInquiry.findUnique({ where: { id } });
  if (!current) throw AppError.notFound(`Inquiry with ID ${id} not found.`);

  const updated = await db.contactInquiry.update({
    where: { id },
    data: {
      ...update,
      updatedAt: new Date()
    }
  });

  await db.auditLog.create({
    data: {
      action: 'CONTACT_INQUIRY_UPDATED',
      resourceType: 'ContactInquiry',
      resourceId: id,
      userId: actorUserId || 'SYSTEM',
      userName: actorName || 'Platform Staff',
      previousState: JSON.stringify({ status: current.status, assignedToName: current.assignedToName }),
      newState: JSON.stringify({ status: updated.status, assignedToName: updated.assignedToName })
    }
  });

  return updated;
}
