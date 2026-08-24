import {
  StudentSISProfile,
  AttendanceRecordItem,
  StudentReportCard,
  UniversityTranscript,
  HifzProgressEntry,
  FeeInvoiceItem,
  ChartOfAccountModel,
  JournalVoucherModel,
  EmployeeProfile,
  LibraryBookModel,
  TransportRouteModel,
  HostelRoomModel,
  ResearchProjectModel,
  ThesisDefenseModel,
  AdmissionApplicantModel
} from './types';

// ==========================================
// 1. SaaS Platform Super Admin Metrics & Plans
// ==========================================

export const SAAS_PLATFORM_STATS = {
  totalInstitutions: 48,
  activeSubscriptions: 45,
  trialInstitutions: 3,
  totalStudentsPlatform: 64500,
  totalTeachersPlatform: 3420,
  monthlyRecurringRevenueUSD: 38400,
  monthlyRecurringRevenueBDT: 4416000,
  annualRecurringRevenueUSD: 460800,
  systemUptime: '99.98%',
  totalSmsSentMonth: 482000,
  cloudStorageUsedTB: 14.8
};

export const SAAS_SUBSCRIPTION_PLANS = [
  {
    id: 'plan-starter',
    name: 'Starter Tier',
    priceBdtMonth: 4500,
    priceUsdMonth: 45,
    studentLimit: 500,
    campusLimit: 1,
    storageGb: 20,
    smsIncluded: 2000,
    targetAudience: 'Small Kindergartens, Madrasahs & Coaching Centers',
    modules: ['Student SIS', 'Manual/QR Attendance', 'Fees & Due Invoices', 'Basic Exams & Grade Cards', 'SMS Gateway']
  },
  {
    id: 'plan-pro',
    name: 'Professional Tier',
    priceBdtMonth: 12500,
    priceUsdMonth: 120,
    studentLimit: 2500,
    campusLimit: 3,
    storageGb: 100,
    smsIncluded: 10000,
    targetAudience: 'High Schools, Colleges & Medium Madrasahs',
    badge: 'Most Popular',
    modules: [
      'Everything in Starter',
      'Double-Entry Accounting & Ledger',
      'HR & Payroll Generator',
      'Library & Barcode Circulation',
      'Transport GPS Simulation',
      'Hostel Room Management',
      'Parent & Student Mobile Portal',
      'Public Certificate Verification'
    ]
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise Tier',
    priceBdtMonth: 28000,
    priceUsdMonth: 270,
    studentLimit: 10000,
    campusLimit: 10,
    storageGb: 1000,
    smsIncluded: 50000,
    targetAudience: 'Universities, Polytechnic Groups & Multi-Campus Institutions',
    modules: [
      'Everything in Professional',
      'University Credit-Hour & Add/Drop Engine',
      'Thesis Defense & Research Grants',
      'Madrasha 30-Para Hifzul Quran Engine',
      'LMS Video Lessons & Online Classes',
      'AI Management Copilot & Predictive Analytics',
      'Dynamic Form & Custom Report Builder',
      'Custom Domain White-Label & Dedicated API SLA'
    ]
  }
];

// ==========================================
// 2. School Students & SIS Profiles (Dhaka Ideal School)
// ==========================================

