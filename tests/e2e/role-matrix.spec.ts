import { test, expect } from '@playwright/test';

test.describe('Multi-Role RBAC Real Login Authorization Matrix Suite', () => {
  const roleAccounts = [
    { role: 'PLATFORM_SUPER_ADMIN', emailEnv: 'E2E_PLATFORM_ADMIN_EMAIL', passEnv: 'E2E_PLATFORM_ADMIN_PASSWORD', defaultEmail: 'platform-super-admin@eduerp.us' },
    { role: 'PRINCIPAL', emailEnv: 'E2E_PRINCIPAL_EMAIL', passEnv: 'E2E_PRINCIPAL_PASSWORD', defaultEmail: 'principal.demo-school@eduerp.us' },
    { role: 'ADMISSION_OFFICER', emailEnv: 'E2E_ADMISSION_EMAIL', passEnv: 'E2E_ADMISSION_PASSWORD', defaultEmail: 'admission.demo-school@eduerp.us' },
    { role: 'TEACHER', emailEnv: 'E2E_TEACHER_EMAIL', passEnv: 'E2E_TEACHER_PASSWORD', defaultEmail: 'teacher.demo-school@eduerp.us' },
    { role: 'ACCOUNTANT', emailEnv: 'E2E_ACCOUNTANT_EMAIL', passEnv: 'E2E_ACCOUNTANT_PASSWORD', defaultEmail: 'accountant.demo-school@eduerp.us' },
    { role: 'HR_MANAGER', emailEnv: 'E2E_HR_EMAIL', passEnv: 'E2E_HR_PASSWORD', defaultEmail: 'hr.demo-school@eduerp.us' },
    { role: 'STUDENT', emailEnv: 'E2E_STUDENT_EMAIL', passEnv: 'E2E_STUDENT_PASSWORD', defaultEmail: 'student.demo-school@eduerp.us' },
    { role: 'PARENT', emailEnv: 'E2E_PARENT_EMAIL', passEnv: 'E2E_PARENT_PASSWORD', defaultEmail: 'parent.demo-school@eduerp.us' },
  ];

  for (const acct of roleAccounts) {
    test(`authenticates real credentials for role: ${acct.role} and verifies identity`, async ({ request }) => {
      const email = process.env[acct.emailEnv] || acct.defaultEmail;
      const pass = process.env[acct.passEnv];
      expect(pass).toBeTruthy();

      // 1. Authenticate via real login
      const res = await request.post('/api/auth/login', {
        data: { email, password: pass }
      });
      expect(res.status()).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user.role).toBe(acct.role);

      // 2. Verify /api/auth/me matches the issued session
      const meRes = await request.get('/api/auth/me');
      expect(meRes.status()).toBe(200);
      const meJson = await meRes.json();
      expect(meJson.authenticated).toBe(true);
      expect(meJson.user.role).toBe(acct.role);
    });
  }
});
