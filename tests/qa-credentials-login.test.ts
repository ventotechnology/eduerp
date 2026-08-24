import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";

describe("COMMAND 10: Production Authentication & QA Credential Verification", () => {
  const platformPassword = "EduERP-Platform@2026!Pilot#10";
  const qaPassword = "EduERP-QA@2026!Pilot#10";

  it("1. Verifies Platform Super Admin credentials and session issuance", async () => {
    const admin = await db.user.findUnique({
      where: { email: "platform-super-admin@eduerp.us" },
    });

    expect(admin).toBeDefined();
    expect(admin?.role).toBe("PLATFORM_SUPER_ADMIN");
    expect(admin?.status).toBe("ACTIVE");

    const isMatch = verifyPassword(platformPassword, admin!.passwordHash);
    expect(isMatch).toBe(true);

    const token = createSessionToken({
      userId: admin!.id,
      email: admin!.email,
      role: admin!.role as any,
      tenantId: null,
    });

    const payload = verifySessionToken(token);
    expect(payload).toBeDefined();
    expect(payload?.email).toBe("platform-super-admin@eduerp.us");
    expect(payload?.role).toBe("PLATFORM_SUPER_ADMIN");
  });

  it("2. Verifies institutional leadership credentials across all demo tenants", async () => {
    const principals = [
      { email: "principal.demo-school@eduerp.us", slug: "demo-school" },
      { email: "principal.demo-college@eduerp.us", slug: "demo-college" },
      { email: "principal.demo-madrasha@eduerp.us", slug: "demo-madrasha" },
      { email: "vice-chancellor.demo-university@eduerp.us", slug: "demo-university" },
      { email: "principal.demo-polytechnic@eduerp.us", slug: "demo-polytechnic" },
      { email: "principal.demo-vocational@eduerp.us", slug: "demo-vocational" },
      { email: "principal.demo-training@eduerp.us", slug: "demo-training" },
    ];

    for (const p of principals) {
      const user = await db.user.findUnique({
        where: { email: p.email },
        include: { tenant: true },
      });

      expect(user, `User ${p.email} should exist`).toBeDefined();
      expect(user?.status).toBe("ACTIVE");
      expect(user?.tenant?.slug).toBe(p.slug);

      const isMatch = verifyPassword(qaPassword, user!.passwordHash);
      expect(isMatch, `Password for ${p.email} should verify`).toBe(true);

      const token = createSessionToken({
        userId: user!.id,
        email: user!.email,
        role: user!.role as any,
        tenantId: user!.tenantId,
      });

      const payload = verifySessionToken(token);
      expect(payload?.tenantId).toBe(user!.tenantId);
    }
  });

  it("3. Verifies student and teacher credentials across institutions", async () => {
    const users = [
      { email: "teacher.demo-school@eduerp.us", role: "TEACHER" },
      { email: "student.demo-school@eduerp.us", role: "STUDENT" },
      { email: "accountant.demo-school@eduerp.us", role: "ACCOUNTANT" },
      { email: "hr-manager.demo-school@eduerp.us", role: "HR_MANAGER" },
      { email: "librarian.demo-school@eduerp.us", role: "LIBRARIAN" },
      { email: "transport-manager.demo-school@eduerp.us", role: "TRANSPORT_MANAGER" },
    ];

    for (const u of users) {
      const user = await db.user.findUnique({ where: { email: u.email } });
      expect(user, `User ${u.email} must exist`).toBeDefined();
      expect(user?.role).toBe(u.role);

      const isMatch = verifyPassword(qaPassword, user!.passwordHash);
      expect(isMatch).toBe(true);
    }
  });

  it("4. Rejects wrong passwords and tampered session tokens", async () => {
    const user = await db.user.findUnique({ where: { email: "principal.demo-school@eduerp.us" } });
    expect(verifyPassword("WrongPassword!123", user!.passwordHash)).toBe(false);

    const validToken = createSessionToken({
      userId: user!.id,
      email: user!.email,
      role: user!.role as any,
      tenantId: user!.tenantId,
    });

    const [data, sig] = validToken.split(".");
    const tamperedToken = `${data}.invalidSignatureHash`;
    expect(verifySessionToken(tamperedToken)).toBeNull();
  });
});
