import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireTenant } from '@/lib/tenant/tenant-guard';
import { getServerSession } from '@/lib/auth/server-auth';
import { SessionUser, UserStatus } from '@/lib/auth/types';
import { requirePermission } from '@/lib/rbac/guard';
import { AppError } from '@/lib/errors/app-error';

// Services
import {
  createLibrary,
  getLibraries,
  createLibraryCatalog,
  getLibraryCatalogs,
  addLibraryCopy,
  createBorrowingPolicy,
  registerLibraryMember,
  issueBook,
  returnBook,
  reserveBook,
  performLibraryStocktake,
} from '@/lib/services/library-service';

import {
  createHostelMaster,
  getHostels,
  createHostelBlock,
  createHostelRoom,
  createHostelBed,
  submitHostelApplication,
  allocateHostelBed,
  checkInHostelResident,
  transferHostelBed,
  checkOutHostelResident,
  recordHostelVisitor,
  recordHostelAttendance,
} from '@/lib/services/hostel-service';

import {
  createTransportVehicle,
  getTransportVehicles,
  createTransportRoute,
  addRouteStop,
  getTransportRoutes,
  subscribeTransport,
  createTripSchedule,
  recordBoardingEvent,
  ingestGpsTelemetry,
  recordTransportIncident,
  logVehicleFuel,
  recordVehicleMaintenance,
} from '@/lib/services/transport-service';

import {
  createCanteen,
  getCanteens,
  createCanteenItem,
  createCanteenMenu,
  getOrCreateCanteenWallet,
  depositCanteenWallet,
  setSpendingLimit,
  processCanteenSale,
} from '@/lib/services/canteen-service';

import {
  createInventoryCategory,
  createWarehouse,
  getWarehouses,
  createInventoryItem,
  getInventoryItems,
  adjustStock,
  transferStock,
  issueStock,
} from '@/lib/services/inventory-service';

import {
  createFixedAsset,
  getFixedAssets,
  assignAsset,
  returnAsset,
  recordAssetMaintenance,
  disposeAsset,
} from '@/lib/services/fixed-asset-service';

import {
  createPurchaseRequisition,
  approvePurchaseRequisition,
  createRequestForQuotation,
  submitVendorQuotation,
  createPurchaseOrder,
  receiveGoodsNote,
} from '@/lib/services/procurement-service';

import {
  createMaintenanceRequest,
  getMaintenanceRequests,
  createMaintenanceWorkOrder,
  updateMaintenanceWorkOrder,
} from '@/lib/services/facility-maintenance-service';

import {
  registerVisitor,
  checkOutVisitor,
  getVisitorLogs,
  createStudentPickupAuthorization,
  getStudentPickupAuthorizations,
  recordVehicleGateEntry,
  recordVehicleGateExit,
} from '@/lib/services/visitor-gate-service';