export const SCHOOL_STUDENTS: StudentSISProfile[] = [
  {
    id: 'STD-SCH-001',
    studentIdNumber: 'DIMS-2026-0101',
    admissionNumber: 'ADM-2024-0012',
    rollNumber: '01',
    registrationNumber: 'REG-DH-8891024',
    firstName: 'Tahmid',
    lastName: 'Rahman',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    dateOfBirth: '2010-04-15',
    gender: 'Male',
    bloodGroup: 'B+',
    religion: 'Islam',
    nationality: 'Bangladeshi',
    nidBirthCertNumber: '20102692019481023',
    presentAddress: 'House 42, Road 7, Motijheel C/A, Dhaka-1000',
    permanentAddress: 'Village: Rupganj, Narayanganj',
    phone: '+880 1711-234567',
    email: 'tahmid.rahman@dims.edu.bd',
    campusName: 'Main Campus (Motijheel)',
    className: 'Grade 9',
    sectionName: 'Section Green',
    shift: 'Morning Shift',
    group: 'Science',
    academicStatus: 'ACTIVE',
    totalDues: 0,
    attendanceRate: 96.5,
    currentGpaOrCgpa: 5.0,
    guardian: {
      name: 'Engr. Mahbubur Rahman',
      phone: '+880 1819-876543',
      relation: 'Father',
      occupation: 'Civil Engineer',
      email: 'mahbub.rahman@gmail.com'
    },
    disciplineIncidentsCount: 0
  },
  {
    id: 'STD-SCH-002',
    studentIdNumber: 'DIMS-2026-0102',
    admissionNumber: 'ADM-2024-0015',
    rollNumber: '02',
    registrationNumber: 'REG-DH-8891025',
    firstName: 'Nusrat',
    lastName: 'Jahan',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
    dateOfBirth: '2010-08-22',
    gender: 'Female',
    bloodGroup: 'O+',
    religion: 'Islam',
    nationality: 'Bangladeshi',
    nidBirthCertNumber: '20102692019481029',
    presentAddress: 'Flat 4B, Shantinagar Plaza, Dhaka-1217',
    permanentAddress: 'Munshiganj Sadar',
    phone: '+880 1712-345678',
    email: 'nusrat.jahan@dims.edu.bd',
    campusName: 'Main Campus (Motijheel)',
    className: 'Grade 9',
    sectionName: 'Section Green',
    shift: 'Morning Shift',
    group: 'Science',
    academicStatus: 'ACTIVE',
    totalDues: 2500,
    attendanceRate: 94.2,
    currentGpaOrCgpa: 4.88,
    guardian: {
      name: 'Dr. Jahanara Begum',
      phone: '+880 1911-123456',
      relation: 'Mother',
      occupation: 'Physician'
    },
    disciplineIncidentsCount: 0
  },
  {
    id: 'STD-SCH-003',
    studentIdNumber: 'DIMS-2026-0103',
    admissionNumber: 'ADM-2024-0089',
    rollNumber: '14',
    registrationNumber: 'REG-DH-8891090',
    firstName: 'Rahim',
    lastName: 'Chowdhury',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
    dateOfBirth: '2010-02-10',
    gender: 'Male',
    bloodGroup: 'A+',
    religion: 'Islam',
    nationality: 'Bangladeshi',
    nidBirthCertNumber: '20102692019481099',
    presentAddress: '24 Kakrail Road, Dhaka-1000',
    permanentAddress: 'Feni Sadar',
    phone: '+880 1713-987654',
    email: 'rahim.c@dims.edu.bd',
    campusName: 'Main Campus (Motijheel)',
    className: 'Grade 9',
    sectionName: 'Section Red',
    shift: 'Day Shift',
    group: 'Science',
    academicStatus: 'ACTIVE',
    totalDues: 7200,
    attendanceRate: 67.5,
    currentGpaOrCgpa: 2.85,
    guardian: {
      name: 'Kamal Chowdhury',
      phone: '+880 1817-009988',
      relation: 'Father',
      occupation: 'Businessman'
    },
    disciplineIncidentsCount: 2
  }
];

// ==========================================
// 3. Madrasha Students & Hifzul Quran Records
// ==========================================

export const MADRASHA_STUDENTS: StudentSISProfile[] = [
  {
    id: 'STD-MAD-001',
    studentIdNumber: 'AIMC-2026-H01',
    admissionNumber: 'HIFZ-2023-04',
    rollNumber: '05',
    firstName: 'Muhammad',
    lastName: 'Abdullah',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    dateOfBirth: '2012-05-10',
    gender: 'Male',
    bloodGroup: 'A+',
    religion: 'Islam',
    nationality: 'Bangladeshi',
    nidBirthCertNumber: '20122692019480011',
    presentAddress: 'Al-Jamiatul Islamia Complex Hostel, Lalbagh, Dhaka',
    permanentAddress: 'Brahmanbaria Sadar',
    phone: '+880 1715-112233',
    email: 'abdullah@aimc.edu.bd',
    campusName: 'Main Madrasha & Hifz Complex',
    className: 'Dakhil 8th',
    sectionName: 'Halqa Al-Furqan',
    shift: 'Morning Shift',
    academicStatus: 'ACTIVE',
    totalDues: 0,
    attendanceRate: 98.4,
    currentGpaOrCgpa: 5.0,
    guardian: {
      name: 'Moulana Habibur Rahman',
      phone: '+880 1819-334455',
      relation: 'Father',
      occupation: 'Imam & Scholar'
    },
    hifzStats: {
      totalParasMemorized: 22,
      currentSurah: 'Surah Maryam (سورة مريم)',
      currentAyat: 45,
      dailySabakStatus: 'Completed',
      dourParaRange: 'Para 1 - 10'
    },
    disciplineIncidentsCount: 0
  },
  {
    id: 'STD-MAD-002',
    studentIdNumber: 'AIMC-2026-H02',
    admissionNumber: 'HIFZ-2024-11',
    rollNumber: '12',
    firstName: 'Huzaifa',
    lastName: 'Ibn Tariq',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    dateOfBirth: '2013-09-14',
    gender: 'Male',
    bloodGroup: 'B+',
    religion: 'Islam',
    nationality: 'Bangladeshi',
    nidBirthCertNumber: '20132692019480045',
    presentAddress: 'Lalbagh Fort Road, Dhaka-1211',
    permanentAddress: 'Cumilla',
    phone: '+880 1716-445566',
    email: 'huzaifa@aimc.edu.bd',
    campusName: 'Main Madrasha & Hifz Complex',
    className: 'Hifzul Quran Department',
    sectionName: 'Halqa Abu Bakr (R)',
    shift: 'Morning Shift',
    academicStatus: 'ACTIVE',
    totalDues: 1800,
    attendanceRate: 92.0,
    currentGpaOrCgpa: 4.75,
    guardian: {
      name: 'Tariqul Islam',
      phone: '+880 1912-778899',
      relation: 'Father',
      occupation: 'Islamic Book Publisher'
    },
    hifzStats: {
      totalParasMemorized: 14.5,
      currentSurah: 'Surah Al-Isra (سورة الإسراء)',
      currentAyat: 70,
      dailySabakStatus: 'Pending',
      dourParaRange: 'Para 1 - 7'
    },
    disciplineIncidentsCount: 0
  }
];

