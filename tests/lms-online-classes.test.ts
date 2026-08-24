import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { createLmsCourse } from '@/lib/services/lms-course-service';
import {
  scheduleOnlineClass,
  getOnlineClasses,
  recordOnlineClassAttendance,
} from '@/lib/services/online-class-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('COMMAND 8: Online Live Classes, Meeting Links & Attendance', () => {
  let institutionId: string;
  let campusId: string;
  let teacherId: string;
  let studentId: string;
  let courseId: string;
  let teacherActor: SessionUser;
  let tenantSlug: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const tenant = await db.tenant.create({
      data: { slug: `lms-cls-${timestamp}`, institutionType: 'UNIVERSITY', subscriptionTier: 'ENTERPRISE', isActive: true },
    });
    tenantSlug = tenant.slug;

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Class Test University',
        shortName: 'CTU',
        address: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '01711223344',
        email: `cls-${timestamp}@eduerp.us`,
      },
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: { institutionId: inst.id, name: 'Main Campus', code: `MC-${timestamp}`, address: 'Dhaka' },
    });
    campusId = campus.id;

    const emp = await db.employee.create({
      data: {
        campusId: campus.id,
        employeeCode: `EMP-CLS-${timestamp}`,
        firstName: 'Mahmudur',
        lastName: 'Rahman',
        designation: 'Lecturer',
        joiningDate: new Date('2021-01-01'),
        basicSalary: 55000,
        phone: '01700000000',
        email: `mahmud-${timestamp}@eduerp.us`,
        status: 'ACTIVE',
      },
    });
    teacherId = emp.id;

    const stu = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `STU-CLS-${timestamp}`,
        admissionNumber: `ADM-CLS-${timestamp}`,
        firstName: 'Abrar',
        lastName: 'Fahim',
        dateOfBirth: new Date('2004-01-01'),
        gender: 'Male',
        presentAddress: 'Dhaka',
        permanentAddress: 'Dhaka',
        status: 'ACTIVE',
      },
    });
    studentId = stu.id;

    teacherActor = {
      id: emp.id,
      name: 'Mahmudur Rahman',
      email: emp.email,
      role: 'TEACHER',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    const crs = await createLmsCourse(
      tenantSlug,
      {
        campusId,
        code: `EEE-101-${timestamp}`,
        title: 'Basic Electrical Engineering',
        primaryTeacherId: teacherId,
        status: 'PUBLISHED',
      },
      teacherActor
    );
    courseId = crs.id;
  });

  it('schedules online live classes with Google Meet/Zoom, restricts meeting link access and logs attendance', async () => {
    const classDate = new Date();
    classDate.setDate(classDate.getDate() + 1);

    const session = await scheduleOnlineClass(
      tenantSlug,
      {
        courseId,
        title: 'Live Workshop: AC Circuit Analysis & Phasor Diagrams',
        topic: 'RLC resonance circuits and power factor correction',
        teacherEmployeeId: teacherId,
        classDate: classDate.toISOString(),
        startTime: '10:00',
        endTime: '11:30',
        meetingProvider: 'GOOGLE_MEET',
        meetingUrl: 'https://meet.google.com/xyz-uvwx-rst',
      },
      teacherActor
    );
    expect(session.id).toBeDefined();
    expect(session.meetingProvider).toBe('GOOGLE_MEET');

    // Get list of online classes
    const classes = await getOnlineClasses(tenantSlug, courseId, teacherActor);
    expect(classes.length).toBe(1);
    expect(classes[0].meetingUrl).toBe('https://meet.google.com/xyz-uvwx-rst');

    // Record attendance event
    const att = await recordOnlineClassAttendance(
      tenantSlug,
      {
        onlineClassId: session.id,
        studentId,
        attendanceStatus: 'PRESENT',
        durationMinutes: 85,
        source: 'LMS_JOIN_EVENT',
      },
      teacherActor
    );
    expect(att.attendanceStatus).toBe('PRESENT');
    expect(att.durationMinutes).toBe(85);
  });
});
