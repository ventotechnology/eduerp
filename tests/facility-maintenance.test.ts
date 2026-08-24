import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import {
  createMaintenanceRequest,
  createMaintenanceWorkOrder,
  updateMaintenanceWorkOrder,
  getMaintenanceRequests,
} from '@/lib/services/facility-maintenance-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('COMMAND 7: Campus Maintenance & Service Desk Engine', () => {
  let institutionId: string;
  let campusId: string;
  let actor: SessionUser;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const tenant = await db.tenant.create({
      data: {
        slug: `mnt-tenant-${timestamp}`,
        institutionType: 'POLYTECHNIC',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
      },
    });

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Maintenance Test Institution',
        shortName: 'MNT',
        address: 'Tejgaon, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Tejgaon',
        phone: '01711223344',
        email: `mnt-${timestamp}@eduerp.us`,
      },
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Main Polytechnic Campus',
        code: `MPC-${timestamp}`,
        address: 'Tejgaon, Dhaka',
      },
    });
    campusId = campus.id;

    actor = {
      id: 'mnt-admin-1',
      name: 'Maintenance Supervisor',
      email: 'maintenance@eduerp.us',
      role: 'PRINCIPAL',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };
  });

  it('creates maintenance ticket, generates work order and tracks resolution costs', async () => {
    const ticket = await createMaintenanceRequest(
      actor.tenantId!,
      {
        campusId,
        category: 'ELECTRICAL',
        priority: 'HIGH',
        title: 'AC Failure in Computer Lab 3',
        description: 'Split AC unit not cooling and emitting buzzing noise',
      },
      actor
    );
    expect(ticket.ticketNumber).toBeDefined();
    expect(ticket.status).toBe('OPEN');

    const wo = await createMaintenanceWorkOrder(
      actor.tenantId!,
      {
        requestId: ticket.id,
        technicianName: 'Master Electrician Kamal',
        laborCost: 1500,
        partsCost: 3200,
      },
      actor
    );
    expect(wo.workOrderNumber).toBeDefined();
    expect(wo.totalCost).toBe(4700);

    const resolvedWo = await updateMaintenanceWorkOrder(
      actor.tenantId!,
      {
        workOrderId: wo.id,
        status: 'RESOLVED',
        resolutionSummary: 'Replaced faulty capacitor and refilled R410A refrigerant gas. Tested cooling OK.',
      },
      actor
    );
    expect(resolvedWo.status).toBe('RESOLVED');

    const reqs = await getMaintenanceRequests(actor.tenantId!);
    const updatedTicket = reqs.find((r) => r.id === ticket.id);
    expect(updatedTicket?.status).toBe('RESOLVED');
  });
});