export const HIFZ_DAILY_ENTRIES: HifzProgressEntry[] = [
  {
    id: 'HIFZ-REC-01',
    studentId: 'STD-MAD-001',
    studentName: 'Muhammad Abdullah',
    date: '2026-08-24',
    sabakPara: 23,
    sabakSurah: 'Surah Maryam (سورة مريم)',
    sabakAyatStart: 35,
    sabakAyatEnd: 55,
    sabakRating: 'Mumtaz (Excellent)',
    sabkiPara: 22,
    sabkiPages: 4,
    dourParaRange: 'Para 8 - 10',
    totalParasCompleted: 22.5,
    ustadNotes: 'MashaAllah, Tajweed and Makhraj recitation are crisp and highly accurate.'
  },
  {
    id: 'HIFZ-REC-02',
    studentId: 'STD-MAD-002',
    studentName: 'Huzaifa Ibn Tariq',
    date: '2026-08-24',
    sabakPara: 15,
    sabakSurah: 'Surah Al-Kahf (سورة الكهف)',
    sabakAyatStart: 1,
    sabakAyatEnd: 20,
    sabakRating: 'Jayyid Jiddan (Very Good)',
    sabkiPara: 14,
    sabkiPages: 2,
    dourParaRange: 'Para 3 - 5',
    totalParasCompleted: 14.5,
    ustadNotes: 'Focus on Madd elongation in Surah Al-Kahf verses 14-18.'
  }
];

// ==========================================
// 4. University Students, Transcripts & Thesis (MUST)
// ==========================================

export const UNIVERSITY_STUDENTS: StudentSISProfile[] = [
  {
    id: 'STD-UNI-001',
    studentIdNumber: 'MUST-2023-CSE-0042',
    admissionNumber: 'UNI-ADM-2023-019',
    rollNumber: '042',
    registrationNumber: 'UGC-MUST-2023-8821',
    firstName: 'Tanveer',
    lastName: 'Ahmed',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
    dateOfBirth: '2003-11-04',
    gender: 'Male',
    bloodGroup: 'AB+',
    religion: 'Islam',
    nationality: 'Bangladeshi',
    nidBirthCertNumber: '20032692019481992',
    presentAddress: 'Bashundhara R/A, Block C, Dhaka-1229',
    permanentAddress: 'Sylhet Sadar',
    phone: '+880 1718-554433',
    email: 'tanveer.cse@must.edu.bd',
    campusName: 'Main Campus (Bashundhara)',
    programName: 'BSc in Computer Science & Engineering',
    departmentName: 'Department of CSE',
    batchName: 'Batch 2023 (Spring)',
    currentSemester: 'Semester 7',
    academicStatus: 'ACTIVE',
    totalDues: 0,
    attendanceRate: 91.5,
    currentGpaOrCgpa: 3.86,
    guardian: {
      name: 'Faruk Ahmed',
      phone: '+880 1819-223344',
      relation: 'Father',
      occupation: 'Bank Executive'
    },
    disciplineIncidentsCount: 0
  },
  {
    id: 'STD-UNI-002',
    studentIdNumber: 'MUST-2024-BBA-0105',
    admissionNumber: 'UNI-ADM-2024-112',
    rollNumber: '105',
    registrationNumber: 'UGC-MUST-2024-9102',
    firstName: 'Sumaiya',
    lastName: 'Akter',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
    dateOfBirth: '2004-03-19',
    gender: 'Female',
    bloodGroup: 'O+',
    religion: 'Islam',
    nationality: 'Bangladeshi',
    nidBirthCertNumber: '20042692019487721',
    presentAddress: 'Uttara Sector 7, Dhaka-1230',
    permanentAddress: 'Gazipur',
    phone: '+880 1719-887766',
    email: 'sumaiya.bba@must.edu.bd',
    campusName: 'Main Campus (Bashundhara)',
    programName: 'Bachelor of Business Administration (BBA)',
    departmentName: 'Department of Business Administration',
    batchName: 'Batch 2024 (Fall)',
    currentSemester: 'Semester 4',
    academicStatus: 'ACTIVE',
    totalDues: 18500,
    attendanceRate: 88.0,
    currentGpaOrCgpa: 3.65,
    guardian: {
      name: 'Abdul Matin',
      phone: '+880 1913-445566',
      relation: 'Father',
      occupation: 'Entrepreneur'
    },
    disciplineIncidentsCount: 0
  }
];

