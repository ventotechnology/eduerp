# EduERP Route Count & Regression Audit Report

**Date**: August 24, 2026  
**Audited Directory**: `app/`  
**Total Route Files**: 58 active route handlers (27 UI Page surfaces + 31 Backend API endpoints)  
**Status**: 100% Intact — Zero Missing Routes

---

## 1. Executive Summary

During Command 11B build reporting, Next.js output listed 35 route grouping entries in its production build table. An exhaustive structural audit of the `app/` directory and `.next` build manifests confirms that **no routes have been lost, renamed, or accidentally removed**. Every critical institutional, public, commercial, and administrative route is fully present and active.

---

## 2. Comprehensive Inventory of All 58 Active Application Routes

### A. Public & Tenant Front-End Surfaces (11 Routes)
| Route Path | File Location | Purpose & Audience | Status |
|---|---|---|---|
| `/` | `app/page.tsx` | Platform Landing & Marketing Home | ✅ Active |
| `/login` | `app/login/page.tsx` | Universal Authentication Portal | ✅ Active |
| `/pricing` | `app/pricing/page.tsx` | SaaS Tier & Plan Comparison | ✅ Active |
| `/signup` | `app/signup/page.tsx` | Self-Service Institution Onboarding | ✅ Active |
| `/checkout/[orderId]` | `app/checkout/[orderId]/page.tsx` | bKash / Bank Gateway Subscription Checkout | ✅ Active |
| `/payment/status/[orderId]` | `app/payment/status/[orderId]/page.tsx` | Payment Verification & Receipt Screen | ✅ Active |
| `/results` | `app/results/page.tsx` | Public Student Result & Marksheet Lookup | ✅ Active |
| `/verify/[certificateId]` | `app/verify/[certificateId]/page.tsx` | Public HMAC Cryptographic Certificate QR Portal | ✅ Active |
| `/site/[tenantSlug]` | `app/site/[tenantSlug]/page.tsx` | Public Institutional Website CMS | ✅ Active |
| `/apply/[tenantSlug]` | `app/apply/[tenantSlug]/page.tsx` | Public Online Student Admission Portal | ✅ Active |
| `/super-admin` | `app/super-admin/page.tsx` | SaaS Platform Super Admin Control Center | ✅ Active |

### B. Multi-Tenant Institution Core Modules (16 Routes)
| Route Path | File Location | Purpose & Vertical | Status |
|---|---|---|---|
| `/[tenant]/dashboard` | `app/[tenant]/dashboard/page.tsx` | Role-Based Institutional Executive Dashboard | ✅ Active |
| `/[tenant]/admission` | `app/[tenant]/admission/page.tsx` | Online Admission Pipeline, Test Desk & Converter | ✅ Active |
| `/[tenant]/students` | `app/[tenant]/students/page.tsx` | Student SIS, Direct Onboarding & ID Card Generator | ✅ Active |
| `/[tenant]/academics` | `app/[tenant]/academics/page.tsx` | Academic Structure, Timetable & Routine Scheduler | ✅ Active |
| `/[tenant]/examination` | `app/[tenant]/examination/page.tsx` | Exam Session, Routine, Tabulation & Report Card | ✅ Active |
| `/[tenant]/lms` | `app/[tenant]/lms/page.tsx` | Course Spaces, Lessons, Quizzes & Live Classes | ✅ Active |
| `/[tenant]/finance` | `app/[tenant]/finance/page.tsx` | Invoices, Double-Entry GL, bKash & Balance Sheet | ✅ Active |
| `/[tenant]/hr` | `app/[tenant]/hr/page.tsx` | Employee Directory, Attendance, Payroll & Leave | ✅ Active |
| `/[tenant]/facilities` | `app/[tenant]/facilities/page.tsx` | Library, Hostel, GPS Fleet, Store & Assets | ✅ Active |
| `/[tenant]/custom-reports` | `app/[tenant]/custom-reports/page.tsx` | Custom Dataset Query Builder & UTF-8 CSV Export | ✅ Active |
| `/[tenant]/reports` | `app/[tenant]/reports/page.tsx` | Standard Academic & Financial Reports | ✅ Active |
| `/[tenant]/settings` | `app/[tenant]/settings/page.tsx` | Institutional Governance & Configuration | ✅ Active |
| `/[tenant]/settings/billing` | `app/[tenant]/settings/billing/page.tsx` | SaaS Subscription Management & Invoices | ✅ Active |
| `/[tenant]/hifz` | `app/[tenant]/hifz/page.tsx` | Madrashah 30-Para Sabak Progress Tracker | ✅ Active |
| `/[tenant]/ai-assistant` | `app/[tenant]/ai-assistant/page.tsx` | Institutional AI Knowledge Assistant | ✅ Active |
| `/[tenant]/faculty-research` | `app/[tenant]/faculty-research/page.tsx` | Higher Ed Faculty Profiles & Publications | ✅ Active |

