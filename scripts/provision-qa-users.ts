import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db } from '../lib/db';
import { hashPassword } from '../lib/auth/password';

export function generateSecurePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*_-+=';
  const all = upper + lower + digits + symbols;

  const bytes = crypto.randomBytes(32);
  let pwd = '';
  pwd += upper[bytes[0] % upper.length];
  pwd += upper[bytes[1] % upper.length];
  pwd += lower[bytes[2] % lower.length];
  pwd += lower[bytes[3] % lower.length];
  pwd += digits[bytes[4] % digits.length];
  pwd += digits[bytes[5] % digits.length];
  pwd += symbols[bytes[6] % symbols.length];
  pwd += symbols[bytes[7] % symbols.length];

  for (let i = 8; i < 26; i++) {
    pwd += all[bytes[i] % all.length];
  }

  // Cryptographic shuffle
  const arr = pwd.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

export interface QAAccountDefinition {
  institutionName: string;
  institutionType: string;
  tenantSlug: string;
  role: string;
  name: string;
  email: string;
  loginUrl: string;
  expectedLandingUrl: string;
  modulesToTest: string;
  notes: string;
}

export const QA_ACCOUNT_DEFINITIONS: QAAccountDefinition[] = [
  // Platform Super Admins & Platform Roles
  {
    institutionName: 'SaaS Platform Management',
    institutionType: 'PLATFORM',
    tenantSlug: 'platform',
    role: 'PLATFORM_SUPER_ADMIN',
    name: 'Executive Super Admin',
    email: 'platform-super-admin@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/super-admin',
    modulesToTest: 'Tenant Provisioning, Multi-Tenant Metrics, Subscriptions, System Logs, Global Configuration',
    notes: 'Full unrestricted platform administrator with cross-tenant visibility'
  },
  {
    institutionName: 'SaaS Platform Management',
    institutionType: 'PLATFORM',
    tenantSlug: 'platform',
    role: 'PLATFORM_SUPER_ADMIN',
    name: 'Platform Root Administrator',
    email: 'admin@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/super-admin',
    modulesToTest: 'Security Policies, System Audit, Root Disaster Recovery',
    notes: 'Root platform operations'
  },
  {
    institutionName: 'SaaS Platform Management',
    institutionType: 'PLATFORM',
    tenantSlug: 'platform',
    role: 'PLATFORM_ADMIN',
    name: 'Platform Operations Admin',
    email: 'platform-admin@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/super-admin',
    modulesToTest: 'Tenant Management, Usage Metrics, Feature Toggles',
    notes: 'Operations administration'
  },
  {
    institutionName: 'SaaS Platform Management',
    institutionType: 'PLATFORM',
    tenantSlug: 'platform',
    role: 'SUPPORT_ADMIN',
    name: 'Global Technical Support',
    email: 'support-admin@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/super-admin',
    modulesToTest: 'Tenant Support, Audit Trail, Diagnostics',
    notes: 'Platform support representative'
  },
  {
    institutionName: 'SaaS Platform Management',
    institutionType: 'PLATFORM',
    tenantSlug: 'platform',
    role: 'BILLING_ADMIN',
    name: 'SaaS Billing & Subscriptions Admin',
    email: 'billing-admin@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/super-admin',
    modulesToTest: 'Subscription Plans, Invoices, Gateway Configs',
    notes: 'Platform billing manager'
  },
  {
    institutionName: 'SaaS Platform Management',
    institutionType: 'PLATFORM',
    tenantSlug: 'platform',
    role: 'SALES_ADMIN',
    name: 'Institution Onboarding Sales Admin',
    email: 'sales-admin@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/super-admin',
    modulesToTest: 'Onboarding Funnel, Demo Requests, Quotes',
    notes: 'Platform sales executive'
  },
  {
    institutionName: 'SaaS Platform Management',
    institutionType: 'PLATFORM',
    tenantSlug: 'platform',
    role: 'SUPER_ADMIN',
    name: 'Legacy Platform Admin Alias',
    email: 'super-admin@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/super-admin',
    modulesToTest: 'Backward-compatible platform administration',
    notes: 'Legacy alias role for platform super admin'
  },
  {
    institutionName: 'SaaS Platform Management',
    institutionType: 'PLATFORM',
    tenantSlug: 'platform',
    role: 'SUPER_ADMIN',
    name: 'System Super Admin',
    email: 'superadmin@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/super-admin',
    modulesToTest: 'Platform Overview, Monitoring, Tenant Actions',
    notes: 'Default superadmin alias account'
  },

  // 1. Dhaka Ideal Model School (demo-school)
  {
    institutionName: 'Dhaka Ideal Model School',
    institutionType: 'SCHOOL',
    tenantSlug: 'demo-school',
    role: 'PRINCIPAL',
    name: 'Dr. Rafiqul Islam, Principal',
    email: 'principal.demo-school@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-school/dashboard',
    modulesToTest: 'Executive Dashboard, Teacher Review, Leave Approvals, Result Finalization, Budget Approvals',
    notes: 'Chief executive officer of school tenant'
  },
  {
    institutionName: 'Dhaka Ideal Model School',
    institutionType: 'SCHOOL',
    tenantSlug: 'demo-school',
    role: 'VICE_PRINCIPAL',
    name: 'Nasreen Sultana, Vice Principal',
    email: 'vice-principal.demo-school@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-school/dashboard',
    modulesToTest: 'Academic Supervision, Discipline Records, Timetable Approvals',
    notes: 'Secondary executive'
  },
  {
    institutionName: 'Dhaka Ideal Model School',
    institutionType: 'SCHOOL',
    tenantSlug: 'demo-school',
    role: 'OWNER',
    name: 'Haji Mohammad Yunus, Founder & Owner',
    email: 'owner.demo-school@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-school/dashboard',
    modulesToTest: 'Financial Statements, Asset Valuations, Long-term Capital Reports',
    notes: 'Institution owner/sponsor'
  },
  {
    institutionName: 'Dhaka Ideal Model School',
    institutionType: 'SCHOOL',
    tenantSlug: 'demo-school',
    role: 'CHAIRMAN',
    name: 'Alhaj Kabir Ahmed, Governing Body Chairman',
    email: 'chairman.demo-school@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-school/dashboard',
    modulesToTest: 'Governing Body Approvals, Policy Resolutions, Executive Oversight',
    notes: 'Board Chairman'
  },
  {
    institutionName: 'Dhaka Ideal Model School',
    institutionType: 'SCHOOL',
    tenantSlug: 'demo-school',
    role: 'COORDINATOR',
    name: 'Shahidul Alam, Academic Coordinator',
    email: 'coordinator.demo-school@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-school/dashboard',
    modulesToTest: 'Curriculum Planning, Lesson Progress, Exam Schedules',
    notes: 'Academic Coordinator'
  },
  {
    institutionName: 'Dhaka Ideal Model School',
    institutionType: 'SCHOOL',
    tenantSlug: 'demo-school',
    role: 'TEACHER',
    name: 'Mahbubur Rahman, Senior Teacher',
    email: 'teacher.demo-school@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-school/dashboard',
    modulesToTest: 'Attendance, Marks Entry, LMS Lessons, Homework, Question Bank, Online Class',
    notes: 'Lead Mathematics teacher'
  },
  {
    institutionName: 'Dhaka Ideal Model School',
    institutionType: 'SCHOOL',
    tenantSlug: 'demo-school',
    role: 'ACCOUNTANT',
    name: 'Mizanur Rahman, Chief Accountant',
    email: 'accountant.demo-school@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-school/dashboard',
    modulesToTest: 'Student Billing, Fee Collection, General Ledger, Payroll Vouchers, Bank Reconciliation',
    notes: 'Finance Officer'
  },
  {
    institutionName: 'Dhaka Ideal Model School',
    institutionType: 'SCHOOL',
    tenantSlug: 'demo-school',
    role: 'HR_MANAGER',
    name: 'Fatema Tuz Zohra, HR Officer',
    email: 'hr-manager.demo-school@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-school/dashboard',
    modulesToTest: 'Employee Profiles, Biometric Attendance, Leave Approval, Recruitment, Appraisals',
    notes: 'HR Director'
  },
  {
    institutionName: 'Dhaka Ideal Model School',
    institutionType: 'SCHOOL',
    tenantSlug: 'demo-school',
    role: 'LIBRARIAN',
    name: 'Mohsin Ali, Head Librarian',
    email: 'librarian.demo-school@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-school/dashboard',
    modulesToTest: 'Book Cataloging, Barcode Issue/Return, Fine Collection, OPAC Search',
    notes: 'Librarian'
  },
  {
    institutionName: 'Dhaka Ideal Model School',
    institutionType: 'SCHOOL',
    tenantSlug: 'demo-school',
    role: 'HOSTEL_MANAGER',
    name: 'Anwar Hossain, Hostel Warden',
    email: 'hostel-manager.demo-school@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-school/dashboard',
    modulesToTest: 'Hostel Buildings, Room/Bed Allocation, Attendance, Meal Tracking',
    notes: 'Hostel In-charge'
  },
  {
    institutionName: 'Dhaka Ideal Model School',
    institutionType: 'SCHOOL',
    tenantSlug: 'demo-school',
    role: 'TRANSPORT_MANAGER',
    name: 'Jalal Uddin, Transport In-Charge',
    email: 'transport-manager.demo-school@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-school/dashboard',
    modulesToTest: 'Bus Routes, Vehicle Fleet, Driver Rosters, Student Route Allocation',
    notes: 'Transport In-charge'
  },
  {
    institutionName: 'Dhaka Ideal Model School',
    institutionType: 'SCHOOL',
    tenantSlug: 'demo-school',
    role: 'ADMISSION_OFFICER',
    name: 'Kazi Farzana, Admission Officer',
    email: 'admission-officer.demo-school@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-school/dashboard',
    modulesToTest: 'Online Admission Leads, Scrutiny, Merit Lists, Auto-Enrollment',
    notes: 'Admissions Lead'
  },
  {
    institutionName: 'Dhaka Ideal Model School',
    institutionType: 'SCHOOL',
    tenantSlug: 'demo-school',
    role: 'STUDENT',
    name: 'Sadia Sultana, Class 10 Student',
    email: 'student.demo-school@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-school/dashboard',
    modulesToTest: 'Class Timetable, LMS Homework, Online Quizzes, Result Cards, Fee Invoices',
    notes: 'Secondary School Student'
  },
  {
    institutionName: 'Dhaka Ideal Model School',
    institutionType: 'SCHOOL',
    tenantSlug: 'demo-school',
    role: 'PARENT',
    name: 'Abdul Gafur, Parent/Guardian',
    email: 'guardian.demo-school@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-school/dashboard',
    modulesToTest: 'Child Attendance, Report Cards, Online Fee Payment, Teacher Notices',
    notes: 'Guardian of Sadia Sultana'
  },

  // 2. Chittagong Model College (demo-college)
  {
    institutionName: 'Chittagong Model College',
    institutionType: 'COLLEGE',
    tenantSlug: 'demo-college',
    role: 'PRINCIPAL',
    name: 'Prof. AKM Shamsuddin, Principal',
    email: 'principal.demo-college@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-college/dashboard',
    modulesToTest: 'HSC Group Management, Board Registration, Faculty Appraisals',
    notes: 'College Principal'
  },
  {
    institutionName: 'Chittagong Model College',
    institutionType: 'COLLEGE',
    tenantSlug: 'demo-college',
    role: 'TEACHER',
    name: 'Dr. Laila Arjumand, Associate Professor (Physics)',
    email: 'teacher.demo-college@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-college/dashboard',
    modulesToTest: 'HSC Practical Marks, CQ/MCQ Assessments, Lesson Materials',
    notes: 'Physics Department Head'
  },
  {
    institutionName: 'Chittagong Model College',
    institutionType: 'COLLEGE',
    tenantSlug: 'demo-college',
    role: 'STUDENT',
    name: 'Tanvir Hasan, HSC Science Student',
    email: 'student.demo-college@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-college/dashboard',
    modulesToTest: 'Subject Combinations, Lab Schedules, GPA Calculation, Term Exams',
    notes: 'HSC 2nd Year Student'
  },

  // 3. Rajshahi Model School & College (demo-school-college)
  {
    institutionName: 'Rajshahi Model School & College',
    institutionType: 'SCHOOL_AND_COLLEGE',
    tenantSlug: 'demo-school-college',
    role: 'PRINCIPAL',
    name: 'Prof. Manzurul Haque, Principal',
    email: 'principal.demo-school-college@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-school-college/dashboard',
    modulesToTest: 'Dual Section Management, Class 1-12 Coordination, Cross-Shift Staffing',
    notes: 'Integrated Campus Head'
  },
  {
    institutionName: 'Rajshahi Model School & College',
    institutionType: 'SCHOOL_AND_COLLEGE',
    tenantSlug: 'demo-school-college',
    role: 'TEACHER',
    name: 'Shamim Ara, Senior Lecturer',
    email: 'teacher.demo-school-college@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-school-college/dashboard',
    modulesToTest: 'High School & Higher Secondary Exam Grading, Attendance',
    notes: 'Senior Lecturer'
  },
  {
    institutionName: 'Rajshahi Model School & College',
    institutionType: 'SCHOOL_AND_COLLEGE',
    tenantSlug: 'demo-school-college',
    role: 'STUDENT',
    name: 'Rashedul Islam, Student',
    email: 'student.demo-school-college@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-school-college/dashboard',
    modulesToTest: 'Integrated Transcripts, Class Schedule, Digital Library',
    notes: 'Class 11 Student'
  },

  // 4. Darul Uloom Islamia Madrasha (demo-madrasha)
  {
    institutionName: 'Darul Uloom Islamia Madrasha',
    institutionType: 'MADRASHA',
    tenantSlug: 'demo-madrasha',
    role: 'PRINCIPAL',
    name: 'Mawlana Abdul Haque, Principal / Muhtamim',
    email: 'principal.demo-madrasha@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-madrasha/dashboard',
    modulesToTest: 'Madrasha Curriculum, Hifz Completion Tracker, Dakhil/Alim Boards',
    notes: 'Principal / Muhtamim'
  },
  {
    institutionName: 'Darul Uloom Islamia Madrasha',
    institutionType: 'MADRASHA',
    tenantSlug: 'demo-madrasha',
    role: 'TEACHER',
    name: 'Qari Ibrahim Khalil, Senior Hifz Ustad',
    email: 'teacher.demo-madrasha@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-madrasha/dashboard',
    modulesToTest: 'Daily Sabaq/Sabqi/Manzil Tracking, Surah Mastery, Tajweed Grading',
    notes: 'Lead Hifz Instructor'
  },
  {
    institutionName: 'Darul Uloom Islamia Madrasha',
    institutionType: 'MADRASHA',
    tenantSlug: 'demo-madrasha',
    role: 'STUDENT',
    name: 'Mahmud Hasan, Hifz & Alim Student',
    email: 'student.demo-madrasha@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-madrasha/dashboard',
    modulesToTest: 'Para/Juz Completion Log, Islamic Studies Assessments, Attendance',
    notes: 'Hifz Student'
  },

  // 5. Metropolitan University Bangladesh (demo-university)
  {
    institutionName: 'Metropolitan University Bangladesh',
    institutionType: 'UNIVERSITY',
    tenantSlug: 'demo-university',
    role: 'VICE_CHANCELLOR',
    name: 'Prof. Dr. Munaz Ahmed Noor, Vice Chancellor',
    email: 'vice-chancellor.demo-university@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-university/dashboard',
    modulesToTest: 'University Senate Overview, UGC Compliance, Research Grants, Accreditation',
    notes: 'Vice Chancellor'
  },
  {
    institutionName: 'Metropolitan University Bangladesh',
    institutionType: 'UNIVERSITY',
    tenantSlug: 'demo-university',
    role: 'PRO_VICE_CHANCELLOR',
    name: 'Prof. Dr. Mahfuzur Rahman, Pro-VC',
    email: 'pro-vc.demo-university@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-university/dashboard',
    modulesToTest: 'Academic Affairs, Curriculum Reviews, Faculty Appointments',
    notes: 'Pro-Vice Chancellor'
  },
  {
    institutionName: 'Metropolitan University Bangladesh',
    institutionType: 'UNIVERSITY',
    tenantSlug: 'demo-university',
    role: 'TRUSTEE',
    name: 'Engr. Rezaul Karim, Board of Trustees',
    email: 'trustee.demo-university@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-university/dashboard',
    modulesToTest: 'Financial Endowment, Capital Expansion, Strategic Governance',
    notes: 'Board of Trustees Member'
  },
  {
    institutionName: 'Metropolitan University Bangladesh',
    institutionType: 'UNIVERSITY',
    tenantSlug: 'demo-university',
    role: 'REGISTRAR',
    name: 'Dr. Ashrafuzzaman, Registrar',
    email: 'registrar.demo-university@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-university/dashboard',
    modulesToTest: 'Semester Enrollment, Graduation Clearances, Convocation Transcripts',
    notes: 'University Registrar'
  },
  {
    institutionName: 'Metropolitan University Bangladesh',
    institutionType: 'UNIVERSITY',
    tenantSlug: 'demo-university',
    role: 'DEAN',
    name: 'Prof. Dr. Shamim Kaiser, Dean of Engineering',
    email: 'dean.demo-university@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-university/dashboard',
    modulesToTest: 'Faculty Department Budgets, OBE Syllabus Approval, Thesis Moderation',
    notes: 'Faculty Dean'
  },
  {
    institutionName: 'Metropolitan University Bangladesh',
    institutionType: 'UNIVERSITY',
    tenantSlug: 'demo-university',
    role: 'HEAD_OF_DEPARTMENT',
    name: 'Dr. Tariqul Islam, Head of CSE',
    email: 'hod.demo-university@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-university/dashboard',
    modulesToTest: 'Department Courses, Teacher Allocations, Prerequisite Waivers',
    notes: 'Department Chairman'
  },
  {
    institutionName: 'Metropolitan University Bangladesh',
    institutionType: 'UNIVERSITY',
    tenantSlug: 'demo-university',
    role: 'FACULTY',
    name: 'Dr. Farzana Yasmin, Assistant Professor',
    email: 'faculty.demo-university@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-university/dashboard',
    modulesToTest: 'Credit Course LMS, Research Projects, Mid/Final Exam Marks Submission',
    notes: 'University Faculty'
  },
  {
    institutionName: 'Metropolitan University Bangladesh',
    institutionType: 'UNIVERSITY',
    tenantSlug: 'demo-university',
    role: 'STUDENT',
    name: 'Nayeem Abdullah, Undergraduate Student (CSE)',
    email: 'student.demo-university@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-university/dashboard',
    modulesToTest: 'Semester Advising, Prerequisite Validation, CGPA Tracker, Online Drop/Add',
    notes: 'BSc CSE Undergraduate'
  },

  // 6. Dhaka Polytechnic Institute (demo-polytechnic)
  {
    institutionName: 'Dhaka Polytechnic Institute',
    institutionType: 'POLYTECHNIC',
    tenantSlug: 'demo-polytechnic',
    role: 'PRINCIPAL',
    name: 'Engr. Nurul Huda, Principal',
    email: 'principal.demo-polytechnic@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-polytechnic/dashboard',
    modulesToTest: 'BTEB 4-Year Diploma Engineering, Industrial Attachment, Practical Labs',
    notes: 'Polytechnic Principal'
  },
  {
    institutionName: 'Dhaka Polytechnic Institute',
    institutionType: 'POLYTECHNIC',
    tenantSlug: 'demo-polytechnic',
    role: 'TEACHER',
    name: 'Engr. Sabrina Islam, Senior Instructor (Electrical)',
    email: 'teacher.demo-polytechnic@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-polytechnic/dashboard',
    modulesToTest: 'Workshop Continuous Assessments, Semester Final Practical Exams',
    notes: 'Technical Instructor'
  },
  {
    institutionName: 'Dhaka Polytechnic Institute',
    institutionType: 'POLYTECHNIC',
    tenantSlug: 'demo-polytechnic',
    role: 'STUDENT',
    name: 'Sabbir Hossain, Diploma Engineering Student',
    email: 'student.demo-polytechnic@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-polytechnic/dashboard',
    modulesToTest: 'Industrial Training Logs, Semester Exam Registrations, Lab Manuals',
    notes: '4th Semester Diploma Student'
  },

  // 7. Bangladesh Technical Vocational Academy (demo-vocational)
  {
    institutionName: 'Bangladesh Technical Vocational Academy',
    institutionType: 'TECHNICAL_INSTITUTE',
    tenantSlug: 'demo-vocational',
    role: 'PRINCIPAL',
    name: 'Engr. Mostafa Kamal, Principal',
    email: 'principal.demo-vocational@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-vocational/dashboard',
    modulesToTest: 'NTVQF Trade Certificates, RPL Assessments, Competency Standards',
    notes: 'Vocational Principal'
  },
  {
    institutionName: 'Bangladesh Technical Vocational Academy',
    institutionType: 'TECHNICAL_INSTITUTE',
    tenantSlug: 'demo-vocational',
    role: 'TEACHER',
    name: 'Md. Rashedul Islam, Senior Trade Instructor',
    email: 'teacher.demo-vocational@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-vocational/dashboard',
    modulesToTest: 'Competency Based Assessments (CBT&A), Trade Practical Marks',
    notes: 'Trade Instructor'
  },
  {
    institutionName: 'Bangladesh Technical Vocational Academy',
    institutionType: 'TECHNICAL_INSTITUTE',
    tenantSlug: 'demo-vocational',
    role: 'STUDENT',
    name: 'Al Amin, Trade Trainee',
    email: 'student.demo-vocational@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-vocational/dashboard',
    modulesToTest: 'Trade Modules, Competency Logbook, Skill Verification Badges',
    notes: 'NTVQF Level 2 Trainee'
  },

  // 8. National Institute of Professional Training (demo-training)
  {
    institutionName: 'National Institute of Professional Training',
    institutionType: 'TRAINING_INSTITUTE',
    tenantSlug: 'demo-training',
    role: 'PRINCIPAL',
    name: 'Brig. Gen. (Retd.) M. A. Latif, Executive Director',
    email: 'principal.demo-training@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-training/dashboard',
    modulesToTest: 'Corporate Training Cohorts, Executive Certifications, CPD Credits',
    notes: 'Executive Director'
  },
  {
    institutionName: 'National Institute of Professional Training',
    institutionType: 'TRAINING_INSTITUTE',
    tenantSlug: 'demo-training',
    role: 'TEACHER',
    name: 'Shakil Ahmed, Lead Corporate Trainer',
    email: 'teacher.demo-training@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-training/dashboard',
    modulesToTest: 'Short Course Batches, Attendance, Certificate Generation, Post-test Quizzes',
    notes: 'Corporate Trainer'
  },
  {
    institutionName: 'National Institute of Professional Training',
    institutionType: 'TRAINING_INSTITUTE',
    tenantSlug: 'demo-training',
    role: 'STUDENT',
    name: 'Nusrat Jahan, Executive Trainee',
    email: 'student.demo-training@eduerp.us',
    loginUrl: 'https://eduerp.us/login',
    expectedLandingUrl: 'https://eduerp.us/demo-training/dashboard',
    modulesToTest: 'Cohort Materials, CPD Digital Badges, Verifiable Course Certificate',
    notes: 'Professional Trainee'
  }
];

