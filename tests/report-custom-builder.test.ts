import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import {
  createReportDefinition,
  updateReportDefinition,
  duplicateReportDefinition,
  saveReportSnapshot,
} from "@/lib/services/custom-report-service";
import { executeGovernedReportQuery } from "@/lib/services/report-query-engine";
import { SessionUser } from "@/lib/auth/types";

describe("COMMAND 9: Custom Report Builder Lifecycle & Snapshot Integrity", () => {
  const tenantSlug = "custom-builder-tenant";
  let institutionId: string;
  let campusId: string;
  let studentId: string;

  const actor: SessionUser = {
    id: "user-report-builder-1",
    name: "Report Admin",
    email: "report.admin@eduerp.us",
    role: "PRINCIPAL",
    tenantId: tenantSlug,
    isPlatformAdmin: false,
    status: "ACTIVE" as any,
  };

  beforeEach(async () => {
    const t = await db.tenant.upsert({
      where: { slug: tenantSlug },
      update: {},
      create: {
        slug: tenantSlug,
        institutionType: "SCHOOL",
        subscriptionTier: "PROFESSIONAL",
        isActive: true,
      },
    });

    const inst = await db.institution.upsert({
      where: { tenantId: t.id },
      update: {},
      create: {
        tenantId: t.id,
        name: "Report Builder Institute",
        shortName: "RBI",
        address: "Dhanmondi, Dhaka",
        district: "Dhaka",
        division: "Dhaka",
        upazilaThana: "Dhanmondi",
        email: "admin@rbi.edu",
        phone: "01711223344",
      },
    });
    institutionId = inst.id;

    const camp = await db.campus.upsert({
      where: { institutionId_code: { institutionId: inst.id, code: "MC-RBI" } },
      update: {},
      create: {
        institutionId: inst.id,
        name: "Main Campus",
        code: "MC-RBI",
        address: "Dhaka",
      },
    });
    campusId = camp.id;

    await db.student.deleteMany({ where: { campusId: camp.id } });
    const stu = await db.student.create({
      data: {
        campusId: camp.id,
        studentIdNumber: "STU-BLD-01",
        admissionNumber: "ADM-BLD-01",
        firstName: "Tareq",
        lastName: "Jamil",
        gender: "MALE",
        presentAddress: "Dhaka",
        permanentAddress: "Dhaka",
        dateOfBirth: new Date("2010-01-01"),
        status: "ACTIVE",
      },
    });
    studentId = stu.id;

    await db.invoice.deleteMany({ where: { studentId: stu.id } });
    await db.invoice.createMany({
      data: [
        {
          studentId: stu.id,
          invoiceNumber: "INV-BLD-01",
          title: "Monthly Tuition Fee",
          subTotal: 10000,
          totalAmount: 10000,
          paidAmount: 8000,
          dueAmount: 2000,
          waiverAmount: 0,
          status: "PARTIALLY_PAID",
          dueDate: new Date("2026-10-15"),
        },
        {
          studentId: stu.id,
          invoiceNumber: "INV-BLD-02",
          title: "Lab Session Fee",
          subTotal: 15000,
          totalAmount: 15000,
          paidAmount: 15000,
          dueAmount: 0,
          waiverAmount: 0,
          status: "PAID",
          dueDate: new Date("2026-10-15"),
        },
      ],
    });
  });

  it("1. Creates, updates, and duplicates custom report definition", async () => {
    const report = await createReportDefinition(
      tenantSlug,
      {
        datasetCode: "FEES",
        name: "Outstanding Fee Receivables Report",
        description: "Track unpaid fees and partial collections",
        visibility: "INSTITUTION_SHARED",
        columns: [
          { fieldKey: "invoiceNumber", displayLabel: "Invoice #", sequenceOrder: 1 },
          { fieldKey: "totalAmount", displayLabel: "Total (BDT)", sequenceOrder: 2, aggregateType: "SUM" },
          { fieldKey: "paidAmount", displayLabel: "Paid (BDT)", sequenceOrder: 3, aggregateType: "SUM" },
          { fieldKey: "balanceAmount", displayLabel: "Due Balance", sequenceOrder: 4, aggregateType: "SUM" },
          { fieldKey: "status", displayLabel: "Payment Status", sequenceOrder: 5 },
        ],
        filters: [
          { fieldKey: "status", operator: "EQUALS", valueJson: JSON.stringify("PARTIALLY_PAID"), sequenceOrder: 1 },
        ],
        sorts: [{ fieldKey: "totalAmount", direction: "DESC", priority: 1 }],
      },
      actor
    );

    expect(report.id).toBeDefined();
    expect(report.name).toBe("Outstanding Fee Receivables Report");
    expect(report.columns.length).toBe(5);

    const updated = await updateReportDefinition(
      tenantSlug,
      {
        reportDefinitionId: report.id,
        name: "Updated Receivables Aging",
        isFavorite: true,
      },
      actor
    );
    expect(updated.name).toBe("Updated Receivables Aging");
    expect(updated.version).toBe(2);
    expect(updated.isFavorite).toBe(true);

    const copy = await duplicateReportDefinition(
      tenantSlug,
      report.id,
      "Duplicate Receivables Report",
      actor
    );
    expect(copy.id).not.toBe(report.id);
    expect(copy.name).toBe("Duplicate Receivables Report");
    expect(copy.columns.length).toBe(5);
  });

  it("2. Computes numeric aggregations accurately on query execution", async () => {
    const result = await executeGovernedReportQuery(
      tenantSlug,
      {
        datasetCode: "FEES",
        columns: ["invoiceNumber", "totalAmount", "paidAmount", "balanceAmount"],
        aggregates: [
          { fieldKey: "totalAmount", aggregateType: "SUM" },
          { fieldKey: "paidAmount", aggregateType: "SUM" },
          { fieldKey: "balanceAmount", aggregateType: "SUM" },
        ],
      },
      actor
    );

    expect(result.rows.length).toBe(2);
    expect(result.aggregates.totalAmount_sum).toBe(25000);
    expect(result.aggregates.paidAmount_sum).toBe(23000);
    expect(result.aggregates.balanceAmount_sum).toBe(2000);
  });

  it("3. Generates immutable report snapshot with cryptographic SHA-256 data hash", async () => {
    const report = await createReportDefinition(tenantSlug, { datasetCode: "FEES", name: "Snap Report", columns: [{ fieldKey: "invoiceNumber", displayLabel: "Inv" }] }, actor);
    const sampleData = [
      { invoiceNumber: "INV-01", totalAmount: 10000 },
      { invoiceNumber: "INV-02", totalAmount: 15000 },
    ];

    const snapshot = await saveReportSnapshot(
      tenantSlug,
      {
        reportDefinitionId: report.id,
        datasetCode: "FEES",
        rowCount: 2,
        dataJson: sampleData,
      },
      actor
    );

    expect(snapshot.id).toBeDefined();
    expect(snapshot.dataHash).toBeDefined();
    expect(snapshot.dataHash.length).toBe(64);
    expect(snapshot.rowCount).toBe(2);
  });
});
