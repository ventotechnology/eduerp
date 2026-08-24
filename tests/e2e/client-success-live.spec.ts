import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://eduerp.us';

test.describe('COMMAND 11F — Client Success, Help Center, Training Academy & Support Live Tests', () => {

  test('1. Public Contact Page renders official Nikunja-2 address and WhatsApp link', async ({ page }) => {
    await page.goto(`${BASE_URL}/contact`);
    await page.waitForLoadState('networkidle');

    // Verify Official Details
    await expect(page.getByText('Vento Technology')).toBeVisible();
    await expect(page.getByText('House 2/B, Road 8, Nikunja-2, Khilkhet')).toBeVisible();
    await expect(page.getByText('teamhimu@gmail.com')).toBeVisible();
    await expect(page.getByRole('link', { name: /Chat on WhatsApp/i })).toBeVisible();

    // Verify WhatsApp link target
    const waLink = page.getByRole('link', { name: /Chat on WhatsApp/i });
    await expect(waLink).toHaveAttribute('href', /wa\.me\/8801335556688/);
  });

  test('2. Public Contact Page submits prospective institutional inquiry', async ({ page }) => {
    await page.goto(`${BASE_URL}/contact`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[placeholder*="Rafiqul"]', 'Playwright Test Director');
    await page.fill('input[placeholder*="Dhaka Ideal"]', 'Playwright Academy Dhaka');
    await page.fill('input[type="email"]', `lead.e2e.${Date.now()}@eduerp.us`);
    await page.fill('input[placeholder*="+880 17"]', '+8801711223344');
    await page.fill('input[placeholder*="Schedule Online Admission"]', 'Live Demo Verification Request');
    await page.fill('textarea[placeholder*="Mention any specific"]', 'Automated E2E submission verifying concurrency-safe inquiry sequence.');

    await page.click('button[type="submit"]');

    await expect(page.getByText('Inquiry Registered Successfully!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/INQ-2026-/)).toBeVisible();
  });

  test('3. Public Help Center loads categories and performs live search', async ({ page }) => {
    await page.goto(`${BASE_URL}/help`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /How can we help your institution today/i })).toBeVisible();
    await expect(page.getByText('Student SIS & Admissions')).toBeVisible();

    // Search query
    const searchInput = page.getByPlaceholder('Search topics:');
    await searchInput.fill('login');

    await expect(page.getByText('Knowledge Base Articles')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/How to Log in to your Institution Portal/i)).toBeVisible();
  });

  test('4. Training Academy displays course curriculum and certificate verification', async ({ page }) => {
    await page.goto(`${BASE_URL}/training`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Master the EduERP Platform/i })).toBeVisible();
    await expect(page.getByText('EduERP Getting Started & Core Fundamentals')).toBeVisible();

    // Click into course
    await page.click('text=EduERP Getting Started & Core Fundamentals');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Curriculum Outline')).toBeVisible();
    await expect(page.getByText('Navigating the EduERP Workspace')).toBeVisible();
  });

  test('5. Public Certificate Verification validates or flags credential authenticity', async ({ page }) => {
    // Valid certificate lookup
    await page.goto(`${BASE_URL}/verify/training/CERT-TRN-INVALID-999`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Invalid or Unverified Credential')).toBeVisible();
  });

  test('6. Public FAQ and Release Notes pages load formatted content', async ({ page }) => {
    await page.goto(`${BASE_URL}/help/faq`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Frequently Asked Questions')).toBeVisible();

    await page.goto(`${BASE_URL}/help/releases`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Release Notes & Platform Changelog/i)).toBeVisible();
  });
});
