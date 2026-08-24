import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  LibraryCreateSchema,
  LibraryCatalogCreateSchema,
  LibraryCopyCreateSchema,
  LibraryBorrowingPolicyCreateSchema,
  LibraryMemberRegisterSchema,
  BookIssueCreateSchema,
  BookReturnSchema,
  BookReservationCreateSchema,
  LibraryStocktakeCreateSchema,
} from '@/lib/validations/schemas';

export async function createLibrary(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LibraryCreateSchema.parse(rawData);

  const campus = await db.campus.findFirst({
    where: { id: validated.campusId, institutionId: tenant.institutionId },
  });
  if (!campus) throw AppError.notFound('Selected campus does not exist in this institution.');

  const existing = await db.library.findFirst({
    where: { institutionId: tenant.institutionId, code: validated.code },
  });
  if (existing) throw AppError.conflict(`Library code '${validated.code}' already exists.`);

  const library = await db.library.create({
    data: {
      institutionId: tenant.institutionId,
      campusId: validated.campusId,
      code: validated.code,
      name: validated.name,
      location: validated.location,
      openingHours: validated.openingHours,
      status: validated.status,
    },
    include: { campus: true },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'LIBRARY',
    action: 'CREATE',
    resourceId: library.id,
    newState: { code: library.code, name: library.name },
  });

  return library;
}

export async function getLibraries(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);
  return db.library.findMany({
    where: { institutionId: tenant.institutionId },
    include: {
      campus: true,
      _count: { select: { catalogs: true } },
    },
    orderBy: { code: 'asc' },
  });
}

export async function createLibraryCatalog(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LibraryCatalogCreateSchema.parse(rawData);

  const library = await db.library.findFirst({
    where: { id: validated.libraryId, institutionId: tenant.institutionId },
  });
  if (!library) throw AppError.notFound('Library not found.');

  return db.libraryCatalog.create({
    data: {
      institutionId: tenant.institutionId,
      libraryId: validated.libraryId,
      title: validated.title,
      subtitle: validated.subtitle,
      isbn: validated.isbn,
      author: validated.author,
      editor: validated.editor,
      publisher: validated.publisher,
      edition: validated.edition,
      publicationYear: validated.publicationYear,
      language: validated.language,
      category: validated.category,
      subject: validated.subject,
      resourceType: validated.resourceType,
      keywords: validated.keywords,
      description: validated.description,
      coverImageUrl: validated.coverImageUrl,
      isDigital: validated.isDigital,
      digitalFileUrl: validated.digitalFileUrl,
    },
    include: { library: true },
  });
}

export async function getLibraryCatalogs(
  tenantIdentifier: string,
  filters: { libraryId?: string; search?: string; category?: string; resourceType?: string } = {}
) {
  const tenant = await requireTenant(tenantIdentifier);
  const where: any = { institutionId: tenant.institutionId };

  if (filters.libraryId) where.libraryId = filters.libraryId;
  if (filters.category) where.category = filters.category;
  if (filters.resourceType) where.resourceType = filters.resourceType;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { author: { contains: filters.search } },
      { isbn: { contains: filters.search } },
      { keywords: { contains: filters.search } },
    ];
  }

  return db.libraryCatalog.findMany({
    where,
    include: {
      library: true,
      copies: true,
      reservations: { where: { status: 'PENDING' } },
    },
    orderBy: { title: 'asc' },
  });
}

export async function addLibraryCopy(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LibraryCopyCreateSchema.parse(rawData);

  const catalog = await db.libraryCatalog.findFirst({
    where: { id: validated.catalogId, institutionId: tenant.institutionId },
  });
  if (!catalog) throw AppError.notFound('Bibliographic catalog record not found.');

  const existingCopy = await db.libraryCopy.findFirst({
    where: { catalogId: validated.catalogId, accessionNumber: validated.accessionNumber },
  });
  if (existingCopy) throw AppError.conflict(`Accession number '${validated.accessionNumber}' already exists for this catalog.`);

  return db.libraryCopy.create({
    data: {
      catalogId: validated.catalogId,
      accessionNumber: validated.accessionNumber,
      barcode: validated.barcode || validated.accessionNumber,
      qrCode: validated.qrCode || `QR-${validated.accessionNumber}`,
      shelf: validated.shelf,
      rack: validated.rack,
      condition: validated.condition,
      acquisitionDate: validated.acquisitionDate ? new Date(validated.acquisitionDate) : new Date(),
      acquisitionCost: validated.acquisitionCost,
      availabilityStatus: validated.availabilityStatus,
    },
  });
}

