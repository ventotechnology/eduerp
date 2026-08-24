export type InstitutionType =
  | 'SCHOOL'
  | 'COLLEGE'
  | 'SCHOOL_AND_COLLEGE'
  | 'MADRASHA'
  | 'UNIVERSITY'
  | 'POLYTECHNIC'
  | 'TECHNICAL_INSTITUTE'
  | 'TRAINING_INSTITUTE'
  | 'OTHER';

export type UserRole =
  | 'PLATFORM_SUPER_ADMIN'
  | 'PLATFORM_ADMIN'
  | 'SUPPORT_ADMIN'
  | 'BILLING_ADMIN'
  | 'SALES_ADMIN'
  | 'SUPER_ADMIN'
  | 'OWNER'
  | 'CHAIRMAN'
  | 'TRUSTEE'
  | 'VICE_CHANCELLOR'
  | 'PRO_VICE_CHANCELLOR'
  | 'REGISTRAR'
  | 'PRINCIPAL'
  | 'VICE_PRINCIPAL'
  | 'DEAN'
  | 'HEAD_OF_DEPARTMENT'
  | 'COORDINATOR'
  | 'TEACHER'
  | 'FACULTY'
  | 'ACCOUNTANT'
  | 'HR_MANAGER'
  | 'LIBRARIAN'
  | 'HOSTEL_MANAGER'
  | 'TRANSPORT_MANAGER'
  | 'ADMISSION_OFFICER'
  | 'STUDENT'
  | 'PARENT';

export type LanguageCode = 'en' | 'bn' | 'ar';

export interface InstitutionBranding {
  name: string;
  shortName: string;
  logoUrl?: string;
  sealUrl?: string;
  signatureUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  eiin?: string;
  instituteCode?: string;
  mpoStatus?: boolean;
  universityCode?: string;
  boardAffiliation?: string;
  madrashaBoardInfo?: string;
  ugcInfo?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  principalHeadName?: string;
  principalHeadTitle?: string;
}

export interface TenantContextType {
  id: string;
  slug: string;
  institutionType: InstitutionType;
  branding: InstitutionBranding;
  campuses: CampusModel[];
  activeCampusId: string;
  activeRole: UserRole;
  activeUser: UserModel;
  language: LanguageCode;
  switchTenant: (slug: string) => void;
  switchRole: (role: UserRole) => void;
  switchCampus: (campusId: string) => void;
  switchLanguage: (lang: LanguageCode) => void;
  institutionTypeConfig: InstitutionTypeConfig;
}

export interface InstitutionTypeConfig {
  type: InstitutionType;
  label: string;
  labelBn: string;
  academicUnitLabel: string; // e.g. "Class" vs "Program" vs "Dakhil Level"
  sectionUnitLabel: string; // e.g. "Section" vs "Batch" vs "Halqa"
  teacherLabel: string; // e.g. "Teacher" vs "Faculty" vs "Ustad"
  headTitle: string; // e.g. "Principal" vs "Vice Chancellor" vs "Muhtamim"
  gradingType: 'SCHOOL_GPA_5' | 'UNIVERSITY_CGPA_4' | 'MADRASHA_GPA';
  hasShifts: boolean;
  hasHifzEngine: boolean;
  hasHigherEdThesis: boolean;
  hasSemesterCredit: boolean;
  hasVocationalTrade: boolean;
  features: string[];
}

export interface CampusModel {
  id: string;
  name: string;
  code: string;
  type: string;
  address: string;
  phone?: string;
  isMain: boolean;
  studentCount: number;
  teacherCount: number;
}

export interface UserModel {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  designation?: string;
  department?: string;
}

export interface StudentSISProfile {
  id: string;
  studentIdNumber: string;
  admissionNumber: string;
  rollNumber: string;
  registrationNumber?: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  religion: string;
  nationality: string;
  nidBirthCertNumber: string;
  
  presentAddress: string;
  permanentAddress: string;
  phone: string;
  email: string;
  
  // Academic
  campusName: string;
  className?: string; // School/College
  sectionName?: string;
  shift?: string;
  group?: string; // Science, Commerce, Humanities
  programName?: string; // University/Tech
  departmentName?: string;
  batchName?: string;
  currentSemester?: string;
  
  // Status & Financials
  academicStatus: 'ACTIVE' | 'PROMOTED' | 'GRADUATED' | 'DROPPED_OUT' | 'TRANSFERRED';
  totalDues: number;
  attendanceRate: number;
  currentGpaOrCgpa: number;
  
  // Guardian
  guardian: {
    name: string;
    phone: string;
    relation: string;
    occupation?: string;
    email?: string;
    address?: string;
  };

  // Madrasha Hifz Stats
  hifzStats?: {
    totalParasMemorized: number;
    currentSurah: string;
    currentAyah?: number;
    currentAyat?: number;
    dailySabakStatus: 'Completed' | 'Pending' | 'Needs Revision';
    dourParaRange: string;
  };

  // Medical & Discipline
  allergies?: string;
  medicalConditions?: string;
  disciplineIncidentsCount: number;
}

export interface AttendanceRecordItem {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HALF_DAY';
  periodNumber?: number;
  subjectCode?: string;
  remarks?: string;
  source: 'MANUAL' | 'QR' | 'RFID' | 'BIOMETRIC' | 'FACE';
}

export interface ExamMarksDistribution {
  theory: number;
  practical: number;
  assignment: number;
  attendance: number;
  total: number;
}

