# EduERP Owner QA Testing Checklist & Step-by-Step Guide
**Command 11B Live Verification Guide for Platform Owner**

---

### Prerequisites & Access Information
* **Production URL**: `https://eduerp.us`
* **Canonical Demo School URL**: `https://eduerp.us/demo-school/dashboard`
* **Interactive Demo Switcher**: Available in the top header bar across all pages.
* **Credentials**:
  * Platform Super Admin: `superadmin@eduerp.us` / `EduErp@2026!`
  * Head of Institution (Demo School): `principal.demo-school@eduerp.us` / `EduErp@2026!`
  * Admission Officer (Demo School): `admission.demo-school@eduerp.us` / `EduErp@2026!`
  * Senior Teacher (Demo School): `teacher.demo-school@eduerp.us` / `EduErp@2026!`
  * Chief Accountant (Demo School): `accountant.demo-school@eduerp.us` / `EduErp@2026!`

---

## 1. Authentication & Session Reliability
- [ ] **Test 1.1: Direct URL Protection**: Open an incognito browser window and navigate directly to `https://eduerp.us/demo-school/admission`. Verify that you are immediately redirected to the login page (`/login?returnUrl=...`) instead of seeing a broken shell with "Session expired" error banners.
- [ ] **Test 1.2: Interactive Demo Switcher**: In the top navigation bar, select **Institution: Dhaka Ideal Model High School** and **Role Persona: Admission Officer**. Observe that the page reloads with a real authenticated session for `admission.demo-school@eduerp.us`.
- [ ] **Test 1.3: User Persona Synchronization**: Notice that the top-right user card and sidebar display the actual authenticated user name (`Sabbir Hossain` or `Admission Officer`) and role (`ADMISSION_OFFICER`), matching server truth.

---

## 2. Public Admission Funnel & Admin Pipeline
- [ ] **Test 2.1: Public Application Submission**:
  1. Open `https://eduerp.us/apply/dhaka-ideal-school`.
  2. Fill out the 3-step applicant form (First Name, Last Name, Phone, Guardian Details, Class 10, Address).
  3. Submit the application and note the generated Application Number (e.g. `APP-2026-0004`).
- [ ] **Test 2.2: Instant Admin Pipeline Visibility**:
  1. Navigate to `https://eduerp.us/demo-school/admission`.
  2. Verify that your newly submitted application appears immediately under the **SUBMITTED** pipeline tab.
  3. Verify that the owner's existing application (`Md Humayun Kabir`, `APP-2026-0002`) is present and intact.
- [ ] **Test 2.3: Internal Application Wizard**:
  1. Click the **+ New Applicant** button on `https://eduerp.us/demo-school/admission`.
  2. Fill in the required applicant fields (including Admission Fee with leading numbers like `05000` or `5000`).
  3. Click **Submit Application**. Verify that confetti triggers, modal closes, and the new applicant appears in the pipeline without errors.

---

## 3. Student SIS & Direct Enrollment
- [ ] **Test 3.1: Admission Conversion to Student**:
  1. In the Admission Pipeline (`/demo-school/admission`), click **Admit Student** on an eligible application.
  2. Confirm class placement, section assignment, and tuition fee generation.
  3. Verify that the applicant moves to **ADMITTED** status.
  4. Navigate to `https://eduerp.us/demo-school/students` and verify that the student is now listed with an auto-generated Student ID Number (e.g. `DIMS-2026-0003`).
- [ ] **Test 3.2: Direct Student Onboarding**:
  1. On `/demo-school/students`, click **+ Add Student (SIS)**.
  2. Fill out the student name, gender, date of birth, class, section, guardian information.
  3. Submit the form. Verify that the student is saved to the database and appears in the student directory.
  4. Reload the browser page (`F5`) to confirm complete data persistence.

---

## 4. Academic LMS & Course Spaces
- [ ] **Test 4.1: Create Course Space**:
  1. Navigate to `https://eduerp.us/demo-school/lms`.
  2. Click **Create Course Space** in the header.
  3. Enter Course Title (e.g. `Higher Physics - Mechanics`), Code (`PHY-201`), select Class 10, Section A, Subject Physics, and Primary Teacher.
  4. Click **Create Course Space**. Verify that the new course space card appears in the grid.
