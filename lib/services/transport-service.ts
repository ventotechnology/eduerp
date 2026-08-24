import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { AppError } from '@/lib/errors/app-error';
import { SessionUser } from '@/lib/auth/types';
import { logAuditEvent } from '@/lib/audit/audit-logger';
import {
  TransportVehicleCreateSchema,
  TransportRouteCreateSchema,
  RouteStopCreateSchema,
  TransportSubscriptionCreateSchema,
  TripScheduleCreateSchema,
  TransportBoardingEventCreateSchema,
  GpsTelemetryIngestSchema,
  TransportIncidentCreateSchema,
  FuelLogCreateSchema,
  VehicleMaintenanceRecordCreateSchema,
} from '@/lib/validations/schemas';

export async function createTransportVehicle(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = TransportVehicleCreateSchema.parse(rawData);

  const campus = await db.campus.findFirst({
    where: { id: validated.campusId, institutionId: tenant.institutionId },
  });
  if (!campus) throw AppError.notFound('Selected campus not found in this institution.');

  if (validated.assignedDriverId) {
    const driver = await db.employee.findFirst({
      where: { id: validated.assignedDriverId, campus: { institutionId: tenant.institutionId } },
    });
    if (!driver) throw AppError.notFound('Assigned driver employee not found.');
  }

  const existing = await db.transportVehicle.findFirst({
    where: { institutionId: tenant.institutionId, vehicleNumber: validated.vehicleNumber },
  });
  if (existing) throw AppError.conflict(`Vehicle number '${validated.vehicleNumber}' already exists.`);

  const vehicle = await db.transportVehicle.create({
    data: {
      institutionId: tenant.institutionId,
      campusId: validated.campusId,
      vehicleNumber: validated.vehicleNumber,
      registrationNumber: validated.registrationNumber,
      vehicleType: validated.vehicleType,
      makeModel: validated.makeModel,
      capacity: validated.capacity,
      manufactureYear: validated.manufactureYear,
      fuelType: validated.fuelType,
      ownership: validated.ownership,
      assignedDriverId: validated.assignedDriverId,
      driverName: validated.driverName,
      driverPhone: validated.driverPhone,
      status: validated.status,
    },
    include: { campus: true, assignedDriver: true },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'TRANSPORT',
    action: 'CREATE',
    resourceId: vehicle.id,
    newState: { vehicleNumber: vehicle.vehicleNumber, capacity: vehicle.capacity },
  });

  return vehicle;
}

export async function getTransportVehicles(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);
  return db.transportVehicle.findMany({
    where: { institutionId: tenant.institutionId },
    include: {
      campus: true,
      assignedDriver: true,
      subscriptions: { where: { status: 'ACTIVE' } },
      trips: true,
    },
    orderBy: { vehicleNumber: 'asc' },
  });
}

export async function createTransportRoute(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = TransportRouteCreateSchema.parse(rawData);

  const existing = await db.transportRoute.findFirst({
    where: { institutionId: tenant.institutionId, routeCode: validated.routeCode },
  });
  if (existing) throw AppError.conflict(`Route code '${validated.routeCode}' already exists.`);

  return db.transportRoute.create({
    data: {
      institutionId: tenant.institutionId,
      campusId: validated.campusId,
      routeCode: validated.routeCode,
      routeName: validated.routeName,
      startPoint: validated.startPoint,
      endPoint: validated.endPoint,
      distanceKm: validated.distanceKm,
      estimatedMinutes: validated.estimatedMinutes,
      monthlyFee: validated.monthlyFee,
      status: validated.status,
    },
  });
}

export async function addRouteStop(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = RouteStopCreateSchema.parse(rawData);

  const route = await db.transportRoute.findFirst({
    where: { id: validated.routeId, institutionId: tenant.institutionId },
  });
  if (!route) throw AppError.notFound('Transport route not found.');

  return db.routeStop.create({
    data: {
      routeId: validated.routeId,
      stopOrder: validated.stopOrder,
      stopName: validated.stopName,
      pickupTime: validated.pickupTime,
      dropTime: validated.dropTime,
      latitude: validated.latitude,
      longitude: validated.longitude,
      feeZone: validated.feeZone,
    },
  });
}

