# EDUERP-COMMAND-12A3-INSTITUTION-OWNER-ACADEMIC-SUBSCRIPTION-SEAL.md

**SEAL CERTIFICATION**: COMPLETE & FULLY VERIFIED ON PRODUCTION  
**COMMAND**: COMMAND 12A.3 — Real Institution Owner Control Center, Academic Setup, Profile/Logout, Subscription Self-Service, bKash Upgrade/Downgrade & Offline Payment Verification  
**TARGET CUSTOMER**: Scholars International Tahfiz Academy (SITA) (`contact@scholarsita.com` / `Mohammad Saifullah`)  
**ENVIRONMENT**: Production (`https://eduerp.us`, VPS: `187.52.115.164`, PostgreSQL 16 `eduerp_prod`)  
**TIMESTAMP**: 2026-08-24T21:52:00+06:00  

---

## 1. Executive Summary & Capabilities Unlocked

A real institution Principal or Owner (such as **Mohammad Saifullah** for **Scholars International Tahfiz Academy**) now possesses a complete, standalone, self-service operational cockpit. **No manual database edits or developer interventions are needed** for day-to-day management or commercial subscription upgrades.

### Key Capabilities Verified:
1. **Academic Structure Configuration**:
   - Create, edit, delete, and set current Academic Years (e.g. `2026`).
   - Create, edit, delete Classes/Levels/Programs (e.g. `Hifz Beginner`, `Nazera`, `Dakhil 6`).
   - Create, edit, delete Sections (`Section A`, `Section B`) and assign Class Teachers.
   - Create, edit, delete Subjects & Curriculum (`Quran Mazid & Tajweed`, `Hadith Sharif`, `Fiqh`, `Arabic Language`, `Bangla Literature`, `English Language`, `General Mathematics`).
   - Configure weekly Timetable Routine slots and periods.
   - 1-Click **Madrasha Starter Academic Structure Template Engine** provisions complete Madrasha structure cleanly without creating fake students or mock attendance records.
2. **Admission Wizard Dynamic Dropdowns**:
   - Fixed empty Academic Year and Class dropdowns in Step 3 of the Admission Wizard.
   - Automatically detects empty academic structure and presents intuitive quick-creation modals directly inside the wizard with auto-selection.
3. **User Profile & Security**:
   - Tenant header user menu displays active Principal name, role, active campus, and direct links to Profile, Security, Billing, and Logout.
   - Self-service profile updates via `/api/auth/profile` with audit logging.
   - Password change with length/confirmation validation and current password verification.
4. **Subscription Self-Service & Plan Comparison**:
   - Visual 4-Plan Comparison Matrix (`Starter`, `Standard`, `Professional`, `Enterprise`) loaded directly from database pricing.
   - Monthly vs Annual billing toggle with 15% annual savings.
   - **Downgrade Usage Guard**: Blocks downgrade attempts if active student count exceeds target plan capacity.
   - **bKash Checkout**: Server-side checkout initiation.
   - **Offline Bank Transfer**: Submits deposit proof with status `SUBMITTED` / `PENDING_REVIEW` without auto-activation.
5. **Platform Super Admin Payment Verification Queue**:
   - `/super-admin/orders` allows Super Admins to verify bank transfers, trigger atomic subscription fulfillment, or reject with stated reasons.

---

## 2. Test Execution & Verification Evidence

### Local Vitest Suite:
- **74 test files passed** (100%)
- **309 total tests passed**
- Dedicated test file: `tests/sita-owner-control.test.ts` (12/12 passing)

### Live Production Playwright E2E Suite (`https://eduerp.us`):
- `tests/e2e/sita-owner-control.spec.ts`: **7 / 7 tests passed** (44.4s)
  1. *SITA canonical root & alias route to public CMS website for anonymous visitors* (PASSED)
  2. *SITA Principal login & institutional header authentication* (PASSED)
  3. *SITA Academics Configuration & Setup Center* (PASSED)
  4. *SITA Admission Desk & Application Wizard Dropdowns* (PASSED)
  5. *SITA Settings, Profile & Security Tabs* (PASSED)
  6. *SITA Subscription Self-Service & 4-Plan Comparison* (PASSED)
  7. *Super Admin SaaS Orders & Revenue Billing Verification Queue* (PASSED)
- `tests/e2e/sita-pilot-live.spec.ts`: **10 / 10 regression tests passed** (32.5s)

### Compilation & Build Verification:
- Next.js Turbopack build: **91 production routes compiled with 0 errors**
- ESLint: **0 errors, 0 warnings**
- TypeScript (`npx tsc --noEmit`): **0 errors**

### Production Infrastructure & Multi-Tenant Safety:
- Pre-deployment backup on VPS `187.52.115.164`: `/opt/backups/eduerp/pre-command-12a3-20260824_154544.sql.gz` (134K)
- Zero data loss: All production tables and SITA tenant records intact.
- Co-hosted applications verified healthy:
  - `bizerp-app` (Up & healthy)
  - `cityerp-app` (Up & healthy)
  - `ecopos-app` (Up & healthy)
  - `rentmix-app` (Up & healthy)
  - `vitaerp-staging-app` (Up & healthy)

---

## 3. Git Commit Record

```
commit fbc6321
Author: Antigravity AI <dev@ventotechnology.com>
Date:   Mon Aug 24 21:45:07 2026 +0600

    feat(owner-control): implement real institution owner control center, academic setup, profile/security, subscription self-service, downgrade guard & offline payment verification
```
