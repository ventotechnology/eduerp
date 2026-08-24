import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import {
  createTransportVehicle,
  createTransportRoute,
  addRouteStop,
  subscribeTransport,
  recordBoardingEvent,
  ingestGpsTelemetry,
  logVehicleFuel,
  recordVehicleMaintenance,
} from '@/lib/services/transport-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('COMMAND 7: Transport & GPS Telemetry Fleet Engine', () => {
  let institutionId: string;
  let campusId: string;
  let actor: SessionUser;
  let student1Id: string;
  let student2Id: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const tenant = await db.tenant.create({
      data: {
        slug: `trn-tenant-${timestamp}`,
        institutionType: 'SCHOOL',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
      },
    });

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Transport Test Institution',
        shortName: 'TRN',
        address: 'Uttara, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Uttara',
        phone: '01711223344',
        email: `trn-${timestamp}@eduerp.us`,
      },
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'City Campus',
        code: `CC-${timestamp}`,
        address: 'Uttara, Dhaka',
      },
    });
    campusId = campus.id;

    const s1 = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `STU-TRN1-${timestamp}`,
        admissionNumber: `ADM-TRN1-${timestamp}`,
        firstName: 'Fahim',
        lastName: 'Montasir',
        dateOfBirth: new Date('2005-01-01'),
        gender: 'Male',
        presentAddress: 'Uttara',
        permanentAddress: 'Uttara',
        status: 'ACTIVE',
      },
    });
    student1Id = s1.id;

    const s2 = await db.student.create({
      data: {
        campusId: campus.id,
        studentIdNumber: `STU-TRN2-${timestamp}`,
        admissionNumber: `ADM-TRN2-${timestamp}`,
        firstName: 'Sumaiya',
        lastName: 'Akter',
        dateOfBirth: new Date('2005-01-01'),
        gender: 'Female',
        presentAddress: 'Uttara',
        permanentAddress: 'Uttara',
        status: 'ACTIVE',
      },
    });
    student2Id = s2.id;

    actor = {
      id: 'trn-admin-1',
      name: 'Fleet Supervisor',
      email: 'transport@eduerp.us',
      role: 'TRANSPORT_MANAGER',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };
  });

  it('manages vehicles, routes, stops, subscription capacity and GPS telemetry ingestion', async () => {
    const route = await createTransportRoute(
      actor.tenantId!,
      {
        campusId,
        routeCode: `R-01-${Date.now()}`,
        routeName: 'Uttara to Dhanmondi Campus Line',
        startPoint: 'Uttara Sector 11',
        endPoint: 'Dhanmondi Campus',
        distanceKm: 22.5,
        estimatedMinutes: 60,
        monthlyFee: 3000,
      },
      actor
    );
    expect(route.id).toBeDefined();

    const stop1 = await addRouteStop(
      actor.tenantId!,
      {
        routeId: route.id,
        stopOrder: 1,
        stopName: 'Uttara House Building',
        pickupTime: '07:00 AM',
        dropTime: '04:30 PM',
      },
      actor
    );

    const stop2 = await addRouteStop(
      actor.tenantId!,
      {
        routeId: route.id,
        stopOrder: 2,
        stopName: 'Dhanmondi 27',
        pickupTime: '07:55 AM',
        dropTime: '03:45 PM',
      },
      actor
    );

    const vehicle = await createTransportVehicle(
      actor.tenantId!,
      {
        campusId,
        vehicleNumber: `DHK-METRO-CA-${Date.now().toString().slice(-4)}`,
        vehicleType: 'MICROBUS',
        makeModel: 'Toyota HiAce 2022',
        capacity: 1,
        fuelType: 'OCTANE',
        ownership: 'OWNED',
        driverName: 'Mohammad Ali',
        driverPhone: '01700000000',
      },
      actor
    );
    expect(vehicle.id).toBeDefined();

    const sub1 = await subscribeTransport(
      actor.tenantId!,
      {
        memberType: 'STUDENT',
        studentId: student1Id,
        vehicleId: vehicle.id,
        routeId: route.id,
        pickupStopId: stop1.id,
        dropStopId: stop2.id,
        monthlyFee: 3000,
      },
      actor
    );
    expect(sub1.status).toBe('ACTIVE');

    await expect(
      subscribeTransport(
        actor.tenantId!,
        {
          memberType: 'STUDENT',
          studentId: student2Id,
          vehicleId: vehicle.id,
          routeId: route.id,
          pickupStopId: stop1.id,
          dropStopId: stop2.id,
          monthlyFee: 3000,
        },
        actor
      )
    ).rejects.toThrow(/is at full capacity/i);

    const boarding = await recordBoardingEvent(actor.tenantId!, {
      subscriptionId: sub1.id,
      studentId: student1Id,
      eventType: 'BOARDED',
      source: 'QR',
    });
    expect(boarding.eventType).toBe('BOARDED');

    const telemetry = await ingestGpsTelemetry(actor.tenantId!, {
      vehicleId: vehicle.id,
      deviceId: 'GPS-TRACKER-009',
      latitude: 23.7806,
      longitude: 90.4193,
      speedKmH: 45.2,
      headingDegrees: 180,
    });
    expect(telemetry.speedKmH).toBe(45.2);

    const fuel = await logVehicleFuel(
      actor.tenantId!,
      {
        vehicleId: vehicle.id,
        quantityLiters: 40,
        fuelCost: 5200,
        odometerReading: 12500,
        receiptNumber: 'FUEL-0992',
      },
      actor
    );
    expect(fuel.fuelCost).toBe(5200);

    const maintenance = await recordVehicleMaintenance(
      actor.tenantId!,
      {
        vehicleId: vehicle.id,
        serviceType: 'ROUTINE',
        description: 'Engine oil change and brake inspection',
        cost: 3500,
        odometerReading: 12500,
      },
      actor
    );
    expect(maintenance.status).toBe('COMPLETED');
  });
});
