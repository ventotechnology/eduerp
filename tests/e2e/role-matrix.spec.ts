import { test, expect } from '@playwright/test';

test.describe('Multi-Role RBAC Authorization Matrix Suite', () => {
  const testRoles = [
    'PLATFORM_SUPER_ADMIN',
    'PRINCIPAL',
    'TEACHER',
    'ACCOUNTANT',
    'ADMISSION_OFFICER',
    'LIBRARIAN',
    'HOSTEL_SUPERINTENDENT',
    'TRANSPORT_MANAGER',
    'CANTEEN_MANAGER',
    'STORE_KEEPER',
    'STUDENT',
    'PARENT'
  ];

  for (const role of testRoles) {
    test(`switches session to role: ${role} and verifies identity`, async ({ request }) => {
      const res = await request.post('/api/auth/demo-session', {
        data: { tenantSlug: 'demo-school', role }
      });
      expect(res.status()).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user.role).toBe(role);

      // Verify /api/auth/me matches the issued session
      const meRes = await request.get('/api/auth/me');
      expect(meRes.status()).toBe(200);
      const meJson = await meRes.json();
      expect(meJson.authenticated).toBe(true);
      expect(meJson.user.role).toBe(role);
    });
  }
});
