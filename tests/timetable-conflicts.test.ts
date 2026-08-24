import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../lib/db';
import { createTimetableEntry, deleteTimetableEntry, getTenantTimetableEntries } from '../lib/services/timetable-service';
import { setTeacherAvailability } from '../lib/services/academic-structure-service';
import { SessionUser, UserStatus } from '../lib/auth/types';

const mockAdmin: SessionUser = {
  id: 'USR-TT-COORD',
  name: 'Timetable Coordinator',
  email: 'coordinator@scholars.edu.bd',
  role: 'PRINCIPAL',
  tenantId: 'scholars-dhaka',
  status: UserStatus.ACTIVE,
  isPlatformAdmin: false
};

describe('Timetable & Multi-Level Server Conflict Engine (COMMAND 3)', () => {
  let testCampusId: string;
  let testRoomId1: string;
  let testRoomId2: string;
  let testTeacherId1: string;
  let testTeacherId2: string;
  let testSectionId1: string;
  let testSectionId2: string;

  beforeAll(async () => {
    const tenant = await db.tenant.upsert({
      where: { slug: 'scholars-dhaka' },
      update: {},
      create: {
        slug: 'scholars-dhaka',
        institutionType: 'SCHOOL',
        subscriptionTier: 'PROFESSIONAL',
        isActive: true
      }
    });

    const institution = await db.institution.upsert({
      where: { tenantId: tenant.id },
      update: {},
      create: {
        tenantId: tenant.id,
        name: 'Dhaka Scholars International School',
        shortName: 'DIMS',
        eiin: '108456',
        boardAffiliation: 'DHAKA',
        address: 'Dhanmondi, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '+880 1711-000000',
        email: 'info@scholars.edu.bd'
      }
    });

    const campus = await db.campus.upsert({
      where: {
        institutionId_code: {
          institutionId: institution.id,
          code: 'CMP-MAIN'
        }
      },
      update: {},
      create: {
        institutionId: institution.id,
        name: 'DIMS Main Campus',
        code: 'CMP-MAIN',
        address: 'Dhanmondi, Dhaka',
        isMain: true
      }
    });

    testCampusId = campus.id;

    // Clean up any test rooms, teachers, and classes from previous runs
    await db.timetableEntry.deleteMany({ where: { institutionId: institution.id } });
    await db.teacherAvailability.deleteMany({});
    await db.section.deleteMany({ where: { class: { institutionId: institution.id } } });
    await db.class.deleteMany({ where: { institutionId: institution.id, name: 'Grade 7 Conflict Class' } });
    await db.classroom.deleteMany({ where: { campusId: testCampusId, roomNumber: { in: ['ROOM-CONFLICT-101', 'ROOM-CONFLICT-102'] } } });

    // Create 2 test rooms
    const r1 = await db.classroom.create({
      data: {
        campusId: testCampusId,
        roomNumber: 'ROOM-CONFLICT-101',
        capacity: 40,
        type: 'CLASSROOM'
      }
    });
    testRoomId1 = r1.id;

    const r2 = await db.classroom.create({
      data: {
        campusId: testCampusId,
        roomNumber: 'ROOM-CONFLICT-102',
        capacity: 40,
        type: 'CLASSROOM'
      }
    });
    testRoomId2 = r2.id;

    // Create 2 test teachers
    const user1 = await db.user.create({
      data: {
        email: `teacher.conflict1.${Date.now()}@scholars.edu.bd`,
        passwordHash: 'hash',
        name: 'Prof. Conflict Check 1',
        role: 'TEACHER'
      }
    });

    const emp1 = await db.employee.create({
      data: {
        campusId: testCampusId,
        userId: user1.id,
        employeeCode: `EMP-TT-1-${Date.now().toString().slice(-4)}`,
        firstName: 'Conflict',
        lastName: 'Teacher 1',
        designation: 'Senior Teacher',
        joiningDate: new Date(),
        basicSalary: 45000,
        phone: '+880 1711-111111',
        email: user1.email
      }
    });

    const t1 = await db.teacher.create({
      data: {
        employeeId: emp1.id,
        qualification: 'M.Sc in Physics'
      }
    });
    testTeacherId1 = t1.id;

    const user2 = await db.user.create({
      data: {
        email: `teacher.conflict2.${Date.now()}@scholars.edu.bd`,
        passwordHash: 'hash',
        name: 'Prof. Conflict Check 2',
        role: 'TEACHER'
      }
    });

    const emp2 = await db.employee.create({
      data: {
        campusId: testCampusId,
        userId: user2.id,
        employeeCode: `EMP-TT-2-${Date.now().toString().slice(-4)}`,
        firstName: 'Conflict',
        lastName: 'Teacher 2',
        designation: 'Lecturer',
        joiningDate: new Date(),
        basicSalary: 35000,
        phone: '+880 1711-222222',
        email: user2.email
      }
    });

    const t2 = await db.teacher.create({
      data: {
        employeeId: emp2.id,
        qualification: 'M.Sc in Mathematics'
      }
    });
    testTeacherId2 = t2.id;

    // Create 2 test sections
    const cls = await db.class.create({
      data: {
        institutionId: institution!.id,
        name: 'Grade 7 Conflict Class',
        numericValue: 7,
        shift: 'Morning'
      }
    });

    const s1 = await db.section.create({
      data: {
        classId: cls.id,
        name: 'Section A - TT',
        capacity: 40
      }
    });
    testSectionId1 = s1.id;

    const s2 = await db.section.create({
      data: {
        classId: cls.id,
        name: 'Section B - TT',
        capacity: 40
      }
    });
    testSectionId2 = s2.id;
  });

  it('saves an initial valid non-overlapping timetable slot', async () => {
    const entry = await createTimetableEntry(
      'scholars-dhaka',
      {
        dayOfWeek: 'MONDAY',
        startTime: '08:00',
        endTime: '08:45',
        classroomId: testRoomId1,
        teacherId: testTeacherId1,
        sectionId: testSectionId1,
        subjectName: 'Physics 101',
        teacherName: 'Prof. Conflict Check 1'
      },
      mockAdmin
    );

    expect(entry).toBeDefined();
    expect(entry.subjectName).toBe('Physics 101');
    expect(entry.dayOfWeek).toBe('MONDAY');
  });

  it('detects and REJECTS Room Conflict (same room, overlapping time window)', async () => {
    // Attempt to book Room 101 from 08:30 to 09:15 on MONDAY with a different teacher and section
    await expect(
      createTimetableEntry(
        'scholars-dhaka',
        {
          dayOfWeek: 'MONDAY',
          startTime: '08:30',
          endTime: '09:15',
          classroomId: testRoomId1, // Same room!
          teacherId: testTeacherId2,
          sectionId: testSectionId2,
          subjectName: 'Chemistry',
          teacherName: 'Prof. Conflict Check 2'
        },
        mockAdmin
      )
    ).rejects.toThrow(/Room Conflict Detected/);
  });

  it('detects and REJECTS Teacher Conflict (same teacher in 2 rooms simultaneously)', async () => {
    // Attempt to book Teacher 1 in Room 102 from 08:15 to 09:00 on MONDAY
    await expect(
      createTimetableEntry(
        'scholars-dhaka',
        {
          dayOfWeek: 'MONDAY',
          startTime: '08:15',
          endTime: '09:00',
          classroomId: testRoomId2, // Different room
          teacherId: testTeacherId1, // Same teacher!
          sectionId: testSectionId2,
          subjectName: 'Higher Math',
          teacherName: 'Prof. Conflict Check 1'
        },
        mockAdmin
      )
    ).rejects.toThrow(/Teacher Conflict Detected/);
  });

  it('detects and REJECTS Section Conflict (same student cohort double-booked)', async () => {
    // Attempt to book Section 1 in Room 102 from 08:15 to 09:00 on MONDAY
    await expect(
      createTimetableEntry(
        'scholars-dhaka',
        {
          dayOfWeek: 'MONDAY',
          startTime: '08:15',
          endTime: '09:00',
          classroomId: testRoomId2,
          teacherId: testTeacherId2,
          sectionId: testSectionId1, // Same section!
          subjectName: 'Biology',
          teacherName: 'Prof. Conflict Check 2'
        },
        mockAdmin
      )
    ).rejects.toThrow(/Class\/Section Conflict Detected/);
  });

  it('detects and REJECTS Teacher Availability Constraint', async () => {
    // Mark Teacher 2 as unavailable on FRIDAY
    await setTeacherAvailability(
      'scholars-dhaka',
      {
        teacherId: testTeacherId2,
        dayOfWeek: 'FRIDAY',
        isAvailable: false,
        reason: 'Attending Friday Academic Research Seminar'
      },
      mockAdmin
    );

    // Attempt to schedule Teacher 2 on FRIDAY
    await expect(
      createTimetableEntry(
        'scholars-dhaka',
        {
          dayOfWeek: 'FRIDAY',
          startTime: '09:00',
          endTime: '09:45',
          classroomId: testRoomId2,
          teacherId: testTeacherId2,
          sectionId: testSectionId2,
          subjectName: 'Discrete Mathematics',
          teacherName: 'Prof. Conflict Check 2'
        },
        mockAdmin
      )
    ).rejects.toThrow(/Teacher Availability Conflict/);
  });

  it('allows saving a valid non-overlapping subsequent period slot', async () => {
    const entry2 = await createTimetableEntry(
      'scholars-dhaka',
      {
        dayOfWeek: 'MONDAY',
        startTime: '08:45',
        endTime: '09:30',
        classroomId: testRoomId1,
        teacherId: testTeacherId2,
        sectionId: testSectionId1,
        subjectName: 'Higher Math Theory',
        teacherName: 'Prof. Conflict Check 2'
      },
      mockAdmin
    );

    expect(entry2).toBeDefined();
    expect(entry2.startTime).toBe('08:45');
  });

  it('queries timetable entries with filters and supports deletion', async () => {
    const entries = await getTenantTimetableEntries('scholars-dhaka', { dayOfWeek: 'MONDAY' });
    expect(entries.length).toBeGreaterThanOrEqual(2);

    const slotToDelete = entries.find((e) => e.subjectName === 'Higher Math Theory');
    const deleteRes = await deleteTimetableEntry('scholars-dhaka', slotToDelete!.id, mockAdmin);
    expect(deleteRes.success).toBe(true);

    const remaining = await getTenantTimetableEntries('scholars-dhaka', { dayOfWeek: 'MONDAY' });
    expect(remaining.some((e) => e.id === slotToDelete!.id)).toBe(false);
  });
});
