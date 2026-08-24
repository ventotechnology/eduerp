import { test, expect } from '@playwright/test';

test.describe('Platform Super Admin Impersonation & Security Guard Suite', () => {
  test('anonymous request to demo-session is strictly denied (401 Unauthorized)', async ({ request }) => {
    const res = await request.post('/api/auth/demo-session', {
      data: { tenantSlug: 'demo-school', role: 'PRINCIPAL' }
    });
    expect(res.status()).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  test('anonymous request attempting to gain PLATFORM_SUPER_ADMIN is strictly denied (401)', async ({ request }) => {
    const res = await request.post('/api/auth/demo-session', {
      data: { tenantSlug: 'platform', role: 'PLATFORM_SUPER_ADMIN' }
    });
    expect(res.status()).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  test('teacher session attempting to impersonate another role is forbidden (403)', async ({ request }) => {
    const teacherEmail = process.env.E2E_TEACHER_EMAIL || 'teacher.demo-school@eduerp.us';
    const teacherPass = process.env.E2E_TEACHER_PASSWORD;
    expect(teacherPass).toBeTruthy();

    const loginRes = await request.post('/api/auth/login', {
      data: { email: teacherEmail, password: teacherPass }
    });
    expect(loginRes.status()).toBe(200);

    const impRes = await request.post('/api/auth/demo-session', {
      data: { tenantSlug: 'demo-school', role: 'PRINCIPAL' }
    });
    expect(impRes.status()).toBe(403);
    const impJson = await impRes.json();
    expect(impJson.success).toBe(false);
  });

  test('authorized Platform Super Admin can impersonate real QA persona and exit cleanly', async ({ request }) => {
    const adminEmail = process.env.E2E_PLATFORM_ADMIN_EMAIL || 'platform-super-admin@eduerp.us';
    const adminPass = process.env.E2E_PLATFORM_ADMIN_PASSWORD;
    expect(adminPass).toBeTruthy();

    // 1. Login as Platform Super Admin
    const loginRes = await request.post('/api/auth/login', {
      data: { email: adminEmail, password: adminPass }
    });
    expect(loginRes.status()).toBe(200);

    // 2. Impersonate Demo School Principal
    const impRes = await request.post('/api/auth/demo-session', {
      data: { tenantSlug: 'demo-school', role: 'PRINCIPAL' }
    });
    expect(impRes.status()).toBe(200);
    const impJson = await impRes.json();
    expect(impJson.success).toBe(true);
    expect(impJson.user.role).toBe('PRINCIPAL');
    expect(impJson.user.impersonator.email).toBe(adminEmail);

    // 3. Verify /api/auth/me reflects impersonation status
    const meRes = await request.get('/api/auth/me');
    expect(meRes.status()).toBe(200);
    const meJson = await meRes.json();
    expect(meJson.authenticated).toBe(true);
    expect(meJson.user.role).toBe('PRINCIPAL');
    expect(meJson.user.impersonator).toBeTruthy();

    // 4. Exit Impersonation and restore Platform Super Admin
    const exitRes = await request.post('/api/auth/impersonation/exit');
    expect(exitRes.status()).toBe(200);
    const exitJson = await exitRes.json();
    expect(exitJson.success).toBe(true);

    // 5. Verify /api/auth/me is restored
    const meRestored = await request.get('/api/auth/me');
    const meRestoredJson = await meRestored.json();
    expect(meRestoredJson.user.role).toBe('PLATFORM_SUPER_ADMIN');
    expect(meRestoredJson.user.impersonator).toBeNull();
  });

  test('impersonating nonexistent tenant or role fails closed with 404', async ({ request }) => {
    const adminEmail = process.env.E2E_PLATFORM_ADMIN_EMAIL || 'platform-super-admin@eduerp.us';
    const adminPass = process.env.E2E_PLATFORM_ADMIN_PASSWORD;
    expect(adminPass).toBeTruthy();

    await request.post('/api/auth/login', {
      data: { email: adminEmail, password: adminPass }
    });

    const res = await request.post('/api/auth/demo-session', {
      data: { tenantSlug: 'non-existent-tenant-xyz', role: 'PRINCIPAL' }
    });
    expect(res.status()).toBe(404);
  });
});
