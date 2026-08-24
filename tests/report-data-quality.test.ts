import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import {
  evaluateDataQualityRules,
  getDataQualityDashboard,
} from "@/lib/services/data-governance-service";

describe("COMMAND 9: Enterprise Data Governance & Quality Audit Engine", () => {
  const tenantSlug = "data-quality-school";
  let institutionId: string;
  let campusId: string;
  let studentId: string;

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
        name: "Data Quality Model School",
        shortName: "DQMS",
        address: "Dhanmondi, Dhaka",
        district: "Dhaka",
        division: "Dhaka",
        upazilaThana: "Dhanmondi",
        email: "admin@dqms.edu",
        phone: "01711223344",
      },
    });
    institutionId = inst.id;

    const camp = await db.campus.upsert({
      where: { institutionId_code: { institutionId: inst.id, code: "MC-DQMS" } },
      update: {},
      create: {
        institutionId: inst.id,
        name: "Main Campus",
        code: "MC-DQMS",
        address: "Dhaka",
      },
    });
    campusId = camp.id;

    await db.student.deleteMany({ where: { campusId: camp.id } });
    const s1 = await db.student.create({
      data: {
        campusId,
        studentIdNumber: "DQ-STD-VALID",
        admissionNumber: "ADM-DQ1",
        firstName: "Mahmud",
        lastName: "Hasan",
        gender: "MALE",
        presentAddress: "Dhaka",
        permanentAddress: "Dhaka",
        dateOfBirth: new Date("2010-01-01"),
        phone: "01711223344",
        email: "mahmud@gmail.com",
        status: "ACTIVE",
      },
    });
    studentId = s1.id;

    await db.student.create({
      data: {
        campusId,
        studentIdNumber: "DQ-STD-MISSING",
        admissionNumber: "ADM-DQ2",
        firstName: "Robiul",
        lastName: "Islam",
        gender: "MALE",
        presentAddress: "Dhaka",
        permanentAddress: "Dhaka",
        dateOfBirth: new Date("2010-01-01"),
        phone: null,
        email: null,
        status: "ACTIVE",
      },
    });

    await db.invoice.deleteMany({ where: { studentId: s1.id } });
    await db.invoice.create({
      data: {
        studentId: s1.id,
        invoiceNumber: "INV-DQ-ERR",
        title: "Tuition Mismatch Error",
        subTotal: 10000,
        totalAmount: 10000,
        paidAmount: 5000,
        dueAmount: 3000, // Sum = 8000 != 10000 (mismatch error)
        waiverAmount: 0,
        status: "PARTIALLY_PAID",
        dueDate: new Date(),
      },
    });
  });

  it("1. Scans records and detects data quality anomalies", async () => {
    const scan = await evaluateDataQualityRules(tenantSlug);
    expect(scan.issuesFound).toBeGreaterThanOrEqual(2);

    const hasMissingContact = scan.issues.some(
      (i) => i.datasetCode === "STUDENTS" && i.details.includes("Missing all primary student contact information")
    );
    const hasInvoiceMismatch = scan.issues.some(
      (i) => i.datasetCode === "FEES" && i.details.includes("Invoice balance mismatch")
    );

    expect(hasMissingContact).toBe(true);
    expect(hasInvoiceMismatch).toBe(true);
  });

  it("2. Computes cleanliness score on data quality dashboard", async () => {
    const dashboard = await getDataQualityDashboard(tenantSlug);
    expect(dashboard.metrics.totalRecordsAudited).toBeGreaterThan(0);
    expect(dashboard.metrics.errorsCount).toBeGreaterThanOrEqual(2);
    expect(dashboard.metrics.cleanlinessScorePercent).toBeLessThan(100);
  });
});
