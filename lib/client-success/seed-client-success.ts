import { db } from '@/lib/db';
import { DEFAULT_CONTACT_SETTINGS } from './contact-service';

export async function seedClientSuccessData() {
  // 1. Platform Contact Settings
  await db.platformContactSettings.upsert({
    where: { id: 'default' },
    create: DEFAULT_CONTACT_SETTINGS,
    update: {
      companyName: DEFAULT_CONTACT_SETTINGS.companyName,
      address: DEFAULT_CONTACT_SETTINGS.address,
      city: DEFAULT_CONTACT_SETTINGS.city,
      postalCode: DEFAULT_CONTACT_SETTINGS.postalCode,
      country: DEFAULT_CONTACT_SETTINGS.country,
      generalEmail: DEFAULT_CONTACT_SETTINGS.generalEmail,
      phone: DEFAULT_CONTACT_SETTINGS.phone,
      whatsapp: DEFAULT_CONTACT_SETTINGS.whatsapp
    }
  });

  // 2. Support SLA Policies
  const slaPolicies = [
    { priority: 'CRITICAL', name: 'Critical Incident SLA', firstResponseTargetMinutes: 60, resolutionTargetMinutes: 240 },
    { priority: 'URGENT', name: 'Urgent Operational SLA', firstResponseTargetMinutes: 120, resolutionTargetMinutes: 720 },
    { priority: 'HIGH', name: 'High Priority SLA', firstResponseTargetMinutes: 240, resolutionTargetMinutes: 1440 },
    { priority: 'NORMAL', name: 'Standard Business SLA', firstResponseTargetMinutes: 480, resolutionTargetMinutes: 2880 },
    { priority: 'LOW', name: 'Low Priority Query SLA', firstResponseTargetMinutes: 1440, resolutionTargetMinutes: 4320 }
  ];

  for (const sla of slaPolicies) {
    await db.supportSlaPolicy.upsert({
      where: { priority: sla.priority },
      create: sla,
      update: {
        name: sla.name,
        firstResponseTargetMinutes: sla.firstResponseTargetMinutes,
        resolutionTargetMinutes: sla.resolutionTargetMinutes
      }
    });
  }

  // 3. Support Teams
  const supportTeams = [
    { code: 'TECH_SUPPORT', name: 'Technical Support', description: 'Core system stability, bug fixes and login issues' },
    { code: 'IMPLEMENTATION', name: 'Implementation & Onboarding', description: 'New institution onboarding and initial setup' },
    { code: 'TRAINING', name: 'Training & Adoption', description: 'Staff and teacher product training' },
    { code: 'BILLING', name: 'Billing & Commercial', description: 'Invoices, bKash payments and subscription plans' },
    { code: 'DATA_MIGRATION', name: 'Data Migration Specialists', description: 'Legacy student and marks database ingestion' },
    { code: 'PRODUCT', name: 'Product Management', description: 'Feature requests and vertical customization' },
    { code: 'INTEGRATIONS', name: 'API & Integrations', description: 'SMS gateway, biometric devices and third-party tools' }
  ];

  for (const team of supportTeams) {
    await db.supportTeam.upsert({
      where: { code: team.code },
      create: team,
      update: { name: team.name, description: team.description }
    });
  }

  // 4. Support Categories
  const supportCategories = [
    { code: 'LOGIN_AUTH', name: 'Login & Account Access', defaultPriority: 'HIGH', displayOrder: 1 },
    { code: 'ADMISSION', name: 'Online Admission & Applications', defaultPriority: 'NORMAL', displayOrder: 2 },
    { code: 'STUDENT_SIS', name: 'Student Information System (SIS)', defaultPriority: 'NORMAL', displayOrder: 3 },
    { code: 'ACADEMICS', name: 'Academics & Timetable', defaultPriority: 'NORMAL', displayOrder: 4 },
    { code: 'ATTENDANCE', name: 'Biometric Attendance', defaultPriority: 'NORMAL', displayOrder: 5 },
    { code: 'EXAMINATION', name: 'Examination & Marks Processing', defaultPriority: 'HIGH', displayOrder: 6 },
    { code: 'LMS', name: 'LMS & Online Class', defaultPriority: 'NORMAL', displayOrder: 7 },
    { code: 'FINANCE', name: 'Fees & Invoicing', defaultPriority: 'HIGH', displayOrder: 8 },
    { code: 'PAYMENT_GATEWAY', name: 'bKash / Payment Issues', defaultPriority: 'HIGH', displayOrder: 9 },
    { code: 'HR_PAYROLL', name: 'HR & Staff Payroll', defaultPriority: 'NORMAL', displayOrder: 10 },
    { code: 'LIBRARY', name: 'Library Circulation', defaultPriority: 'LOW', displayOrder: 11 },
    { code: 'TRANSPORT', name: 'Transport & Fleet GPS', defaultPriority: 'LOW', displayOrder: 12 },
    { code: 'HOSTEL', name: 'Hostel Allocation', defaultPriority: 'LOW', displayOrder: 13 },
    { code: 'REPORTS', name: 'BANBEIS / Custom Reports', defaultPriority: 'NORMAL', displayOrder: 14 },
    { code: 'DATA_MIGRATION', name: 'Bulk Data Migration', defaultPriority: 'NORMAL', displayOrder: 15 },
    { code: 'SUBSCRIPTION', name: 'Subscription & Renewal', defaultPriority: 'NORMAL', displayOrder: 16 },
    { code: 'BUG', name: 'Bug Report', defaultPriority: 'HIGH', displayOrder: 17 },
    { code: 'FEATURE_REQUEST', name: 'Feature Enhancement', defaultPriority: 'LOW', displayOrder: 18 },
    { code: 'OTHER', name: 'General Inquiry', defaultPriority: 'NORMAL', displayOrder: 19 }
  ];

  for (const cat of supportCategories) {
    await db.supportCategory.upsert({
      where: { code: cat.code },
      create: cat,
      update: { name: cat.name, displayOrder: cat.displayOrder, defaultPriority: cat.defaultPriority }
    });
  }

  // 5. Knowledge Categories & Initial Articles
  const gettingStartedCat = await db.knowledgeCategory.upsert({
    where: { slug: 'getting-started' },
    create: {
      name: 'Getting Started',
      slug: 'getting-started',
      description: 'First steps with EduERP, portal navigation, and profile settings',
      displayOrder: 1,
      icon: 'Rocket'
    },
    update: { name: 'Getting Started', description: 'First steps with EduERP, portal navigation, and profile settings' }
  });

  const sisCat = await db.knowledgeCategory.upsert({
    where: { slug: 'student-sis' },
    create: {
      name: 'Student SIS & Admissions',
      slug: 'student-sis',
      description: 'Managing student profiles, enrollment, public admissions and roll numbers',
      displayOrder: 2,
      icon: 'Users'
    },
    update: { name: 'Student SIS & Admissions' }
  });

  const financeCat = await db.knowledgeCategory.upsert({
    where: { slug: 'finance-fees' },
    create: {
      name: 'Fees & Accounting',
      slug: 'finance-fees',
      description: 'Fee schedules, student invoice generation, bKash collection and ledger reconciliation',
      displayOrder: 3,
      icon: 'DollarSign'
    },
    update: { name: 'Fees & Accounting' }
  });

  const examsCat = await db.knowledgeCategory.upsert({
    where: { slug: 'examinations-marks' },
    create: {
      name: 'Exams & Result Processing',
      slug: 'examinations-marks',
      description: 'Setting up exam terms, entering subject marks, grading policies and generating progress reports',
      displayOrder: 4,
      icon: 'Award'
    },
    update: { name: 'Exams & Result Processing' }
  });

  const lmsCat = await db.knowledgeCategory.upsert({
    where: { slug: 'academic-lms' },
    create: {
      name: 'Learning Management (LMS)',
      slug: 'academic-lms',
      description: 'Course spaces, online homework, quizzes, rubrics and digital gradebook',
      displayOrder: 5,
      icon: 'BookOpen'
    },
    update: { name: 'Learning Management (LMS)' }
  });

  const hrCat = await db.knowledgeCategory.upsert({
    where: { slug: 'hr-payroll' },
    create: {
      name: 'HR & Staff Payroll',
      slug: 'hr-payroll',
      description: 'Employee records, biometric punch logs, leave approvals and monthly salary generation',
      displayOrder: 6,
      icon: 'Briefcase'
    },
    update: { name: 'HR & Staff Payroll' }
  });

  // Seed Canonical Knowledge Articles
  const canonicalArticles = [
    {
      categoryId: gettingStartedCat.id,
      title: 'How to Log in to your Institution Portal',
      slug: 'how-to-login-institution-portal',
      summary: 'Learn how to authenticate securely with your assigned email, password, and institutional slug.',
      body: `### Logging into EduERP\n\n1. Visit **https://eduerp.us/login** or your institutional sub-domain (e.g. \`https://eduerp.us/demo-school/dashboard\`).\n2. Enter your registered email address and secure password.\n3. Click **Sign in to Portal**.\n4. You will be redirected directly to your institutional dashboard.\n\n> **Note:** If you are an administrator across multiple campuses, you can switch active campuses from the top header selector.`,
      tags: JSON.stringify(['login', 'authentication', 'account', 'password']),
      relatedModule: 'LOGIN',
      visibility: 'PUBLIC',
      isFeatured: true
    },
    {
      categoryId: sisCat.id,
      title: 'Adding and Managing Student Profiles in the SIS',
      slug: 'adding-and-managing-student-profiles',
      summary: 'Step-by-step guide to enrolling students, updating guardian info, and generating roll numbers.',
      body: `### Enrolling a New Student\n\n1. Navigate to **Students (SIS)** from the left sidebar.\n2. Click the **+ Register Student** button.\n3. Fill in the required biographical fields: Full Name, Date of Birth, Gender, Class/Grade, Section, and Guardian Contact.\n4. Click **Save & Enrol**.\n5. The student will instantly receive an automated Student ID (e.g. \`STU-2026-0001\`) and ledger account.`,
      tags: JSON.stringify(['students', 'sis', 'enrollment', 'guardian']),
      relatedModule: 'SIS',
      visibility: 'PUBLIC',
      isFeatured: true
    },
    {
      categoryId: sisCat.id,
      title: 'Managing the Online Admission & Enrollment Pipeline',
      slug: 'managing-online-admission-pipeline',
      summary: 'How to accept prospective applicant submissions, conduct admission screening, and admit candidates.',
      body: `### Online Admission Workflow\n\n1. Share your public admission URL: \`https://eduerp.us/apply/[tenant-slug]\`.\n2. Applicants submit their credentials and desired academic level.\n3. Review submitted applications in the **Online Admission** module.\n4. Update applicant status from \`APPLIED\` -> \`SHORTLISTED\` -> \`ADMITTED\`.\n5. Admitted students are automatically converted into permanent SIS student records with zero data re-entry.`,
      tags: JSON.stringify(['admission', 'applications', 'intake', 'enrollment']),
      relatedModule: 'ADMISSION',
      visibility: 'PUBLIC',
      isFeatured: true
    },
    {
      categoryId: financeCat.id,
      title: 'Generating Monthly Student Fee Invoices & bKash Collection',
      slug: 'generating-fee-invoices-and-bkash-collection',
      summary: 'Create structured fee items, disburse batch invoices to classes, and collect automated cashless payments.',
      body: `### Fee Invoicing & bKash Reconciliation\n\n1. Open the **Fees & Accounting** module.\n2. Click **Generate Batch Invoices**.\n3. Select your academic session, target grade/section, and fee schedule (Tuition, Lab, Exam Fee).\n4. Invoices are dispatched to parent portals with automated bKash Payment Links.\n5. When parents pay via bKash, transactions are instantly reconciled into your Double-Entry General Ledger.`,
      tags: JSON.stringify(['finance', 'fees', 'invoicing', 'bkash', 'payments']),
      relatedModule: 'FINANCE',
      visibility: 'PUBLIC',
      isFeatured: true
    },
    {
      categoryId: examsCat.id,
      title: 'Setting up Examination Terms and Publishing Marks',
      slug: 'setting-up-exam-terms-and-publishing-marks',
      summary: 'Configure exam schedules, enter component marks (Written, MCQ, Practical), and calculate GPA.',
      body: `### Examination & Marks Workflow\n\n1. Navigate to **Examination & Marks Engine**.\n2. Define your exam session (e.g. \`First Term Examination 2026\`).\n3. Assign subject marks distribution (e.g. 70 Written + 30 MCQ).\n4. Teachers enter marks per section with automated boundary validation.\n5. Click **Publish Results** to compute GPA and generate printable Grade Sheets and SMS transcripts.`,
      tags: JSON.stringify(['exams', 'marks', 'gpa', 'results', 'transcript']),
      relatedModule: 'EXAM',
      visibility: 'PUBLIC',
      isFeatured: true
    }
  ];

  for (const art of canonicalArticles) {
    await db.knowledgeArticle.upsert({
      where: { slug: art.slug },
      create: {
        ...art,
        publishedAt: new Date()
      },
      update: {
        title: art.title,
        summary: art.summary,
        body: art.body,
        tags: art.tags,
        relatedModule: art.relatedModule,
        visibility: art.visibility,
        isFeatured: art.isFeatured
      }
    });
  }

  // 6. FAQs
  const generalFaqCat = await db.faqCategory.upsert({
    where: { slug: 'general-faq' },
    create: { name: 'General Platform & Security', slug: 'general-faq', displayOrder: 1 },
    update: { name: 'General Platform & Security' }
  });

  const faqs = [
    {
      categoryId: generalFaqCat.id,
      question: 'How do I log in to my institution portal?',
      answer: 'Visit https://eduerp.us/login, enter your institutional email and password. You will be routed to your institution dashboard directly.',
      relatedModule: 'LOGIN',
      displayOrder: 1
    },
    {
      categoryId: generalFaqCat.id,
      question: 'How do I reset my account password?',
      answer: 'Contact your Institution Super Admin or Principal to reset your password, or reach out to EduERP Technical Support via the Support Ticket portal.',
      relatedModule: 'LOGIN',
      displayOrder: 2
    },
    {
      categoryId: generalFaqCat.id,
      question: 'How do I add a new student into the SIS?',
      answer: 'Navigate to Students (SIS) from your sidebar and click + Register Student. Fill in the student details and save.',
      relatedModule: 'SIS',
      displayOrder: 3
    },
    {
      categoryId: generalFaqCat.id,
      question: 'How does the Online Admission engine work?',
      answer: 'Prospective students fill out the public admission form at /apply/[tenant-slug]. Admissions officers can review and admit candidates with one click.',
      relatedModule: 'ADMISSION',
      displayOrder: 4
    },
    {
      categoryId: generalFaqCat.id,
      question: 'How do I open a support ticket for help?',
      answer: 'Go to https://eduerp.us/support/tickets/new or click the Help & Support button in the bottom navigation. Describe your issue and our team will respond promptly.',
      relatedModule: 'OTHER',
      displayOrder: 5
    }
  ];

  for (const faq of faqs) {
    const existing = await db.faqItem.findFirst({
      where: { question: faq.question }
    });
    if (!existing) {
      await db.faqItem.create({ data: faq });
    }
  }

  // 7. Release Notes
  const releaseNotes = [
    {
      version: 'v1.1.0',
      title: 'EduERP 1.1.0 — Client Success, Training Academy & Support Ticketing',
      slug: 'eduerp-1-1-0-client-success-and-support',
      summary: 'Complete Help Center, Knowledge Base CMS, Training Academy certification, and Two-Way Support Ticketing.',
      newFeatures: JSON.stringify([
        'Public Help Center and Knowledge Base with full-text search',
        'EduERP Training Academy with role-based curricula and automated certification',
        'Two-Way Support Ticketing system with concurrency-safe sequence generation',
        'Internal Support Notes with strict multi-tenant isolation',
        'Official Vento Technology Nikunja-2 Contact Center and dynamic contact configuration'
      ]),
      improvements: JSON.stringify([
        'Multi-tenant friendly alias canonical routing engine (dims, cmc, rmsc, duim, mub, dpi, btva, nipt)',
        'Enhanced SLA policy tracking and automatic response due date computation',
        'CSAT rating workflow upon ticket resolution'
      ]),
      bugFixes: JSON.stringify([
        'Resolved cross-tab branding sync race in TenantProvider',
        'Unified navigation route slugs across all vertical modules'
      ])
    }
  ];

  for (const rn of releaseNotes) {
    await db.releaseNote.upsert({
      where: { version: rn.version },
      create: rn,
      update: rn
    });
  }

  // 8. Canonical Training Academy Programs
  const trainingPrograms = [
    {
      title: 'EduERP Getting Started & Core Fundamentals',
      slug: 'eduerp-getting-started',
      description: 'Comprehensive orientation covering portal access, user roles, daily workflows, and multi-tenant security.',
      audience: 'All Institutional Staff',
      targetRole: 'ALL',
      difficulty: 'BEGINNER',
      durationMinutes: 45,
      modules: [
        {
          title: 'System Orientation & Security',
          displayOrder: 1,
          lessons: [
            {
              title: 'Navigating the EduERP Workspace',
              slug: 'navigating-eduerp-workspace',
              content: '### Overview of the Unified Navigation\n\nLearn how to access your institutional modules, filter by active academic sessions, and leverage the AI copilot.',
              durationMinutes: 15,
              displayOrder: 1
            },
            {
              title: 'Account Security & Password Hygiene',
              slug: 'account-security-hygiene',
              content: '### Securing Your Portal Account\n\nBest practices for password management, multi-device sign-in, and role-based data privacy.',
              durationMinutes: 15,
              displayOrder: 2
            }
          ]
        }
      ]
    },
    {
      title: 'Institution Administrator Essentials',
      slug: 'institution-administrator-essentials',
      description: 'Complete masterclass on configuring academic years, campus profiles, grading formulas, and user roles.',
      audience: 'Principals & Institution Admins',
      targetRole: 'PRINCIPAL',
      difficulty: 'INTERMEDIATE',
      durationMinutes: 90,
      modules: [
        {
          title: 'Academic Structure Configuration',
          displayOrder: 1,
          lessons: [
            {
              title: 'Configuring Classes, Sections & Shifts',
              slug: 'configuring-classes-and-sections',
              content: '### Defining Classes and Shift Allocations\n\nStep-by-step instructions on setting up Morning/Day shifts, class capacities, and section mappings.',
              durationMinutes: 25,
              displayOrder: 1
            }
          ]
        }
      ]
    },
    {
      title: 'Admission Officer Training',
      slug: 'admission-officer-training',
      description: 'Mastering public application review, intake screening, quota management, and enrollment conversions.',
      audience: 'Admissions & Enrollment Teams',
      targetRole: 'ADMISSION_OFFICER',
      difficulty: 'BEGINNER',
      durationMinutes: 60,
      modules: [
        {
          title: 'Managing the Online Intake Funnel',
          displayOrder: 1,
          lessons: [
            {
              title: 'Processing Applications & Document Verification',
              slug: 'processing-applications-verification',
              content: '### Verification Guidelines\n\nVerifying birth certificates, previous grade transcripts, and shortlisting prospective students.',
              durationMinutes: 30,
              displayOrder: 1
            }
          ]
        }
      ]
    },
    {
      title: 'Teacher & Classroom Educator Training',
      slug: 'teacher-classroom-training',
      description: 'Effective teaching with EduERP: attendance taking, digital lesson planning, homework assignments, and marks entry.',
      audience: 'Teachers & Faculty',
      targetRole: 'TEACHER',
      difficulty: 'BEGINNER',
      durationMinutes: 75,
      modules: [
        {
          title: 'Daily Classroom Operations',
          displayOrder: 1,
          lessons: [
            {
              title: 'Taking Daily Attendance and Recording Absences',
              slug: 'daily-attendance-and-absences',
              content: '### Attendance Ingestion\n\nMarking present, late, and excused absences with automated SMS notifications to guardians.',
              durationMinutes: 20,
              displayOrder: 1
            }
          ]
        }
      ]
    },
    {
      title: 'Finance & Accounts Officer Training',
      slug: 'finance-accounts-training',
      description: 'Mastering fee structures, monthly billing runs, bKash gateway reconciliation, scholarships, and staff payroll.',
      audience: 'Accountants & Finance Managers',
      targetRole: 'ACCOUNTANT',
      difficulty: 'ADVANCED',
      durationMinutes: 120,
      modules: [
        {
          title: 'Fee Cycles & General Ledger',
          displayOrder: 1,
          lessons: [
            {
              title: 'Double-Entry Accounting & Fee Disbursal',
              slug: 'double-entry-accounting-fee-disbursal',
              content: '### Double Entry Principles in EduERP\n\nHow fee invoices generate Debit Accounts Receivable and Credit Tuition Revenue automatically.',
              durationMinutes: 40,
              displayOrder: 1
            }
          ]
        }
      ]
    }
  ];

  for (const prog of trainingPrograms) {
    const course = await db.trainingCourse.upsert({
      where: { slug: prog.slug },
      create: {
        title: prog.title,
        slug: prog.slug,
        description: prog.description,
        audience: prog.audience,
        targetRole: prog.targetRole,
        difficulty: prog.difficulty,
        durationMinutes: prog.durationMinutes
      },
      update: {
        title: prog.title,
        description: prog.description,
        audience: prog.audience,
        targetRole: prog.targetRole,
        difficulty: prog.difficulty,
        durationMinutes: prog.durationMinutes
      }
    });

    for (const mod of prog.modules) {
      const createdMod = await db.trainingModule.create({
        data: {
          courseId: course.id,
          title: mod.title,
          displayOrder: mod.displayOrder
        }
      });

      for (const les of mod.lessons) {
        await db.trainingLesson.create({
          data: {
            moduleId: createdMod.id,
            title: les.title,
            slug: les.slug,
            content: les.content,
            durationMinutes: les.durationMinutes,
            displayOrder: les.displayOrder
          }
        });
      }
    }
  }

  console.log('✅ EduERP Client Success, Help, Training & Support successfully seeded.');
}
