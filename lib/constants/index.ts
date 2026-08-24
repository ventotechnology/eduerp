import { InstitutionType, InstitutionTypeConfig, UserRole } from '../types';

export const INSTITUTION_TYPE_CONFIGS: Record<InstitutionType, InstitutionTypeConfig> = {
  SCHOOL: {
    type: 'SCHOOL',
    label: 'School (General / English Medium / KG)',
    labelBn: 'স্কুল (সাধারণ / ইংলিশ ভার্সন / কিন্ডারগার্টেন)',
    academicUnitLabel: 'Class',
    sectionUnitLabel: 'Section',
    teacherLabel: 'Teacher',
    headTitle: 'Headmaster / Principal',
    gradingType: 'SCHOOL_GPA_5',
    hasShifts: true,
    hasHifzEngine: false,
    hasHigherEdThesis: false,
    hasSemesterCredit: false,
    hasVocationalTrade: false,
    features: ['Shifts (Morning/Day)', 'Play to Grade 12', 'Science/Arts/Commerce Groups', 'School GPA Report Cards']
  },
  COLLEGE: {
    type: 'COLLEGE',
    label: 'Higher Secondary College (HSC XI-XII)',
    labelBn: 'উচ্চ মাধ্যমিক কলেজ (একাদশ-দ্বাদশ)',
    academicUnitLabel: 'HSC Year',
    sectionUnitLabel: 'Section',
    teacherLabel: 'Lecturer / Professor',
    headTitle: 'Principal',
    gradingType: 'SCHOOL_GPA_5',
    hasShifts: true,
    hasHifzEngine: false,
    hasHigherEdThesis: false,
    hasSemesterCredit: false,
    hasVocationalTrade: false,
    features: ['HSC Subject Combinations', '4th Subject Logic', 'Practical Marks Management', 'HSC Test Exams']
  },
  SCHOOL_AND_COLLEGE: {
    type: 'SCHOOL_AND_COLLEGE',
    label: 'School & College Combined',
    labelBn: 'স্কুল অ্যান্ড কলেজ',
    academicUnitLabel: 'Class / HSC Year',
    sectionUnitLabel: 'Section',
    teacherLabel: 'Teacher / Lecturer',
    headTitle: 'Principal',
    gradingType: 'SCHOOL_GPA_5',
    hasShifts: true,
    hasHifzEngine: false,
    hasHigherEdThesis: false,
    hasSemesterCredit: false,
    hasVocationalTrade: false,
    features: ['Combined KG-12 + HSC', 'Shift Management', 'School & College Exam Engine']
  },
  MADRASHA: {
    type: 'MADRASHA',
    label: 'Madrasha (Ebtedayee, Dakhil, Alim, Kamil & Hifz)',
    labelBn: 'মাদ্রাসা (ইবতেদায়ী, দাখিল, আলিম, ফাজিল, কামিল ও হিফজ)',
    academicUnitLabel: 'Marhala / Class',
    sectionUnitLabel: 'Halqa / Section',
    teacherLabel: 'Ustad / Teacher',
    headTitle: 'Muhtamim / Principal',
    gradingType: 'MADRASHA_GPA',
    hasShifts: true,
    hasHifzEngine: true,
    hasHigherEdThesis: false,
    hasSemesterCredit: false,
    hasVocationalTrade: false,
    features: ['Hifzul Quran 30 Para Daily Sabak/Dour Tracker', 'Madrasha Board Curriculum', 'Arabic & Islamic Studies', 'Nazera & Hifz Evaluation']
  },
  UNIVERSITY: {
    type: 'UNIVERSITY',
    label: 'University & Higher Education',
    labelBn: 'বিশ্ববিদ্যালয় ও উচ্চশিক্ষা প্রতিষ্ঠান',
    academicUnitLabel: 'Degree Program',
    sectionUnitLabel: 'Batch / Section',
    teacherLabel: 'Faculty Member',
    headTitle: 'Vice Chancellor',
    gradingType: 'UNIVERSITY_CGPA_4',
    hasShifts: false,
    hasHifzEngine: false,
    hasHigherEdThesis: true,
    hasSemesterCredit: true,
    hasVocationalTrade: false,
    features: ['Faculties & Departments', 'Semester Credit Hour System', 'Course Add/Drop & Retake', 'Credit-Weighted CGPA', 'Thesis Defense & Research Grants']
  },
  POLYTECHNIC: {
    type: 'POLYTECHNIC',
    label: 'Polytechnic & Technical Institute',
    labelBn: 'পলিটেকনিক ও কারিগরি ইনস্টিটিউট',
    academicUnitLabel: 'Technology / Trade',
    sectionUnitLabel: 'Shift / Section',
    teacherLabel: 'Instructor / Lecturer',
    headTitle: 'Principal',
    gradingType: 'UNIVERSITY_CGPA_4',
    hasShifts: true,
    hasHifzEngine: false,
    hasHigherEdThesis: false,
    hasSemesterCredit: true,
    hasVocationalTrade: true,
    features: ['Engineering Technology Trades', 'BTEB Curriculum', 'Industrial Attachment', 'Practical Workshop Logbooks']
  },
  TECHNICAL_INSTITUTE: {
    type: 'TECHNICAL_INSTITUTE',
    label: 'Vocational & Technical Training',
    labelBn: 'কারিগরি প্রশিক্ষণ কেন্দ্র',
    academicUnitLabel: 'Trade Course',
    sectionUnitLabel: 'Batch',
    teacherLabel: 'Trainer / Instructor',
    headTitle: 'Director',
    gradingType: 'SCHOOL_GPA_5',
    hasShifts: true,
    hasHifzEngine: false,
    hasHigherEdThesis: false,
    hasSemesterCredit: false,
    hasVocationalTrade: true,
    features: ['Vocational Trades', 'Skill Certification', 'Apprenticeship Tracker']
  },
  TRAINING_INSTITUTE: {
    type: 'TRAINING_INSTITUTE',
    label: 'Professional Training & Coaching',
    labelBn: 'প্রশিক্ষণ ও কোচিং একাডেমি',
    academicUnitLabel: 'Course / Track',
    sectionUnitLabel: 'Cohort',
    teacherLabel: 'Mentor / Instructor',
    headTitle: 'Director',
    gradingType: 'SCHOOL_GPA_5',
    hasShifts: true,
    hasHifzEngine: false,
    hasHigherEdThesis: false,
    hasSemesterCredit: false,
    hasVocationalTrade: false,
    features: ['Cohort Admissions', 'Certificate Generator', 'Modular Fees']
  },
  OTHER: {
    type: 'OTHER',
    label: 'Specialized Educational Institution',
    labelBn: 'বিশেষায়িত শিক্ষা প্রতিষ্ঠান',
    academicUnitLabel: 'Level',
    sectionUnitLabel: 'Group',
    teacherLabel: 'Instructor',
    headTitle: 'Administrator',
    gradingType: 'SCHOOL_GPA_5',
    hasShifts: false,
    hasHifzEngine: false,
    hasHigherEdThesis: false,
    hasSemesterCredit: false,
    hasVocationalTrade: false,
    features: ['Flexible Curriculum', 'Customizable Modules']
  }
};