export interface SubjectMarksEntry {
  subjectCode: string;
  subjectName: string;
  fullMarks: number;
  obtainedTheory: number;
  obtainedPractical: number;
  obtainedAssignment: number;
  obtainedAttendance: number;
  totalObtained: number;
  letterGrade: string;
  gradePoint: number;
  isPassed: boolean;
}

export interface StudentReportCard {
  studentId: string;
  studentName: string;
  studentIdNumber: string;
  rollNumber: string;
  className: string;
  sectionName: string;
  examName: string;
  academicYear: string;
  subjects: SubjectMarksEntry[];
  totalFullMarks: number;
  totalObtainedMarks: number;
  gpa: number;
  overallGrade: string;
  classPosition: number;
  totalStudentsInSection: number;
  attendanceRate: number;
  remarks: string;
  verificationCode: string;
  issueDate: string;
}

export interface UniversityTranscript {
  studentId: string;
  studentName: string;
  studentIdNumber: string;
  program: string;
  department: string;
  faculty: string;
  admissionSemester: string;
  graduationSemester?: string;
  semesters: {
    semesterName: string;
    courses: {
      courseCode: string;
      courseTitle: string;
      creditHours: number;
      gradePoint: number;
      letterGrade: string;
    }[];
    semesterCreditsEarned: number;
    semesterGpa: number;
    cumulativeCreditsEarned: number;
    cgpa: number;
  }[];
  totalCreditsRequired: number;
  totalCreditsCompleted: number;
  finalCgpa: number;
  degreeStatus: 'IN_PROGRESS' | 'COMPLETED' | 'AWARDED';
  verificationCode: string;
}

export interface HifzProgressEntry {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  sabakPara: number;
  sabakSurah: string;
  sabakAyatStart: number;
  sabakAyatEnd: number;
  sabakRating: 'Mumtaz (Excellent)' | 'Jayyid Jiddan (Very Good)' | 'Jayyid (Good)' | 'Maqbool (Fair)' | 'Needs Revision';
  sabkiPara: number;
  sabkiPages: number;
  dourParaRange: string;
  totalParasCompleted: number;
  ustadNotes: string;
}

export interface FeeInvoiceItem {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  studentIdNumber: string;
  title: string;
  subTotal: number;
  discount: number;
  fine: number;
  total: number;
  paid: number;
  due: number;
  dueDate: string;
  status: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'OVERDUE';
  items: { description: string; amount: number }[];
}

export interface ChartOfAccountModel {
  id: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  balance: number;
}

export interface JournalVoucherModel {
  id: string;
  voucherNumber: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  approvedBy: string;
}

export interface EmployeeProfile {
  id: string;
  employeeCode: string;
  name: string;
  designation: string;
  department: string;
  category: 'TEACHING' | 'ADMINISTRATIVE' | 'SUPPORT_STAFF';
  academicRank?: 'Lecturer' | 'Senior Lecturer' | 'Assistant Professor' | 'Associate Professor' | 'Professor' | 'Dean' | 'Chairperson';
  joiningDate: string;
  basicSalary: number;
  phone: string;
  email: string;
  photoUrl: string;
  attendanceRate: number;
  weeklyTeachingHours?: number;
  publicationsCount?: number;
  leavesBalance: {
    casual: number;
    sick: number;
    annual: number;
  };
}

export interface LibraryBookModel {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  isEBook: boolean;
  borrowersCount: number;
}

export interface TransportRouteModel {
  id: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  routeTitle: string;
  capacity: number;
  occupiedSeats: number;
  status: 'ON_ROUTE' | 'IDLE' | 'MAINTENANCE';
  currentCoordinates: { lat: number; lng: number };
  stops: { name: string; time: string; fee: number }[];
}

export interface HostelRoomModel {
  id: string;
  hostelName: string;
  roomNumber: string;
  floor: number;
  type: 'BOYS' | 'GIRLS';
  totalBeds: number;
  occupiedBeds: number;
  monthlyRent: number;
  studentsList: string[];
}

export interface ResearchProjectModel {
  id: string;
  title: string;
  principalInvestigator: string;
  department: string;
  fundingAgency: string;
  grantAmount: number;
  startDate: string;
  status: 'ONGOING' | 'COMPLETED' | 'SUBMITTED';
  publicationsCount: number;
}

export interface ThesisDefenseModel {
  id: string;
  studentName: string;
  studentIdNumber: string;
  program: string;
  thesisTitle: string;
  supervisorName: string;
  defenseDate: string;
  defenseStatus: 'SCHEDULED' | 'DEFENDED_PASSED' | 'REVISIONS_REQUIRED' | 'REJECTED';
  plagiarismPercent: number;
  score?: number;
}

export interface AdmissionApplicantModel {
  id: string;
  applicationNumber: string;
  applicantName: string;
  appliedGradeOrProgram: string;
  photoUrl: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  guardianName: string;
  previousSchool: string;
  previousGpa: number;
  admissionTestScore?: number;
  vivaScore?: number;
  status: 'SUBMITTED' | 'TEST_SCHEDULED' | 'TEST_PASSED' | 'MERIT_LIST' | 'WAITING_LIST' | 'ENROLLED' | 'REJECTED';
  applicationFeePaid: boolean;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  dataSummary?: Record<string, any>;
  suggestedActions?: string[];
}
