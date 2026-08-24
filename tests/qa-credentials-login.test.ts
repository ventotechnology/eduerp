import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";
import { generateSecurePassword } from "@/scripts/provision-qa-users";

describe("COMMAND 10.1: Production Authentication & QA Credential Cryptographic Security", () => {
  it("1. Generates cryptographically secure random passwords (length >= 24, high entropy)", () => {
    const p1 = generateSecurePassword();
    const p2 = generateSecurePassword();

    expect(p1.length).toBeGreaterThanOrEqual(24);
    expect(p2.length).toBeGreaterThanOrEqual(24);
    expect(p1).not.toEqual(p2);

    // Checks character class distribution
    expect(/[A-Z]/.test(p1)).toBe(true);
    expect(/[a-z]/.test(p1)).toBe(true);
    expect(/[0-9]/.test(p1)).toBe(true);
    expect(/[!@#$%^&*_\-+=]/.test(p1)).toBe(true);
  });

  it("2. Verifies PBKDF2 password hashing and verification flow", () => {
    const testSecret = generateSecurePassword();
    const hash = hashPassword(testSecret);

    expect(hash).toBeDefined();
    expect(hash).toContain(":");

    const isValid = verifyPassword(testSecret, hash);
    expect(isValid).toBe(true);

    const isInvalid = verifyPassword("IncorrectPassword123!", hash);
    expect(isInvalid).toBe(false);
  });

  it("3. Verifies session token signing, tampering prevention and verification", () => {
    const token = createSessionToken({
      userId: "test-user-id",
      email: "qa.test@eduerp.us",
      role: "PLATFORM_SUPER_ADMIN",
      tenantId: null,
    });

    const payload = verifySessionToken(token);
    expect(payload).toBeDefined();
    expect(payload?.email).toBe("qa.test@eduerp.us");
    expect(payload?.role).toBe("PLATFORM_SUPER_ADMIN");

    // Tampering test
    const tampered = token.slice(0, -4) + "XXXX";
    const tamperedPayload = verifySessionToken(tampered);
    expect(tamperedPayload).toBeNull();
  });
});
