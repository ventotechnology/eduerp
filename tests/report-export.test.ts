import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import {
  exportReportToCsv,
  exportReportToXlsx,
  exportReportToPdfSummary,
} from "@/lib/services/report-export-service";
import { SessionUser } from "@/lib/auth/types";

describe("COMMAND 9: Report Multi-Format Export Engine (CSV / XLSX / PDF)", () => {
  const tenantSlug = "export-test-school";
  let institutionId: string;
  let campusId: string;

  const actor: SessionUser = {
    id: "user-exporter",
    name: "Export Manager",
    email: "exporter@school.edu",
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
        name: "Export Test High School",
        shortName: "ETHS",
        address: "Dhanmondi, Dhaka",
        district: "Dhaka",
        division: "Dhaka",
        upazilaThana: "Dhanmondi",
        email: "admin@eths.edu",
        phone: "01711223344",
      },
    });
    institutionId = inst.id;

    const camp = await db.campus.upsert({
      where: { institutionId_code: { institutionId: inst.id, code: "MC-ETHS" } },
      update: {},
      create: {
        institutionId: inst.id,
        name: "Main Campus",
        code: "MC-ETHS",
        address: "Dhaka",
      },
    });
    campusId = camp.id;

    await db.student.deleteMany({ where: { campusId: camp.id } });
    await db.student.createMany({
      data: [
        {
          campusId: camp.id,
          studentIdNumber: "EXP-STD-01",
          admissionNumber: "ADM-01",
          firstName: "মুহাম্মদ",
          lastName: "রহিম",
          gender: "MALE",
          presentAddress: "Dhaka",
          permanentAddress: "Dhaka",
          dateOfBirth: new Date("2010-01-01"),
          status: "ACTIVE",
        },
        {
          campusId: camp.id,
          studentIdNumber: "EXP-STD-02",
          admissionNumber: "ADM-02",
          firstName: "সাদিয়া, জাহান",
          lastName: "সুলতানা",
          gender: "FEMALE",
          presentAddress: "Dhaka",
          permanentAddress: "Dhaka",
          dateOfBirth: new Date("2010-02-01"),
          status: "ACTIVE",
        },
      ],
    });
  });

  it("1. Generates UTF-8 CSV with BOM for native Bangla character compatibility", async () => {
    const result = await exportReportToCsv(
      tenantSlug,
      {
        datasetCode: "STUDENTS",
        columns: ["studentIdNumber", "firstName", "lastName", "gender", "status"],
      },
      actor
    );

    expect(result.contentType).toBe("text/csv; charset=utf-8");
    expect(result.content.startsWith("﻿")).toBe(true);
    expect(result.content).toContain("মুহাম্মদ");
    expect(result.content).toContain('"সাদিয়া, জাহান"');
    expect(result.rowCount).toBe(2);

    const log = await db.reportExport.findFirst({
      where: { institutionId, exportFormat: "CSV" },
      orderBy: { exportedAt: "desc" },
    });
    expect(log).toBeDefined();
    expect(log?.rowCount).toBe(2);
  });

  it("2. Generates structured XLSX workbook payload", async () => {
    const result = await exportReportToXlsx(
      tenantSlug,
      {
        datasetCode: "STUDENTS",
        columns: ["studentIdNumber", "firstName", "lastName"],
      },
      actor
    );

    expect(result.contentType).toContain("spreadsheetml.sheet");
    expect(result.payload.sheetName).toBe("STUDENTS");
    expect(result.payload.rows.length).toBe(2);
    expect(result.rowCount).toBe(2);
  });

  it("3. Generates printable PDF summary sheet metadata", async () => {
    const result = await exportReportToPdfSummary(
      tenantSlug,
      {
        datasetCode: "STUDENTS",
        columns: ["studentIdNumber", "firstName", "lastName"],
      },
      actor
    );

    expect(result.title).toBe("STUDENTS Official Report Summary");
    expect(result.confidentiality).toContain("INTERNAL USE ONLY");
    expect(result.rows.length).toBe(2);
  });
});