export const BANGLADESH_EDUCATION_BOARDS = [
  'Dhaka Education Board',
  'Chattogram Education Board',
  'Rajshahi Education Board',
  'Cumilla Education Board',
  'Jashore Education Board',
  'Barishal Education Board',
  'Sylhet Education Board',
  'Dinajpur Education Board',
  'Mymensingh Education Board',
  'Bangladesh Madrasha Education Board (BMEB)',
  'Bangladesh Technical Education Board (BTEB)',
  'Cambridge International (CIE)',
  'Edexcel / Pearson'
];

export const PRESET_DEMO_TENANTS = [
  {
    slug: 'demo-school',
    name: 'Dhaka Ideal Model High School',
    shortName: 'DIMS',
    type: 'SCHOOL' as InstitutionType,
    primaryColor: '#1e40af', // Blue
    secondaryColor: '#0f172a',
    eiin: '108421',
    board: 'Dhaka Education Board',
    headTitle: 'Headmaster / Principal',
    headName: 'Dr. Rafiqul Islam',
    address: '12/A Dhanmondi, Dhaka',
    description: 'Leading school providing Play-10 education with Morning & Day shifts and Science/Commerce/Arts streams.'
  },
  {
    slug: 'demo-college',
    name: 'Chittagong Model College',
    shortName: 'CMC',
    type: 'COLLEGE' as InstitutionType,
    primaryColor: '#7c2d12', // Crimson / Amber
    secondaryColor: '#1e1b4b',
    eiin: '132104',
    board: 'Chattogram Education Board',
    headTitle: 'Principal',
    headName: 'Dr. Shahinur Rahman',
    address: 'GEC Circle, Chattogram',
    description: 'Premier HSC college specializing in Science, Business Studies & Humanities with practical lab management.'
  },
  {
    slug: 'demo-school-college',
    name: 'Rajshahi Model School & College',
    shortName: 'RMSC',
    type: 'SCHOOL_AND_COLLEGE' as InstitutionType,
    primaryColor: '#0284c7', // Sky Blue
    secondaryColor: '#0c4a6e',
    eiin: '125601',
    board: 'Rajshahi Education Board',
    headTitle: 'Principal',
    headName: 'Prof. Anisur Rahman',
    address: 'Kazihata, Rajshahi',
    description: 'Integrated K-12 and Higher Secondary institution with unified campus operations.'
  },
  {
    slug: 'demo-madrasha',
    name: 'Darul Uloom Islamia Madrasha & Hifz Complex',
    shortName: 'DUIM',
    type: 'MADRASHA' as InstitutionType,
    primaryColor: '#065f46', // Islamic Emerald Green
    secondaryColor: '#064e3b',
    eiin: '119852',
    board: 'Bangladesh Madrasha Education Board (BMEB)',
    headTitle: 'Principal / Muhtamim',
    headName: 'Allama Mufti Abdul Quddus',
    address: 'Dargah Gate, Sylhet',
    description: 'Full Islamic complex with Dakhil, Alim, Kamil curriculum and an automated 30-Para Hifzul Quran tracker.'
  },
  {
    slug: 'demo-university',
    name: 'Metropolitan University Bangladesh',
    shortName: 'MUB',
    type: 'UNIVERSITY' as InstitutionType,
    primaryColor: '#4338ca', // Indigo / Purple
    secondaryColor: '#312e81',
    eiin: 'UGC-884',
    board: 'University Grants Commission (UGC)',
    headTitle: 'Vice Chancellor',
    headName: 'Prof. Dr. Anwar Hossain Choudhury',
    address: 'Gulshan 2, Dhaka',
    description: 'Modern higher-ed campus with Faculties, Semester Credit Hours, Add/Drop, Thesis Defense & Research grants.'
  },
  {
    slug: 'demo-polytechnic',
    name: 'Dhaka Polytechnic Institute',
    shortName: 'DPI',
    type: 'POLYTECHNIC' as InstitutionType,
    primaryColor: '#d97706', // Amber / Orange
    secondaryColor: '#78350f',
    eiin: '133001',
    board: 'Bangladesh Technical Education Board (BTEB)',
    headTitle: 'Principal',
    headName: 'Engr. Kazi Mizanur Rahman',
    address: 'Tejgaon I/A, Dhaka',
    description: '4-Year Diploma Engineering with Computer, Electrical, Civil & Mechanical technologies.'
  },
  {
    slug: 'demo-vocational',
    name: 'Bangladesh Technical Vocational Academy',
    shortName: 'BTVA',
    type: 'TECHNICAL_INSTITUTE' as InstitutionType,
    primaryColor: '#0d9488', // Teal
    secondaryColor: '#134e4a',
    eiin: '135502',
    board: 'Bangladesh Technical Education Board (BTEB)',
    headTitle: 'Principal',
    headName: 'Engr. Shamsul Haque',
    address: 'Board Bazar, Gazipur',
    description: 'BTEB certified vocational and trade courses with workshop log tracking.'
  },
  {
    slug: 'demo-training',
    name: 'National Institute of Professional Training',
    shortName: 'NIPT',
    type: 'TRAINING_INSTITUTE' as InstitutionType,
    primaryColor: '#6366f1', // Indigo
    secondaryColor: '#312e81',
    eiin: 'NIP-101',
    board: 'National Skills Development Authority (NSDA)',
    headTitle: 'Director General',
    headName: 'Dr. Tariqul Islam',
    address: 'Panthapath, Dhaka',
    description: 'Professional certificates, cohort batches, and corporate development programs.'
  },
  // Legacy aliases for backward compatibility
  {
    slug: 'dhaka-ideal-school',
    name: 'Dhaka Ideal Model High School',
    shortName: 'DIMS',
    type: 'SCHOOL' as InstitutionType,
    primaryColor: '#1e40af',
    secondaryColor: '#0f172a',
    eiin: '108421',
    board: 'Dhaka Education Board',
    headTitle: 'Headmaster / Principal',
    headName: 'Dr. Rafiqul Islam',
    address: '12/A Dhanmondi, Dhaka',
    description: 'Leading school providing Play-10 education with Morning & Day shifts and Science/Commerce/Arts streams.'
  },
  {
    slug: 'dhaka-imperial-college',
    name: 'Dhaka Imperial College',
    shortName: 'DIC',
    type: 'COLLEGE' as InstitutionType,
    primaryColor: '#7c2d12',
    secondaryColor: '#1e1b4b',
    eiin: '132104',
    board: 'Dhaka Education Board',
    headTitle: 'Principal',
    headName: 'Dr. Shahinur Rahman',
    address: 'Dhanmondi R/A, Dhaka-1209',
    description: 'Premier HSC college specializing in Science, Business Studies & Humanities with practical lab management.'
  },
  {
    slug: 'al-jamiatul-islamia-madrasha',
    name: 'Al-Jamiatul Islamia Madrasha & Hifz Complex',
    shortName: 'AIMC',
    type: 'MADRASHA' as InstitutionType,
    primaryColor: '#065f46',
    secondaryColor: '#064e3b',
    eiin: '119852',
    board: 'Bangladesh Madrasha Education Board (BMEB)',
    headTitle: 'Muhtamim',
    headName: 'Allama Mufti Abdul Quddus',
    address: 'Lalbagh, Dhaka-1211',
    description: 'Full Islamic complex with Dakhil, Alim, Kamil curriculum and an automated 30-Para Hifzul Quran tracker.'
  },
  {
    slug: 'metropolitan-university',
    name: 'Metropolitan University of Science & Technology',
    shortName: 'MUST',
    type: 'UNIVERSITY' as InstitutionType,
    primaryColor: '#4338ca',
    secondaryColor: '#312e81',
    eiin: 'UGC-884',
    board: 'University Grants Commission (UGC)',
    headTitle: 'Vice Chancellor',
    headName: 'Prof. Dr. Anwar Hossain Choudhury',
    address: 'Bashundhara R/A, Dhaka-1229',
    description: 'Modern higher-ed campus with 4 Faculties, Semester Credit Hours, Add/Drop, Thesis Defense & Research grants.'
  }
];

