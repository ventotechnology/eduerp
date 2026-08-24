# EduERP Demo & Commercial Client Testing Guide

## 1. Overview & Separation of Environments
EduERP maintains a strict separation between **Evaluation Demo Workspaces** and **Real Commercial Workspaces**:

| Characteristic | Evaluation Demo Tenants (`isDemoTenant: true`) | Real Commercial Tenants (`isDemoTenant: false`) |
|---|---|---|
| **Purpose** | Exploration & feature capability showcase | Live institutional governance & academic records |
| **Interactive Demo Switcher Bar** | **Visible** (Allows 1-click persona switching) | **Hidden & Forbidden** (Never rendered) |
| **Shared Demo Passwords** | Supported for evaluation personas | **Forbidden** (Strict individual bcrypt passwords) |
| **Password Change Requirement** | Optional | **Mandatory on First Login** for provisioned owners |
| **Data Seed** | Populated with demo students, grades & timetable | **Clean & Empty** (Only structural draft templates) |
| **MRR / SaaS Metrics Impact** | **Excluded** from commercial ARR/MRR aggregates | **Included** in active MRR and paid subscriber count |

---

## 2. Evaluation Demo Workspaces Inventory
The following 5 institutions represent pre-configured demo workspaces covering all vertical engines:

1. **Dhaka Ideal School (`demo-school` / `dhaka-ideal-school`)**
   - Type: `SCHOOL`
   - Principal Persona: `principal@school.edu.bd`
   - Teacher Persona: `teacher@school.edu.bd`
   - Student Persona: `student@school.edu.bd`
   - Key Modules: Attendance, Exam Mark Entry, Fee Collection, Student Diary

2. **Chittagong Model College (`ctg-model-college`)**
   - Type: `COLLEGE`
   - Principal Persona: `principal@college.edu.bd`
   - Key Modules: HSC Science/Arts/Commerce streams, 4th Subject Bonus calculation

3. **Jamia Darul Quran Madrasha (`jamia-darul-quran`)**
   - Type: `MADRASHA`
   - Principal Persona: `principal@madrasha.edu.bd`
   - Key Modules: 30-Para Hifzul Quran Progress Tracker, Sabak/Sabki/Manzil scoring

4. **Dhaka International University (`dhaka-intl-university`)**
   - Type: `UNIVERSITY`
   - Vice-Chancellor Persona: `vc@university.edu.bd`
   - Key Modules: Open Credit System, Faculty Research, Thesis Defense

5. **Dhaka Central Polytechnic (`dhaka-central-polytechnic`)**
   - Type: `POLYTECHNIC`
   - Principal Persona: `principal@polytechnic.edu.bd`
   - Key Modules: 8-Semester Engineering Diploma, BTEB Compliance

---

## 3. Controlled QA Commercial Pilot Tenant
For live commercial E2E verification without polluting live financial ledgers:

- **Institution Name**: `Vento EduERP Pilot Academy QA`
- **Tenant Slug**: `pilot-academy-qa`
- **Institution Type**: `SCHOOL`
- **Subscription Package**: `PROFESSIONAL` (Active Annual Commercial Subscription)
- **Administrator Email**: `owner@pilot-academy.qa`
- **Workspace URL**: `https://eduerp.us/pilot-academy-qa/dashboard`
- **Properties**: `isTestTenant: true`, `isDemoTenant: false`
- **Verification Highlights**:
  - Full commercial onboarding wizard with 14-step checklist.
  - 1-Click academic starter template loading.
  - Server-side entitlement validation and quota checking.
  - Audited `PLATFORM SUPPORT SESSION` banner when visited by Platform Super Admins.

---

## 4. Local Credential Management
All private credentials and test personas are stored in the non-committed local file:
`/Users/humayun/Projects/eduerp/EDUERP-DEMO-CREDENTIALS.local.txt`

This file is explicitly listed in `.gitignore` and is never committed to the public Git repository.