export async function createBorrowingPolicy(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LibraryBorrowingPolicyCreateSchema.parse(rawData);

  return db.libraryBorrowingPolicy.create({
    data: {
      institutionId: tenant.institutionId,
      name: validated.name,
      memberType: validated.memberType,
      maxBooks: validated.maxBooks,
      loanDurationDays: validated.loanDurationDays,
      renewalLimit: validated.renewalLimit,
      finePerOverdueDay: validated.finePerOverdueDay,
      graceDays: validated.graceDays,
    },
  });
}

export async function registerLibraryMember(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LibraryMemberRegisterSchema.parse(rawData);

  if (validated.studentId) {
    const student = await db.student.findFirst({
      where: { id: validated.studentId, campus: { institutionId: tenant.institutionId } },
    });
    if (!student) throw AppError.notFound('Student not found in this institution.');
  }

  if (validated.employeeId) {
    const emp = await db.employee.findFirst({
      where: { id: validated.employeeId, campus: { institutionId: tenant.institutionId } },
    });
    if (!emp) throw AppError.notFound('Employee not found in this institution.');
  }

  const existing = await db.libraryMember.findFirst({
    where: { institutionId: tenant.institutionId, membershipNumber: validated.membershipNumber },
  });
  if (existing) throw AppError.conflict(`Membership number '${validated.membershipNumber}' already exists.`);

  return db.libraryMember.create({
    data: {
      institutionId: tenant.institutionId,
      memberType: validated.memberType,
      studentId: validated.studentId,
      employeeId: validated.employeeId,
      membershipNumber: validated.membershipNumber,
      policyId: validated.policyId,
      expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
      status: 'ACTIVE',
    },
    include: {
      student: true,
      employee: true,
      policy: true,
    },
  });
}

export async function issueBook(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = BookIssueCreateSchema.parse(rawData);

  const member = await db.libraryMember.findFirst({
    where: { id: validated.memberId, institutionId: tenant.institutionId },
    include: { policy: true },
  });
  if (!member || member.status !== 'ACTIVE') {
    throw AppError.validation('Active library member record not found.');
  }

  const copy = await db.libraryCopy.findFirst({
    where: { id: validated.copyId, catalog: { institutionId: tenant.institutionId } },
    include: { catalog: true },
  });
  if (!copy) throw AppError.notFound('Library physical copy not found.');
  if (copy.availabilityStatus !== 'AVAILABLE') {
    throw AppError.conflict(`Book copy '${copy.accessionNumber}' is not available (Current status: ${copy.availabilityStatus}).`);
  }

  // Check borrow limit
  const activeIssuesCount = await db.bookIssue.count({
    where: { memberId: member.id, status: 'ISSUED' },
  });
  const maxBooks = member.policy?.maxBooks || 3;
  if (activeIssuesCount >= maxBooks) {
    throw AppError.conflict(`Member has reached the maximum borrowing limit of ${maxBooks} books.`);
  }

  return db.$transaction(async (tx) => {
    // 1. Update copy availability
    await tx.libraryCopy.update({
      where: { id: copy.id },
      data: { availabilityStatus: 'ISSUED' },
    });

    // 2. Create Issue record
    const issue = await tx.bookIssue.create({
      data: {
        institutionId: tenant.institutionId,
        copyId: copy.id,
        memberId: member.id,
        issueDate: new Date(),
        dueDate: new Date(validated.dueDate),
        status: 'ISSUED',
        issuedBy: actor.name,
      },
      include: {
        copy: { include: { catalog: true } },
        member: { include: { student: true, employee: true } },
      },
    });

    await logAuditEvent({
      actor,
      tenantId: tenant.tenantId,
      resourceType: 'LIBRARY',
      action: 'CREATE',
      resourceId: issue.id,
      newState: {
        accessionNumber: copy.accessionNumber,
        member: member.membershipNumber,
        dueDate: issue.dueDate,
      },
    });

    return issue;
  });
}

