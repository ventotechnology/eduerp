import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import {
  createLibrary,
  createLibraryCatalog,
  addLibraryCopy,
  createBorrowingPolicy,
  registerLibraryMember,
  issueBook,
  returnBook,
  performLibraryStocktake,
} from '@/lib/services/library-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('COMMAND 7: Library Management Engine', () => {
  let institutionId: string;
  let campusId: string;
  let actor: SessionUser;
  let testStudentId: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const tenant = await db.tenant.create({
      data: {
        slug: `lib-tenant-${timestamp}`,
        institutionType: 'UNIVERSITY',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
      },
    });

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Library Test Institution',
        shortName: 'LIB',
        address: 'Dhanmondi, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '01711223344',
        email: `lib-${timestamp}@eduerp.us`,
      },
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Main Campus',
        code: `MC-${timestamp}`,
        address: 'Dhaka',
      },
    });
    campusId = campus.id;

    const student = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `STU-LIB-${timestamp}`,
        admissionNumber: `ADM-LIB-${timestamp}`,
        firstName: 'Rahim',
        lastName: 'Ahmed',
        dateOfBirth: new Date('2005-01-01'),
        gender: 'Male',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        status: 'ACTIVE',
      },
    });
    testStudentId = student.id;

    actor = {
      id: 'lib-admin-1',
      name: 'Chief Librarian',
      email: 'librarian@eduerp.us',
      role: 'LIBRARIAN',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };
  });

  it('creates library, catalog, copies, policy and completes full borrowing lifecycle', async () => {
    const library = await createLibrary(
      actor.tenantId!,
      {
        campusId,
        code: `LIB-${Date.now()}`,
        name: 'Central University Library',
        openingHours: '08:00 AM - 08:00 PM',
      },
      actor
    );
    expect(library.id).toBeDefined();

    const catalog = await createLibraryCatalog(
      actor.tenantId!,
      {
        libraryId: library.id,
        title: 'Introduction to Algorithms',
        isbn: '978-0262033848',
        author: 'Thomas H. Cormen',
        category: 'Computer Science',
        resourceType: 'BOOK',
      },
      actor
    );
    expect(catalog.id).toBeDefined();

    const copy1 = await addLibraryCopy(
      actor.tenantId!,
      {
        catalogId: catalog.id,
        accessionNumber: `ACC-001-${Date.now()}`,
        condition: 'NEW',
        acquisitionCost: 1200,
        availabilityStatus: 'AVAILABLE',
      },
      actor
    );
    expect(copy1.id).toBeDefined();

    const policy = await createBorrowingPolicy(
      actor.tenantId!,
      {
        name: 'Undergrad Standard Policy',
        memberType: 'STUDENT',
        maxBooks: 2,
        loanDurationDays: 7,
        finePerOverdueDay: 10,
        graceDays: 0,
      },
      actor
    );

    const member = await registerLibraryMember(
      actor.tenantId!,
      {
        memberType: 'STUDENT',
        studentId: testStudentId,
        membershipNumber: `MEM-${Date.now()}`,
        policyId: policy.id,
      },
      actor
    );
    expect(member.id).toBeDefined();

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const issue = await issueBook(
      actor.tenantId!,
      {
        copyId: copy1.id,
        memberId: member.id,
        dueDate: dueDate.toISOString(),
      },
      actor
    );
    expect(issue.status).toBe('ISSUED');

    const copyAfterIssue = await db.libraryCopy.findUnique({ where: { id: copy1.id } });
    expect(copyAfterIssue?.availabilityStatus).toBe('ISSUED');

    const returnResult = await returnBook(
      actor.tenantId!,
      {
        issueId: issue.id,
        condition: 'GOOD',
      },
      actor
    );
    expect(returnResult.status).toBe('RETURNED');
    expect(returnResult.fineAmount).toBe(0);

    const copyAfterReturn = await db.libraryCopy.findUnique({ where: { id: copy1.id } });
    expect(copyAfterReturn?.availabilityStatus).toBe('AVAILABLE');

    const stocktake = await performLibraryStocktake(
      actor.tenantId!,
      {
        libraryId: library.id,
        scannedAccessionNumbers: [copy1.accessionNumber],
      },
      actor
    );
    expect(stocktake.foundCount).toBe(1);
    expect(stocktake.status).toBe('COMPLETED');
  });
});