export const DEMO_USER_PERSONAS: { role: UserRole; name: string; title: string; avatar: string }[] = [
  { role: 'SUPER_ADMIN', name: 'Platform Admin (SaaS Control)', title: 'SaaS Platform Super Admin', avatar: '👑' },
  { role: 'PRINCIPAL', name: 'Dr. Rafiqul Islam / Vice Chancellor', title: 'Head of Institution', avatar: '🎓' },
  { role: 'DEAN', name: 'Prof. Dr. Nusrat Jahan', title: 'Dean of Faculty / Academic Coordinator', avatar: '🏛️' },
  { role: 'TEACHER', name: 'Tariqul Islam / Ustad Mahmood', title: 'Senior Teacher / Faculty Member', avatar: '👨‍🏫' },
  { role: 'ACCOUNTANT', name: 'Mustafizur Rahman', title: 'Chief Accounts Officer', avatar: '💰' },
  { role: 'LIBRARIAN', name: 'Nasreen Akhtar', title: 'Chief Librarian', avatar: '📚' },
  { role: 'STUDENT', name: 'Zubair Ahmed / Fatima Zohra', title: 'Student Profile', avatar: '🎒' },
  { role: 'PARENT', name: 'Engr. Mahbubul Alam', title: 'Guardian / Parent (Multi-child)', avatar: '👨‍👧‍👦' }
];

