# Venomin Integration Guide (Contract v1) — EduERP

## Overview
EduERP integrates natively with the **Venomin Master Commercial Platform** (`https://venomin.com`) using the standardized **Venomin Integration Contract v1**.

---

## 1. Authentication & Security Architecture

### Service-to-Service JWT
- **Issuer (`iss`)**: `https://venomin.com` or `https://walletmix.com`
- **Audience (`aud`)**: `eduerp.us`
- **TTL**: $\le 300\text{ seconds}$
- **Scopes**:
  - `eduerp:provision`: Provision new multi-tenant educational institution workspace.
  - `eduerp:read`: Status lookups and privacy-safe telemetry sync.
  - `eduerp:sso`: Single Sign-On token authorization.
  - `eduerp:suspend`: Non-destructive workspace suspension.
  - `eduerp:reactivate`: Workspace reactivation.

### Production Guard
- Configured via `ENABLE_PRODUCT_PRODUCTION_INTEGRATIONS="false"`.
- Requests with `environment: PRODUCTION` return `403 Forbidden` (`PRODUCTION_MODE_BLOCKED`).

---

## 2. API Endpoints

| Endpoint | Method | Required Scope | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/venomin/health` | `GET` | *Public / Header v1* | Reports health status, capabilities, and version. |
| `/api/venomin/provision` | `POST` | `eduerp:provision` | Provisions tenant, institution, main campus, academic year, vertical classes, and owner. |
| `/api/venomin/provision/[id]` | `GET` | `eduerp:read` | Status lookup for provisioning requests. |
| `/api/venomin/sso/exchange` | `POST` / `GET` | `eduerp:sso` | Validates SSO JWT, resolves `VenominIdentityLink`, sets `eduerp_session` cookie. |
| `/api/venomin/account` | `GET` | `eduerp:read` | Returns aggregate counts only (`campusesCount`, `studentsCount`, `teachersCount`, etc.). |
| `/api/venomin/suspend` | `POST` | `eduerp:suspend` | Non-destructively marks workspace as SUSPENDED. |
| `/api/venomin/reactivate` | `POST` | `eduerp:reactivate` | Restores workspace to ACTIVE state. |

---

## 3. Student & Minor Data Privacy

### Zero-PII Policy
The following data categories are strictly forbidden from being transmitted across the integration boundary or logged:
- Student names, student emails, student phone numbers, and student IDs.
- Parent and guardian contact information and names.
- Student birth dates and national ID / birth certificate numbers.
- Academic exam grades, marks, and official report cards.
- Daily attendance records and disciplinary files.
- Teacher and staff payroll / salary details.
- Fee transaction receipts and invoice itemizations.

### Telemetry Synchronization
The `/api/venomin/account` endpoint returns strictly operational aggregate counts:
- `campusesCount`
- `studentsCount`
- `teachersCount`
- `staffCount`
- `classesCount`
- `sectionsCount`
- `programsCount`
- `departmentsCount`
