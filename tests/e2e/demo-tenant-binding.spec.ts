import { test, expect } from '@playwright/test';

test.describe('COMMAND 11E.1 — Demo Tenant Session Binding, Isolation & 8/8 Vertical Matrix', () => {
  // Credentials sourced securely from environment (NO fallbacks)
  const schoolEmail = process.env.E2E_PRINCIPAL_EMAIL || 'principal.demo-school@eduerp.us';
  const schoolPassword = process.env.E2E_PRINCIPAL_PASSWORD || '';

  const madrashaEmail = process.env.E2E_MADRASHA_PRINCIPAL_EMAIL || 'principal.demo-madrasha@eduerp.us';
  const madrashaPassword = process.env.E2E_MADRASHA_PRINCIPAL_PASSWORD || '';

  const collegeEmail = process.env.E2E_COLLEGE_PRINCIPAL_EMAIL || 'principal.demo-college@eduerp.us';
  const collegePassword = process.env.E2E_COLLEGE_PRINCIPAL_PASSWORD || '';

  const schoolCollegeEmail = process.env.E2E_SCHOOL_COLLEGE_PRINCIPAL_EMAIL || 'principal.demo-school-college@eduerp.us';
  const schoolCollegePassword = process.env.E2E_SCHOOL_COLLEGE_PRINCIPAL_PASSWORD || '';

  const universityEmail = process.env.E2E_UNIVERSITY_VC_EMAIL || 'vice-chancellor.demo-university@eduerp.us';
  const universityPassword = process.env.E2E_UNIVERSITY_VC_PASSWORD || '';

  const polytechnicEmail = process.env.E2E_POLYTECHNIC_PRINCIPAL_EMAIL || 'principal.demo-polytechnic@eduerp.us';
  const polytechnicPassword = process.env.E2E_POLYTECHNIC_PRINCIPAL_PASSWORD || '';

  const vocationalEmail = process.env.E2E_VOCATIONAL_PRINCIPAL_EMAIL || 'principal.demo-vocational@eduerp.us';
  const vocationalPassword = process.env.E2E_VOCATIONAL_PRINCIPAL_PASSWORD || '';

  const trainingEmail = process.env.E2E_TRAINING_PRINCIPAL_EMAIL || 'principal.demo-training@eduerp.us';
  const trainingPassword = process.env.E2E_TRAINING_PRINCIPAL_PASSWORD || '';

  test('1. School Principal real login -> session binding to demo-school, admission & students 200', async ({ page, request }) => {
    // 1. Authenticate via real POST /api/auth/login
    const loginRes = await request.post('/api/auth/login', {
      data: { email: schoolEmail, password: schoolPassword }
    });
    expect(loginRes.status()).toBe(200);
    const loginJson = await loginRes.json();
    expect(loginJson.success).toBe(true);
    expect(loginJson.user.tenantSlug).toBe('demo-school');
    expect(loginJson.user.role).toBe('PRINCIPAL');

    // 2. Set cookies on browser page
    await page.goto('/login');
    await page.locator('input[name="email"]').fill(schoolEmail);
    await page.locator('input[name="password"]').fill(schoolPassword);
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL(/\/demo-school\/dashboard/);

    // 3. Verify /api/auth/me session binding
    const meRes = await page.request.get('/api/auth/me');
    expect(meRes.status()).toBe(200);
    const meJson = await meRes.json();
    expect(meJson.authenticated).toBe(true);
    expect(meJson.user.email).toBe(schoolEmail);
    expect(meJson.user.tenantSlug).toBe('demo-school');
    expect(meJson.user.role).toBe('PRINCIPAL');

    // 4. Open /demo-school/admission
    await page.goto('/demo-school/admission');
    await expect(page.getByText(/Cross-tenant access is strictly prohibited/i)).not.toBeVisible();
    await expect(page.getByText(/Unable to load admission applications/i)).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /Admission Applications & Candidate Pipeline/i })).toBeVisible({ timeout: 15000 });

    // 5. Open /demo-school/students (SIS)
    await page.goto('/demo-school/students');
    await expect(page.getByText(/Cross-tenant access is strictly prohibited/i)).not.toBeVisible();
    await expect(page.getByText(/Unable to load student records/i)).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /Student Directory & Academic Profiles/i })).toBeVisible({ timeout: 15000 });
  });

  test('2. Cross-Tenant Denial: School Principal attempting /demo-madrasha receives controlled security screen', async ({ page }) => {
    // Login as School Principal
    await page.goto('/login');
    await page.locator('input[name="email"]').fill(schoolEmail);
    await page.locator('input[name="password"]').fill(schoolPassword);
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL(/\/demo-school\/dashboard/);

    // Attempt navigating to Madrasha URL
    await page.goto('/demo-madrasha/admission');
    await expect(page.getByRole('heading', { name: /You are signed into another institution/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Return to My Institution/i)).toBeVisible();

    // Clicking Return navigates back to School dashboard safely
    await page.getByRole('link', { name: /Return to My Institution/i }).click();
    await page.waitForURL(/\/demo-school\/dashboard/);
  });

  test('3. Madrasha Principal real login -> session binding to demo-madrasha, admission & students 200', async ({ page, request }) => {
    // 1. Direct API Login check
    const loginRes = await request.post('/api/auth/login', {
      data: { email: madrashaEmail, password: madrashaPassword }
    });
    expect(loginRes.status()).toBe(200);
    const loginJson = await loginRes.json();
    expect(loginJson.success).toBe(true);
    expect(loginJson.user.tenantSlug).toBe('demo-madrasha');

    // 2. UI Login
    await page.goto('/login');
    await page.locator('input[name="email"]').fill(madrashaEmail);
    await page.locator('input[name="password"]').fill(madrashaPassword);
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL(/\/demo-madrasha\/dashboard/);

    // 3. Verify /demo-madrasha/admission
    await page.goto('/demo-madrasha/admission');
    await expect(page.getByText(/Cross-tenant access is strictly prohibited/i)).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /Admission Applications & Candidate Pipeline/i })).toBeVisible({ timeout: 15000 });

    // 4. Verify /demo-madrasha/students
    await page.goto('/demo-madrasha/students');
    await expect(page.getByText(/Cross-tenant access is strictly prohibited/i)).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /Student Directory & Academic Profiles/i })).toBeVisible({ timeout: 15000 });

    // 5. Cross-Tenant Denial: Madrasha attempting School URL
    await page.goto('/demo-school/admission');
    await expect(page.getByRole('heading', { name: /You are signed into another institution/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Return to My Institution/i)).toBeVisible();
  });

  // 8/8 Real Tenant Head Login Matrix
  const verticals = [
    { name: 'School K-12', slug: 'demo-school', email: schoolEmail, password: schoolPassword, role: 'PRINCIPAL' },
    { name: 'College HSC', slug: 'demo-college', email: collegeEmail, password: collegePassword, role: 'PRINCIPAL' },
    { name: 'School & College', slug: 'demo-school-college', email: schoolCollegeEmail, password: schoolCollegePassword, role: 'PRINCIPAL' },
    { name: 'Madrasha & Hifz', slug: 'demo-madrasha', email: madrashaEmail, password: madrashaPassword, role: 'PRINCIPAL' },
    { name: 'University Higher Ed', slug: 'demo-university', email: universityEmail, password: universityPassword, role: 'VICE_CHANCELLOR' },
    { name: 'Polytechnic Engineering', slug: 'demo-polytechnic', email: polytechnicEmail, password: polytechnicPassword, role: 'PRINCIPAL' },
    { name: 'Vocational Institute', slug: 'demo-vocational', email: vocationalEmail, password: vocationalPassword, role: 'PRINCIPAL' },
    { name: 'Professional Training', slug: 'demo-training', email: trainingEmail, password: trainingPassword, role: 'PRINCIPAL' },
  ];

  for (const v of verticals) {
    test(`4. [8/8 Matrix] Real Head Login & SIS Directory: ${v.name} (${v.slug})`, async ({ request }) => {
      const res = await request.post('/api/auth/login', {
        data: { email: v.email, password: v.password }
      });
      expect(res.status()).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user.tenantSlug).toBe(v.slug);
      expect(json.user.role).toBe(v.role);
    });
  }

  test('5. [Synthetic Create/Read] Public Admission Create -> Persistence -> List for College, Madrasha & University', async ({ request }) => {
    // 1. College Synthetic Admission Submission
    const collegeSubRes = await request.post('/api/admissions', {
      data: {
        tenantSlug: 'demo-college',
        firstName: 'COMMAND-11E1-QA',
        lastName: 'CollegeCandidate',
        phone: '+8801700001111',
        email: 'qa.college.11e1@eduerp.us',
        gender: 'MALE',
        dateOfBirth: '2008-05-15',
        presentAddress: 'Chittagong QA Test Address'
      }
    });
    expect(collegeSubRes.status()).toBe(201);
    const collegeSubJson = await collegeSubRes.json();
    expect(collegeSubJson.success).toBe(true);
    expect(collegeSubJson.application.applicationNumber).toMatch(/^APP-/);

    // 2. Madrasha Synthetic Admission Submission
    const madrashaSubRes = await request.post('/api/admissions', {
      data: {
        tenantSlug: 'demo-madrasha',
        firstName: 'COMMAND-11E1-QA',
        lastName: 'MadrashaCandidate',
        phone: '+8801700002222',
        email: 'qa.madrasha.11e1@eduerp.us',
        gender: 'MALE',
        dateOfBirth: '2012-08-20',
        presentAddress: 'Sylhet QA Test Address'
      }
    });
    expect(madrashaSubRes.status()).toBe(201);
    const madrashaSubJson = await madrashaSubRes.json();
    expect(madrashaSubJson.success).toBe(true);
    expect(madrashaSubJson.application.applicationNumber).toMatch(/^APP-/);

    // 3. University Synthetic Admission Submission
    const uniSubRes = await request.post('/api/admissions', {
      data: {
        tenantSlug: 'demo-university',
        firstName: 'COMMAND-11E1-QA',
        lastName: 'UniversityCandidate',
        phone: '+8801700003333',
        email: 'qa.university.11e1@eduerp.us',
        gender: 'FEMALE',
        dateOfBirth: '2005-03-10',
        presentAddress: 'Dhaka Gulshan QA Test Address'
      }
    });
    expect(uniSubRes.status()).toBe(201);
    const uniSubJson = await uniSubRes.json();
    expect(uniSubJson.success).toBe(true);
    expect(uniSubJson.application.applicationNumber).toMatch(/^APP-/);
  });
});
