# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: saas-control-plane-and-public.spec.ts >> COMMAND 11D — SaaS Control Plane, Public Pages & Vertical Admissions >> 4. Super Admin SaaS Control Plane authentication & navigation
- Location: tests/e2e/saas-control-plane-and-public.spec.ts:54:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByPlaceholder(/name@institution.edu.bd/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - link [ref=e6] [cursor=pointer]:
        - /url: /
      - heading "Sign In to EduERP" [level=2] [ref=e10]
      - paragraph [ref=e11]: The Universal Operating System for Education Institutions
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]:
          - generic [ref=e15]:
            - generic [ref=e16]: Official Email / Username
            - textbox "Official Email / Username" [ref=e18]:
              - /placeholder: e.g. principal.demo-school@eduerp.us
          - generic [ref=e19]:
            - generic [ref=e20]: Password
            - generic [ref=e21]:
              - textbox "Password" [ref=e22]:
                - /placeholder: ••••••••••••
              - button [ref=e23]
          - generic [ref=e27]:
            - generic [ref=e28]: Institution Domain / Tenant Slug (Optional)
            - textbox "Institution Domain / Tenant Slug (Optional)" [ref=e30]:
              - /placeholder: e.g. demo-school or demo-university
          - button "Sign In Securely" [ref=e31]
        - paragraph [ref=e36]: Need assistance? Contact your institution IT administrator or platform support.
      - link "← Return to EduERP Landing Page" [ref=e38] [cursor=pointer]:
        - /url: /
  - alert [ref=e40]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('COMMAND 11D — SaaS Control Plane, Public Pages & Vertical Admissions', () => {
  4   |   const saEmail = process.env.E2E_PLATFORM_ADMIN_EMAIL || 'platform-super-admin@eduerp.us';
  5   |   const saPassword = process.env.E2E_PLATFORM_ADMIN_PASSWORD || 'fq9AHAoMhP2HLH+*eV-V-b7J!8';
  6   | 
  7   |   test('1. Public Homepage loads cleanly without demo switcher bar', async ({ page }) => {
  8   |     await page.goto('/');
  9   |     await expect(page).toHaveTitle(/EduERP/);
  10  | 
  11  |     // Verify Demo Switcher is NOT rendered
  12  |     const demoSwitcher = page.locator('aside[aria-label="Interactive Demo Switcher"]');
  13  |     await expect(demoSwitcher).not.toBeVisible();
  14  | 
  15  |     // Verify navigation links
  16  |     const pricingLink = page.getByRole('link', { name: /Pricing/i }).first();
  17  |     await expect(pricingLink).toBeVisible();
  18  | 
  19  |     const demoLink = page.getByRole('link', { name: /Demo Showroom|Explore 8 Vertical Demos/i }).first();
  20  |     await expect(demoLink).toBeVisible();
  21  |   });
  22  | 
  23  |   test('2. Public Demo Showroom (/demo) renders all 8 vertical engines', async ({ page }) => {
  24  |     await page.goto('/demo');
  25  |     await expect(page.getByRole('heading', { name: /Explore EduERP Across 8 Specialized Educational Verticals/i })).toBeVisible();
  26  | 
  27  |     // Verify the 8 verticals
  28  |     await expect(page.getByText('Dhaka Ideal Model School')).toBeVisible();
  29  |     await expect(page.getByText('Chittagong Model College')).toBeVisible();
  30  |     await expect(page.getByText('Rajshahi Model School & College')).toBeVisible();
  31  |     await expect(page.getByText('Darul Uloom Islamia Madrasha')).toBeVisible();
  32  |     await expect(page.getByText('Metropolitan University Bangladesh')).toBeVisible();
  33  |     await expect(page.getByText('Dhaka Polytechnic Institute')).toBeVisible();
  34  |     await expect(page.getByText('Bangladesh Technical Vocational Academy')).toBeVisible();
  35  |     await expect(page.getByText('National Institute of Professional Training')).toBeVisible();
  36  |   });
  37  | 
  38  |   test('3. Public Legal Pages (/privacy, /terms, /contact) load correctly', async ({ page }) => {
  39  |     // Privacy
  40  |     await page.goto('/privacy');
  41  |     await expect(page.getByRole('heading', { name: /Privacy Policy & Student Data Protection/i })).toBeVisible();
  42  |     await expect(page.getByText('Zero Commercial Monetization of Student Data')).toBeVisible();
  43  | 
  44  |     // Terms
  45  |     await page.goto('/terms');
  46  |     await expect(page.getByRole('heading', { name: /Terms of Service & Master Subscription Agreement/i })).toBeVisible();
  47  | 
  48  |     // Contact
  49  |     await page.goto('/contact');
  50  |     await expect(page.getByRole('heading', { name: /Let's Transform Your Institution's Digital Operations/i })).toBeVisible();
  51  |     await expect(page.getByPlaceholder(/Describe student capacity/i)).toBeVisible();
  52  |   });
  53  | 
  54  |   test('4. Super Admin SaaS Control Plane authentication & navigation', async ({ page }) => {
  55  |     // Attempt visiting /super-admin without auth should redirect to /login
  56  |     await page.goto('/super-admin');
  57  |     await page.waitForURL(/\/login/);
  58  | 
  59  |     // Login as Super Admin
> 60  |     await page.getByPlaceholder(/name@institution.edu.bd/i).fill(saEmail);
      |                                                             ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  61  |     await page.getByPlaceholder(/••••••••/i).fill(saPassword);
  62  |     await page.getByRole('button', { name: /Sign in to EduERP OS/i }).click();
  63  | 
  64  |     // Wait for Super Admin Overview
  65  |     await page.waitForURL(/\/super-admin/);
  66  |     await expect(page.getByRole('heading', { name: /SaaS Platform Overview/i })).toBeVisible();
  67  | 
  68  |     // Visit Institutions page
  69  |     await page.goto('/super-admin/institutions');
  70  |     await expect(page.getByRole('heading', { name: /Institution Tenants/i })).toBeVisible();
  71  |     await expect(page.getByRole('button', { name: /\+ Create Institution/i })).toBeVisible();
  72  | 
  73  |     // Visit Plans & Pricing page
  74  |     await page.goto('/super-admin/plans');
  75  |     await expect(page.getByRole('heading', { name: /SaaS Plans & Pricing Matrix/i })).toBeVisible();
  76  |     await expect(page.getByRole('button', { name: /\+ Create Plan/i })).toBeVisible();
  77  | 
  78  |     // Visit Payment Gateways page
  79  |     await page.goto('/super-admin/gateways');
  80  |     await expect(page.getByRole('heading', { name: /Payment Gateways & bKash Integration/i })).toBeVisible();
  81  |     await expect(page.getByText('bKash Production Checkout Engine')).toBeVisible();
  82  | 
  83  |     // Visit Demo Credentials Vault
  84  |     await page.goto('/super-admin/demo-credentials');
  85  |     await expect(page.getByRole('heading', { name: /Client Demo Credential Vault/i })).toBeVisible();
  86  |   });
  87  | 
  88  |   test('5. Public Admissions on multiple vertical engines load without error', async ({ page }) => {
  89  |     // School admission
  90  |     await page.goto('/demo-school/admission');
  91  |     await expect(page.getByText(/Admission/i).first()).toBeVisible();
  92  | 
  93  |     // College admission
  94  |     await page.goto('/demo-college/admission');
  95  |     await expect(page.getByText(/Admission/i).first()).toBeVisible();
  96  | 
  97  |     // Madrasha admission
  98  |     await page.goto('/demo-madrasha/admission');
  99  |     await expect(page.getByText(/Admission/i).first()).toBeVisible();
  100 |   });
  101 | });
  102 | 
```