export async function getTransportRoutes(tenantIdentifier: string) {
  const tenant = await requireTenant(tenantIdentifier);
  return db.transportRoute.findMany({
    where: { institutionId: tenant.institutionId },
    include: {
      stops: { orderBy: { stopOrder: 'asc' } },
      subscriptions: { where: { status: 'ACTIVE' } },
      trips: { include: { vehicle: true } },
    },
    orderBy: { routeCode: 'asc' },
  });
}

export async function subscribeTransport(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = TransportSubscriptionCreateSchema.parse(rawData);

  const route = await db.transportRoute.findFirst({
    where: { id: validated.routeId, institutionId: tenant.institutionId },
    include: { stops: true },
  });
  if (!route) throw AppError.notFound('Transport route not found.');

  if (validated.studentId) {
    const student = await db.student.findFirst({
      where: { id: validated.studentId, campus: { institutionId: tenant.institutionId } },
    });
    if (!student) throw AppError.notFound('Student not found in this institution.');

    const activeSub = await db.transportSubscription.findFirst({
      where: { studentId: validated.studentId, status: 'ACTIVE' },
    });
    if (activeSub) throw AppError.conflict('Student already has an active transport subscription.');
  }

  // Capacity enforcement if vehicle is specified
  if (validated.vehicleId) {
    const vehicle = await db.transportVehicle.findFirst({
      where: { id: validated.vehicleId, institutionId: tenant.institutionId },
      include: { subscriptions: { where: { status: 'ACTIVE' } } },
    });
    if (!vehicle) throw AppError.notFound('Vehicle not found.');
    if (vehicle.subscriptions.length >= vehicle.capacity) {
      throw AppError.conflict(
        `Vehicle '${vehicle.vehicleNumber}' is at full capacity (${vehicle.subscriptions.length}/${vehicle.capacity} seats occupied).`
      );
    }
  }

  const sub = await db.transportSubscription.create({
    data: {
      institutionId: tenant.institutionId,
      memberType: validated.memberType,
      studentId: validated.studentId,
      employeeId: validated.employeeId,
      vehicleId: validated.vehicleId,
      routeId: validated.routeId,
      pickupStopId: validated.pickupStopId,
      dropStopId: validated.dropStopId,
      startDate: validated.startDate ? new Date(validated.startDate) : new Date(),
      endDate: validated.endDate ? new Date(validated.endDate) : null,
      monthlyFee: validated.monthlyFee || route.monthlyFee,
      status: 'ACTIVE',
    },
    include: {
      route: true,
      pickupStop: true,
      dropStop: true,
      student: true,
      vehicle: true,
    },
  });

  await logAuditEvent({
    actor,
    tenantId: tenant.tenantId,
    resourceType: 'TRANSPORT',
    action: 'CREATE',
    resourceId: sub.id,
    newState: {
      route: route.routeName,
      memberType: sub.memberType,
      monthlyFee: sub.monthlyFee,
    },
  });

  return sub;
}

export async function createTripSchedule(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = TripScheduleCreateSchema.parse(rawData);

  const route = await db.transportRoute.findFirst({
    where: { id: validated.routeId, institutionId: tenant.institutionId },
  });
  if (!route) throw AppError.notFound('Route not found.');

  const vehicle = await db.transportVehicle.findFirst({
    where: { id: validated.vehicleId, institutionId: tenant.institutionId },
  });
  if (!vehicle) throw AppError.notFound('Vehicle not found.');

  return db.tripSchedule.create({
    data: {
      institutionId: tenant.institutionId,
      routeId: validated.routeId,
      vehicleId: validated.vehicleId,
      driverName: validated.driverName || vehicle.driverName,
      tripType: validated.tripType,
      scheduledStartTime: validated.scheduledStartTime,
      scheduledEndTime: validated.scheduledEndTime,
      status: 'SCHEDULED',
    },
    include: { route: true, vehicle: true },
  });
}

