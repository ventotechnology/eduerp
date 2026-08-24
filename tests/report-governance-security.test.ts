import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { executeGovernedReportQuery, maskPiiValue } from "@/lib/services/report-query-engine";
import { SessionUser } from "@/lib/auth/types";

describe("COMMAND 9: Report Governance, Query Safety & Multi-Tenant Security", () => {
  const tenantSlug = "report-gov-school";
  let institutionAId: string;
  let institutionBId: string;
  let campusAId: string;
  let campusBId: string;

  const principalActor: SessionUser = {
    id: "user-principal-a",
    name: "Principal A",
    email: "principal@school-a.edu",
    role: "PRINCIPAL",
    tenantId: tenantSlug,
    isPlatformAdmin: false,
    status: "ACTIVE" as any,
  };

  const platformSuperAdminActor: SessionUser = {
    id: "user-platform-admin",
    name: "Super Admin",
    email: "superadmin@eduerp.us",
    role: "PLATFORM_SUPER_ADMIN",
    tenantId: "platform-root",
    isPlatformAdmin: true,
    status: "ACTIVE" as any,
  };

  beforeEach(async () => {
    const tA = await db.tenant.upsert({
      where: { slug: tenantSlug },
      update: {},
      create: {
        slug: tenantSlug,
        institutionType: "SCHOOL",
        subscriptionTier: "PROFESSIONAL",
        isActive: true,
      },
    });

    const instA = await db.institution.upsert({
      where: { tenantId: tA.id },
      update: {},
      create: {
        tenantId: tA.id,
        name: "Report Governance High School",
        shortName: "RGHS",
        address: "Dhanmondi, Dhaka",
        district: "Dhaka",
        division: "Dhaka",
        upazilaThana: "Dhanmondi",
        email: "admin@school-a.edu",
        phone: "01711223344",
      },
    });
    institutionAId = instA.id;

    const campA = await db.campus.upsert({
      where: { institutionId_code: { institutionId: instA.id, code: "MCA" } },
      update: {},
      create: {
        institutionId: instA.id,
        name: "Main Campus A",
        code: "MCA",
        address: "Dhaka",
      },
    });
    campusAId = campA.id;

    const tB = await db.tenant.upsert({
      where: { slug: "report-gov-b" },
      update: {},
      create: {
        slug: "report-gov-b",
        institutionType: "COLLEGE",
        subscriptionTier: "PROFESSIONAL",
        isActive: true,
      },
    });

    const instB = await db.institution.upsert({
      where: { tenantId: tB.id },
      update: {},
      create: {
        tenantId: tB.id,
        name: "School B",
        shortName: "SB",
        address: "Agrabad, Chittagong",
        district: "Chittagong",
        division: "Chittagong",
        upazilaThana: "Double Mooring",
        email: "admin@school-b.edu",
        phone: "01811223344",
      },
    });
    institutionBId = instB.id;

    const campB = await db.campus.upsert({
      where: { institutionId_code: { institutionId: instB.id, code: "MCB" } },
      update: {},
      create: {
        institutionId: instB.id,
        name: "Main Campus B",
        code: "MCB",
        address: "Chittagong",
      },
    });
    campusBId = campB.id;

    await db.student.deleteMany({ where: { campusId: { in: [campusAId, campusBId] } } });
    await db.student.create({
      data: {
        campusId: campusAId,
        studentIdNumber: "RPT-STD-A1",
        admissionNumber: "ADM-A1",
        firstName: "Anisur",
        lastName: "Rahman",
        gender: "MALE",
        presentAddress: "Dhaka",
        permanentAddress: "Dhaka",
        dateOfBirth: new Date("2010-01-01"),
        phone: "01712345678",
        email: "anisur@gmail.com",
        status: "ACTIVE",
      },
    });

    await db.student.create({
      data: {
        campusId: campusBId,
        studentIdNumber: "RPT-STD-B1",
        admissionNumber: "ADM-B1",
        firstName: "Farhana",
        lastName: "Akter",
        gender: "FEMALE",
        presentAddress: "Dhaka",
        permanentAddress: "Dhaka",
        dateOfBirth: new Date("2010-02-01"),
        phone: "01899887766",
        email: "farhana@yahoo.com",
        status: "ACTIVE",
      },
    });
  });

  it("1. Rejects unapproved columns and raw table injection attempts", async () => {
    await expect(
      executeGovernedReportQuery(
        tenantSlug,
        {
          datasetCode: "STUDENTS",
          columns: ["studentIdNumber", "malicious_column_1; DROP TABLE users;--"],
        },
        principalActor
      )
    ).rejects.toThrow(/Unknown or unapproved column/);
  });

  it("2. Enforces strict tenant boundary isolation", async () => {
    const result = await executeGovernedReportQuery(
      tenantSlug,
      {
        datasetCode: "STUDENTS",
        columns: ["studentIdNumber", "firstName", "lastName"],
      },
      principalActor
    );

    expect(result.rows.length).toBeGreaterThan(0);
    const hasStudentA = result.rows.some((r) => r.studentIdNumber === "RPT-STD-A1");
    const hasStudentB = result.rows.some((r) => r.studentIdNumber === "RPT-STD-B1");

    expect(hasStudentA).toBe(true);
    expect(hasStudentB).toBe(false);
  });

  it("3. Segregates SaaS platform datasets from institutional tenants", async () => {
    await expect(
      executeGovernedReportQuery(
        tenantSlug,
        {
          datasetCode: "PLATFORM_TENANTS",
        },
        principalActor
      )
    ).rejects.toThrow(/Only SaaS Platform Super Admins can access platform datasets/);

    const platformResult = await executeGovernedReportQuery(
      tenantSlug,
      {
        datasetCode: "PLATFORM_TENANTS",
      },
      platformSuperAdminActor
    );
    expect(platformResult.rows.length).toBeGreaterThan(0);
  });

  it("4. Applies PII masking on confidential student phone and email", () => {
    const maskedPhone = maskPiiValue("01712345678", "PHONE");
    expect(maskedPhone).toBe("017******78");

    const maskedEmail = maskPiiValue("student.rahim@gmail.com", "EMAIL");
    expect(maskedEmail).toBe("s***m@gmail.com");

    const maskedBank = maskPiiValue("123456789012", "BANK_ACCOUNT");
    expect(maskedBank).toBe("****9012");
  });
});
