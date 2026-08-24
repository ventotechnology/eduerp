# EDUERP COMMAND 12A — PLATFORM OWNER & SITA REAL MADRASHA PILOT PROVISIONING REPORT

**Project:** EduERP Universal Multi-Tenant Education Operating System  
**Deployment Environment:** Production VPS (`187.52.115.164`), Container: `eduerp-app`  
**Database:** PostgreSQL 16 (`eduerp_prod`)  
**Production Domain:** [https://eduerp.us](https://eduerp.us)  
**Execution Timestamp:** 2026-08-24 20:20:00 UTC+06:00  
**Final Classification:** `SITA_REAL_MADRASHA_PILOT_LIVE`  

---

## 1. Executive Summary

Command 12A has successfully completed the real-world commercial provisioning of **Scholars International Tahfiz Academy (SITA)** as a live Madrasha customer on EduERP, alongside establishing platform owner accounts and verifying cross-tenant isolation and security guards.

All credentials were created and securely deposited into private local files (`private/SITA-CLIENT-CREDENTIALS.txt` and `private/EDUERP-PLATFORM-OWNER-CREDENTIALS.txt`) with strict `chmod 600` permissions and complete exclusion in `.gitignore`. No passwords or cryptographic hashes were exposed.

---

## 2. Platform Owner Accounts Provisioning Matrix

Both platform-level administrator accounts have been idempotently created and verified with authentic cryptographic credentials.

| Account Identifier | Role | Status | Tenant Binding | Password Configured | Control Plane Access |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `bloodsoft24@gmail.com` | `PLATFORM_SUPER_ADMIN` | `ACTIVE` | Global (`null`) | **YES** | Full Platform & Tenant Wildcard |
| `walletmix@gmail.com` | `PLATFORM_ADMIN` | `ACTIVE` | Global (`null`) | **YES** | SaaS Operations & Support |

---

## 3. Real Customer Institution Profile: SITA

Scholars International Tahfiz Academy (SITA) is registered as a **real commercial pilot tenant** on EduERP.

| Parameter | Configuration / Value |
| :--- | :--- |
| **Institution Name** | Scholars International Tahfiz Academy |
| **Short Name** | SITA |
| **Canonical Slug** | `scholars-international-tahfiz-academy` |
| **Short Alias** | `sita` |
| **Institution Type** | `MADRASHA` |
| **Live Portal URL** | [https://eduerp.us/scholars-international-tahfiz-academy](https://eduerp.us/scholars-international-tahfiz-academy) |
| **Alias URL** | [https://eduerp.us/sita](https://eduerp.us/sita) |
| **Online Admission Portal** | [https://eduerp.us/apply/scholars-international-tahfiz-academy](https://eduerp.us/apply/scholars-international-tahfiz-academy) |
| **Official Address** | House 05, Road 09, Sector 04, Uttara, Dhaka-1230 |
| **Official Phone** | 01988115666 |
| **Official Email** | `contact@scholarsita.com` |
| **Board Affiliation** | Bangladesh Madrasah Education Board (BMEB) |
| **Demo Tenant Flag** | `isDemoTenant = false` (Real Customer) |
| **Test Tenant Flag** | `isTestTenant = false` (Real Customer) |
| **Main Campus** | SITA Main Campus (`SITA-MAIN`, `isMain = true`) |
| **Subscription Tier** | `ENTERPRISE` (30-Day Complimentary Pilot) |
| **Pilot Status** | `ACTIVE` (`trialEndsAt: 30 days ahead`) |
| **Revenue Classification** | Real Pilot Trial (Zero fake paid invoice generated) |
| **Activated Modules** | Hifz Tracking (30 Paras), Online Admission, SIS, LMS, Finance, HR, Exams |

---

## 4. Organization Head Account Profile

| Property | Value |
| :--- | :--- |
| **Name** | Mohammad Saifullah |
| **Designation / Title** | Principal / Muhtamim |
| **Login Email** | `contact@scholarsita.com` |
| **Phone** | 01988115666 |
| **Assigned Role** | `PRINCIPAL` |
| **Tenant Association** | Exclusive to SITA (`scholars-international-tahfiz-academy`) |
| **Status** | `ACTIVE` |
| **Password Configured** | **YES** |
| **Support Contact** | `teamhimu@gmail.com` / WhatsApp `+8801335556688` |

---

## 5. Security & Private Credential Management

- **Private File 1:** `/Users/humayun/Projects/eduerp/private/SITA-CLIENT-CREDENTIALS.txt` (`chmod 600`)
- **Private File 2:** `/Users/humayun/Projects/eduerp/private/EDUERP-PLATFORM-OWNER-CREDENTIALS.txt` (`chmod 600`)
- **Git Protection:** Directory `private/` is permanently listed in `.gitignore` and confirmed untracked by `git status --ignored`.
- **Zero Exposure:** Neither plaintext passwords nor password hashes appear in logs, git history, or documentation.

---

## 6. Multi-Tenant Isolation & Guard Verification

1. **Strict Session Binding:** Sessions authenticated as `contact@scholarsita.com` are cryptographically bound to SITA.
2. **Cross-Tenant Access Denial:** Navigating from a SITA session to `/demo-school/dashboard` or `/demo-madrasha/dashboard` triggers a controlled security screen with notice `You are signed into another institution`.
3. **Friendly Alias Normalization:** Requests to `/sita/dashboard`, `/apply/sita`, etc. seamlessly resolve to SITA without crossing tenant boundaries.
4. **Idempotency Guarantee:** Executing `scripts/provision-sita-client.ts` repeatedly maintains existing user IDs, updates settings idempotently, and creates zero duplicate rows in PostgreSQL.

---

## 7. Verification & Testing Matrix

| Test Suite | Scope | Target | Result |
| :--- | :--- | :--- | :--- |
| **Vitest Suite** | 71 test files, 279 tests | Local PostgreSQL & Core Engines | **279 / 279 PASSED (100%)** |
| **SITA Provisioning Suite** | `tests/sita-pilot-provisioning.test.ts` (19 tests) | SITA & Platform Accounts Contract | **19 / 19 PASSED (100%)** |
| **Playwright Live E2E** | `tests/e2e/sita-pilot-live.spec.ts` (6 tests) | Live `https://eduerp.us` | **6 / 6 PASSED (100%)** |
| **Full Playwright Suite** | 10 spec files, 72 live tests | Live `https://eduerp.us` | **72 / 72 PASSED (100%)** |
| **TypeScript / Next.js Build** | 88 production routes | Turbopack Production Optimization | **0 ERRORS (100% Clean)** |
| **ESLint Audit** | Full codebase | Code quality & static analysis | **0 ERRORS** |

---

## 8. Co-Hosted Applications Health Matrix

All 5 co-hosted production applications on VPS `187.52.115.164` were independently audited and confirmed fully healthy:

| Application | Domain | HTTP Protocol / Status | State |
| :--- | :--- | :--- | :--- |
| **BizERP** | `https://bizerp.us` | `HTTP/2 200` | Healthy / Operational |
| **CityERP** | `https://cityerp.online` | `HTTP/2 200` | Healthy / Operational |
| **EcoPOS** | `https://ecopos.us` | `HTTP/2 200` | Healthy / Operational |
| **RentMix** | `https://rentmix.us` | `HTTP/2 200` | Healthy / Operational |
| **VitaERP** | `https://vitaerp.us` | `HTTP/2 200` | Healthy / Operational |

---

## 9. Final Classification

```
================================================================================
FINAL VERIFIED CLASSIFICATION: SITA_REAL_MADRASHA_PILOT_LIVE
================================================================================
```