export async function recordBoardingEvent(tenantIdentifier: string, rawData: unknown) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = TransportBoardingEventCreateSchema.parse(rawData);

  return db.transportBoardingEvent.create({
    data: {
      tripId: validated.tripId,
      subscriptionId: validated.subscriptionId,
      studentId: validated.studentId,
      eventTime: new Date(),
      eventType: validated.eventType,
      source: validated.source,
    },
  });
}

export async function ingestGpsTelemetry(tenantIdentifier: string, rawData: unknown) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = GpsTelemetryIngestSchema.parse(rawData);

  const vehicle = await db.transportVehicle.findFirst({
    where: { id: validated.vehicleId, institutionId: tenant.institutionId },
  });
  if (!vehicle) throw AppError.notFound('Vehicle not found.');

  const timestamp = validated.timestamp ? new Date(validated.timestamp) : new Date();

  return db.gpsTelemetryRecord.create({
    data: {
      vehicleId: validated.vehicleId,
      deviceId: validated.deviceId,
      latitude: validated.latitude,
      longitude: validated.longitude,
      speedKmH: validated.speedKmH,
      headingDegrees: validated.headingDegrees,
      accuracyMeters: validated.accuracyMeters,
      timestamp,
      source: validated.source,
    },
  });
}

export async function recordTransportIncident(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = TransportIncidentCreateSchema.parse(rawData);

  const vehicle = await db.transportVehicle.findFirst({
    where: { id: validated.vehicleId, institutionId: tenant.institutionId },
  });
  if (!vehicle) throw AppError.notFound('Vehicle not found.');

  return db.transportIncident.create({
    data: {
      institutionId: tenant.institutionId,
      vehicleId: validated.vehicleId,
      routeId: validated.routeId,
      incidentDate: validated.incidentDate ? new Date(validated.incidentDate) : new Date(),
      incidentType: validated.incidentType,
      severity: validated.severity,
      description: validated.description,
      actionTaken: validated.actionTaken,
      reportedBy: actor.name,
    },
  });
}

export async function logVehicleFuel(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = FuelLogCreateSchema.parse(rawData);

  const vehicle = await db.transportVehicle.findFirst({
    where: { id: validated.vehicleId, institutionId: tenant.institutionId },
  });
  if (!vehicle) throw AppError.notFound('Vehicle not found.');

  return db.fuelLog.create({
    data: {
      institutionId: tenant.institutionId,
      vehicleId: validated.vehicleId,
      logDate: validated.logDate ? new Date(validated.logDate) : new Date(),
      quantityLiters: validated.quantityLiters,
      fuelCost: validated.fuelCost,
      odometerReading: validated.odometerReading,
      receiptNumber: validated.receiptNumber,
      recordedBy: actor.name,
    },
  });
}

export async function recordVehicleMaintenance(tenantIdentifier: string, rawData: unknown, actor: SessionUser) {
  const tenant = await requireTenant(tenantIdentifier);
  const validated = VehicleMaintenanceRecordCreateSchema.parse(rawData);

  const vehicle = await db.transportVehicle.findFirst({
    where: { id: validated.vehicleId, institutionId: tenant.institutionId },
  });
  if (!vehicle) throw AppError.notFound('Vehicle not found.');

  return db.vehicleMaintenanceRecord.create({
    data: {
      institutionId: tenant.institutionId,
      vehicleId: validated.vehicleId,
      serviceDate: validated.serviceDate ? new Date(validated.serviceDate) : new Date(),
      serviceType: validated.serviceType,
      description: validated.description,
      cost: validated.cost,
      odometerReading: validated.odometerReading,
      nextServiceDueOdometer: validated.nextServiceDueOdometer,
      nextServiceDueDate: validated.nextServiceDueDate ? new Date(validated.nextServiceDueDate) : null,
      status: 'COMPLETED',
    },
  });
}