export const GRADING_SYSTEMS = {
  SCHOOL_GPA_5: [
    { grade: 'A+', point: 5.0, minMarks: 80, maxMarks: 100, remark: 'Outstanding' },
    { grade: 'A', point: 4.0, minMarks: 70, maxMarks: 79, remark: 'Excellent' },
    { grade: 'A-', point: 3.5, minMarks: 60, maxMarks: 69, remark: 'Very Good' },
    { grade: 'B', point: 3.0, minMarks: 50, maxMarks: 59, remark: 'Good' },
    { grade: 'C', point: 2.0, minMarks: 40, maxMarks: 49, remark: 'Satisfactory' },
    { grade: 'D', point: 1.0, minMarks: 33, maxMarks: 39, remark: 'Pass' },
    { grade: 'F', point: 0.0, minMarks: 0, maxMarks: 32, remark: 'Fail' }
  ],
  UNIVERSITY_CGPA_4: [
    { grade: 'A+', point: 4.0, minMarks: 80, maxMarks: 100, remark: 'Outstanding' },
    { grade: 'A', point: 3.75, minMarks: 75, maxMarks: 79, remark: 'Excellent' },
    { grade: 'A-', point: 3.5, minMarks: 70, maxMarks: 74, remark: 'Very Good' },
    { grade: 'B+', point: 3.25, minMarks: 65, maxMarks: 69, remark: 'Good' },
    { grade: 'B', point: 3.0, minMarks: 60, maxMarks: 64, remark: 'Above Average' },
    { grade: 'B-', point: 2.75, minMarks: 55, maxMarks: 59, remark: 'Average' },
    { grade: 'C+', point: 2.5, minMarks: 50, maxMarks: 54, remark: 'Below Average' },
    { grade: 'C', point: 2.25, minMarks: 45, maxMarks: 49, remark: 'Pass' },
    { grade: 'D', point: 2.0, minMarks: 40, maxMarks: 44, remark: 'Poor Pass' },
    { grade: 'F', point: 0.0, minMarks: 0, maxMarks: 39, remark: 'Fail' }
  ]
};