export const UNIVERSITY_TRANSCRIPT_SAMPLE: UniversityTranscript = {
  studentId: 'STD-UNI-001',
  studentName: 'Tanveer Ahmed',
  studentIdNumber: 'MUST-2023-CSE-0042',
  program: 'Bachelor of Science in Computer Science & Engineering (BSc in CSE)',
  department: 'Department of Computer Science & Engineering',
  faculty: 'Faculty of Science & Engineering',
  admissionSemester: 'Spring 2023',
  totalCreditsRequired: 144,
  totalCreditsCompleted: 112,
  finalCgpa: 3.86,
  degreeStatus: 'IN_PROGRESS',
  verificationCode: 'VRF-MUST-8821-CSE',
  semesters: [
    {
      semesterName: 'Semester 1 (Spring 2023)',
      semesterCreditsEarned: 16,
      semesterGpa: 3.92,
      cumulativeCreditsEarned: 16,
      cgpa: 3.92,
      courses: [
        { courseCode: 'CSE-101', courseTitle: 'Structured Programming Language', creditHours: 3.0, gradePoint: 4.0, letterGrade: 'A+' },
        { courseCode: 'CSE-102', courseTitle: 'Structured Programming Lab', creditHours: 1.5, gradePoint: 4.0, letterGrade: 'A+' },
        { courseCode: 'MATH-101', courseTitle: 'Differential & Integral Calculus', creditHours: 3.0, gradePoint: 4.0, letterGrade: 'A+' },
        { courseCode: 'PHY-101', courseTitle: 'Physics: Waves & Electromagnetism', creditHours: 3.0, gradePoint: 3.75, letterGrade: 'A' },
        { courseCode: 'ENG-101', courseTitle: 'English Communication & Writing', creditHours: 3.0, gradePoint: 3.75, letterGrade: 'A' }
      ]
    },
    {
      semesterName: 'Semester 2 (Summer 2023)',
      semesterCreditsEarned: 16.5,
      semesterGpa: 3.84,
      cumulativeCreditsEarned: 32.5,
      cgpa: 3.88,
      courses: [
        { courseCode: 'CSE-103', courseTitle: 'Data Structures & Algorithms', creditHours: 3.0, gradePoint: 4.0, letterGrade: 'A+' },
        { courseCode: 'CSE-104', courseTitle: 'Data Structures Lab', creditHours: 1.5, gradePoint: 4.0, letterGrade: 'A+' },
        { courseCode: 'MATH-103', courseTitle: 'Discrete Mathematics', creditHours: 3.0, gradePoint: 3.75, letterGrade: 'A' },
        { courseCode: 'EEE-101', courseTitle: 'Basic Electrical Engineering', creditHours: 3.0, gradePoint: 3.5, letterGrade: 'A-' }
      ]
    },
    {
      semesterName: 'Semester 6 (Spring 2026)',
      semesterCreditsEarned: 18,
      semesterGpa: 3.88,
      cumulativeCreditsEarned: 112,
      cgpa: 3.86,
      courses: [
        { courseCode: 'CSE-301', courseTitle: 'Database Management Systems', creditHours: 3.0, gradePoint: 4.0, letterGrade: 'A+' },
        { courseCode: 'CSE-302', courseTitle: 'Database Lab', creditHours: 1.5, gradePoint: 4.0, letterGrade: 'A+' },
        { courseCode: 'CSE-305', courseTitle: 'Operating Systems & Concurrency', creditHours: 3.0, gradePoint: 3.75, letterGrade: 'A' },
        { courseCode: 'CSE-307', courseTitle: 'Software Engineering & Design Patterns', creditHours: 3.0, gradePoint: 4.0, letterGrade: 'A+' },
        { courseCode: 'CSE-310', courseTitle: 'Artificial Intelligence & Machine Learning', creditHours: 3.0, gradePoint: 3.75, letterGrade: 'A' }
      ]
    }
  ]
};