export async function returnBook(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = BookReturnSchema.parse(rawData);

  const issue = await db.bookIssue.findFirst({
    where: { id: validated.issueId, institutionId: tenant.institutionId },
    include: {
      copy: { include: { catalog: true } },
      member: { include: { policy: true, student: true } },
    },
  });
  if (!issue || issue.status !== 'ISSUED') {
    throw AppError.notFound('Active book issue record not found.');
  }

  const returnDate = new Date();
  const dueDate = new Date(issue.dueDate);
  let overdueDays = 0;
  let fineAmount = 0;

  if (returnDate > dueDate) {
    const diffDays = Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const graceDays = issue.member.policy?.graceDays || 0;
    overdueDays = Math.max(0, diffDays - graceDays);
    const fineRate = issue.member.policy?.finePerOverdueDay || 5.0;
    fineAmount = overdueDays * fineRate;
  }

  if (validated.damageFee > 0) {
    fineAmount += validated.damageFee;
  }

  return db.$transaction(async (tx) => {
    // 1. Update copy condition and status
    const newStatus = validated.condition === 'LOST' ? 'LOST' : validated.condition === 'DAMAGED' ? 'DAMAGED' : 'AVAILABLE';
    await tx.libraryCopy.update({
      where: { id: issue.copyId },
      data: {
        availabilityStatus: newStatus,
        condition: validated.condition === 'DAMAGED' ? 'DAMAGED' : issue.copy.condition,
      },
    });

    // 2. Update issue record
    const updatedIssue = await tx.bookIssue.update({
      where: { id: issue.id },
      data: {
        returnDate,
        overdueDays,
        fineAmount,
        status: 'RETURNED',
        damageNotes: validated.damageNotes,
        returnedBy: actor.name,
      },
      include: {
        copy: { include: { catalog: true } },
        member: true,
      },
    });

    await logAuditEvent({
      actor,
      tenantId: tenant.tenantId,
      resourceType: 'LIBRARY',
      action: 'UPDATE',
      resourceId: issue.id,
      newState: {
        returnDate,
        overdueDays,
        fineAmount,
        condition: validated.condition,
      },
    });

    return updatedIssue;
  });
}

export async function reserveBook(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = BookReservationCreateSchema.parse(rawData);

  const catalog = await db.libraryCatalog.findFirst({
    where: { id: validated.catalogId, institutionId: tenant.institutionId },
  });
  if (!catalog) throw AppError.notFound('Catalog item not found.');

  const member = await db.libraryMember.findFirst({
    where: { id: validated.memberId, institutionId: tenant.institutionId },
  });
  if (!member) throw AppError.notFound('Library member not found.');

  const count = await db.bookReservation.count({
    where: { catalogId: validated.catalogId, status: 'PENDING' },
  });

  return db.bookReservation.create({
    data: {
      institutionId: tenant.institutionId,
      catalogId: validated.catalogId,
      memberId: validated.memberId,
      priorityOrder: count + 1,
      expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
      status: 'PENDING',
    },
    include: { catalog: true, member: true },
  });
}

export async function performLibraryStocktake(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = LibraryStocktakeCreateSchema.parse(rawData);

  const library = await db.library.findFirst({
    where: { id: validated.libraryId, institutionId: tenant.institutionId },
  });
  if (!library) throw AppError.notFound('Library not found.');

  const copies = await db.libraryCopy.findMany({
    where: { catalog: { libraryId: validated.libraryId } },
  });

  const totalRegistered = copies.length;
  const scannedSet = new Set(validated.scannedAccessionNumbers);

  let foundCount = 0;
  let missingCount = 0;
  let damagedCount = 0;

  for (const c of copies) {
    if (scannedSet.has(c.accessionNumber)) {
      foundCount++;
      if (c.condition === 'DAMAGED') damagedCount++;
    } else {
      missingCount++;
    }
  }

  return db.libraryStocktake.create({
    data: {
      institutionId: tenant.institutionId,
      libraryId: validated.libraryId,
      totalScanned: validated.scannedAccessionNumbers.length,
      foundCount,
      missingCount,
      damagedCount,
      status: 'COMPLETED',
      conductedBy: actor.name,
      notes: validated.notes || `Stocktake verified against ${totalRegistered} registered catalog copies.`,
    },
  });
}
