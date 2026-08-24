import { test, expect } from '@playwright/test';

test.describe('COMMAND 11E: All 8 Verticals Head Logins & Workflows Suite', () => {

  const verticals = [
    {
      vertical: 'School (General K-12)',
      slug: 'demo-school',
      role: 'PRINCIPAL',
      emailEnv: 'E2E_PRINCIPAL_EMAIL',
      passEnv: 'E2E_PRINCIPAL_PASSWORD',
      defaultEmail: 'principal.demo-school@eduerp.us',
      expectedLanding: '/demo-school/dashboard',
    },
    {
      vertical: 'College (Higher Secondary HSC)',
      slug: 'demo-college',
      role: 'PRINCIPAL',
      emailEnv: 'E2E_COLLEGE_PRINCIPAL_EMAIL',
      passEnv: 'E2E_COLLEGE_PRINCIPAL_PASSWORD',
      defaultEmail: 'principal.demo-college@eduerp.us',
      expectedLanding: '/demo-college/dashboard',
    },
    {
      vertical: 'School & College (Combined)',
      slug: 'demo-school-college',
      role: 'PRINCIPAL',
      emailEnv: 'E2E_SCHOOL_COLLEGE_PRINCIPAL_EMAIL',
      passEnv: 'E2E_SCHOOL_COLLEGE_PRINCIPAL_PASSWORD',
      defaultEmail: 'principal.demo-school-college@eduerp.us',
      expectedLanding: '/demo-school-college/dashboard',
    },
    {
      vertical: 'Madrasha & Hifz',
      slug: 'demo-madrasha',
      role: 'PRINCIPAL',
      emailEnv: 'E2E_MADRASHA_PRINCIPAL_EMAIL',
      passEnv: 'E2E_MADRASHA_PRINCIPAL_PASSWORD',
      defaultEmail: 'principal.demo-madrasha@eduerp.us',
      expectedLanding: '/demo-madrasha/dashboard',
    },
    {
      vertical: 'University Higher Education',
      slug: 'demo-university',
      role: 'VICE_CHANCELLOR',
      emailEnv: 'E2E_UNIVERSITY_VC_EMAIL',
      passEnv: 'E2E_UNIVERSITY_VC_PASSWORD',
      defaultEmail: 'vice-chancellor.demo-university@eduerp.us',
      expectedLanding: '/demo-university/dashboard',
    },
    {
      vertical: 'Polytechnic Diploma Engineering',
      slug: 'demo-polytechnic',
      role: 'PRINCIPAL',
      emailEnv: 'E2E_POLYTECHNIC_PRINCIPAL_EMAIL',
      passEnv: 'E2E_POLYTECHNIC_PRINCIPAL_PASSWORD',
      defaultEmail: 'principal.demo-polytechnic@eduerp.us',
      expectedLanding: '/demo-polytechnic/dashboard',
    },
    {
      vertical: 'Technical & Vocational Institute',
      slug: 'demo-vocational',
      role: 'PRINCIPAL',
      emailEnv: 'E2E_VOCATIONAL_PRINCIPAL_EMAIL',
      passEnv: 'E2E_VOCATIONAL_PRINCIPAL_PASSWORD',
      defaultEmail: 'principal.demo-vocational@eduerp.us',
      expectedLanding: '/demo-vocational/dashboard',
    },
    {
      vertical: 'Professional Training Institute',
      slug: 'demo-training',
      role: 'PRINCIPAL',
      emailEnv: 'E2E_TRAINING_PRINCIPAL_EMAIL',
      passEnv: 'E2E_TRAINING_PRINCIPAL_PASSWORD',
      defaultEmail: 'principal.demo-training@eduerp.us',
      expectedLanding: '/demo-training/dashboard',
    },
  ];

  for (const v of verticals) {
    test(`Head Administrator real authentication: ${v.vertical} (${v.slug})`, async ({ request }) => {
      const email = process.env[v.emailEnv] || v.defaultEmail;
      const password = process.env[v.passEnv];

      expect(password).toBeTruthy();

      const loginRes = await request.post('/api/auth/login', {
        data: { email, password }
      });

      expect(loginRes.status()).toBe(200);
      const loginJson = await loginRes.json();
      expect(loginJson.success).toBe(true);
      expect(loginJson.user?.email).toBe(email);
      expect(loginJson.user?.tenantSlug).toBe(v.slug);
    });
  }

  test('Public admission application submission works for College vertical', async ({ request }) => {
    // 1. Fetch metadata
    const acRes = await request.get('/api/academics?tenantSlug=demo-college');
    expect(acRes.status()).toBe(200);
    const acJson = await acRes.json();

    const campusId = acJson.data?.campuses?.[0]?.id;
    const academicYearId = acJson.data?.academicYears?.[0]?.id;

    if (campusId && academicYearId) {
      const phone = `018${Math.floor(10000000 + Math.random() * 90000000)}`;
      const submitRes = await request.post('/api/admissions', {
        data: {
          action: 'APPLY',
          tenantSlug: 'demo-college',
          campusId,
          academicYearId,
          firstName: 'College',
          lastName: 'Candidate',
          phone,
          presentAddress: 'Chattogram',
          permanentAddress: 'Chattogram',
          guardianName: 'Guardian College',
          guardianPhone: phone,
          gender: 'Male',
          dateOfBirth: '2008-05-15'
        }
      });

      expect(submitRes.status()).toBe(201);
      const submitJson = await submitRes.json();
      expect(submitJson.success).toBe(true);
      expect(submitJson.data?.applicationNumber).toBeTruthy();
    }
  });

  test('Platform Super Admin password rotation verification - blocks invalid passwords', async ({ request }) => {
    const adminEmail = process.env.E2E_PLATFORM_ADMIN_EMAIL || 'admin@eduerp.us';
    
    // Attempt with dummy / invalid password
    const badLoginRes = await request.post('/api/auth/login', {
      data: { email: adminEmail, password: 'WrongInvalidPassword999!' }
    });
    expect(badLoginRes.status()).toBe(401);

    // Attempt with valid rotated password
    const validPass = process.env.E2E_PLATFORM_ADMIN_PASSWORD;
    expect(validPass).toBeTruthy();

    const goodLoginRes = await request.post('/api/auth/login', {
      data: { email: adminEmail, password: validPass }
    });
    expect(goodLoginRes.status()).toBe(200);
    const goodJson = await goodLoginRes.json();
    expect(goodJson.success).toBe(true);
  });
});