export const THESIS_DEFENSE_RECORDS: ThesisDefenseModel[] = [
  {
    id: 'THESIS-01',
    studentName: 'Tanveer Ahmed',
    studentIdNumber: 'MUST-2023-CSE-0042',
    program: 'BSc in CSE',
    thesisTitle: 'Deep Learning Architectures for Automated Bengali OCR and Document Classification',
    supervisorName: 'Prof. Dr. Nusrat Jahan',
    defenseDate: '2026-09-15',
    defenseStatus: 'SCHEDULED',
    plagiarismPercent: 4.2
  },
  {
    id: 'THESIS-02',
    studentName: 'Rakibul Hasan',
    studentIdNumber: 'MUST-2022-CSE-0018',
    program: 'BSc in CSE',
    thesisTitle: 'Decentralized Micro-Grid Energy Trading via Ethereum Smart Contracts',
    supervisorName: 'Dr. Shahadat Hossain',
    defenseDate: '2026-08-10',
    defenseStatus: 'DEFENDED_PASSED',
    plagiarismPercent: 6.1,
    score: 92.5
  }
];

export const RESEARCH_PROJECTS: ResearchProjectModel[] = [
  {
    id: 'RES-MUST-01',
    title: 'Development of Multi-Modal Edge AI Diagnostic Platform for Rural Healthcare',
    principalInvestigator: 'Prof. Dr. Anwar Hossain Choudhury',
    department: 'CSE & Biomedical Engineering',
    fundingAgency: 'ICT Division, Government of Bangladesh (Innovation Fund)',
    grantAmount: 3500000,
    startDate: '2025-01-01',
    status: 'ONGOING',
    publicationsCount: 4
  },
  {
    id: 'RES-MUST-02',
    title: 'High-Efficiency Perovskite Solar Cell Optimization using Nanomaterial Thin Films',
    principalInvestigator: 'Dr. M. K. Alam',
    department: 'Department of EEE',
    fundingAgency: 'World Bank Higher Education Enhancement Project (HEQEP)',
    grantAmount: 5000000,
    startDate: '2024-06-01',
    status: 'ONGOING',
    publicationsCount: 6
  }
];

// ==========================================
// 5. School Report Cards (Sample Branded Result)
// ==========================================

export const SCHOOL_REPORT_CARD_SAMPLE: StudentReportCard = {
  studentId: 'STD-SCH-001',
  studentName: 'Tahmid Rahman',
  studentIdNumber: 'DIMS-2026-0101',
  rollNumber: '01',
  className: 'Grade 9',
  sectionName: 'Section Green (Morning Shift)',
  examName: 'Midterm Examination 2026',
  academicYear: '2026',
  totalFullMarks: 700,
  totalObtainedMarks: 662,
  gpa: 5.0,
  overallGrade: 'A+',
  classPosition: 1,
  totalStudentsInSection: 42,
  attendanceRate: 96.5,
  remarks: 'Exceptional academic excellence and exemplary classroom conduct.',
  verificationCode: 'VRF-DIMS-9041-A1',
  issueDate: '2026-08-20',
  subjects: [
    { subjectCode: '101', subjectName: 'Bangla 1st Paper', fullMarks: 100, obtainedTheory: 65, obtainedPractical: 0, obtainedAssignment: 18, obtainedAttendance: 10, totalObtained: 93, letterGrade: 'A+', gradePoint: 5.0, isPassed: true },
    { subjectCode: '107', subjectName: 'English 1st Paper', fullMarks: 100, obtainedTheory: 64, obtainedPractical: 0, obtainedAssignment: 17, obtainedAttendance: 10, totalObtained: 91, letterGrade: 'A+', gradePoint: 5.0, isPassed: true },
    { subjectCode: '109', subjectName: 'Mathematics', fullMarks: 100, obtainedTheory: 70, obtainedPractical: 0, obtainedAssignment: 20, obtainedAttendance: 10, totalObtained: 100, letterGrade: 'A+', gradePoint: 5.0, isPassed: true },
    { subjectCode: '136', subjectName: 'Physics', fullMarks: 100, obtainedTheory: 48, obtainedPractical: 25, obtainedAssignment: 18, obtainedAttendance: 9, totalObtained: 100, letterGrade: 'A+', gradePoint: 5.0, isPassed: true },
    { subjectCode: '137', subjectName: 'Chemistry', fullMarks: 100, obtainedTheory: 46, obtainedPractical: 24, obtainedAssignment: 18, obtainedAttendance: 10, totalObtained: 98, letterGrade: 'A+', gradePoint: 5.0, isPassed: true },
    { subjectCode: '138', subjectName: 'Biology', fullMarks: 100, obtainedTheory: 44, obtainedPractical: 23, obtainedAssignment: 16, obtainedAttendance: 9, totalObtained: 92, letterGrade: 'A+', gradePoint: 5.0, isPassed: true },
    { subjectCode: '154', subjectName: 'Information & Comm. Tech (ICT)', fullMarks: 100, obtainedTheory: 45, obtainedPractical: 25, obtainedAssignment: 18, obtainedAttendance: 10, totalObtained: 98, letterGrade: 'A+', gradePoint: 5.0, isPassed: true }
  ]
};

