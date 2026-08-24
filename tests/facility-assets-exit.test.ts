import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import {
  createFixedAsset,
  assignAsset,
  returnAsset,
  checkEmployeeAssetClearance,
  disposeAsset,
} from '@/lib/services/fixed-asset-service';
import { SessionUser, UserStatus } from '@/lib/auth/types';

describe('COMMAND 7: Fixed Assets & HR Exit Clearance Engine', () => {
  let institutionId: string;
  let campusId: string;
  let actor: SessionUser;
  let employeeId: string;

  beforeEach(async () => {
    const timestamp = Date.now() + Math.floor(Math.random() * 10000);
    const tenant = await db.tenant.create({
      data: {
        slug: `ast-tenant-${timestamp}`,
        institutionType: 'UNIVERSITY',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
      },
    });

    const inst = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Asset Test Institution',
        shortName: 'AST',
        address: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Dhanmondi',
        phone: '01711223344',
        email: `ast-${timestamp}@eduerp.us`,
      },
    });
    institutionId = inst.id;

    const campus = await db.campus.create({
      data: {
        institutionId: inst.id,
        name: 'Main Campus',
        code: `AMC-${timestamp}`,
        address: 'Dhaka',
      },
    });
    campusId = campus.id;

    const emp = await db.employee.create({
      data: {
        campusId: campus.id,
        employeeCode: `EMP-AST-${timestamp}`,
        firstName: 'Tanvir',
        lastName: 'Ahmed',
        designation: 'Officer',
        joiningDate: new Date('2022-01-01'),
        basicSalary: 45000,
        phone: '01700000000',
        email: `emp-${timestamp}@eduerp.us`,
        status: 'ACTIVE',
      },
    });
    employeeId = emp.id;

    actor = {
      id: 'asset-mgr-1',
      name: 'Asset Registrar',
      email: 'assets@eduerp.us',
      role: 'PRINCIPAL',
      tenantId: tenant.slug,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };
  });

  it('manages asset lifecycle, verifies HR exit clearance check and ensures no hard-delete on disposal', async () => {
    const laptop = await createFixedAsset(
      actor.tenantId!,
      {
        campusId,
        assetTag: `AST-LAP-${Date.now()}`,
        name: 'Dell Latitude 5420 Laptop',
        category: 'LAPTOP',
        serialNumber: 'SN-99887766',
        purchaseCost: 85000,
        depreciationMethod: 'STRAIGHT_LINE',
        depreciationRatePercent: 20,
      },
      actor
    );
    expect(laptop.id).toBeDefined();
    expect(laptop.status).toBe('IN_STOCK');

    const assignment = await assignAsset(
      actor.tenantId!,
      {
        assetId: laptop.id,
        assignedToType: 'EMPLOYEE',
        employeeId,
        remarks: 'Issued for academic course delivery',
      },
      actor
    );
    expect(assignment.id).toBeDefined();

    const clearanceBeforeReturn = await checkEmployeeAssetClearance(actor.tenantId!, employeeId);
    expect(clearanceBeforeReturn.isCleared).toBe(false);
    expect(clearanceBeforeReturn.unreturnedAssets.length).toBe(1);
    expect(clearanceBeforeReturn.unreturnedAssets[0].id).toBe(laptop.id);

    await returnAsset(
      actor.tenantId!,
      {
        assignmentId: assignment.id,
        conditionOnReturn: 'GOOD',
        remarks: 'Returned in working condition upon resignation',
      },
      actor
    );

    const clearanceAfterReturn = await checkEmployeeAssetClearance(actor.tenantId!, employeeId);
    expect(clearanceAfterReturn.isCleared).toBe(true);
    expect(clearanceAfterReturn.unreturnedAssets.length).toBe(0);

    const disposal = await disposeAsset(
      actor.tenantId!,
      {
        assetId: laptop.id,
        disposalType: 'SOLD',
        saleAmount: 15000,
        reason: 'End of 5-year hardware lifecycle sale',
      },
      actor
    );
    expect(disposal.id).toBeDefined();

    const assetInDb = await db.fixedAsset.findUnique({ where: { id: laptop.id } });
    expect(assetInDb?.status).toBe('DISPOSED');
    expect(assetInDb?.currentCustodianEmployeeId).toBeNull();
  });
});