export async function provisionQAUsers(options: { rotatePasswords?: boolean } = {}) {
  console.log('=== EDUERP SAFE QA PROVISIONING & CREDENTIAL GENERATION ===');
  console.log(`Action: ${options.rotatePasswords ? 'ROTATING ALL PASSWORDS' : 'PROVISIONING / SYNCING QA USERS'}`);

  // 1. Subscription Plans & Gateways
  const { SaasPlanService } = await import('../lib/services/saas-plan.service');
  await SaasPlanService.seedInitialPlans();

  // 2. Demo Tenants & Institutions
  const demoTenants = [
    { slug: 'demo-school', name: 'Dhaka Ideal Model School', shortName: 'DIMS', institutionType: 'SCHOOL', district: 'Dhaka', division: 'Dhaka', address: '12/A Dhanmondi, Dhaka', phone: '+8801711000001', email: 'info@dims.edu.bd' },
    { slug: 'demo-college', name: 'Chittagong Model College', shortName: 'CMC', institutionType: 'COLLEGE', district: 'Chattogram', division: 'Chattogram', address: 'GEC Circle, Chattogram', phone: '+8801711000002', email: 'info@cmc.edu.bd' },
    { slug: 'demo-school-college', name: 'Rajshahi Model School & College', shortName: 'RMSC', institutionType: 'SCHOOL_AND_COLLEGE', district: 'Rajshahi', division: 'Rajshahi', address: 'Kazihata, Rajshahi', phone: '+8801711000003', email: 'info@rmsc.edu.bd' },
    { slug: 'demo-madrasha', name: 'Darul Uloom Islamia Madrasha', shortName: 'DUIM', institutionType: 'MADRASHA', district: 'Sylhet', division: 'Sylhet', address: 'Dargah Gate, Sylhet', phone: '+8801711000004', email: 'info@duim.edu.bd' },
    { slug: 'demo-university', name: 'Metropolitan University Bangladesh', shortName: 'MUB', institutionType: 'UNIVERSITY', district: 'Dhaka', division: 'Dhaka', address: 'Gulshan 2, Dhaka', phone: '+8801711000005', email: 'info@mub.edu.bd' },
    { slug: 'demo-polytechnic', name: 'Dhaka Polytechnic Institute', shortName: 'DPI', institutionType: 'POLYTECHNIC', district: 'Dhaka', division: 'Dhaka', address: 'Tejgaon I/A, Dhaka', phone: '+8801711000006', email: 'info@dpi.edu.bd' },
    { slug: 'demo-vocational', name: 'Bangladesh Technical Vocational Academy', shortName: 'BTVA', institutionType: 'TECHNICAL_INSTITUTE', district: 'Gazipur', division: 'Dhaka', address: 'Board Bazar, Gazipur', phone: '+8801711000007', email: 'info@btva.edu.bd' },
    { slug: 'demo-training', name: 'National Institute of Professional Training', shortName: 'NIPT', institutionType: 'TRAINING_INSTITUTE', district: 'Dhaka', division: 'Dhaka', address: 'Panthapath, Dhaka', phone: '+8801711000008', email: 'info@nipt.edu.bd' },
  ];

  const tenantMap = new Map<string, string>();

  for (const t of demoTenants) {
    const tenant = await db.tenant.upsert({
      where: { slug: t.slug },
      update: { isDemoTenant: true },
      create: {
        slug: t.slug,
        institutionType: t.institutionType as any,
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
        isDemoTenant: true,
      },
    });
    tenantMap.set(t.slug, tenant.id);

    // Ensure institution record with required fields
    const institution = await db.institution.upsert({
      where: { tenantId: tenant.id },
      update: { name: t.name },
      create: {
        tenantId: tenant.id,
        name: t.name,
        shortName: t.shortName,
        instituteCode: t.shortName,
        address: t.address,
        district: t.district,
        division: t.division,
        upazilaThana: t.district,
        phone: t.phone,
        email: t.email,
      },
    });

    // Ensure Main Campus
    const campus = await db.campus.upsert({
      where: { id: `campus-${t.slug}` },
      update: {},
      create: {
        id: `campus-${t.slug}`,
        institutionId: institution.id,
        name: `${t.name} (Main Campus)`,
        code: 'MAIN',
        address: t.address,
        isMain: true,
      },
    });

    // Ensure Academic Year 2026
    const ay = await db.academicYear.upsert({
      where: { institutionId_name: { institutionId: institution.id, name: '2026' } },
      update: { isCurrent: true, status: 'ACTIVE' },
      create: {
        institutionId: institution.id,
        name: '2026',
        code: 'AY-2026',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        status: 'ACTIVE',
        isCurrent: true,
      },
    });

    // Ensure Shifts
    const morningShift = await db.shift.upsert({
      where: { institutionId_code: { institutionId: institution.id, code: 'SFT-MORN' } },
      update: {},
      create: {
        institutionId: institution.id,
        name: 'Morning Shift',
        code: 'SFT-MORN',
        startTime: '07:30',
        endTime: '12:30',
        isActive: true,
      },
    });

    // Ensure Default Classes depending on institution type
    const classNames = t.institutionType === 'COLLEGE'
      ? ['Class 11', 'Class 12']
      : t.institutionType === 'MADRASHA'
      ? ['Dakhil 6', 'Dakhil 7', 'Dakhil 8', 'Dakhil 9', 'Dakhil 10']
      : ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

    for (let seq = 0; seq < classNames.length; seq++) {
      const clsName = classNames[seq];
      const cls = await db.class.upsert({
        where: { institutionId_name_shift: { institutionId: institution.id, name: clsName, shift: 'Morning' } },
        update: {},
        create: {
          institutionId: institution.id,
          name: clsName,
          numericValue: seq + 6,
          sequence: seq + 1,
          shift: 'Morning',
          stage: 'SECONDARY',
        },
      });

      // Ensure Sections
      await db.section.upsert({
        where: { id: `sec-${cls.id}-padma` },
        update: {},
        create: {
          id: `sec-${cls.id}-padma`,
          classId: cls.id,
          name: 'Padma',
          capacity: 40,
        },
      });
    }

    // Ensure Polytechnic Trades if Polytechnic
    if (t.institutionType === 'POLYTECHNIC' || t.institutionType === 'TECHNICAL_INSTITUTE') {
      await db.technologyTrade.upsert({
        where: { id: `trade-${t.slug}-cmt` },
        update: {},
        create: {
          id: `trade-${t.slug}-cmt`,
          institutionId: institution.id,
          name: 'Computer Technology',
          code: 'CMT',
          btebCode: '685',
          durationSemesters: 8,
        },
      });
    }

    // Ensure Admission Settings
    await db.admissionSetting.upsert({
      where: { institutionId: institution.id },
      update: {},
      create: {
        institutionId: institution.id,
        isOnlineAdmissionOpen: true,
        applicationFee: 0,
        admissionFeeDefault: 5000,
        isTestRequired: false,
        maxCapacityPerClass: 40,
        applicationNumberPrefix: t.shortName || 'APP',
      },
    });
  }

  // 3. User Provisioning & Secure Random Password Generation
  const generatedCredentials: Array<QAAccountDefinition & { password: string }> = [];

  for (const acct of QA_ACCOUNT_DEFINITIONS) {
    const isPlatform = acct.tenantSlug === 'platform';
    const tenantId = isPlatform ? null : (tenantMap.get(acct.tenantSlug) || null);

    const randomPassword = generateSecurePassword();
    const passwordHash = hashPassword(randomPassword);

    await db.user.upsert({
      where: { email: acct.email },
      update: {
        passwordHash,
        role: acct.role as any,
        tenantId,
        status: 'ACTIVE',
      },
      create: {
        email: acct.email,
        passwordHash,
        name: acct.name,
        role: acct.role as any,
        tenantId,
        status: 'ACTIVE',
      },
    });

    generatedCredentials.push({
      ...acct,
      password: randomPassword,
    });
  }

  // 4. Output Private Credentials Files (Strictly Git-Ignored)
  const txtContent = [
    '====================================================================================================',
    'PRIVATE QA CREDENTIALS — ROTATED AFTER COMMAND 10 SECURITY REMEDIATION — DO NOT COMMIT',
    '====================================================================================================',
    `Generated At: ${new Date().toISOString()}`,
    `Total Accounts: ${generatedCredentials.length}`,
    'Security Note: Every account has a unique, cryptographically random 26-character password.',
    'Only the PBKDF2 hashes are stored in the database. Plaintext exists only in this private file.',
    '====================================================================================================\n',
  ];

  for (const c of generatedCredentials) {
    txtContent.push(`--------------------------------------------------------------------------------`);
    txtContent.push(`Institution    : ${c.institutionName} (${c.institutionType})`);
    txtContent.push(`Tenant Slug    : ${c.tenantSlug}`);
    txtContent.push(`Role           : ${c.role}`);
    txtContent.push(`Name           : ${c.name}`);
    txtContent.push(`Email          : ${c.email}`);
    txtContent.push(`Password       : ${c.password}`);
    txtContent.push(`Login URL      : ${c.loginUrl}`);
    txtContent.push(`Landing URL    : ${c.expectedLandingUrl}`);
    txtContent.push(`Modules To Test: ${c.modulesToTest}`);
    txtContent.push(`Notes          : ${c.notes}\n`);
  }

  const csvRows = [
    'Institution Name,Institution Type,Tenant Slug,Role,Name,Email,Temporary Password,Login URL,Expected Landing URL,Main Modules To Test,Notes'
  ];

  for (const c of generatedCredentials) {
    csvRows.push([
      `"${c.institutionName}"`,
      `"${c.institutionType}"`,
      `"${c.tenantSlug}"`,
      `"${c.role}"`,
      `"${c.name}"`,
      `"${c.email}"`,
      `"${c.password}"`,
      `"${c.loginUrl}"`,
      `"${c.expectedLandingUrl}"`,
      `"${c.modulesToTest}"`,
      `"${c.notes}"`
    ].join(','));
  }

  const projectRoot = process.cwd();
  const txtPath = path.join(projectRoot, 'EDUERP-ONLINE-TEST-CREDENTIALS.txt');
  const csvPath = path.join(projectRoot, 'EDUERP-ONLINE-TEST-CREDENTIALS.csv');

  fs.writeFileSync(txtPath, txtContent.join('\n'), { mode: 0o600 });
  fs.writeFileSync(csvPath, csvRows.join('\n'), { mode: 0o600 });

  // On VPS if running as root, write to private admin directory as well
  const vpsPrivateDir = '/root/eduerp-private';
  if (fs.existsSync('/root') && process.getuid && process.getuid() === 0) {
    try {
      fs.mkdirSync(vpsPrivateDir, { recursive: true, mode: 0o700 });
      fs.writeFileSync(path.join(vpsPrivateDir, 'EDUERP-ONLINE-TEST-CREDENTIALS.txt'), txtContent.join('\n'), { mode: 0o600 });
    } catch {
      // Ignore
    }
  }

  console.log(`✅ Provisioned ${generatedCredentials.length} QA accounts across 8 demo institutions + Platform.`);
  console.log(`🔒 Unique cryptographic passwords generated and hashed.`);
  console.log(`📄 Private credentials saved to ${txtPath} (mode 0600, gitignored).`);
  console.log(`📊 CSV catalog saved to ${csvPath} (mode 0600, gitignored).`);
}

if (require.main === module) {
  const isRotate = process.argv.includes('--rotate');
  provisionQAUsers({ rotatePasswords: isRotate })
    .then(() => {
      console.log('=== QA PROVISIONING COMPLETED SUCCESSFULLY ===');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ QA PROVISIONING ERROR:', err);
      process.exit(1);
    });
}