// ==========================================
// 6. Invoices, Fees & Double-Entry Accounting
// ==========================================

export const INVOICES_DATA: FeeInvoiceItem[] = [
  {
    id: 'INV-2026-001',
    invoiceNumber: 'INV-2026-00812',
    studentId: 'STD-SCH-001',
    studentName: 'Tahmid Rahman',
    studentIdNumber: 'DIMS-2026-0101',
    title: 'Monthly Tuition & Science Lab Fee - August 2026',
    subTotal: 3500,
    discount: 0,
    fine: 0,
    total: 3500,
    paid: 3500,
    due: 0,
    dueDate: '2026-08-15',
    status: 'PAID',
    items: [
      { description: 'Monthly Tuition Fee', amount: 2800 },
      { description: 'Physics & Chemistry Lab Maintenance', amount: 500 },
      { description: 'Digital LMS & ICT Access', amount: 200 }
    ]
  },
  {
    id: 'INV-2026-002',
    invoiceNumber: 'INV-2026-00813',
    studentId: 'STD-SCH-002',
    studentName: 'Nusrat Jahan',
    studentIdNumber: 'DIMS-2026-0102',
    title: 'Monthly Tuition & Transport Fee - August 2026',
    subTotal: 4500,
    discount: 500,
    fine: 0,
    total: 4000,
    paid: 1500,
    due: 2500,
    dueDate: '2026-08-28',
    status: 'PARTIALLY_PAID',
    items: [
      { description: 'Monthly Tuition Fee', amount: 2800 },
      { description: 'Air-Conditioned Transport Route 3 (Shantinagar)', amount: 1700 }
    ]
  },
  {
    id: 'INV-2026-003',
    invoiceNumber: 'INV-2026-00814',
    studentId: 'STD-SCH-003',
    studentName: 'Rahim Chowdhury',
    studentIdNumber: 'DIMS-2026-0103',
    title: 'Quarterly Tuition & Sports Development Fee',
    subTotal: 7200,
    discount: 0,
    fine: 350,
    total: 7550,
    paid: 0,
    due: 7550,
    dueDate: '2026-08-10',
    status: 'OVERDUE',
    items: [
      { description: 'Tuition Fee (June, July, August)', amount: 6000 },
      { description: 'Annual Sports & Gymnasium Fee', amount: 1200 }
    ]
  }
];

export const CHART_OF_ACCOUNTS: ChartOfAccountModel[] = [
  { id: 'COA-1001', code: '1001', name: 'Cash on Hand (Treasury)', type: 'ASSET', balance: 1485000 },
  { id: 'COA-1002', code: '1002', name: 'City Bank Institutional Operating A/C', type: 'ASSET', balance: 18450000 },
  { id: 'COA-1003', code: '1003', name: 'bKash Merchant Gateway Escrow', type: 'ASSET', balance: 3420000 },
  { id: 'COA-1004', code: '1004', name: 'Nagad Corporate Gateway Settlement', type: 'ASSET', balance: 1890000 },
  { id: 'COA-1005', code: '1005', name: 'Student Tuition Fees Receivable (Dues)', type: 'ASSET', balance: 720500 },
  { id: 'COA-2001', code: '2001', name: 'Accounts Payable (Vendors & Books)', type: 'LIABILITY', balance: 450000 },
  { id: 'COA-2002', code: '2002', name: 'Employee Provident Fund (PF) Liability', type: 'LIABILITY', balance: 2840000 },
  { id: 'COA-3001', code: '3001', name: 'Institutional Endowment / Trustee Capital', type: 'EQUITY', balance: 25000000 },
  { id: 'COA-4001', code: '4001', name: 'Student Tuition & Admission Revenue', type: 'REVENUE', balance: 14820000 },
  { id: 'COA-4002', code: '4002', name: 'Hostel & Transport Operations Revenue', type: 'REVENUE', balance: 3840000 },
  { id: 'COA-5001', code: '5001', name: 'Faculty & Employee Salaries', type: 'EXPENSE', balance: 8450000 },
  { id: 'COA-5002', code: '5002', name: 'Campus Utilities & High-speed Internet', type: 'EXPENSE', balance: 640000 }
];