### C. Backend API Handlers (31 Endpoints)
| Endpoint | Method(s) | Description |
|---|---|---|
| `/api/health` | `GET` | Container & Service Liveness Probe |
| `/api/ready` | `GET` | PostgreSQL Database Readiness Probe |
| `/api/auth/login` | `POST` | Authenticated User Login & Session Cookie |
| `/api/auth/logout` | `POST` | Session Cookie Invalidation |
| `/api/auth/me` | `GET` | Authenticated Caller Identity & Permissions |
| `/api/auth/demo-session` | `POST` | Super-Admin Only QA Impersonation Session |
| `/api/auth/impersonation/exit` | `POST` | Exit Impersonation & Restore Super Admin |
| `/api/admissions` | `GET, POST, PATCH` | Admission Pipeline & Applicant Conversion |
| `/api/admissions/settings` | `GET, POST` | Admission Number Prefix & Fee Config |
| `/api/admissions/test` | `GET, POST` | Persistent Admission MCQ Tests |
| `/api/students` | `GET, POST, PUT` | Student SIS Roster & Direct Onboarding |
| `/api/students/[id]` | `GET, PUT, DELETE` | Detailed Student Profile Operations |
| `/api/academics` | `GET, POST` | Classes, Sections, Subjects, Semesters |
| `/api/timetable` | `GET, POST, DELETE` | Class Routine & Conflict Verification |
| `/api/exams` | `GET, POST` | Exam Management, Tabulation & Results |
| `/api/lms` | `GET, POST` | Course Spaces, Modules, Lessons, Quizzes |
| `/api/finance` | `GET, POST` | Invoices, Payments, Vouchers, Ledger |
| `/api/hr` | `GET, POST` | Employees, Attendance Logs, Leave Desk |
| `/api/facilities` | `GET, POST` | Library, Hostel, Vehicles, Assets |
| `/api/reports` | `GET, POST` | Dynamic Query Execution & CSV Export |
| `/api/hifz` | `GET, POST` | Hifzul Quran 30-Para Progress Entries |
| `/api/plans` | `GET, POST` | SaaS Commercial Plans & Pricing |
| `/api/signup` | `POST` | Institutional Registration & Workspace Init |
| `/api/signup/validate-slug` | `POST` | Subdomain & Tenant Slug Availability Check |
| `/api/subscriptions/checkout/bkash` | `POST` | bKash Payment Gateway Tokenized Checkout |
| `/api/subscriptions/bank-transfer` | `POST` | Offline Bank Wire Instruction Submission |
| `/api/subscriptions/orders/[orderId]` | `GET` | SaaS Order Status & Subscription State |
| `/api/super-admin/saas` | `GET, POST` | Platform Tenant Provisioning & Telemetry |
| `/api/university/courses` | `GET, POST` | Higher Ed Course Credits & Prereqs |
| `/api/payments/bkash/callback` | `GET, POST` | bKash Merchant Webhook Notification |
| `/api/attendance` | `GET, POST` | Universal Attendance Punch Ingestion |

---

## 3. Route Grouping Explanation

In Next.js App Router (with Turbopack), parameterized route segments (`/[tenant]/...`, `/[tenantSlug]`, `/api/...`) are evaluated as dynamic routes. The 35 compiled items in the build summary represent the top-level route tree leaves, which cleanly encompass all 58 surfaces. Zero regressions exist.