- [ ] **Test 4.2: Add Syllabus Module & Digital Lesson**:
  1. Select the newly created course space.
  2. Click **+ Add Module**, enter module title and description, and save.
  3. Inside the module, click **+ Add Lesson**, enter lesson title, video URL, duration, and save.
  4. Verify that the module and lesson are rendered in the course outline.
- [ ] **Test 4.3: Create Homework & Rubric Assignment**:
  1. Switch to the **Homework & Assignments** tab.
  2. Click **+ Create Rubric Assignment**, fill in assignment title, total marks (e.g. `30`), and due date.
  3. Submit and verify that the assignment appears in the assignments table.
- [ ] **Test 4.4: AI Question Draft Generator**:
  1. Switch to the **Question Bank & AI Generator** tab.
  2. Enter a topic (e.g. `Electromagnetism & Faraday Law`) and select difficulty `Medium`.
  3. Click **Generate 5 Multi-Type Drafts**. Verify that structured questions are generated and appended to the repository.

---

## 5. Examination Engine & Result Tabulation
- [ ] **Test 5.1: Create Examination Session**:
  1. Navigate to `https://eduerp.us/demo-school/examination`.
  2. Click **Create Examination**, enter title (e.g. `Annual Final Examination 2026`), select Type `ANNUAL`, and dates.
  3. Click **Create Examination**. Verify that the exam session appears in the Active Examinations list.
- [ ] **Test 5.2: Schedule Exam Subject**:
  1. Select the created exam session.
  2. Click **+ Schedule Subject**, select Subject, Class, Date, Start/End Time, and Max Marks (`100`).
  3. Save schedule and verify it appears in the Exam Routine table.
- [ ] **Test 5.3: Print Branded Report Card**:
  1. Click **Print Report Card**.
  2. Verify that the branded institutional report card modal opens with student marks, GPA calculation on the server scale, and QR integrity code.

---

## 6. Financial Management & Transactions
- [ ] **Test 6.1: Invoices & Payment Recording**:
  1. Navigate to `https://eduerp.us/demo-school/finance`.
  2. Under the **Invoices** tab, select an unpaid invoice.
  3. Choose payment gateway (e.g. **bKash** or **Cash**), enter amount, and click **Record Payment**.
  4. Verify that the invoice due balance is updated and marked `PAID` or `PARTIALLY_PAID` with receipt generation.
- [ ] **Test 6.2: Financial Statements & Trial Balance**:
  1. Switch to the **Trial Balance** and **Financial Statements** tabs.
  2. Verify that the live Income Statement, Balance Sheet, and Trial Balance ledger totals load without errors.

---

## 7. HR Workforce & Campus Facilities
- [ ] **Test 7.1: Employee Directory & Leave Management**:
  1. Navigate to `https://eduerp.us/demo-school/hr`.
  2. Switch between **Staff Directory**, **Attendance Logs**, and **Leave Requests** tabs to confirm data loading.
- [ ] **Test 7.2: Campus Operations & Facilities**:
  1. Navigate to `https://eduerp.us/demo-school/facilities`.
  2. Switch through **Library**, **Hostel**, **Transport**, **Inventory**, and **Fixed Assets** tabs to confirm zero crashes and full data rendering.

---

## 8. Cross-Vertical Tenant Switching
- [ ] **Test 8.1: 8 Educational Verticals**:
  Use the top Demo Switcher to cycle through all 8 canonical educational institutions:
  1. `demo-school` (Dhaka Ideal Model High School — General School)
  2. `demo-college` (Chittagong Model College — Intermediate College)
  3. `demo-school-college` (Rajshahi Model School & College — Integrated K-12)
  4. `demo-madrasha` (Darul Uloom Islamia Madrasha — Islamic & Hifz)
  5. `demo-university` (Metropolitan University Bangladesh — Higher Ed & Semester Credits)
  6. `demo-polytechnic` (Dhaka Polytechnic Institute — Diploma Engineering)
  7. `demo-vocational` (Bangladesh Technical Vocational Academy — Technical Trade)
  8. `demo-training` (National Institute of Professional Training — Professional Certifications)
  Verify that branding, campus titles, and role permissions adapt dynamically for each vertical.