export const JOURNAL_VOUCHERS: JournalVoucherModel[] = [
  {
    id: 'VOUCH-2026-081',
    voucherNumber: 'JV-2026-081',
    date: '2026-08-24',
    description: 'bKash online fee collection settlement for Grade 9-10 tuition invoices',
    debitAccount: '1003 - bKash Merchant Gateway Escrow',
    creditAccount: '4001 - Student Tuition & Admission Revenue',
    amount: 384500,
    approvedBy: 'Mustafizur Rahman (Accounts Officer)'
  },
  {
    id: 'VOUCH-2026-082',
    voucherNumber: 'JV-2026-082',
    date: '2026-08-23',
    description: 'Physics & Chemistry lab glassware & reagent replenishment purchase',
    debitAccount: '5002 - Campus Utilities & Lab Maintenance',
    creditAccount: '1002 - City Bank Operating A/C',
    amount: 125000,
    approvedBy: 'Dr. Rafiqul Islam (Principal)'
  }
];

// ==========================================
// 7. HR, Employees & Faculty Ranks
// ==========================================

export const EMPLOYEES_DATA: EmployeeProfile[] = [
  {
    id: 'EMP-001',
    employeeCode: 'EMP-T-010',
    name: 'Prof. Mohammad Rafiqul Islam',
    designation: 'Principal / Head of Institution',
    department: 'Administration & Academic Council',
    category: 'TEACHING',
    academicRank: 'Professor',
    joiningDate: '2015-01-10',
    basicSalary: 95000,
    phone: '+880 1711-001122',
    email: 'principal@dims.edu.bd',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
    attendanceRate: 98.2,
    weeklyTeachingHours: 6,
    publicationsCount: 12,
    leavesBalance: { casual: 10, sick: 14, annual: 20 }
  },
  {
    id: 'EMP-002',
    employeeCode: 'EMP-T-018',
    name: 'Tariqul Islam',
    designation: 'Senior Teacher (Mathematics)',
    department: 'Department of Mathematics',
    category: 'TEACHING',
    academicRank: 'Senior Lecturer',
    joiningDate: '2018-07-01',
    basicSalary: 52000,
    phone: '+880 1712-998877',
    email: 'tariqul.math@dims.edu.bd',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250',
    attendanceRate: 96.0,
    weeklyTeachingHours: 22,
    leavesBalance: { casual: 8, sick: 12, annual: 18 }
  },
  {
    id: 'EMP-003',
    employeeCode: 'EMP-A-004',
    name: 'Mustafizur Rahman',
    designation: 'Chief Accounts Officer',
    department: 'Finance & Accounts',
    category: 'ADMINISTRATIVE',
    joiningDate: '2019-03-15',
    basicSalary: 60000,
    phone: '+880 1819-445566',
    email: 'accounts@dims.edu.bd',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    attendanceRate: 99.1,
    leavesBalance: { casual: 12, sick: 14, annual: 15 }
  }
];

// ==========================================
// 8. Facilities: Library, Transport GPS, Hostel & Assets
// ==========================================

export const LIBRARY_BOOKS: LibraryBookModel[] = [
  {
    id: 'BK-01',
    isbn: '978-0131103627',
    title: 'The C Programming Language (2nd Edition)',
    author: 'Brian W. Kernighan, Dennis M. Ritchie',
    category: 'Computer Science',
    totalCopies: 25,
    availableCopies: 18,
    shelfLocation: 'Rack CS-04, Shelf 2',
    isEBook: false,
    borrowersCount: 7
  },
  {
    id: 'BK-02',
    isbn: '978-9840417382',
    title: 'Tafsir Ibn Kathir (Complete 10 Volume Set)',
    author: 'Imam Ibn Kathir',
    category: 'Islamic Studies & Quran',
    totalCopies: 15,
    availableCopies: 11,
    shelfLocation: 'Islamic Section IS-01',
    isEBook: true,
    borrowersCount: 4
  },
  {
    id: 'BK-03',
    isbn: '978-0073529325',
    title: 'University Physics with Modern Physics',
    author: 'Hugh D. Young, Roger A. Freedman',
    category: 'Physics & Natural Sciences',
    totalCopies: 30,
    availableCopies: 22,
    shelfLocation: 'Rack SCI-02, Shelf 1',
    isEBook: false,
    borrowersCount: 8
  }
];