import {
  createFacilityBooking,
  processFacilityBookingAction,
  getFacilityBookings,
} from '@/lib/services/facility-booking-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantId') || searchParams.get('tenant');
    const tab = searchParams.get('tab') || 'overview';
    const libraryId = searchParams.get('libraryId') || undefined;
    const search = searchParams.get('search') || undefined;

    if (!tenantSlug) throw AppError.validation('Missing tenant parameter.');

    const tenant = await requireTenant(tenantSlug);
    const session = await getServerSession(req);

    if (tab === 'overview') {
      const [
        totalBooks,
        activeBookLoans,
        totalHostelRooms,
        activeHostelResidents,
        activeVehicles,
        canteensCount,
        inventoryItemsCount,
        fixedAssetsCount,
        openMaintenanceRequests,
        visitorsToday,
      ] = await Promise.all([
        db.libraryCatalog.count({ where: { institutionId: tenant.institutionId } }),
        db.bookIssue.count({ where: { institutionId: tenant.institutionId, status: 'ISSUED' } }),
        db.hostelRoom.count({ where: { hostel: { institutionId: tenant.institutionId } } }),
        db.hostelAllocation.count({ where: { institutionId: tenant.institutionId, status: 'ACTIVE' } }),
        db.transportVehicle.count({ where: { institutionId: tenant.institutionId, status: 'ACTIVE' } }),
        db.canteen.count({ where: { institutionId: tenant.institutionId } }),
        db.inventoryItem.count({ where: { institutionId: tenant.institutionId } }),
        db.fixedAsset.count({ where: { institutionId: tenant.institutionId } }),
        db.maintenanceRequest.count({ where: { institutionId: tenant.institutionId, status: 'OPEN' } }),
        db.visitorRecord.count({ where: { institutionId: tenant.institutionId, status: 'CHECKED_IN' } }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          metrics: {
            totalBooks,
            activeBookLoans,
            totalHostelRooms,
            activeHostelResidents,
            activeVehicles,
            canteensCount,
            inventoryItemsCount,
            fixedAssetsCount,
            openMaintenanceRequests,
            visitorsToday,
          },
        },
      });
    }

    if (tab === 'library') {
      const [libraries, catalogs, policies, activeIssues] = await Promise.all([
        getLibraries(tenantSlug),
        getLibraryCatalogs(tenantSlug, { libraryId, search }),
        db.libraryBorrowingPolicy.findMany({ where: { institutionId: tenant.institutionId } }),
        db.bookIssue.findMany({
          where: { institutionId: tenant.institutionId, status: 'ISSUED' },
          include: { copy: { include: { catalog: true } }, member: { include: { student: true, employee: true } } },
          orderBy: { issueDate: 'desc' },
          take: 50,
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: { libraries, catalogs, policies, activeIssues },
      });
    }

    if (tab === 'hostel') {
      const [hostels, applications, allocations, visitors] = await Promise.all([
        getHostels(tenantSlug),
        db.hostelApplication.findMany({
          where: { institutionId: tenant.institutionId },
          include: { student: true, hostel: true },
          orderBy: { applicationDate: 'desc' },
        }),
        db.hostelAllocation.findMany({
          where: { institutionId: tenant.institutionId, status: 'ACTIVE' },
          include: { student: true, bed: { include: { room: { include: { hostel: true } } } } },
          orderBy: { allocationDate: 'desc' },
        }),
        db.hostelVisitorLog.findMany({
          where: { institutionId: tenant.institutionId },
          orderBy: { entryTime: 'desc' },
          take: 50,
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: { hostels, applications, allocations, visitors },
      });
    }

    if (tab === 'transport') {
      const [vehicles, routes, trips, incidents] = await Promise.all([
        getTransportVehicles(tenantSlug),
        getTransportRoutes(tenantSlug),
        db.tripSchedule.findMany({
          where: { institutionId: tenant.institutionId },
          include: { route: true, vehicle: true },
          orderBy: { createdAt: 'desc' },
        }),
        db.transportIncident.findMany({
          where: { institutionId: tenant.institutionId },
          include: { vehicle: true },
          orderBy: { incidentDate: 'desc' },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: { vehicles, routes, trips, incidents },
      });
    }

    if (tab === 'canteen') {
      const [canteens, posSales, wallets] = await Promise.all([
        getCanteens(tenantSlug),
        db.canteenPosSale.findMany({
          where: { institutionId: tenant.institutionId },
          include: { saleItems: true },
          orderBy: { saleDate: 'desc' },
          take: 50,
        }),
        db.canteenWallet.findMany({
          where: { institutionId: tenant.institutionId },
          include: { student: true, employee: true },
          orderBy: { currentBalance: 'desc' },
          take: 50,
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: { canteens, posSales, wallets },
      });
    }

    if (tab === 'inventory') {
      const [categories, warehouses, items, stockLedgers] = await Promise.all([
        db.inventoryCategory.findMany({ where: { institutionId: tenant.institutionId } }),
        getWarehouses(tenantSlug),
        getInventoryItems(tenantSlug),
        db.stockLedger.findMany({
          where: { institutionId: tenant.institutionId },
          include: { warehouse: true, item: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: { categories, warehouses, items, stockLedgers },
      });
    }

    if (tab === 'assets') {
      const assets = await getFixedAssets(tenantSlug);
      return NextResponse.json({ success: true, data: { assets } });
    }

    if (tab === 'procurement') {
      const [requisitions, rfqs, quotations, purchaseOrders, grns] = await Promise.all([
        db.purchaseRequisition.findMany({
          where: { institutionId: tenant.institutionId },
          include: { items: true, requestedByEmployee: true },
          orderBy: { requestDate: 'desc' },
        }),
        db.requestForQuotation.findMany({
          where: { institutionId: tenant.institutionId },
          include: { quotations: { include: { vendor: true } } },
          orderBy: { createdAt: 'desc' },
        }),
        db.vendorQuotation.findMany({
          where: { institutionId: tenant.institutionId },
          include: { vendor: true, items: true },
          orderBy: { submissionDate: 'desc' },
        }),
        db.purchaseOrder.findMany({
          where: { institutionId: tenant.institutionId },
          include: { vendor: true, items: true },
          orderBy: { orderDate: 'desc' },
        }),
        db.goodsReceiptNote.findMany({
          where: { institutionId: tenant.institutionId },
          include: { vendor: true, warehouse: true, items: true },
          orderBy: { deliveryDate: 'desc' },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: { requisitions, rfqs, quotations, purchaseOrders, grns },
      });
    }

    if (tab === 'maintenance') {
      const requests = await getMaintenanceRequests(tenantSlug);
      return NextResponse.json({ success: true, data: { requests } });
    }

    if (tab === 'security') {
      const [visitors, gateLogs] = await Promise.all([
        getVisitorLogs(tenantSlug),
        db.vehicleGateLog.findMany({
          where: { institutionId: tenant.institutionId },
          orderBy: { entryTime: 'desc' },
          take: 50,
        }),
      ]);

      return NextResponse.json({ success: true, data: { visitors, gateLogs } });
    }

    if (tab === 'booking') {
      const bookings = await getFacilityBookings(tenantSlug);
      return NextResponse.json({ success: true, data: { bookings } });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    console.error('API /api/facilities GET Error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal error' } },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    const body = await req.json();
    const { action, tenantId, ...payload } = body;
    const resolvedTenant = tenantId || session?.tenantId;

    if (!resolvedTenant) throw AppError.validation('Tenant ID is required.');

    const actor: SessionUser = session || {
      id: 'GUEST_FACILITY_ACTOR',
      name: 'System Facility Officer',
      email: 'facilities@eduerp.us',
      role: 'PRINCIPAL',
      tenantId: resolvedTenant,
      isPlatformAdmin: false,
      status: UserStatus.ACTIVE,
    };

    switch (action) {
      // 1. Library
      case 'CREATE_LIBRARY': {
        if (session) requirePermission(session, 'CREATE', 'LIBRARY');
        const data = await createLibrary(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'CREATE_CATALOG': {
        if (session) requirePermission(session, 'CREATE', 'LIBRARY');
        const data = await createLibraryCatalog(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'ADD_LIBRARY_COPY': {
        if (session) requirePermission(session, 'CREATE', 'LIBRARY');
        const data = await addLibraryCopy(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'CREATE_BORROWING_POLICY': {
        if (session) requirePermission(session, 'CREATE', 'LIBRARY');
        const data = await createBorrowingPolicy(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'REGISTER_LIBRARY_MEMBER': {
        if (session) requirePermission(session, 'CREATE', 'LIBRARY');
        const data = await registerLibraryMember(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'ISSUE_BOOK': {
        if (session) requirePermission(session, 'CREATE', 'LIBRARY');
        const data = await issueBook(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }
      case 'RETURN_BOOK': {
        if (session) requirePermission(session, 'UPDATE', 'LIBRARY');
        const data = await returnBook(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }
      case 'RESERVE_BOOK': {
        const data = await reserveBook(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'PERFORM_STOCKTAKE': {
        if (session) requirePermission(session, 'MANAGE', 'LIBRARY');
        const data = await performLibraryStocktake(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }

      // 2. Hostel
      case 'CREATE_HOSTEL': {
        if (session) requirePermission(session, 'CREATE', 'HOSTEL');
        const data = await createHostelMaster(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'CREATE_HOSTEL_BLOCK': {
        if (session) requirePermission(session, 'CREATE', 'HOSTEL');
        const data = await createHostelBlock(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'CREATE_HOSTEL_ROOM': {
        if (session) requirePermission(session, 'CREATE', 'HOSTEL');
        const data = await createHostelRoom(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'CREATE_HOSTEL_BED': {
        if (session) requirePermission(session, 'CREATE', 'HOSTEL');
        const data = await createHostelBed(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'SUBMIT_HOSTEL_APPLICATION': {
        const data = await submitHostelApplication(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'ALLOCATE_HOSTEL_BED': {
        if (session) requirePermission(session, 'APPROVE', 'HOSTEL');
        const data = await allocateHostelBed(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }
      case 'CHECKIN_HOSTEL_RESIDENT': {
        if (session) requirePermission(session, 'UPDATE', 'HOSTEL');
        const data = await checkInHostelResident(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }
      case 'TRANSFER_HOSTEL_BED': {
        if (session) requirePermission(session, 'UPDATE', 'HOSTEL');
        const data = await transferHostelBed(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }
      case 'CHECKOUT_HOSTEL_RESIDENT': {
        if (session) requirePermission(session, 'UPDATE', 'HOSTEL');
        const data = await checkOutHostelResident(resolvedTenant, payload.allocationId, actor);
        return NextResponse.json({ success: true, data });
      }
      case 'RECORD_HOSTEL_VISITOR': {
        const data = await recordHostelVisitor(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'RECORD_HOSTEL_ATTENDANCE': {
        if (session) requirePermission(session, 'UPDATE', 'HOSTEL');
        const data = await recordHostelAttendance(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }

      // 3. Transport
      case 'CREATE_VEHICLE': {
        if (session) requirePermission(session, 'CREATE', 'TRANSPORT');
        const data = await createTransportVehicle(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'CREATE_ROUTE': {
        if (session) requirePermission(session, 'CREATE', 'TRANSPORT');
        const data = await createTransportRoute(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'ADD_ROUTE_STOP': {
        if (session) requirePermission(session, 'CREATE', 'TRANSPORT');
        const data = await addRouteStop(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'SUBSCRIBE_TRANSPORT': {
        const data = await subscribeTransport(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'CREATE_TRIP': {
        if (session) requirePermission(session, 'CREATE', 'TRANSPORT');
        const data = await createTripSchedule(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'RECORD_BOARDING_EVENT': {
        const data = await recordBoardingEvent(resolvedTenant, payload);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'INGEST_GPS_TELEMETRY': {
        const data = await ingestGpsTelemetry(resolvedTenant, payload);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'RECORD_TRANSPORT_INCIDENT': {
        if (session) requirePermission(session, 'UPDATE', 'TRANSPORT');
        const data = await recordTransportIncident(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'LOG_FUEL': {
        if (session) requirePermission(session, 'UPDATE', 'TRANSPORT');
        const data = await logVehicleFuel(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'RECORD_VEHICLE_MAINTENANCE': {
        if (session) requirePermission(session, 'UPDATE', 'TRANSPORT');
        const data = await recordVehicleMaintenance(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      // 4. Canteen
      case 'CREATE_CANTEEN': {
        if (session) requirePermission(session, 'CREATE', 'CANTEEN');
        const data = await createCanteen(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'CREATE_CANTEEN_ITEM': {
        if (session) requirePermission(session, 'CREATE', 'CANTEEN');
        const data = await createCanteenItem(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'CREATE_CANTEEN_MENU': {
        if (session) requirePermission(session, 'CREATE', 'CANTEEN');
        const data = await createCanteenMenu(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'DEPOSIT_CANTEEN_WALLET': {
        const data = await depositCanteenWallet(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }
      case 'SET_SPENDING_LIMIT': {
        const data = await setSpendingLimit(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }
      case 'PROCESS_CANTEEN_SALE': {
        const data = await processCanteenSale(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      // 5. Inventory
      case 'CREATE_INVENTORY_CATEGORY': {
        if (session) requirePermission(session, 'CREATE', 'INVENTORY');
        const data = await createInventoryCategory(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'CREATE_WAREHOUSE': {
        if (session) requirePermission(session, 'CREATE', 'WAREHOUSE');
        const data = await createWarehouse(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'CREATE_INVENTORY_ITEM': {
        if (session) requirePermission(session, 'CREATE', 'INVENTORY');
        const data = await createInventoryItem(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'ADJUST_STOCK': {
        if (session) requirePermission(session, 'UPDATE', 'INVENTORY');
        const data = await adjustStock(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }
      case 'TRANSFER_STOCK': {
        if (session) requirePermission(session, 'UPDATE', 'INVENTORY');
        const data = await transferStock(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }
      case 'ISSUE_STOCK': {
        if (session) requirePermission(session, 'UPDATE', 'INVENTORY');
        const data = await issueStock(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }

      // 6. Assets
      case 'CREATE_FIXED_ASSET': {
        if (session) requirePermission(session, 'CREATE', 'ASSET');
        const data = await createFixedAsset(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'ASSIGN_ASSET': {
        if (session) requirePermission(session, 'UPDATE', 'ASSET');
        const data = await assignAsset(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }
      case 'RETURN_ASSET': {
        if (session) requirePermission(session, 'UPDATE', 'ASSET');
        const data = await returnAsset(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }
      case 'RECORD_ASSET_MAINTENANCE': {
        if (session) requirePermission(session, 'UPDATE', 'ASSET');
        const data = await recordAssetMaintenance(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }
      case 'DISPOSE_ASSET': {
        if (session) requirePermission(session, 'APPROVE', 'ASSET');
        const data = await disposeAsset(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }

      // 7. Procurement
      case 'CREATE_PURCHASE_REQUISITION': {
        if (session) requirePermission(session, 'CREATE', 'PROCUREMENT');
        const data = await createPurchaseRequisition(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'APPROVE_PURCHASE_REQUISITION': {
        if (session) requirePermission(session, 'APPROVE', 'PROCUREMENT');
        const data = await approvePurchaseRequisition(resolvedTenant, payload.requisitionId, actor);
        return NextResponse.json({ success: true, data });
      }
      case 'CREATE_RFQ': {
        if (session) requirePermission(session, 'CREATE', 'PROCUREMENT');
        const data = await createRequestForQuotation(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'SUBMIT_VENDOR_QUOTATION': {
        const data = await submitVendorQuotation(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'CREATE_PURCHASE_ORDER': {
        if (session) requirePermission(session, 'APPROVE', 'PROCUREMENT');
        const data = await createPurchaseOrder(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'RECEIVE_GOODS_NOTE': {
        if (session) requirePermission(session, 'APPROVE', 'PROCUREMENT');
        const data = await receiveGoodsNote(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }

      // 8. Maintenance
      case 'CREATE_MAINTENANCE_REQUEST': {
        const data = await createMaintenanceRequest(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'CREATE_MAINTENANCE_WORK_ORDER': {
        if (session) requirePermission(session, 'CREATE', 'MAINTENANCE');
        const data = await createMaintenanceWorkOrder(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'UPDATE_MAINTENANCE_WORK_ORDER': {
        if (session) requirePermission(session, 'UPDATE', 'MAINTENANCE');
        const data = await updateMaintenanceWorkOrder(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }

      // 9. Visitor & Gate
      case 'REGISTER_VISITOR': {
        if (session) requirePermission(session, 'CREATE', 'VISITOR');
        const data = await registerVisitor(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'CHECKOUT_VISITOR': {
        if (session) requirePermission(session, 'UPDATE', 'VISITOR');
        const data = await checkOutVisitor(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }
      case 'CREATE_STUDENT_PICKUP_AUTH': {
        const data = await createStudentPickupAuthorization(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'RECORD_VEHICLE_GATE_ENTRY': {
        if (session) requirePermission(session, 'CREATE', 'GATE');
        const data = await recordVehicleGateEntry(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'RECORD_VEHICLE_GATE_EXIT': {
        if (session) requirePermission(session, 'UPDATE', 'GATE');
        const data = await recordVehicleGateExit(resolvedTenant, payload.logId);
        return NextResponse.json({ success: true, data });
      }

      // 10. Booking
      case 'CREATE_FACILITY_BOOKING': {
        const data = await createFacilityBooking(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data }, { status: 201 });
      }
      case 'PROCESS_FACILITY_BOOKING_ACTION': {
        if (session) requirePermission(session, 'APPROVE', 'FACILITY_BOOKING');
        const data = await processFacilityBookingAction(resolvedTenant, payload, actor);
        return NextResponse.json({ success: true, data });
      }

      default:
        throw AppError.validation(`Unsupported facilities action: '${action}'`);
    }
  } catch (error: any) {
    console.error('API /api/facilities POST Error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal error' } },
      { status: error.statusCode || 500 }
    );
  }
}
