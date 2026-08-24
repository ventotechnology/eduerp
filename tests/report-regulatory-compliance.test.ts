import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import {
  initializeRegulatoryAgencies,
  getRegulatoryAgencies,
  createRegulatoryTemplate,
  startRegulatoryReportRun,
  validateRegulatoryReportRun,
  approveRegulatoryReportRun,
  recordRegulatorySubmission,
} from "@/lib/services/regulatory-engine-service";
import { SessionUser } from "@/lib/auth/types";

describe("COMMAND 9: Regulatory Agency Master, Versioned Templates & Validation Engine", () => {
  const tenantSlug = "regulatory-test-school";
  let institutionId: string;
  let campusId: string;
  let templateId: string;

  const preparerActor: SessionUser = {
    id: "user-preparer-1",
    name: "Compliance Officer",
    email: "officer@school.edu",
    role: "TEACHER",
    tenantId: tenantSlug,
    isPlatformAdmin: false,
    status: "ACTIVE" as any,
  };

  const approverActor: SessionUser = {
    id: "user-principal-approver",
    name: "Headmaster Principal",
    email: "principal@school.edu",
    role: "PRINCIPAL",
    tenantId: tenantSlug,
    isPlatformAdmin: false,
    status: "ACTIVE" as any,
  };

  const platformAdmin: SessionUser = {
    id: "user-platform-admin",
    name: "Super Admin",
    email: "admin@eduerp.us",
    role: "PLATFORM_SUPER_ADMIN",
    tenantId: "platform-root",
    isPlatformAdmin: true,
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
        name: "Regulatory Model High School",
        shortName: "RMHS",
        address: "Dhanmondi, Dhaka",
        district: "Dhaka",
        division: "Dhaka",
        upazilaThana: "Dhanmondi",
        email: "admin@rmhs.edu",
        phone: "01700112233",
      },
    });
    institutionId = inst.id;

    const camp = await db.campus.upsert({
      where: { institutionId_code: { institutionId: inst.id, code: "MC-RMHS" } },
      update: {},
      create: {
        institutionId: inst.id,
        name: "Main Campus",
        code: "MC-RMHS",
        address: "Dhaka",
      },
    });
    campusId = camp.id;

    await initializeRegulatoryAgencies();

    const tm = await createRegulatoryTemplate(
      {
        agencyCode: "BANBEIS",
        templateCode: "BANBEIS_CENSUS_" + Date.now(),
        title: "BANBEIS Annual Educational Census 2026",
        version: 1,
        institutionType: "SCHOOL",
        outputFormat: "XLSX",
        fields: [
          { fieldCode: "EIIN_NO", label: "EIIN Number", dataType: "STRING", isRequired: true },
          { fieldCode: "TOTAL_STUDENTS", label: "Total Students", dataType: "NUMBER", isRequired: true },
          { fieldCode: "TOTAL_FEMALE_STUDENTS", label: "Female Students", dataType: "NUMBER", isRequired: true },
          { fieldCode: "TOTAL_TEACHERS", label: "Total Teachers", dataType: "NUMBER", isRequired: true },
        ],
      },
      platformAdmin
    );
    templateId = tm.id;
  });

  it("1. Initializes Bangladesh government agencies (BANBEIS, DSHE, UGC, BTEB, BMEB)", async () => {
    const agencies = await getRegulatoryAgencies();
    expect(agencies.length).toBeGreaterThanOrEqual(6);
    const hasBanbeis = agencies.some((a) => a.code === "BANBEIS");
    const hasDshe = agencies.some((a) => a.code === "DSHE");
    const hasUgc = agencies.some((a) => a.code === "UGC");
    const hasBteb = agencies.some((a) => a.code === "BTEB");

    expect(hasBanbeis).toBe(true);
    expect(hasDshe).toBe(true);
    expect(hasUgc).toBe(true);
    expect(hasBteb).toBe(true);
  });

  it("2. Detects validation errors during compliance scan and enforces resolution", async () => {
    await db.student.deleteMany({ where: { campusId } });
    await db.student.create({
      data: {
        campusId,
        studentIdNumber: "REG-STD-INV",
        admissionNumber: "ADM-INV",
        firstName: "Kamal",
        lastName: "Uddin",
        gender: "" as any,
        presentAddress: "Dhaka",
        permanentAddress: "Dhaka",
        dateOfBirth: new Date("2010-01-01"),
        status: "ACTIVE",
      },
    });

    const run = await startRegulatoryReportRun(
      tenantSlug,
      {
        templateId,
        reportingPeriod: "2025-2026",
      },
      preparerActor
    );

    expect(run.status).toBe("DRAFT");

    const validatedRun = await validateRegulatoryReportRun(tenantSlug, run.id, preparerActor);
    expect(validatedRun.status).toBe("VALIDATION_FAILED");
    expect(validatedRun.validationIssues.length).toBeGreaterThan(0);
    expect(validatedRun.validationIssues.some((i) => i.fieldCode === "STUDENT_GENDER")).toBe(true);

    await expect(
      approveRegulatoryReportRun(tenantSlug, { reportRunId: run.id }, approverActor)
    ).rejects.toThrow(/Cannot approve regulatory report with active validation errors/);
  });

  it("3. Enforces segregation of duties and records official submission acknowledgement", async () => {
    await db.student.deleteMany({ where: { campusId } });
    await db.student.create({
      data: {
        campusId,
        studentIdNumber: "REG-STD-VALID",
        admissionNumber: "ADM-VALID",
        firstName: "Nusrat",
        lastName: "Jahan",
        gender: "FEMALE",
        presentAddress: "Dhaka",
        permanentAddress: "Dhaka",
        dateOfBirth: new Date("2010-05-15"),
        status: "ACTIVE",
      },
    });

    const run = await startRegulatoryReportRun(
      tenantSlug,
      {
        templateId,
        reportingPeriod: "2025-2026",
      },
      preparerActor
    );

    const validRun = await validateRegulatoryReportRun(tenantSlug, run.id, preparerActor);
    expect(validRun.status).toBe("READY");

    await expect(
      approveRegulatoryReportRun(tenantSlug, { reportRunId: run.id }, preparerActor, true)
    ).rejects.toThrow(/Segregation of duties violation/);

    const approvedRun = await approveRegulatoryReportRun(tenantSlug, { reportRunId: run.id }, approverActor, true);
    expect(approvedRun.status).toBe("APPROVED");
    expect(approvedRun.snapshotHash).toBeDefined();
    expect(approvedRun.snapshotHash?.length).toBe(64);

    const submission = await recordRegulatorySubmission(
      tenantSlug,
      {
        reportRunId: run.id,
        submissionReference: "BANBEIS-2026-DHAKA-10293",
        acknowledgementNumber: "ACK-883921",
        notes: "Submitted via BANBEIS web portal by Headmaster",
      },
      approverActor
    );

    expect(submission.submissionReference).toBe("BANBEIS-2026-DHAKA-10293");
    expect(submission.acknowledgementNumber).toBe("ACK-883921");
  });
});