export const TRANSPORT_ROUTES: TransportRouteModel[] = [
  {
    id: 'TR-01',
    vehicleNumber: 'Dhaka Metro Cha-53-1029',
    driverName: 'Mohammad Mizanur Rahman',
    driverPhone: '+880 1714-889900',
    routeTitle: 'Route 1: Uttara -> Airport -> Mohakhali -> Motijheel Campus',
    capacity: 40,
    occupiedSeats: 36,
    status: 'ON_ROUTE',
    currentCoordinates: { lat: 23.7806, lng: 90.4193 },
    stops: [
      { name: 'Uttara House Building (Sector 6)', time: '06:45 AM', fee: 2000 },
      { name: 'Airport Station', time: '07:05 AM', fee: 1800 },
      { name: 'Mohakhali Flyover', time: '07:30 AM', fee: 1500 },
      { name: 'Motijheel Main Gate', time: '07:55 AM', fee: 1200 }
    ]
  },
  {
    id: 'TR-02',
    vehicleNumber: 'Dhaka Metro Cha-53-1144',
    driverName: 'Abdul Karim',
    driverPhone: '+880 1715-667788',
    routeTitle: 'Route 2: Mirpur 10 -> Kazipara -> Farmgate -> Motijheel',
    capacity: 40,
    occupiedSeats: 32,
    status: 'IDLE',
    currentCoordinates: { lat: 23.7548, lng: 90.3925 },
    stops: [
      { name: 'Mirpur 10 Roundabout', time: '06:50 AM', fee: 1800 },
      { name: 'Shewrapara Metro Station', time: '07:10 AM', fee: 1600 },
      { name: 'Farmgate Bus Stand', time: '07:35 AM', fee: 1400 }
    ]
  }
];

export const HOSTEL_ROOMS: HostelRoomModel[] = [
  {
    id: 'HSTL-RM-101',
    hostelName: 'Shahid Minar Boys Dormitory',
    roomNumber: '101',
    floor: 1,
    type: 'BOYS',
    totalBeds: 4,
    occupiedBeds: 4,
    monthlyRent: 3500,
    studentsList: ['Tahmid Rahman', 'Muhammad Abdullah', 'Fahim Hasan', 'Shakil Ahmed']
  },
  {
    id: 'HSTL-RM-102',
    hostelName: 'Shahid Minar Boys Dormitory',
    roomNumber: '102',
    floor: 1,
    type: 'BOYS',
    totalBeds: 4,
    occupiedBeds: 2,
    monthlyRent: 3500,
    studentsList: ['Huzaifa Ibn Tariq', 'Zubair Ahmed']
  }
];

// ==========================================
// 9. Online Admissions & Merit List
// ==========================================

export const ADMISSION_APPLICANTS: AdmissionApplicantModel[] = [
  {
    id: 'APP-2026-001',
    applicationNumber: 'ADM-2026-9041',
    applicantName: 'Mushfiqur Rahim',
    appliedGradeOrProgram: 'Grade 9 (Science)',
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
    dateOfBirth: '2011-06-12',
    phone: '+880 1711-445566',
    email: 'mushfiq.app@gmail.com',
    guardianName: 'Dr. M. A. Rahim',
    previousSchool: 'Ideal School Motijheel',
    previousGpa: 5.0,
    admissionTestScore: 88,
    vivaScore: 18,
    status: 'MERIT_LIST',
    applicationFeePaid: true
  },
  {
    id: 'APP-2026-002',
    applicationNumber: 'ADM-2026-9042',
    applicantName: 'Ayesha Siddiqua',
    appliedGradeOrProgram: 'BSc in CSE',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    dateOfBirth: '2006-08-20',
    phone: '+880 1712-778899',
    email: 'ayesha.s@gmail.com',
    guardianName: 'Advocate Shamsul Huda',
    previousSchool: 'Viqarunnisa Noon College',
    previousGpa: 5.0,
    admissionTestScore: 94,
    vivaScore: 19,
    status: 'ENROLLED',
    applicationFeePaid: true
  }
];
