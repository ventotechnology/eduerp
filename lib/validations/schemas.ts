import { z } from 'zod';

// ==========================================
// 1. Student SIS Schemas
// ==========================================
export const StudentCreateSchema = z.object({
  campusId: z.string().min(1, 'Campus is required'),
  academicYearId: z.string().optional().nullable(),
  studentIdNumber: z.string().optional().nullable(),
  admissionNumber: z.string().optional().nullable(),
  rollNumber: z.string().optional().nullable(),
  registrationNumber: z.string().optional().nullable(),
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1, 'Last name is required'),
  photoUrl: z.string().optional().nullable(),
  dateOfBirth: z.string().or(z.date()),
  gender: z.enum(['Male', 'Female', 'Other']),
  bloodGroup: z.string().optional().nullable(),
  religion: z.string().optional().nullable(),
  nationality: z.string().default('Bangladeshi'),
  nidBirthCertNumber: z.string().optional().nullable(),
  presentAddress: z.string().min(1, 'Present address is required'),
  permanentAddress: z.string().min(1, 'Permanent address is required'),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),

  // Academic Placement
  classId: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  shiftId: z.string().optional().nullable(),
  academicGroupId: z.string().optional().nullable(),
  subjectCombinationId: z.string().optional().nullable(),
  technologyTradeId: z.string().optional().nullable(),
  programId: z.string().optional().nullable(),
  batchId: z.string().optional().nullable(),
  semesterId: z.string().optional().nullable(),
  hifzProgram: z.boolean().optional().default(false),
  hifzProgramType: z.string().optional().nullable(),

  // Previous Education & Documents
  previousSchool: z.string().optional().nullable(),
  previousClass: z.string().optional().nullable(),
  previousGpa: z.number().optional().nullable(),
  documentsJson: z.string().optional().nullable(),

  // Fees & Portal Accounts
  admissionFeeAmount: z.number().min(0).optional().nullable(),
  createPortalAccount: z.boolean().optional().default(false),
  createGuardianAccount: z.boolean().optional().default(false),

  status: z.enum(['ACTIVE', 'PROMOTED', 'GRADUATED', 'DROPPED_OUT', 'TRANSFERRED']).default('ACTIVE'),
  guardian: z
    .object({
      fatherName: z.string().min(1, 'Father name is required'),
      fatherPhone: z.string().min(1, 'Father phone is required'),
      fatherProfession: z.string().optional().nullable(),
      motherName: z.string().min(1, 'Mother name is required'),
      motherPhone: z.string().optional().nullable(),
      motherProfession: z.string().optional().nullable(),
      guardianName: z.string().min(1, 'Guardian name is required'),
      guardianPhone: z.string().min(1, 'Guardian phone is required'),
      guardianRelation: z.string().default('Father')
    })
    .optional()
    .nullable()
});

export const StudentUpdateSchema = StudentCreateSchema.partial();

// ==========================================
// 2. Admission Application Schemas
// ==========================================
export const AdmissionApplicationSchema = z.object({
  campusId: z.string().min(1, 'Campus is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1, 'Last name is required'),
  photoUrl: z.string().optional().nullable(),
  dateOfBirth: z.string().or(z.date()),
  gender: z.enum(['Male', 'Female', 'Other']),
  bloodGroup: z.string().optional().nullable(),
  religion: z.string().optional().nullable(),
  nationality: z.string().default('Bangladeshi'),
  nidBirthCertNumber: z.string().optional().nullable(),
  phone: z.string().min(1, 'Contact phone is required'),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  presentAddress: z.string().min(1, 'Present address is required'),
  permanentAddress: z.string().min(1, 'Permanent address is required'),

  // Academic Placement Targets
  desiredClassId: z.string().optional().nullable(),
  desiredProgramId: z.string().optional().nullable(),
  shiftId: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  academicGroupId: z.string().optional().nullable(),
  subjectCombinationId: z.string().optional().nullable(),
  technologyTradeId: z.string().optional().nullable(),
  batchId: z.string().optional().nullable(),
  hifzProgram: z.boolean().optional().default(false),

  // Guardian Information
  guardianName: z.string().min(1, 'Guardian name is required'),
  guardianPhone: z.string().min(1, 'Guardian phone is required'),
  guardianRelation: z.string().default('Father'),
  guardianOccupation: z.string().optional().nullable(),
  fatherName: z.string().optional().nullable(),
  fatherPhone: z.string().optional().nullable(),
  fatherProfession: z.string().optional().nullable(),
  motherName: z.string().optional().nullable(),
  motherPhone: z.string().optional().nullable(),
  motherProfession: z.string().optional().nullable(),

  // Previous Education & Documents
  previousSchool: z.string().optional().nullable(),
  previousClass: z.string().optional().nullable(),
  previousGpa: z.number().min(0).max(5).optional().nullable(),
  documentsJson: z.string().optional().nullable(),

  // Fee & Scholarship Configuration
  applicationFeeAmount: z.number().min(0).optional().nullable(),
  admissionFeeAmount: z.number().min(0).optional().nullable(),
  waiverPercentage: z.number().min(0).max(100).optional().nullable()
});

export const AdmissionSettingSchema = z.object({
  isOnlineAdmissionOpen: z.boolean().default(true),
  applicationStartDate: z.string().or(z.date()).optional().nullable(),
  applicationEndDate: z.string().or(z.date()).optional().nullable(),
  academicYearId: z.string().optional().nullable(),
  applicationFee: z.number().min(0).default(0),
  admissionFeeDefault: z.number().min(0).default(0),
  isTestRequired: z.boolean().default(false),
  isInterviewRequired: z.boolean().default(false),
  autoMeritCalculation: z.boolean().default(true),
  testWeight: z.number().min(0).max(100).default(50),
  previousResultWeight: z.number().min(0).max(100).default(30),
  interviewWeight: z.number().min(0).max(100).default(20),
  maxCapacityPerClass: z.number().int().min(1).default(40),
  allowPortalUserCreation: z.boolean().default(true),
  instructionsText: z.string().optional().nullable(),
  requiredDocumentsJson: z.string().optional().nullable(),
  applicationNumberPrefix: z.string().default('APP')
});

export const ValidAdmissionTransitions: Record<string, string[]> = {
  DRAFT: ['SUBMITTED', 'REJECTED'],
  SUBMITTED: ['UNDER_REVIEW', 'VERIFIED', 'REJECTED'],
  UNDER_REVIEW: ['VERIFIED', 'REJECTED', 'SUBMITTED'],
  VERIFIED: ['TEST_ELIGIBLE', 'INTERVIEW', 'SELECTED', 'WAITLISTED', 'REJECTED'],
  TEST_ELIGIBLE: ['TESTED', 'INTERVIEW', 'SELECTED', 'WAITLISTED', 'REJECTED'],
  TESTED: ['INTERVIEW', 'SELECTED', 'WAITLISTED', 'REJECTED'],
  INTERVIEW: ['SELECTED', 'WAITLISTED', 'REJECTED'],
  SELECTED: ['ADMITTED', 'WAITLISTED', 'REJECTED'],
  WAITLISTED: ['SELECTED', 'REJECTED', 'UNDER_REVIEW'],
  REJECTED: ['UNDER_REVIEW', 'SUBMITTED'], // appeal/reopen
  ADMITTED: []
};

// ==========================================
// 3. Admission Test Scoring
// ==========================================
export const AdmissionTestSubmissionSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  testId: z.string().min(1, 'Test ID is required'),
  answers: z.record(z.string(), z.string()) // questionId -> selectedOption
});

// ==========================================
// 4. Attendance Schemas
// ==========================================
export const AttendanceSessionCreateSchema = z.object({
  campusId: z.string().min(1, 'Campus is required'),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  date: z.string().or(z.date()),
  periodNumber: z.number().int().positive().optional(),
  subjectCode: z.string().optional(),
  records: z.array(
    z.object({
      studentId: z.string().min(1, 'Student ID is required'),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'EXCUSED']),
      remarks: z.string().optional()
    })
  )
});

// ==========================================
// 5. Examination & Marks Schemas
// ==========================================
export const MarksEntryBatchSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  entries: z.array(
    z.object({
      studentId: z.string().min(1, 'Student ID is required'),
      theoryMarks: z.number().min(0).max(100).default(0),
      practicalMarks: z.number().min(0).max(100).default(0),
      assignmentMarks: z.number().min(0).max(100).default(0),
      attendanceMarks: z.number().min(0).max(100).default(0),
      isOptionalFourthSubject: z.boolean().default(false)
    })
  )
});

// ==========================================
// 6. Fee Invoices & Payments Schemas
// ==========================================
export const InvoiceCreateSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  title: z.string().min(1, 'Invoice title is required'),
  subTotal: z.number().positive('Subtotal must be positive'),
  discountAmount: z.number().min(0).default(0),
  fineAmount: z.number().min(0).default(0),
  dueDate: z.string().or(z.date())
});

export const PaymentRecordSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().positive('Payment amount must be greater than 0'),
  gateway: z.enum(['BKASH', 'NAGAD', 'ROCKET', 'CARDS', 'CASH', 'BANK_TRANSFER']),
  transactionRef: z.string().min(1, 'Transaction reference is required')
});

// ==========================================
// 7. University Course Registration Schemas
// ==========================================
export const CourseRegistrationSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  semester: z.string().min(1, 'Semester is required')
});

// ==========================================
// 8. Madrasha Hifz Daily Entry Schemas
// ==========================================
export const HifzDailyEntrySchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  date: z.string().or(z.date()),
  sabakPara: z.number().int().min(1).max(30).optional(),
  sabakSurah: z.string().optional(),
  sabakAyatStart: z.number().int().positive().optional(),
  sabakAyatEnd: z.number().int().positive().optional(),
  sabakGrade: z.enum(['Excellent', 'Very Good', 'Good', 'Fair', 'Revision']).optional(),
  sabkiPara: z.number().int().min(1).max(30).optional(),
  sabkiPages: z.number().int().min(1).optional(),
  sabkiGrade: z.string().optional(),
  dourParaStart: z.number().int().min(1).max(30).optional(),
  dourParaEnd: z.number().int().min(1).max(30).optional(),
  dourGrade: z.string().optional(),
  totalParasMemorized: z.number().min(0).max(30),
  teacherNotes: z.string().optional()
});

// ==========================================
// 9. Academic Structure Schemas
// ==========================================
export const AcademicYearCreateSchema = z.object({
  name: z.string().min(1, 'Academic year name is required'),
  code: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  admissionStartDate: z.string().or(z.date()).optional(),
  admissionEndDate: z.string().or(z.date()).optional(),
  classStartDate: z.string().or(z.date()).optional(),
  status: z.enum(['DRAFT', 'UPCOMING', 'ACTIVE', 'CLOSED', 'ARCHIVED']).default('ACTIVE'),
  isCurrent: z.boolean().default(false)
});

export const AcademicSessionCreateSchema = z.object({
  academicYearId: z.string().min(1, 'Academic year is required'),
  name: z.string().min(1, 'Session name is required'),
  type: z.enum(['SEMESTER', 'TRIMESTER', 'TERM', 'ANNUAL']).default('SEMESTER'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  registrationStartDate: z.string().or(z.date()).optional(),
  registrationEndDate: z.string().or(z.date()).optional(),
  addDropDeadline: z.string().or(z.date()).optional(),
  examStartDate: z.string().or(z.date()).optional(),
  examEndDate: z.string().or(z.date()).optional(),
  resultPublishDate: z.string().or(z.date()).optional(),
  status: z.enum(['DRAFT', 'UPCOMING', 'ACTIVE', 'CLOSED', 'ARCHIVED']).default('ACTIVE'),
  isCurrent: z.boolean().default(false)
});

export const ShiftCreateSchema = z.object({
  name: z.string().min(1, 'Shift name is required'),
  code: z.string().min(1, 'Shift code is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  breakStartTime: z.string().optional(),
  breakEndTime: z.string().optional(),
  applicableLevel: z.string().optional(),
  isActive: z.boolean().default(true)
});

export const AcademicGroupCreateSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  code: z.string().min(1, 'Group code is required'),
  description: z.string().optional()
});

export const SubjectCombinationSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  name: z.string().min(1, 'Combination name is required'),
  code: z.string().min(1, 'Combination code is required'),
  compulsorySubjectCodes: z.array(z.string()).min(1, 'At least one compulsory subject is required'),
  electiveSubjectCodes: z.array(z.string()).min(1, 'At least one elective subject is required'),
  fourthSubjectChoices: z.array(z.string()).min(1, 'Fourth subject choices required'),
  practicalSubjectCodes: z.array(z.string()).optional()
});

export const SchoolClassCreateSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  numericValue: z.number().int().min(0),
  sequence: z.number().int().default(1),
  stage: z.string().optional(),
  promotionTargetClass: z.string().optional(),
  shift: z.string().default('Morning')
});

export const SchoolSectionCreateSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  name: z.string().min(1, 'Section name is required'),
  group: z.string().optional(),
  roomNumber: z.string().optional(),
  capacity: z.number().int().positive().default(40)
});

export const SchoolSubjectCreateSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().min(1, 'Subject code is required'),
  type: z.enum(['COMPULSORY', 'ELECTIVE', 'OPTIONAL', '4TH_SUBJECT']).default('COMPULSORY'),
  fullMarks: z.number().int().positive().default(100),
  passMarks: z.number().int().positive().default(33),
  theoryMarks: z.number().int().min(0).default(70),
  practicalMarks: z.number().int().min(0).default(0),
  assignmentMarks: z.number().int().min(0).default(20),
  attendanceMarks: z.number().int().min(0).default(10)
});

export const FacultyCreateSchema = z.object({
  name: z.string().min(1, 'Faculty name is required'),
  code: z.string().min(1, 'Faculty code is required'),
  deanName: z.string().optional()
});

export const DepartmentCreateSchema = z.object({
  facultyId: z.string().optional(),
  name: z.string().min(1, 'Department name is required'),
  code: z.string().min(1, 'Department code is required'),
  headName: z.string().optional()
});

export const ProgramCreateSchema = z.object({
  departmentId: z.string().min(1, 'Department ID is required'),
  name: z.string().min(1, 'Program name is required'),
  code: z.string().min(1, 'Program code is required'),
  degreeLevel: z.string().default('BACHELOR'),
  durationYears: z.number().positive().default(4.0),
  totalCredits: z.number().positive().optional()
});

export const BatchCreateSchema = z.object({
  programId: z.string().min(1, 'Program ID is required'),
  name: z.string().min(1, 'Batch name is required'),
  year: z.number().int().positive()
});

export const UniversityCourseCreateSchema = z.object({
  programId: z.string().min(1, 'Program ID is required'),
  code: z.string().min(1, 'Course code is required'),
  title: z.string().min(1, 'Course title is required'),
  creditHours: z.number().positive().default(3.0),
  lectureCredits: z.number().min(0).default(3.0),
  labCredits: z.number().min(0).default(0.0),
  courseType: z.enum(['CORE', 'ELECTIVE', 'GENERAL_EDUCATION', 'LAB', 'THESIS', 'INTERNSHIP', 'PROJECT']).default('CORE'),
  prerequisiteCourseIds: z.array(z.string()).optional()
});

export const CourseOfferingCreateSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  sessionId: z.string().min(1, 'Session ID is required'),
  sectionName: z.string().min(1, 'Section name is required'),
  teacherId: z.string().optional(),
  classroomId: z.string().optional(),
  capacity: z.number().int().positive().default(45),
  scheduleJson: z.string().optional(),
  status: z.enum(['OPEN', 'CLOSED', 'CANCELLED']).default('OPEN')
});

export const CurriculumCreateSchema = z.object({
  programId: z.string().min(1, 'Program ID is required'),
  name: z.string().min(1, 'Curriculum name is required'),
  code: z.string().min(1, 'Curriculum code is required')
});

export const CurriculumVersionCreateSchema = z.object({
  curriculumId: z.string().min(1, 'Curriculum ID is required'),
  versionCode: z.string().min(1, 'Version code is required'),
  effectiveSessionId: z.string().optional(),
  totalCredits: z.number().positive().default(144.0),
  minCgpa: z.number().positive().default(2.00),
  status: z.enum(['ACTIVE', 'DRAFT', 'DEPRECATED']).default('ACTIVE'),
  courses: z.array(
    z.object({
      courseId: z.string().min(1),
      semesterNumber: z.number().int().min(1).max(12),
      isRequired: z.boolean().default(true),
      minGradePoint: z.number().min(0).default(2.00)
    })
  ).min(1, 'At least one curriculum course is required')
});

export const BuildingCreateSchema = z.object({
  campusId: z.string().min(1, 'Campus ID is required'),
  name: z.string().min(1, 'Building name is required'),
  code: z.string().min(1, 'Building code is required'),
  totalFloors: z.number().int().positive().default(5)
});

export const ClassroomCreateSchema = z.object({
  campusId: z.string().min(1, 'Campus ID is required'),
  buildingId: z.string().optional(),
  floorNumber: z.number().int().default(1),
  roomNumber: z.string().min(1, 'Room number is required'),
  capacity: z.number().int().positive().default(40),
  type: z.enum(['CLASSROOM', 'LAB', 'WORKSHOP', 'AUDITORIUM', 'SEMINAR']).default('CLASSROOM'),
  hasProjector: z.boolean().default(false),
  hasAirConditioner: z.boolean().default(false)
});

export const PeriodCreateSchema = z.object({
  campusId: z.string().optional(),
  shiftId: z.string().optional(),
  periodNumber: z.number().int().positive(),
  name: z.string().min(1, 'Period name is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  isBreak: z.boolean().default(false)
});

export const TeacherAvailabilitySchema = z.object({
  teacherId: z.string().min(1, 'Teacher ID is required'),
  dayOfWeek: z.enum(['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']),
  periodId: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isAvailable: z.boolean().default(true),
  reason: z.string().optional()
});

export const TeacherAssignmentSchema = z.object({
  teacherId: z.string().min(1, 'Teacher ID is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  subjectId: z.string().optional(),
  courseOfferingId: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  weeklyPeriods: z.number().int().positive().default(4)
});

// ==========================================
// 10. Timetable & Conflict Engine Schemas
// ==========================================
export const TimetableEntryCreateSchema = z.object({
  academicYearId: z.string().optional(),
  sessionId: z.string().optional(),
  campusId: z.string().optional(),
  sectionId: z.string().optional(),
  courseOfferingId: z.string().optional(),
  subjectId: z.string().optional(),
  periodId: z.string().optional(),
  classroomId: z.string().min(1, 'Room is required'),
  teacherId: z.string().optional(),
  dayOfWeek: z.enum(['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  subjectName: z.string().min(1, 'Subject name is required'),
  teacherName: z.string().min(1, 'Teacher name is required'),
  isDoublePeriod: z.boolean().default(false)
});

// ==========================================
// 11. Polytechnic & Vocational Schemas
// ==========================================
export const TechnologyTradeCreateSchema = z.object({
  name: z.string().min(1, 'Trade name is required'),
  code: z.string().min(1, 'Trade code is required'),
  btebCode: z.string().optional(),
  durationSemesters: z.number().int().positive().default(8),
  description: z.string().optional()
});

export const WorkshopLogCreateSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  date: z.string().or(z.date()),
  taskTitle: z.string().min(1, 'Task title is required'),
  instructorName: z.string().min(1, 'Instructor name is required'),
  completionStatus: z.enum(['COMPLETED', 'PENDING', 'RE_SUBMIT']).default('COMPLETED'),
  score: z.number().min(0).max(100).optional(),
  teacherRemarks: z.string().optional()
});

export const IndustrialAttachmentCreateSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  organizationName: z.string().min(1, 'Organization name is required'),
  supervisorName: z.string().min(1, 'Supervisor name is required'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional(),
  evaluationScore: z.number().min(0).max(100).optional(),
  reportStatus: z.enum(['IN_PROGRESS', 'SUBMITTED', 'APPROVED']).default('IN_PROGRESS')
});

export const CalendarEventCreateSchema = z.object({
  campusId: z.string().optional(),
  title: z.string().min(1, 'Event title is required'),
  eventType: z.enum(['EXAM', 'HOLIDAY', 'ADMISSION', 'REGISTRATION', 'RESULT', 'CONVOCATION', 'EVENT']).default('EVENT'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  description: z.string().optional(),
  isHoliday: z.boolean().default(false)
});

// ==========================================
// 12. Command 4: Assessment & Exam Schemas
// ==========================================
export const AssessmentComponentSchema = z.object({
  name: z.string().min(1, 'Component name is required'),
  code: z.string().min(1, 'Component code is required'),
  maxMarks: z.number().positive('Maximum marks must be greater than 0'),
  passMarks: z.number().min(0, 'Pass marks cannot be negative'),
  weight: z.number().positive().default(1.0),
  sequence: z.number().int().default(1),
  isRequired: z.boolean().default(true),
  roundingRule: z.enum(['HALF_UP', 'CEIL', 'FLOOR', 'NONE']).default('HALF_UP')
}).refine((data) => data.passMarks <= data.maxMarks, {
  message: 'Pass marks cannot exceed maximum marks',
  path: ['passMarks']
});

export const MarkDistributionTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  code: z.string().min(1, 'Template code is required'),
  academicLevel: z.enum(['SCHOOL', 'COLLEGE', 'UNIVERSITY', 'POLYTECHNIC', 'MADRASHA']).optional(),
  components: z.array(AssessmentComponentSchema).min(1, 'At least one component is required'),
  isDefault: z.boolean().default(false)
});

export const ExamCreateSchema = z.object({
  sessionId: z.string().min(1, 'Academic session is required'),
  name: z.string().min(1, 'Exam name is required'),
  type: z.string().min(1, 'Exam type is required'),
  examTypeCode: z.string().default('TERM'),
  termNumber: z.number().int().default(1),
  targetClassId: z.string().optional(),
  targetProgramId: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  markEntryDeadline: z.string().or(z.date()).optional(),
  moderationDeadline: z.string().or(z.date()).optional(),
  publicationDeadline: z.string().or(z.date()).optional()
});

export const ExamScheduleCreateSchema = z.object({
  examId: z.string().min(1, 'Exam is required'),
  subjectId: z.string().optional(),
  courseId: z.string().optional(),
  courseOfferingId: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  date: z.string().or(z.date()),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  durationMinutes: z.number().int().positive().default(180),
  roomId: z.string().optional(),
  invigilatorName: z.string().optional(),
  invigilatorId: z.string().optional(),
  maxMarks: z.number().positive().default(100),
  instructions: z.string().optional()
});

export const ExamEligibilityOverrideSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  status: z.enum(['ELIGIBLE', 'INELIGIBLE_ATTENDANCE', 'INELIGIBLE_FINANCIAL', 'INELIGIBLE_ACADEMIC', 'OVERRIDDEN']),
  overrideReason: z.string().min(3, 'Override reason must be provided')
});

export const MarkScoreEntryItemSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  markStatus: z.enum(['MARK', 'ABSENT', 'EXEMPT', 'WITHHELD', 'INCOMPLETE']).default('MARK'),
  theoryMarks: z.number().min(0).default(0),
  practicalMarks: z.number().min(0).default(0),
  assignmentMarks: z.number().min(0).default(0),
  attendanceMarks: z.number().min(0).default(0),
  componentScores: z.record(z.string(), z.number()).optional(),
  remarks: z.string().optional()
});

export const MarksEntryBulkSchema = z.object({
  examId: z.string().min(1, 'Exam is required'),
  subjectId: z.string().optional(),
  courseOfferingId: z.string().optional(),
  entries: z.array(MarkScoreEntryItemSchema).min(1, 'At least one student mark entry is required')
});

export const MarksWorkflowTransitionSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  subjectId: z.string().optional(),
  courseOfferingId: z.string().optional(),
  targetStatus: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'LOCKED', 'RETURNED_FOR_CORRECTION']),
  reviewRemarks: z.string().optional()
});

export const MarkCorrectionSchema = z.object({
  marksEntryId: z.string().min(1, 'Marks entry ID is required'),
  newScore: z.number().min(0, 'Score cannot be negative'),
  componentName: z.string().min(1, 'Component name is required'),
  reason: z.string().min(5, 'Detailed reason for correction is required')
});

export const ResultPublicationSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  publicationStatus: z.enum(['INTERNAL', 'PENDING_PUBLICATION', 'PUBLISHED', 'WITHHELD']),
  remarks: z.string().optional()
});

export const OfficialTranscriptIssueSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  transcriptType: z.enum(['SEMESTER', 'UNOFFICIAL', 'PROVISIONAL', 'FINAL_ACADEMIC']).default('SEMESTER'),
  semester: z.string().optional()
});

export const CertificateIssueSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  certificateType: z.enum([
    'STUDENT',
    'ENROLLMENT',
    'BONAFIDE',
    'CHARACTER',
    'TESTIMONIAL',
    'TRANSFER',
    'COURSE_COMPLETION',
    'GRADUATION',
    'PROVISIONAL',
    'CUSTOM'
  ]),
  studentName: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  programOrClass: z.string().optional(),
  gpaOrDivision: z.string().optional(),
  passingYear: z.number().int().optional(),
  signatoryTitle: z.string().default('Principal'),
  customRemarks: z.string().optional()
});

export const CertificateRevokeSchema = z.object({
  certificateNumber: z.string().min(1, 'Certificate number is required'),
  reason: z.string().min(5, 'Revocation reason must be detailed')
});

export const PromotionExecutionSchema = z.object({
  examId: z.string().optional(),
  fromAcademicYearId: z.string().min(1, 'Source academic year is required'),
  toAcademicYearId: z.string().min(1, 'Target academic year is required'),
  fromClassId: z.string().min(1, 'Source class is required'),
  toClassId: z.string().optional(), // Null for graduating terminal classes
  minimumPassingGpa: z.number().min(0).max(5.0).default(1.0),
  maxAllowedFailedSubjects: z.number().int().min(0).default(0),
  overrides: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(['PROMOTED', 'CONDITIONALLY_PROMOTED', 'REPEAT', 'WITHHELD', 'GRADUATED']),
      toSectionId: z.string().optional(),
      overrideReason: z.string()
    })
  ).optional()
});

export const GraduationProcessSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  programId: z.string().min(1, 'Program ID is required'),
  graduationDate: z.string().or(z.date()),
  degreeClassification: z.string().optional(),
  thesisTitle: z.string().optional(),
  internshipOrganization: z.string().optional(),
  convocationBatch: z.string().optional()
});

// ==========================================
// 12. Finance, Full Accounting & Payroll Schemas (COMMAND 5)
// ==========================================

export const FiscalYearCreateSchema = z.object({
  name: z.string().min(1, 'Fiscal Year name is required'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSING', 'CLOSED', 'ARCHIVED']).default('OPEN'),
  isCurrent: z.boolean().default(false)
});

export const FiscalPeriodCreateSchema = z.object({
  fiscalYearId: z.string().optional(),
  name: z.string().min(1, 'Period name is required'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date())
});

export const FiscalPeriodReopenSchema = z.object({
  periodId: z.string().min(1, 'Period ID is required'),
  reason: z.string().min(5, 'Reopening reason is required')
});

export const ChartOfAccountCreateSchema = z.object({
  code: z.string().min(1, 'Account code is required'),
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  subtype: z.string().optional(),
  parentId: z.string().optional(),
  isHeader: z.boolean().default(false),
  currency: z.string().default('BDT')
});

export const CostCenterCreateSchema = z.object({
  code: z.string().min(1, 'Cost center code is required'),
  name: z.string().min(1, 'Cost center name is required'),
  departmentId: z.string().optional(),
  campusId: z.string().optional()
});

export const FundCreateSchema = z.object({
  code: z.string().min(1, 'Fund code is required'),
  name: z.string().min(1, 'Fund name is required')
});

export const JournalLineItemSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  costCenterId: z.string().optional(),
  fundId: z.string().optional(),
  debitAmount: z.number().min(0).default(0),
  creditAmount: z.number().min(0).default(0),
  memo: z.string().optional()
});

export const JournalVoucherCreateSchema = z.object({
  fiscalYearId: z.string().optional(),
  fiscalPeriodId: z.string().optional(),
  entryDate: z.string().or(z.date()).optional(),
  description: z.string().min(3, 'Description is required'),
  reference: z.string().optional(),
  sourceType: z.enum(['MANUAL', 'FEE_COLLECTION', 'FEE_BILLING', 'PAYROLL', 'REFUND', 'VENDOR_PAYMENT', 'EXPENSE']).default('MANUAL'),
  sourceId: z.string().optional(),
  lines: z.array(JournalLineItemSchema).min(2, 'Journal must have at least 2 lines')
});

export const JournalReversalSchema = z.object({
  journalEntryId: z.string().min(1, 'Journal entry ID is required'),
  reason: z.string().min(5, 'Reversal reason is required')
});

export const FeeTypeCreateSchema = z.object({
  name: z.string().min(1, 'Fee type name is required'),
  code: z.string().min(1, 'Fee type code is required'),
  description: z.string().optional(),
  isTaxable: z.boolean().default(false),
  taxRate: z.number().min(0).max(100).default(0)
});

export const FeeStructureCreateSchema = z.object({
  feeTypeId: z.string().optional(),
  name: z.string().min(1, 'Fee structure name is required'),
  amount: z.number().positive('Fee amount must be positive'),
  frequency: z.enum(['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'TERM', 'SEMESTER', 'ANNUAL', 'CUSTOM']).default('MONTHLY'),
  academicYearId: z.string().optional(),
  targetClassId: z.string().optional(),
  targetProgramId: z.string().optional(),
  targetClass: z.string().optional(),
  targetProgram: z.string().optional(),
  dueDayOfMonth: z.number().int().min(1).max(31).default(10)
});

export const BatchBillingGenerateSchema = z.object({
  feeStructureId: z.string().min(1, 'Fee structure ID is required'),
  billingPeriod: z.string().min(1, 'Billing period is required (e.g. September 2026)'),
  dueDate: z.string().or(z.date()),
  classId: z.string().optional(),
  programId: z.string().optional(),
  applyProration: z.boolean().default(false),
  prorationFactor: z.number().min(0).max(1).default(1.0)
});

export const LateFeeRuleCreateSchema = z.object({
  feeTypeId: z.string().optional(),
  gracePeriodDays: z.number().int().min(0).default(10),
  fineType: z.enum(['FLAT', 'DAILY', 'PERCENTAGE']).default('FLAT'),
  fineAmount: z.number().min(0).default(100),
  maxFineAmount: z.number().min(0).default(1000)
});

export const ScholarshipMasterCreateSchema = z.object({
  name: z.string().min(1, 'Scholarship name is required'),
  code: z.string().min(1, 'Scholarship code is required'),
  type: z.enum(['MERIT', 'NEED_BASED', 'GOVERNMENT', 'INSTITUTIONAL', 'SPORTS', 'SPECIAL']).default('MERIT'),
  benefitType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).default('PERCENTAGE'),
  benefitValue: z.number().positive('Benefit value must be positive'),
  criteria: z.string().optional()
});

export const ScholarshipApplicationCreateSchema = z.object({
  scholarshipId: z.string().min(1, 'Scholarship ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  requestedAmount: z.number().optional(),
  reason: z.string().min(5, 'Application reason is required'),
  documentsUrl: z.string().optional()
});

export const ScholarshipReviewSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  status: z.enum(['UNDER_REVIEW', 'RECOMMENDED', 'APPROVED', 'REJECTED']),
  remarks: z.string().optional(),
  awardValue: z.number().optional(),
  effectiveStartDate: z.string().or(z.date()).optional(),
  effectiveEndDate: z.string().or(z.date()).optional()
});

export const ScholarshipAwardCreateSchema = z.object({
  scholarshipId: z.string().min(1, 'Scholarship ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  applicationId: z.string().optional(),
  awardType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).default('PERCENTAGE'),
  awardValue: z.number().positive('Award value must be positive'),
  effectiveStartDate: z.string().or(z.date()),
  effectiveEndDate: z.string().or(z.date())
});

export const FeeWaiverCreateSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  invoiceId: z.string().optional(),
  waiverType: z.enum(['TUITION_WAIVER', 'FINE_WAIVER', 'FULL_WAIVER', 'PARTIAL_WAIVER']).default('TUITION_WAIVER'),
  amount: z.number().positive('Waiver amount must be positive'),
  reason: z.string().min(5, 'Waiver reason is required')
});

export const RefundRequestCreateSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  paymentId: z.string().optional(),
  invoiceId: z.string().optional(),
  amount: z.number().positive('Refund amount must be positive'),
  reason: z.string().min(5, 'Refund reason is required')
});

export const RefundProcessSchema = z.object({
  refundRequestId: z.string().min(1, 'Refund request ID is required'),
  action: z.enum(['APPROVE', 'REJECT', 'PROCESS']),
  rejectionReason: z.string().optional(),
  refundMethod: z.enum(['CASH', 'BANK_TRANSFER', 'STUDENT_CREDIT']).default('BANK_TRANSFER')
});

export const InstitutionBankAccountCreateSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  branchName: z.string().optional(),
  accountName: z.string().min(1, 'Account name is required'),
  accountNumberMasked: z.string().min(4, 'Masked account number is required'),
  currency: z.string().default('BDT'),
  ledgerAccountId: z.string().optional(),
  openingBalance: z.number().min(0).default(0)
});

export const ChequeRecordCreateSchema = z.object({
  bankAccountId: z.string().optional(),
  studentId: z.string().optional(),
  vendorId: z.string().optional(),
  chequeNumber: z.string().min(1, 'Cheque number is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  chequeDate: z.string().or(z.date()),
  amount: z.number().positive('Cheque amount must be positive'),
  type: z.enum(['RECEIVED', 'ISSUED']).default('RECEIVED')
});

export const ChequeStatusUpdateSchema = z.object({
  chequeId: z.string().min(1, 'Cheque ID is required'),
  status: z.enum(['DEPOSITED', 'CLEARED', 'BOUNCED', 'CANCELLED']),
  bounceReason: z.string().optional()
});

export const VendorCreateSchema = z.object({
  vendorCode: z.string().min(1, 'Vendor code is required'),
  name: z.string().min(1, 'Vendor name is required'),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().optional(),
  taxIdNumber: z.string().optional(),
  paymentTermsDays: z.number().int().min(0).default(30),
  ledgerAccountId: z.string().optional()
});

export const VendorBillCreateSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
  billNumber: z.string().min(1, 'Bill number is required'),
  billDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()),
  subTotal: z.number().positive('Subtotal must be positive'),
  taxAmount: z.number().min(0).default(0),
  expenseAccountId: z.string().optional()
});

export const ExpenseRequestCreateSchema = z.object({
  category: z.enum(['UTILITIES', 'MAINTENANCE', 'OFFICE_SUPPLIES', 'TRAVEL', 'ACADEMIC_MATERIALS', 'PETTY_CASH', 'MISC']),
  title: z.string().min(1, 'Expense title is required'),
  amount: z.number().positive('Expense amount must be positive'),
  department: z.string().optional(),
  vendorId: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE']).default('CASH'),
  receiptUrl: z.string().optional()
});

export const BudgetCreateSchema = z.object({
  fiscalYearId: z.string().min(1, 'Fiscal Year ID is required'),
  name: z.string().min(1, 'Budget title is required'),
  description: z.string().optional(),
  lines: z.array(
    z.object({
      accountId: z.string().min(1, 'Account ID is required'),
      departmentId: z.string().optional(),
      campusId: z.string().optional(),
      costCenterId: z.string().optional(),
      allocatedAmount: z.number().min(0, 'Allocated amount must be non-negative')
    })
  ).min(1, 'At least one budget line is required')
});

export const BudgetRevisionSchema = z.object({
  budgetId: z.string().min(1, 'Budget ID is required'),
  budgetLineId: z.string().min(1, 'Budget line ID is required'),
  newAmount: z.number().min(0, 'New amount must be non-negative'),
  reason: z.string().min(5, 'Revision reason is required')
});

export const SalaryStructureCreateSchema = z.object({
  name: z.string().min(1, 'Salary structure name is required'),
  basicPercentage: z.number().min(0).max(100).default(50),
  houseRentPercentage: z.number().min(0).max(100).default(30),
  medicalPercentage: z.number().min(0).max(100).default(10),
  transportAllowance: z.number().min(0).default(2000),
  pfEmployeePercentage: z.number().min(0).max(100).default(8.33),
  pfEmployerPercentage: z.number().min(0).max(100).default(8.33),
  taxDeductionPercentage: z.number().min(0).max(100).default(0)
});

export const EmployeeSalaryAssignmentSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  salaryStructureId: z.string().min(1, 'Salary structure ID is required'),
  grossSalary: z.number().positive('Gross salary must be positive'),
  effectiveDate: z.string().or(z.date())
});

export const PayrollPeriodCreateSchema = z.object({
  name: z.string().min(1, 'Period name is required (e.g. August 2026)'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date())
});

export const EmployeeLoanCreateSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  principalAmount: z.number().positive('Principal amount must be positive'),
  monthlyInstallment: z.number().positive('Monthly installment must be positive'),
  startDate: z.string().or(z.date())
});

export const SalaryAdvanceCreateSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  amount: z.number().positive('Advance amount must be positive'),
  advanceDate: z.string().or(z.date())
});



// ==========================================
// 12. Human Resources & Workforce Management (Command 6)
// ==========================================

export const EmployeeCreateSchema = z.object({
  campusId: z.string().min(1, 'Campus ID is required'),
  employeeCode: z.string().min(1, 'Employee code is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  photoUrl: z.string().optional().nullable(),
  designation: z.string().min(1, 'Designation is required'),
  departmentId: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  positionId: z.string().optional().nullable(),
  supervisorId: z.string().optional().nullable(),
  category: z.enum([
    'TEACHING',
    'NON_TEACHING',
    'ADMINISTRATIVE',
    'MANAGEMENT',
    'SUPPORT',
    'DRIVER',
    'SECURITY',
    'MAINTENANCE',
    'OTHER',
  ]).default('TEACHING'),
  status: z.enum([
    'PRE_HIRE',
    'ACTIVE',
    'PROBATION',
    'CONFIRMED',
    'ON_LEAVE',
    'SUSPENDED',
    'NOTICE_PERIOD',
    'RESIGNED',
    'TERMINATED',
    'RETIRED',
    'CONTRACT_ENDED',
    'DECEASED',
    'INACTIVE',
  ]).default('ACTIVE'),
  academicRank: z.string().optional().nullable(),
  joiningDate: z.string().or(z.date()),
  employmentType: z.enum([
    'PERMANENT',
    'PROBATIONARY',
    'CONTRACT',
    'TEMPORARY',
    'PART_TIME',
    'VISITING',
    'INTERN',
    'CONSULTANT',
    'HOURLY',
    'OTHER',
  ]).default('PERMANENT'),
  basicSalary: z.number().min(0, 'Basic salary must be non-negative'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Valid email is required'),
  nidNumber: z.string().optional().nullable(),
  dateOfBirth: z.string().or(z.date()).optional().nullable(),
  gender: z.string().optional().nullable(),
  nationality: z.string().default('Bangladeshi'),
  bloodGroup: z.string().optional().nullable(),
  presentAddress: z.string().optional().nullable(),
  permanentAddress: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactRelation: z.string().optional().nullable(),
});

export const EmployeeUpdateSchema = EmployeeCreateSchema.partial();

export const PositionCreateSchema = z.object({
  positionCode: z.string().min(1, 'Position code is required'),
  title: z.string().min(1, 'Position title is required'),
  campusId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  category: z.string().default('TEACHING'),
  grade: z.string().optional().nullable(),
  reportsToPositionId: z.string().optional().nullable(),
  authorizedHeadcount: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
});

export const FacultyProfileSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  academicRank: z.string().default('Lecturer'),
  specialization: z.string().optional().nullable(),
  researchArea: z.string().optional().nullable(),
  officeRoom: z.string().optional().nullable(),
  officeHours: z.string().optional().nullable(),
  biography: z.string().optional().nullable(),
  orcidId: z.string().optional().nullable(),
  googleScholarUrl: z.string().optional().nullable(),
});

export const EmployeeDocumentCreateSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  documentType: z.enum([
    'NID',
    'PASSPORT',
    'CV',
    'ACADEMIC_CERTIFICATE',
    'EXPERIENCE_CERTIFICATE',
    'APPOINTMENT_LETTER',
    'CONTRACT',
    'DRIVING_LICENSE',
    'POLICE_VERIFICATION',
    'OTHER',
  ]),
  title: z.string().min(1, 'Title is required'),
  documentNumber: z.string().optional().nullable(),
  issueDate: z.string().or(z.date()).optional().nullable(),
  expiryDate: z.string().or(z.date()).optional().nullable(),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).default('PENDING'),
  fileUrl: z.string().min(1, 'File URL is required'),
});

export const EmployeeQualificationCreateSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  degree: z.string().min(1, 'Degree is required'),
  subject: z.string().min(1, 'Subject is required'),
  institution: z.string().min(1, 'Institution is required'),
  country: z.string().default('Bangladesh'),
  passingYear: z.number().int().min(1950),
  resultGrade: z.string().min(1, 'Result / Grade is required'),
  certificateUrl: z.string().optional().nullable(),
});

export const EmployeeExperienceCreateSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  employerName: z.string().min(1, 'Employer name is required'),
  positionTitle: z.string().min(1, 'Position title is required'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  durationMonths: z.number().int().optional().nullable(),
  referenceContact: z.string().optional().nullable(),
});

export const JobRequisitionCreateSchema = z.object({
  positionId: z.string().min(1, 'Position ID is required'),
  requestedHeadcount: z.number().int().min(1).default(1),
  reason: z.string().min(5, 'Requisition reason is required'),
  requiredByDate: z.string().or(z.date()),
});

export const JobVacancyCreateSchema = z.object({
  positionId: z.string().min(1, 'Position ID is required'),
  campusId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  title: z.string().min(1, 'Vacancy title is required'),
  jobType: z.enum(['INTERNAL', 'EXTERNAL', 'BOTH']).default('BOTH'),
  employmentType: z.string().default('PERMANENT'),
  responsibilities: z.string().min(5, 'Responsibilities are required'),
  requirements: z.string().min(5, 'Requirements are required'),
  closingDate: z.string().or(z.date()),
});

export const JobCandidateCreateSchema = z.object({
  vacancyId: z.string().min(1, 'Vacancy ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  cvUrl: z.string().optional().nullable(),
  highestQualification: z.string().optional().nullable(),
  experienceYears: z.number().min(0).default(0),
  source: z.string().default('DIRECT'),
});

export const CandidateInterviewCreateSchema = z.object({
  candidateId: z.string().min(1, 'Candidate ID is required'),
  interviewDate: z.string().or(z.date()),
  roundName: z.string().min(1, 'Round name is required'),
  interviewers: z.string().min(1, 'Interviewers list is required'),
  criteriaScores: z.string().optional().nullable(),
  totalScore: z.number().min(0).max(100).optional().nullable(),
  comments: z.string().optional().nullable(),
  recommendation: z.enum(['HIRE', 'REJECT', 'HOLD', 'NEXT_ROUND']).default('HOLD'),
});

export const JobOfferCreateSchema = z.object({
  candidateId: z.string().min(1, 'Candidate ID is required'),
  positionId: z.string().min(1, 'Position ID is required'),
  employmentType: z.string().default('PERMANENT'),
  proposedJoiningDate: z.string().or(z.date()),
  offeredGrossSalary: z.number().positive('Gross salary must be positive'),
  expiryDate: z.string().or(z.date()),
});

export const CandidateHireConversionSchema = z.object({
  candidateId: z.string().min(1, 'Candidate ID is required'),
  offerId: z.string().min(1, 'Offer ID is required'),
  campusId: z.string().min(1, 'Campus ID is required'),
  employeeCode: z.string().min(1, 'Employee code is required'),
  joiningDate: z.string().or(z.date()),
  basicSalary: z.number().min(0),
});

export const HrShiftCreateSchema = z.object({
  shiftCode: z.string().min(1, 'Shift code is required'),
  name: z.string().min(1, 'Shift name is required'),
  startTime: z.string().min(1, 'Start time is required (HH:MM)'),
  endTime: z.string().min(1, 'End time is required (HH:MM)'),
  graceMinutes: z.number().int().min(0).default(15),
  breakMinutes: z.number().int().min(0).default(60),
  workingHours: z.number().positive().default(8.0),
  isNightShift: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const EmployeeRosterAssignSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  shiftId: z.string().min(1, 'Shift ID is required'),
  rosterDate: z.string().or(z.date()),
});

export const RawPunchIngestSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  punchTime: z.string().or(z.date()),
  punchType: z.enum(['ENTRY', 'EXIT']),
  deviceSource: z.enum(['BIOMETRIC', 'RFID', 'MOBILE', 'WEB', 'MANUAL_IMPORT']).default('BIOMETRIC'),
  deviceId: z.string().optional().nullable(),
  ipAddress: z.string().optional().nullable(),
});

export const AttendanceCorrectionRequestSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  attendanceDate: z.string().or(z.date()),
  requestedStatus: z.enum(['PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'HALF_DAY', 'REMOTE']),
  requestedCheckIn: z.string().or(z.date()).optional().nullable(),
  requestedCheckOut: z.string().or(z.date()).optional().nullable(),
  reason: z.string().min(5, 'Reason for attendance correction is required'),
});

export const OvertimeRequestSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  overtimeDate: z.string().or(z.date()),
  hours: z.number().positive('Overtime hours must be positive'),
  reason: z.string().min(5, 'Reason is required'),
});

export const HrLeaveTypeCreateSchema = z.object({
  code: z.string().min(1, 'Leave type code is required (e.g. CASUAL, SICK)'),
  name: z.string().min(1, 'Leave type name is required'),
  isPaid: z.boolean().default(true),
  annualQuotaDays: z.number().int().min(0).default(14),
  carryForwardMaxDays: z.number().int().min(0).default(0),
  requiresProof: z.boolean().default(false),
});

export const HrLeavePolicyCreateSchema = z.object({
  leaveTypeId: z.string().min(1, 'Leave type ID is required'),
  employmentType: z.string().default('PERMANENT'),
  category: z.string().default('TEACHING'),
  annualEntitlement: z.number().int().min(0).default(14),
  accrualFrequency: z.enum(['ANNUAL', 'MONTHLY', 'PRORATED']).default('ANNUAL'),
});

export const EmployeeLeaveApplySchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  leaveTypeId: z.string().min(1, 'Leave type ID is required'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  totalDays: z.number().positive('Total days must be positive'),
  isHalfDay: z.boolean().default(false),
  halfDayType: z.enum(['FIRST_HALF', 'SECOND_HALF']).optional().nullable(),
  reason: z.string().min(3, 'Reason is required'),
  attachmentUrl: z.string().optional().nullable(),
});

export const LeaveActionSchema = z.object({
  leaveApplicationId: z.string().min(1, 'Leave application ID is required'),
  action: z.enum(['APPROVE', 'REJECT', 'CANCEL']).optional(),
  statusAction: z.enum(['APPROVE', 'REJECT', 'CANCEL']).optional(),
  rejectionReason: z.string().optional().nullable(),
});

export const EmployeePromotionSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  effectiveDate: z.string().or(z.date()),
  newPositionId: z.string().optional().nullable(),
  newAcademicRank: z.string().optional().nullable(),
  reason: z.string().min(5, 'Promotion rationale is required'),
});

export const EmployeeTransferSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  effectiveDate: z.string().or(z.date()),
  newCampusId: z.string().optional().nullable(),
  newDepartmentId: z.string().optional().nullable(),
  reason: z.string().min(5, 'Transfer reason is required'),
});

export const EmployeeIncrementSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  effectiveDate: z.string().or(z.date()),
  newGrossSalary: z.number().positive('New gross salary must be positive'),
  reason: z.string().min(5, 'Increment justification is required'),
});

export const PerformanceCycleCreateSchema = z.object({
  name: z.string().min(1, 'Cycle name is required'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
});

export const EmployeeGoalCreateSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  cycleId: z.string().min(1, 'Cycle ID is required'),
  title: z.string().min(1, 'Goal title is required'),
  weightagePercentage: z.number().min(1).max(100).default(20),
  targetMetric: z.string().min(1, 'Target metric is required'),
});

export const EmployeePerformanceReviewSubmitSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  cycleId: z.string().min(1, 'Cycle ID is required'),
  teachingScore: z.number().min(0).max(100).optional().nullable(),
  researchScore: z.number().min(0).max(100).optional().nullable(),
  serviceScore: z.number().min(0).max(100).optional().nullable(),
  overallScore: z.number().min(0).max(100).optional().nullable(),
  rating: z.enum(['OUTSTANDING', 'EXCEEDS_EXPECTATIONS', 'MEETS_EXPECTATIONS', 'NEEDS_IMPROVEMENT']).optional().nullable(),
  selfReviewSummary: z.string().optional().nullable(),
  managerReviewSummary: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'MODERATED', 'FINALIZED']).default('SUBMITTED'),
});

export const TrainingProgramCreateSchema = z.object({
  title: z.string().min(1, 'Program title is required'),
  provider: z.string().min(1, 'Provider is required'),
  trainingType: z.enum(['PEDAGOGY', 'TECHNICAL', 'LEADERSHIP', 'COMPLIANCE', 'WORKSHOP']).default('PEDAGOGY'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  capacity: z.number().int().min(1).default(30),
  cost: z.number().min(0).default(0),
});

export const EmployeeTrainingNominateSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  trainingProgramId: z.string().min(1, 'Training program ID is required'),
});

export const EmployeeDisciplinaryCaseSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  incidentDate: z.string().or(z.date()),
  allegation: z.string().min(5, 'Allegation details are required'),
  evidenceUrls: z.string().optional().nullable(),
});

export const EmployeeWarningSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  warningLevel: z.enum(['VERBAL', 'WRITTEN', 'FINAL']),
  issueDate: z.string().or(z.date()),
  reason: z.string().min(5, 'Warning reason is required'),
});

export const EmployeeGrievanceSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  subject: z.string().min(1, 'Grievance subject is required'),
  details: z.string().min(10, 'Grievance description is required'),
  isConfidential: z.boolean().default(true),
});

export const EmployeeSeparationRequestSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  separationType: z.enum(['RESIGNATION', 'RETIREMENT', 'CONTRACT_COMPLETION', 'TERMINATION', 'OTHER']).default('RESIGNATION'),
  lastWorkingDate: z.string().or(z.date()),
  reason: z.string().min(5, 'Separation reason is required'),
  noticePeriodDays: z.number().int().min(0).default(30),
});

export const ExitClearanceUpdateSchema = z.object({
  separationId: z.string().min(1, 'Separation ID is required'),
  departmentCleared: z.boolean().optional(),
  libraryCleared: z.boolean().optional(),
  financeCleared: z.boolean().optional(),
  itEquipmentCleared: z.boolean().optional(),
  hostelCleared: z.boolean().optional(),
  finalPayrollInputData: z.string().optional().nullable(),
});


// ====================================================
// COMMAND 7: FACILITIES, OPERATIONS & LOGISTICS SCHEMAS
// ====================================================

// 1. Generic Facility Master
export const FacilityCreateSchema = z.object({
  campusId: z.string().optional().nullable(),
  code: z.string().min(1, 'Facility code is required'),
  name: z.string().min(1, 'Facility name is required'),
  type: z.enum(['LIBRARY', 'HOSTEL', 'CANTEEN', 'SPORTS', 'AUDITORIUM', 'LAB', 'CLINIC', 'PARKING', 'WAREHOUSE', 'OTHER']).default('OTHER'),
  buildingId: z.string().optional().nullable(),
  floorLocation: z.string().optional().nullable(),
  capacity: z.number().int().nonnegative().default(0),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']).default('ACTIVE'),
  metadata: z.string().optional().nullable(),
});

// 2. Library Schemas
export const LibraryCreateSchema = z.object({
  campusId: z.string().min(1, 'Campus ID is required'),
  code: z.string().min(1, 'Library code is required'),
  name: z.string().min(1, 'Library name is required'),
  location: z.string().optional().nullable(),
  openingHours: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const LibraryCatalogCreateSchema = z.object({
  libraryId: z.string().min(1, 'Library ID is required'),
  title: z.string().min(1, 'Book/resource title is required'),
  subtitle: z.string().optional().nullable(),
  isbn: z.string().optional().nullable(),
  author: z.string().min(1, 'Author name is required'),
  editor: z.string().optional().nullable(),
  publisher: z.string().optional().nullable(),
  edition: z.string().optional().nullable(),
  publicationYear: z.number().int().optional().nullable(),
  language: z.string().default('English'),
  category: z.string().default('General'),
  subject: z.string().optional().nullable(),
  resourceType: z.enum(['BOOK', 'JOURNAL', 'MAGAZINE', 'THESIS', 'RESEARCH_PAPER', 'NEWSPAPER', 'EBOOK', 'DIGITAL_RESOURCE', 'AUDIO_VISUAL', 'OTHER']).default('BOOK'),
  keywords: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  coverImageUrl: z.string().optional().nullable(),
  isDigital: z.boolean().default(false),
  digitalFileUrl: z.string().optional().nullable(),
});

export const LibraryCopyCreateSchema = z.object({
  catalogId: z.string().min(1, 'Catalog ID is required'),
  accessionNumber: z.string().min(1, 'Accession number is required'),
  barcode: z.string().optional().nullable(),
  qrCode: z.string().optional().nullable(),
  shelf: z.string().optional().nullable(),
  rack: z.string().optional().nullable(),
  condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED']).default('GOOD'),
  acquisitionDate: z.string().or(z.date()).optional(),
  acquisitionCost: z.number().nonnegative().default(0),
  availabilityStatus: z.enum(['AVAILABLE', 'ISSUED', 'RESERVED', 'LOST', 'DAMAGED', 'REPAIR', 'WITHDRAWN']).default('AVAILABLE'),
});

export const LibraryBorrowingPolicyCreateSchema = z.object({
  name: z.string().min(1, 'Policy name is required'),
  memberType: z.enum(['STUDENT', 'TEACHER', 'STAFF', 'FACULTY']).default('STUDENT'),
  maxBooks: z.number().int().positive().default(3),
  loanDurationDays: z.number().int().positive().default(14),
  renewalLimit: z.number().int().nonnegative().default(2),
  finePerOverdueDay: z.number().nonnegative().default(5.0),
  graceDays: z.number().int().nonnegative().default(1),
});

export const LibraryMemberRegisterSchema = z.object({
  memberType: z.enum(['STUDENT', 'EMPLOYEE']).default('STUDENT'),
  studentId: z.string().optional().nullable(),
  employeeId: z.string().optional().nullable(),
  membershipNumber: z.string().min(1, 'Membership number is required'),
  policyId: z.string().optional().nullable(),
  expiryDate: z.string().or(z.date()).optional().nullable(),
});

export const BookIssueCreateSchema = z.object({
  copyId: z.string().min(1, 'Copy ID is required'),
  memberId: z.string().min(1, 'Member ID is required'),
  dueDate: z.string().or(z.date()),
});

export const BookReturnSchema = z.object({
  issueId: z.string().min(1, 'Issue ID is required'),
  condition: z.enum(['GOOD', 'DAMAGED', 'LOST']).default('GOOD'),
  damageNotes: z.string().optional().nullable(),
  damageFee: z.number().nonnegative().default(0),
});

export const BookReservationCreateSchema = z.object({
  catalogId: z.string().min(1, 'Catalog ID is required'),
  memberId: z.string().min(1, 'Member ID is required'),
  priorityOrder: z.number().int().default(1),
  expiryDate: z.string().or(z.date()).optional().nullable(),
});

export const LibraryStocktakeCreateSchema = z.object({
  libraryId: z.string().min(1, 'Library ID is required'),
  scannedAccessionNumbers: z.array(z.string()),
  notes: z.string().optional().nullable(),
});

// 3. Hostel Schemas
export const HostelCreateSchema = z.object({
  campusId: z.string().min(1, 'Campus ID is required'),
  code: z.string().min(1, 'Hostel code is required'),
  name: z.string().min(1, 'Hostel name is required'),
  type: z.enum(['BOYS', 'GIRLS', 'FACULTY', 'INTERNATIONAL', 'OTHER']).default('BOYS'),
  address: z.string().optional().nullable(),
  wardenName: z.string().optional().nullable(),
  wardenPhone: z.string().optional().nullable(),
  capacity: z.number().int().positive().default(100),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const HostelBlockCreateSchema = z.object({
  hostelId: z.string().min(1, 'Hostel ID is required'),
  name: z.string().min(1, 'Block name is required'),
  code: z.string().min(1, 'Block code is required'),
  totalFloors: z.number().int().positive().default(4),
});

export const HostelRoomCreateSchema = z.object({
  hostelId: z.string().min(1, 'Hostel ID is required'),
  blockId: z.string().optional().nullable(),
  roomNumber: z.string().min(1, 'Room number is required'),
  floorNumber: z.number().int().default(1),
  roomType: z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY', 'CUSTOM']).default('DOUBLE'),
  capacity: z.number().int().positive().default(2),
  monthlyRent: z.number().nonnegative().default(3000),
  hasAttachedBath: z.boolean().default(false),
  hasAirConditioner: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']).default('ACTIVE'),
});

export const HostelBedCreateSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  bedNumber: z.string().min(1, 'Bed number is required'),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'BLOCKED']).default('AVAILABLE'),
});

export const HostelApplicationCreateSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  hostelId: z.string().min(1, 'Hostel ID is required'),
  preferredRoomType: z.string().default('DOUBLE'),
});

export const HostelAllocationCreateSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  bedId: z.string().min(1, 'Bed ID is required'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  depositAmount: z.number().nonnegative().default(0),
  monthlyFee: z.number().nonnegative().default(0),
});

export const HostelCheckInCreateSchema = z.object({
  allocationId: z.string().min(1, 'Allocation ID is required'),
  initialBedCondition: z.string().default('GOOD'),
  keyCardNumber: z.string().optional().nullable(),
  depositPaid: z.number().nonnegative().default(0),
  remarks: z.string().optional().nullable(),
});

export const HostelTransferCreateSchema = z.object({
  allocationId: z.string().min(1, 'Allocation ID is required'),
  newBedId: z.string().min(1, 'New Bed ID is required'),
  reason: z.string().min(3, 'Transfer reason is required'),
});

export const HostelVisitorLogCreateSchema = z.object({
  hostelId: z.string().min(1, 'Hostel ID is required'),
  residentStudentId: z.string().min(1, 'Resident student ID is required'),
  visitorName: z.string().min(1, 'Visitor name is required'),
  visitorPhone: z.string().min(1, 'Visitor phone is required'),
  visitorNid: z.string().optional().nullable(),
  relationship: z.string().optional().nullable(),
  purpose: z.string().min(1, 'Purpose of visit is required'),
});

export const HostelAttendanceCreateSchema = z.object({
  hostelId: z.string().min(1, 'Hostel ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  date: z.string().or(z.date()),
  status: z.enum(['PRESENT', 'OUT', 'LEAVE', 'LATE_RETURN']).default('PRESENT'),
  remarks: z.string().optional().nullable(),
});

// 4. Transport Schemas
export const TransportVehicleCreateSchema = z.object({
  campusId: z.string().min(1, 'Campus ID is required'),
  vehicleNumber: z.string().min(1, 'Vehicle plate number is required'),
  registrationNumber: z.string().optional().nullable(),
  vehicleType: z.enum(['BUS', 'MINIBUS', 'MICROBUS', 'VAN', 'CAR']).default('BUS'),
  makeModel: z.string().min(1, 'Make & Model is required'),
  capacity: z.number().int().positive().default(40),
  manufactureYear: z.number().int().optional().nullable(),
  fuelType: z.enum(['DIESEL', 'OCTANE', 'CNG', 'ELECTRIC']).default('DIESEL'),
  ownership: z.enum(['OWNED', 'LEASED', 'RENTED']).default('OWNED'),
  assignedDriverId: z.string().optional().nullable(),
  driverName: z.string().optional().nullable(),
  driverPhone: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'RETIRED']).default('ACTIVE'),
});

export const TransportRouteCreateSchema = z.object({
  campusId: z.string().optional().nullable(),
  routeCode: z.string().min(1, 'Route code is required'),
  routeName: z.string().min(1, 'Route name is required'),
  startPoint: z.string().min(1, 'Start point is required'),
  endPoint: z.string().min(1, 'End point is required'),
  distanceKm: z.number().nonnegative().default(0),
  estimatedMinutes: z.number().int().positive().default(60),
  monthlyFee: z.number().nonnegative().default(2000),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const RouteStopCreateSchema = z.object({
  routeId: z.string().min(1, 'Route ID is required'),
  stopOrder: z.number().int().positive(),
  stopName: z.string().min(1, 'Stop name is required'),
  pickupTime: z.string().min(1, 'Pickup time is required'),
  dropTime: z.string().min(1, 'Drop time is required'),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  feeZone: z.string().optional().nullable(),
});

export const TransportSubscriptionCreateSchema = z.object({
  memberType: z.enum(['STUDENT', 'EMPLOYEE']).default('STUDENT'),
  studentId: z.string().optional().nullable(),
  employeeId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  routeId: z.string().min(1, 'Route ID is required'),
  pickupStopId: z.string().min(1, 'Pickup stop ID is required'),
  dropStopId: z.string().min(1, 'Drop stop ID is required'),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional().nullable(),
  monthlyFee: z.number().nonnegative().default(0),
});

export const TripScheduleCreateSchema = z.object({
  routeId: z.string().min(1, 'Route ID is required'),
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  driverName: z.string().optional().nullable(),
  tripType: z.enum(['MORNING_PICKUP', 'EVENING_DROP', 'SPECIAL_EVENT']).default('MORNING_PICKUP'),
  scheduledStartTime: z.string(),
  scheduledEndTime: z.string(),
});

export const TransportBoardingEventCreateSchema = z.object({
  tripId: z.string().optional().nullable(),
  subscriptionId: z.string().optional().nullable(),
  studentId: z.string().optional().nullable(),
  eventType: z.enum(['BOARDED', 'DISEMBARKED', 'MISSED', 'MANUAL_OVERRIDE']).default('BOARDED'),
  source: z.enum(['MANUAL', 'QR', 'RFID', 'NFC', 'DEVICE_API']).default('MANUAL'),
});

export const GpsTelemetryIngestSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
  latitude: z.number(),
  longitude: z.number(),
  speedKmH: z.number().default(0),
  headingDegrees: z.number().default(0),
  accuracyMeters: z.number().default(5),
  timestamp: z.string().or(z.date()).optional(),
  source: z.enum(['DEVICE_WEBHOOK', 'SIMULATED', 'MANUAL_LOG']).default('DEVICE_WEBHOOK'),
});

export const TransportIncidentCreateSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  routeId: z.string().optional().nullable(),
  incidentDate: z.string().or(z.date()).optional(),
  incidentType: z.enum(['BREAKDOWN', 'ACCIDENT', 'DELAY', 'DISRUPTION', 'OTHER']).default('BREAKDOWN'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  description: z.string().min(1, 'Description is required'),
  actionTaken: z.string().optional().nullable(),
});

export const FuelLogCreateSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  logDate: z.string().or(z.date()).optional(),
  quantityLiters: z.number().positive('Fuel quantity must be positive'),
  fuelCost: z.number().nonnegative(),
  odometerReading: z.number().nonnegative(),
  receiptNumber: z.string().optional().nullable(),
});

export const VehicleMaintenanceRecordCreateSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  serviceDate: z.string().or(z.date()).optional(),
  serviceType: z.enum(['ROUTINE', 'REPAIR', 'TIRE_CHANGE', 'OVERHAUL']).default('ROUTINE'),
  description: z.string().min(1, 'Description is required'),
  cost: z.number().nonnegative().default(0),
  odometerReading: z.number().nonnegative().default(0),
  nextServiceDueOdometer: z.number().optional().nullable(),
  nextServiceDueDate: z.string().or(z.date()).optional().nullable(),
});

// 5. Canteen Schemas
export const CanteenCreateSchema = z.object({
  campusId: z.string().min(1, 'Campus ID is required'),
  code: z.string().min(1, 'Canteen code is required'),
  name: z.string().min(1, 'Canteen name is required'),
  operatorType: z.enum(['INSTITUTION_OWNED', 'CONTRACT_VENDOR']).default('INSTITUTION_OWNED'),
  vendorId: z.string().optional().nullable(),
});

export const CanteenItemCreateSchema = z.object({
  canteenId: z.string().min(1, 'Canteen ID is required'),
  itemCode: z.string().min(1, 'Item code is required'),
  name: z.string().min(1, 'Item name is required'),
  category: z.enum(['BREAKFAST', 'LUNCH', 'SNACKS', 'BEVERAGES', 'BAKERY', 'OTHER']).default('SNACKS'),
  salePrice: z.number().positive(),
  costPrice: z.number().nonnegative().default(0),
  taxPercent: z.number().nonnegative().default(0),
  isAvailable: z.boolean().default(true),
  stockItemId: z.string().optional().nullable(),
});


export const CanteenMenuCreateSchema = z.object({
  canteenId: z.string().min(1, "Canteen ID is required"),
  date: z.string().or(z.date()),
  mealPeriod: z.enum(["BREAKFAST", "LUNCH", "AFTERNOON_SNACKS", "DINNER"]).default("LUNCH"),
  itemIds: z.array(z.string()).default([]),
  isPublished: z.boolean().default(true),
});

export const CanteenWalletDepositSchema = z.object({
  walletId: z.string().min(1, 'Wallet ID is required'),
  amount: z.number().positive('Deposit amount must be positive'),
  notes: z.string().optional().nullable(),
});

export const CanteenSpendingLimitSchema = z.object({
  walletId: z.string().min(1, 'Wallet ID is required'),
  dailyLimit: z.number().positive(),
  weeklyLimit: z.number().positive(),
});

export const CanteenPosSaleCreateSchema = z.object({
  canteenId: z.string().min(1, 'Canteen ID is required'),
  buyerType: z.enum(['STUDENT', 'EMPLOYEE', 'GUEST']).default('STUDENT'),
  studentId: z.string().optional().nullable(),
  employeeId: z.string().optional().nullable(),
  paymentMode: z.enum(['CASH', 'WALLET', 'CARD_ONLINE', 'CREDIT']).default('CASH'),
  items: z.array(z.object({
    itemId: z.string().min(1),
    quantity: z.number().int().positive(),
  })).min(1, 'At least one item required'),
  discountAmount: z.number().nonnegative().default(0),
});

// 6. Inventory Schemas
export const InventoryCategoryCreateSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  code: z.string().min(1, 'Category code is required'),
  description: z.string().optional().nullable(),
});

export const WarehouseCreateSchema = z.object({
  campusId: z.string().optional().nullable(),
  code: z.string().min(1, 'Warehouse code is required'),
  name: z.string().min(1, 'Warehouse name is required'),
  type: z.enum(['CENTRAL_STORE', 'CAMPUS_STORE', 'DEPARTMENT_STORE', 'CANTEEN_STORE', 'LAB_STORE']).default('CENTRAL_STORE'),
  location: z.string().optional().nullable(),
  managerEmployeeId: z.string().optional().nullable(),
});

export const InventoryItemCreateSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  sku: z.string().min(1, 'SKU code is required'),
  name: z.string().min(1, 'Item name is required'),
  unitOfMeasure: z.enum(['PCS', 'BOX', 'KG', 'LTR', 'REAM', 'PACKET', 'SET']).default('PCS'),
  reorderLevel: z.number().nonnegative().default(10),
  standardCost: z.number().nonnegative().default(0),
  trackSerial: z.boolean().default(false),
  trackBatch: z.boolean().default(false),
  hasExpiry: z.boolean().default(false),
});

export const StockAdjustmentSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  itemId: z.string().min(1, 'Item ID is required'),
  transactionType: z.enum(['OPENING', 'PURCHASE_RECEIPT', 'ISSUE', 'RETURN', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT', 'DAMAGE', 'EXPIRY', 'DISPOSAL']),
  quantity: z.number(),
  unitCost: z.number().nonnegative().default(0),
  notes: z.string().min(1, 'Reason/notes required'),
});

export const StockTransferCreateSchema = z.object({
  fromWarehouseId: z.string().min(1, 'Source warehouse ID is required'),
  toWarehouseId: z.string().min(1, 'Target warehouse ID is required'),
  items: z.array(z.object({
    itemId: z.string().min(1),
    requestedQty: z.number().positive(),
  })).min(1, 'At least one item required'),
});

export const StockIssueRecordCreateSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  issuedToType: z.enum(['DEPARTMENT', 'EMPLOYEE', 'STUDENT', 'FACILITY']).default('DEPARTMENT'),
  departmentId: z.string().optional().nullable(),
  employeeId: z.string().optional().nullable(),
  studentId: z.string().optional().nullable(),
  facilityId: z.string().optional().nullable(),
  purpose: z.string().min(1, 'Issue purpose is required'),
  items: z.array(z.object({
    itemId: z.string().min(1),
    quantity: z.number().positive(),
  })).min(1, 'At least one item required'),
});

// 7. Fixed Asset Schemas
export const FixedAssetCreateSchema = z.object({
  campusId: z.string().min(1, 'Campus ID is required'),
  assetTag: z.string().min(1, 'Asset tag is required'),
  name: z.string().min(1, 'Asset name is required'),
  category: z.enum(['COMPUTER', 'LAPTOP', 'PROJECTOR', 'FURNITURE', 'AC', 'GENERATOR', 'VEHICLE', 'LAB_EQUIPMENT', 'SPORTS_EQUIPMENT', 'BUILDING_EQUIPMENT', 'OTHER']).default('COMPUTER'),
  serialNumber: z.string().optional().nullable(),
  purchaseDate: z.string().or(z.date()).optional(),
  purchaseCost: z.number().nonnegative().default(0),
  supplierVendorId: z.string().optional().nullable(),
  warrantyExpiry: z.string().or(z.date()).optional().nullable(),
  warrantyProvider: z.string().optional().nullable(),
  currentCustodianEmployeeId: z.string().optional().nullable(),
  currentDepartmentId: z.string().optional().nullable(),
  currentRoomId: z.string().optional().nullable(),
  depreciationMethod: z.enum(['STRAIGHT_LINE', 'WRITTEN_DOWN_VALUE', 'NONE']).default('STRAIGHT_LINE'),
  depreciationRatePercent: z.number().nonnegative().default(10),
  salvageValue: z.number().nonnegative().default(0),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED']).default('GOOD'),
});

export const AssetAssignSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required'),
  assignedToType: z.enum(['EMPLOYEE', 'DEPARTMENT', 'ROOM', 'CAMPUS']).default('EMPLOYEE'),
  employeeId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export const AssetReturnSchema = z.object({
  assignmentId: z.string().min(1, 'Assignment ID is required'),
  conditionOnReturn: z.string().default('GOOD'),
  remarks: z.string().optional().nullable(),
});

export const AssetMaintenanceCreateSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required'),
  serviceType: z.enum(['REPAIR', 'SERVICING', 'PART_REPLACEMENT']).default('SERVICING'),
  cost: z.number().nonnegative().default(0),
  vendorName: z.string().optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  nextServiceDue: z.string().or(z.date()).optional().nullable(),
});

export const AssetDisposalCreateSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required'),
  disposalType: z.enum(['SOLD', 'SCRAPPED', 'DONATED', 'LOST']).default('SCRAPPED'),
  saleAmount: z.number().nonnegative().default(0),
  reason: z.string().min(3, 'Disposal rationale is required'),
});

// 8. Procurement Schemas
export const PurchaseRequisitionCreateSchema = z.object({
  departmentId: z.string().optional().nullable(),
  requestedByEmployeeId: z.string().min(1, 'Employee ID is required'),
  requiredByDate: z.string().or(z.date()),
  purpose: z.string().min(1, 'Purpose is required'),
  items: z.array(z.object({
    itemId: z.string().optional().nullable(),
    itemName: z.string().min(1),
    specification: z.string().optional().nullable(),
    quantity: z.number().positive(),
    estimatedUnitPrice: z.number().nonnegative().default(0),
  })).min(1, 'At least one item required'),
});

export const RequestForQuotationCreateSchema = z.object({
  requisitionId: z.string().optional().nullable(),
  title: z.string().min(1, 'Title is required'),
  deadlineDate: z.string().or(z.date()),
  termsConditions: z.string().optional().nullable(),
});

export const VendorQuotationCreateSchema = z.object({
  rfqId: z.string().optional().nullable(),
  vendorId: z.string().min(1, 'Vendor ID is required'),
  quotationNumber: z.string().min(1, 'Quotation number is required'),
  validityDate: z.string().or(z.date()),
  totalQuotedAmount: z.number().positive(),
  paymentTerms: z.string().optional().nullable(),
  deliveryLeadDays: z.number().int().default(7),
  attachmentUrl: z.string().optional().nullable(),
  items: z.array(z.object({
    itemName: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    taxPercent: z.number().nonnegative().default(0),
  })).min(1, 'At least one item required'),
});

export const PurchaseOrderCreateSchema = z.object({
  requisitionId: z.string().optional().nullable(),
  quotationId: z.string().optional().nullable(),
  vendorId: z.string().min(1, 'Vendor ID is required'),
  expectedDeliveryDate: z.string().or(z.date()),
  subtotal: z.number().nonnegative(),
  taxAmount: z.number().nonnegative().default(0),
  shippingAmount: z.number().nonnegative().default(0),
  totalAmount: z.number().positive(),
  terms: z.string().optional().nullable(),
  items: z.array(z.object({
    itemId: z.string().optional().nullable(),
    itemName: z.string().min(1),
    orderedQuantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    taxPercent: z.number().nonnegative().default(0),
  })).min(1, 'At least one item required'),
});

export const GoodsReceiptNoteCreateSchema = z.object({
  poId: z.string().min(1, 'PO ID is required'),
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  challanNumber: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  items: z.array(z.object({
    poItemId: z.string().optional().nullable(),
    itemId: z.string().optional().nullable(),
    receivedQuantity: z.number().positive(),
    acceptedQuantity: z.number().nonnegative(),
    rejectedQuantity: z.number().nonnegative().default(0),
    unitCost: z.number().nonnegative(),
    rejectionReason: z.string().optional().nullable(),
  })).min(1, 'At least one item required'),
});

// 9. Maintenance & Service Desk Schemas
export const MaintenanceRequestCreateSchema = z.object({
  campusId: z.string().min(1, 'Campus ID is required'),
  requesterType: z.enum(['STUDENT', 'EMPLOYEE', 'FACILITY_STAFF']).default('EMPLOYEE'),
  requesterEmployeeId: z.string().optional().nullable(),
  requesterStudentId: z.string().optional().nullable(),
  category: z.enum(['ELECTRICAL', 'PLUMBING', 'HVAC', 'IT_EQUIPMENT', 'FURNITURE', 'TRANSPORT', 'HOSTEL', 'CLEANING', 'SAFETY', 'OTHER']).default('ELECTRICAL'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  facilityId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
  assetId: z.string().optional().nullable(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
});

export const MaintenanceWorkOrderCreateSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  assignedTechnicianEmployeeId: z.string().optional().nullable(),
  technicianName: z.string().optional().nullable(),
  scheduledDate: z.string().or(z.date()).optional(),
  laborCost: z.number().nonnegative().default(0),
  partsCost: z.number().nonnegative().default(0),
});

export const MaintenanceWorkOrderUpdateSchema = z.object({
  workOrderId: z.string().min(1, 'Work Order ID is required'),
  status: z.enum(['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).default('RESOLVED'),
  laborCost: z.number().nonnegative().optional(),
  partsCost: z.number().nonnegative().optional(),
  resolutionSummary: z.string().optional().nullable(),
});

// 10. Visitor & Gate Access Schemas
export const VisitorRecordCreateSchema = z.object({
  campusId: z.string().min(1, 'Campus ID is required'),
  visitorName: z.string().min(1, 'Visitor name is required'),
  phone: z.string().min(1, 'Visitor phone is required'),
  idProofType: z.enum(['NID', 'PASSPORT', 'DRIVING_LICENSE', 'OFFICE_ID']).default('NID'),
  idProofNumber: z.string().optional().nullable(),
  organization: z.string().optional().nullable(),
  purpose: z.string().min(1, 'Purpose of visit is required'),
  visitingPersonType: z.enum(['EMPLOYEE', 'STUDENT', 'OFFICE']).default('EMPLOYEE'),
  hostEmployeeId: z.string().optional().nullable(),
  studentId: z.string().optional().nullable(),
  gateName: z.string().default('Main Gate'),
});

export const VisitorCheckOutSchema = z.object({
  visitorId: z.string().min(1, 'Visitor ID is required'),
});

export const StudentPickupAuthCreateSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  guardianId: z.string().optional().nullable(),
  authorizedPersonName: z.string().min(1, 'Authorized person name is required'),
  phone: z.string().min(1, 'Phone is required'),
  nidNumber: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  relationToStudent: z.string().min(1, 'Relation to student is required'),
});

export const VehicleGateLogCreateSchema = z.object({
  campusId: z.string().min(1, 'Campus ID is required'),
  vehiclePlateNumber: z.string().min(1, 'Vehicle plate number is required'),
  driverName: z.string().optional().nullable(),
  driverPhone: z.string().optional().nullable(),
  vehicleType: z.enum(['CAR', 'TRUCK', 'VAN', 'BIKE', 'DELIVERY']).default('CAR'),
  purpose: z.string().min(1, 'Purpose of entry is required'),
  gateName: z.string().default('Main Gate'),
});

// 11. Facility Booking Schemas
export const FacilityBookingCreateSchema = z.object({
  campusId: z.string().min(1, 'Campus ID is required'),
  facilityId: z.string().optional().nullable(),
  classroomId: z.string().optional().nullable(),
  bookingDate: z.string().or(z.date()),
  startTime: z.string().min(1, 'Start time is required (e.g. 09:00)'),
  endTime: z.string().min(1, 'End time is required (e.g. 12:00)'),
  purpose: z.string().min(1, 'Booking purpose is required'),
  requestedBy: z.string().min(1, 'Requester name is required'),
  requesterType: z.enum(['EMPLOYEE', 'STUDENT', 'EXTERNAL']).default('EMPLOYEE'),
  attendeeCount: z.number().int().positive().default(20),
});

export const FacilityBookingActionSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  action: z.enum(['APPROVE', 'REJECT', 'CANCEL']),
  reviewNotes: z.string().optional().nullable(),
});

// ====================================================
// COMMAND 8: LMS & DIGITAL LEARNING SCHEMAS
// ====================================================

// 1. LMS Course & Syllabus
export const LmsCourseCreateSchema = z.object({
  campusId: z.string().min(1, 'Campus ID is required'),
  code: z.string().min(1, 'Course code is required'),
  title: z.string().min(1, 'Course title is required'),
  description: z.string().optional().nullable(),
  coverImageUrl: z.string().optional().nullable(),
  academicYearId: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  classId: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  subjectId: z.string().optional().nullable(),
  courseOfferingId: z.string().optional().nullable(),
  primaryTeacherId: z.string().optional().nullable(),
  coTeacherIds: z.array(z.string()).optional(),
  coordinatorId: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
});

export const LmsCourseUpdateSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  title: z.string().optional(),
  description: z.string().optional().nullable(),
  coverImageUrl: z.string().optional().nullable(),
  primaryTeacherId: z.string().optional(),
  coTeacherIds: z.array(z.string()).optional(),
  coordinatorId: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export const LmsSyllabusSaveSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  overview: z.string().optional().nullable(),
  objectives: z.string().optional().nullable(),
  learningOutcomesDesc: z.string().optional().nullable(),
  requiredMaterials: z.string().optional().nullable(),
  assessmentBreakdown: z.string().optional().nullable(),
  policies: z.string().optional().nullable(),
  officeHours: z.string().optional().nullable(),
});

export const LmsLearningOutcomeCreateSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  code: z.string().min(1, 'Outcome code is required (e.g. CLO1)'),
  description: z.string().min(1, 'Outcome description is required'),
  bloomLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']).optional().nullable(),
});

// 2. Modules & Lessons
export const LmsModuleCreateSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  title: z.string().min(1, 'Module title is required'),
  description: z.string().optional().nullable(),
  sequenceOrder: z.number().int().default(1),
  releaseType: z.enum(['IMMEDIATE', 'SPECIFIC_DATE', 'PREREQUISITE_MODULE', 'MANUAL']).default('IMMEDIATE'),
  releaseDate: z.string().or(z.date()).optional().nullable(),
  prerequisiteModuleId: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
});

export const LmsLessonCreateSchema = z.object({
  moduleId: z.string().min(1, 'Module ID is required'),
  title: z.string().min(1, 'Lesson title is required'),
  summary: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  contentType: z.enum(['RICH_TEXT', 'PDF', 'VIDEO_LINK', 'EXTERNAL_LINK', 'DOCUMENT', 'EMBED', 'FILE']).default('RICH_TEXT'),
  fileUrl: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  estimatedDurationMinutes: z.number().int().default(30),
  sequenceOrder: z.number().int().default(1),
  completionRule: z.enum(['MANUAL_CHECK', 'VIEW_RESOURCE', 'ASSIGNMENT_SUBMIT', 'QUIZ_PASS']).default('MANUAL_CHECK'),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('PUBLISHED'),
});

export const LmsLessonProgressUpdateSchema = z.object({
  lessonId: z.string().min(1, 'Lesson ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
});

export const LmsAnnouncementCreateSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  title: z.string().min(1, 'Announcement title is required'),
  content: z.string().min(1, 'Announcement content is required'),
  targetSectionId: z.string().optional().nullable(),
  isPinned: z.boolean().default(false),
  expiresAt: z.string().or(z.date()).optional().nullable(),
});

// 3. Homework & Assignments
export const LmsHomeworkCreateSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  title: z.string().min(1, 'Homework title is required'),
  instructions: z.string().optional().nullable(),
  assignedDate: z.string().or(z.date()).optional(),
  dueDate: z.string().or(z.date()),
  attachmentUrl: z.string().optional().nullable(),
  maxMarks: z.number().nonnegative().default(10),
});

export const LmsHomeworkSubmitSchema = z.object({
  homeworkId: z.string().min(1, 'Homework ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  contentText: z.string().optional().nullable(),
  attachmentUrl: z.string().optional().nullable(),
});

export const LmsAssignmentCreateSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  title: z.string().min(1, 'Assignment title is required'),
  instructions: z.string().optional().nullable(),
  totalMarks: z.number().positive().default(100),
  weightPercent: z.number().nonnegative().default(10),
  startDate: z.string().or(z.date()).optional(),
  dueDate: z.string().or(z.date()),
  lateDeadline: z.string().or(z.date()).optional().nullable(),
  lateSubmissionPolicy: z.enum(['ALLOWED', 'NOT_ALLOWED', 'PENALTY_PERCENT']).default('ALLOWED'),
  latePenaltyPercent: z.number().nonnegative().default(10),
  submissionType: z.enum(['TEXT', 'FILE', 'MULTIPLE_FILES', 'LINK', 'OFFLINE', 'GROUP']).default('FILE'),
  maxAttempts: z.number().int().min(1).default(1),
  rubricId: z.string().optional().nullable(),
});

export const LmsRubricCreateSchema = z.object({
  title: z.string().min(1, 'Rubric title is required'),
  description: z.string().optional().nullable(),
  totalPoints: z.number().positive(),
  criteria: z.array(z.object({
    title: z.string().min(1, 'Criterion title is required'),
    description: z.string().optional().nullable(),
    maxPoints: z.number().positive(),
    levels: z.array(z.object({
      title: z.string().min(1, 'Level title is required'),
      description: z.string().optional().nullable(),
      points: z.number().nonnegative(),
    })).min(1, 'At least one performance level is required'),
  })).min(1, 'At least one criterion is required'),
});

export const LmsAssignmentSubmitSchema = z.object({
  assignmentId: z.string().min(1, 'Assignment ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  contentText: z.string().optional().nullable(),
  fileUrls: z.array(z.string()).optional(),
});

export const LmsAssignmentGradeSchema = z.object({
  submissionId: z.string().min(1, 'Submission ID is required'),
  score: z.number().nonnegative(),
  rubricScores: z.record(z.string(), z.number()).optional(),
  feedbackText: z.string().optional().nullable(),
  status: z.enum(['GRADED', 'RETURNED_FOR_CORRECTION']).default('GRADED'),
});

// 4. Question Bank & Quizzes
export const LmsQuestionBankCreateSchema = z.object({
  subjectId: z.string().optional().nullable(),
  courseId: z.string().optional().nullable(),
  topic: z.string().optional().nullable(),
  learningOutcomeCode: z.string().optional().nullable(),
  questionType: z.enum([
    'MCQ_SINGLE', 'MCQ_MULTIPLE', 'TRUE_FALSE', 'FILL_BLANK',
    'SHORT_ANSWER', 'LONG_ANSWER', 'ESSAY', 'NUMERIC',
    'MATCHING', 'ORDERING', 'FILE_RESPONSE'
  ]).default('MCQ_SINGLE'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  bloomTaxonomy: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']).optional().nullable(),
  questionText: z.string().min(1, 'Question text is required'),
  explanation: z.string().optional().nullable(),
  marks: z.number().positive().default(1),
  options: z.any().optional(), // options array or structured choice items
  correctAnswer: z.any(), // JSON or string of correct answer
  status: z.enum(['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ARCHIVED']).default('APPROVED'),
});

export const LmsQuizCreateSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  title: z.string().min(1, 'Quiz title is required'),
  instructions: z.string().optional().nullable(),
  openTime: z.string().or(z.date()).optional(),
  closeTime: z.string().or(z.date()),
  durationMinutes: z.number().int().positive().default(30),
  maxAttempts: z.number().int().min(1).default(1),
  totalMarks: z.number().positive().default(20),
  passMark: z.number().nonnegative().default(8),
  shuffleQuestions: z.boolean().default(true),
  shuffleOptions: z.boolean().default(true),
  showResultsPolicy: z.enum(['IMMEDIATELY', 'AFTER_DEADLINE', 'AFTER_TEACHER_REVIEW', 'NEVER_ANSWERS']).default('AFTER_DEADLINE'),
  negativeMarkingRatio: z.number().nonnegative().default(0),
  questions: z.array(z.object({
    questionBankId: z.string().optional().nullable(),
    questionText: z.string().min(1),
    questionType: z.string().default('MCQ_SINGLE'),
    options: z.any().optional(),
    correctAnswer: z.any(),
    marks: z.number().positive().default(1),
    negativeMarks: z.number().nonnegative().default(0),
    sequenceOrder: z.number().int().default(1),
  })).min(1, 'Quiz must have at least one question'),
});

export const LmsQuizStartAttemptSchema = z.object({
  quizId: z.string().min(1, 'Quiz ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
});

export const LmsQuizSubmitAttemptSchema = z.object({
  attemptId: z.string().min(1, 'Attempt ID is required'),
  answers: z.record(z.string(), z.any()), // map of questionId -> studentAnswer
});

export const LmsQuizGradeResponseSchema = z.object({
  attemptId: z.string().min(1, 'Attempt ID is required'),
  questionId: z.string().min(1, 'Question ID is required'),
  scoreAwarded: z.number().nonnegative(),
  teacherComments: z.string().optional().nullable(),
});

// 5. Online Classes & Attendance
export const LmsOnlineClassCreateSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  title: z.string().min(1, 'Class title is required'),
  topic: z.string().optional().nullable(),
  teacherEmployeeId: z.string().min(1, 'Teacher employee ID is required'),
  classDate: z.string().or(z.date()),
  startTime: z.string().min(1, 'Start time is required (e.g. 10:00)'),
  endTime: z.string().min(1, 'End time is required (e.g. 11:30)'),
  meetingProvider: z.enum(['ZOOM', 'GOOGLE_MEET', 'MICROSOFT_TEAMS', 'CUSTOM_URL']).default('GOOGLE_MEET'),
  meetingUrl: z.string().url('Valid meeting URL is required'),
  meetingPasscode: z.string().optional().nullable(),
});

export const LmsOnlineClassAttendanceSchema = z.object({
  onlineClassId: z.string().min(1, 'Online class ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  attendanceStatus: z.enum(['PRESENT', 'LATE', 'ABSENT']).default('PRESENT'),
  durationMinutes: z.number().int().nonnegative().default(60),
  source: z.enum(['MANUAL', 'LMS_JOIN_EVENT', 'PROVIDER_API']).default('LMS_JOIN_EVENT'),
});

// 6. Discussions
export const LmsDiscussionCreateSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  title: z.string().min(1, 'Discussion topic title is required'),
  description: z.string().optional().nullable(),
  isPinned: z.boolean().default(false),
});

export const LmsDiscussionPostCreateSchema = z.object({
  discussionId: z.string().min(1, 'Discussion ID is required'),
  content: z.string().min(1, 'Post content is required'),
  parentPostId: z.string().optional().nullable(),
});

export const LmsDiscussionModerateSchema = z.object({
  discussionId: z.string().min(1, 'Discussion ID is required'),
  action: z.enum(['PIN', 'UNPIN', 'LOCK', 'UNLOCK', 'HIDE', 'UNHIDE']),
});

// 7. Gradebook & Assessment Sync
export const LmsGradebookItemCreateSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  itemType: z.enum(['HOMEWORK', 'ASSIGNMENT', 'QUIZ', 'LAB', 'CUSTOM']),
  referenceId: z.string().optional().nullable(),
  title: z.string().min(1, 'Gradebook item title is required'),
  maxScore: z.number().positive().default(100),
  weightPercent: z.number().nonnegative().default(10),
  assessmentComponentId: z.string().optional().nullable(),
});

export const LmsGradebookScoreOverrideSchema = z.object({
  gradebookItemId: z.string().min(1, 'Gradebook item ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  scoreObtained: z.number().nonnegative(),
  overrideReason: z.string().min(1, 'Override reason is required'),
});

export const LmsGradebookSyncToOfficialSchema = z.object({
  gradebookItemId: z.string().min(1, 'Gradebook item ID is required'),
  examId: z.string().min(1, 'Official Exam ID is required'),
  assessmentComponentId: z.string().min(1, 'Assessment component ID is required'),
});

// 8. Course Copy
export const LmsCourseCopySchema = z.object({
  sourceCourseId: z.string().min(1, 'Source course ID is required'),
  targetAcademicYearId: z.string().optional().nullable(),
  targetSessionId: z.string().optional().nullable(),
  targetSectionId: z.string().optional().nullable(),
  targetCourseOfferingId: z.string().optional().nullable(),
  newCode: z.string().min(1, 'New course code is required'),
  newTitle: z.string().min(1, 'New course title is required'),
  primaryTeacherId: z.string().min(1, 'Primary teacher ID is required'),
});

// ==========================================
// 15. Enterprise Reporting, Custom Builder & Regulatory Compliance (COMMAND 9)
// ==========================================

export const ReportDefinitionCreateSchema = z.object({
  datasetCode: z.string().min(1, 'Dataset code is required'),
  code: z.string().optional().nullable(),
  name: z.string().min(1, 'Report name is required'),
  description: z.string().optional().nullable(),
  visibility: z.enum(['PRIVATE', 'ROLE_SHARED', 'DEPARTMENT_SHARED', 'CAMPUS_SHARED', 'INSTITUTION_SHARED']).default('PRIVATE'),
  campusId: z.string().optional().nullable(),
  isStandard: z.boolean().default(false),
  columns: z.array(
    z.object({
      fieldKey: z.string().min(1, 'Field key is required'),
      displayLabel: z.string().min(1, 'Display label is required'),
      sequenceOrder: z.number().int().default(1),
      columnWidth: z.number().int().optional().nullable(),
      formattingJson: z.string().optional().nullable(),
      aggregateType: z.enum(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT_COUNT']).optional().nullable(),
    })
  ).min(1, 'At least one column is required'),
  filters: z.array(
    z.object({
      fieldKey: z.string().min(1, 'Field key is required'),
      operator: z.enum(['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'STARTS_WITH', 'GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'IN', 'IS_NULL', 'IS_NOT_NULL']),
      valueJson: z.string(),
      sequenceOrder: z.number().int().default(1),
      isLocked: z.boolean().default(false),
    })
  ).optional().default([]),
  sorts: z.array(
    z.object({
      fieldKey: z.string().min(1, 'Field key is required'),
      direction: z.enum(['ASC', 'DESC']).default('ASC'),
      priority: z.number().int().default(1),
    })
  ).optional().default([]),
  groups: z.array(
    z.object({
      fieldKey: z.string().min(1, 'Field key is required'),
      sequenceOrder: z.number().int().default(1),
    })
  ).optional().default([]),
  calculatedFields: z.array(
    z.object({
      fieldKey: z.string().min(1, 'Field key is required'),
      label: z.string().min(1, 'Label is required'),
      formulaExpression: z.string().min(1, 'Formula is required'),
      dataType: z.enum(['STRING', 'NUMBER', 'DECIMAL', 'PERCENTAGE', 'CURRENCY']).default('DECIMAL'),
    })
  ).optional().default([]),
});

export const ReportDefinitionUpdateSchema = z.object({
  reportDefinitionId: z.string().min(1, 'Report definition ID is required'),
  name: z.string().min(1, 'Report name is required').optional(),
  description: z.string().optional().nullable(),
  visibility: z.enum(['PRIVATE', 'ROLE_SHARED', 'DEPARTMENT_SHARED', 'CAMPUS_SHARED', 'INSTITUTION_SHARED']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  isFavorite: z.boolean().optional(),
  columns: z.array(
    z.object({
      fieldKey: z.string().min(1),
      displayLabel: z.string().min(1),
      sequenceOrder: z.number().int().default(1),
      columnWidth: z.number().int().optional().nullable(),
      formattingJson: z.string().optional().nullable(),
      aggregateType: z.enum(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT_COUNT']).optional().nullable(),
    })
  ).optional(),
  filters: z.array(
    z.object({
      fieldKey: z.string().min(1),
      operator: z.enum(['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'STARTS_WITH', 'GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'IN', 'IS_NULL', 'IS_NOT_NULL']),
      valueJson: z.string(),
      sequenceOrder: z.number().int().default(1),
      isLocked: z.boolean().default(false),
    })
  ).optional(),
  sorts: z.array(
    z.object({
      fieldKey: z.string().min(1),
      direction: z.enum(['ASC', 'DESC']).default('ASC'),
      priority: z.number().int().default(1),
    })
  ).optional(),
  groups: z.array(
    z.object({
      fieldKey: z.string().min(1),
      sequenceOrder: z.number().int().default(1),
    })
  ).optional(),
});

export const ReportExecuteQuerySchema = z.object({
  reportDefinitionId: z.string().optional(),
  datasetCode: z.string().optional(),
  columns: z.array(z.string()).optional(),
  filters: z.array(
    z.object({
      fieldKey: z.string(),
      operator: z.enum(['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'STARTS_WITH', 'GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'IN', 'IS_NULL', 'IS_NOT_NULL']),
      value: z.any(),
    })
  ).optional().default([]),
  sorts: z.array(
    z.object({
      fieldKey: z.string(),
      direction: z.enum(['ASC', 'DESC']).default('ASC'),
    })
  ).optional().default([]),
  groups: z.array(z.string()).optional().default([]),
  aggregates: z.array(
    z.object({
      fieldKey: z.string(),
      aggregateType: z.enum(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT_COUNT']),
    })
  ).optional().default([]),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(500).default(50),
});

export const ReportExportSchema = z.object({
  reportDefinitionId: z.string().optional(),
  datasetCode: z.string().optional(),
  format: z.enum(['CSV', 'XLSX', 'PDF']),
  columns: z.array(z.string()).optional(),
  filters: z.array(
    z.object({
      fieldKey: z.string(),
      operator: z.enum(['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'STARTS_WITH', 'GREATER_THAN', 'LESS_THAN', 'BETWEEN', 'IN', 'IS_NULL', 'IS_NOT_NULL']),
      value: z.any(),
    })
  ).optional().default([]),
  sorts: z.array(
    z.object({
      fieldKey: z.string(),
      direction: z.enum(['ASC', 'DESC']).default('ASC'),
    })
  ).optional().default([]),
});

export const DashboardDefinitionCreateSchema = z.object({
  code: z.string().min(1, 'Dashboard code is required'),
  title: z.string().min(1, 'Dashboard title is required'),
  description: z.string().optional().nullable(),
  category: z.enum(['EXECUTIVE', 'PRINCIPAL', 'VC', 'FINANCE', 'HR', 'ACADEMIC', 'PLATFORM']).default('EXECUTIVE'),
  isStandard: z.boolean().default(false),
  widgets: z.array(
    z.object({
      title: z.string().min(1),
      widgetType: z.enum(['KPI_CARD', 'NUMBER', 'TABLE', 'BAR_CHART', 'LINE_CHART', 'DONUT_CHART', 'TREND']),
      datasetCode: z.string().min(1),
      reportDefinitionId: z.string().optional().nullable(),
      queryConfigJson: z.string(),
      gridPositionJson: z.string().optional().nullable(),
      refreshIntervalSec: z.number().int().default(300),
    })
  ).optional().default([]),
});

export const ReportScheduleCreateSchema = z.object({
  reportDefinitionId: z.string().min(1, 'Report definition ID is required'),
  scheduleFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'TERM_END']),
  recipients: z.array(z.string().email('Invalid email')).min(1, 'At least one recipient is required'),
  outputFormat: z.enum(['XLSX', 'CSV', 'PDF']).default('XLSX'),
});

export const RegulatoryAgencyCreateSchema = z.object({
  code: z.enum(['BANBEIS', 'DSHE', 'EDUCATION_BOARD', 'BMEB_MADRASHA', 'BTEB', 'UGC', 'MOE']),
  name: z.string().min(1, 'Agency name is required'),
  shortName: z.string().min(1, 'Short name is required'),
  description: z.string().optional().nullable(),
  jurisdiction: z.string().default('BANGLADESH'),
  websiteUrl: z.string().url().optional().nullable(),
});

export const RegulatoryTemplateCreateSchema = z.object({
  agencyCode: z.enum(['BANBEIS', 'DSHE', 'EDUCATION_BOARD', 'BMEB_MADRASHA', 'BTEB', 'UGC', 'MOE']),
  templateCode: z.string().min(1, 'Template code is required'),
  title: z.string().min(1, 'Template title is required'),
  version: z.number().int().positive().default(1),
  institutionType: z.enum(['SCHOOL', 'COLLEGE', 'MADRASHA', 'UNIVERSITY', 'POLYTECHNIC', 'VOCATIONAL', 'TRAINING_INSTITUTE']).optional().nullable(),
  effectiveFrom: z.string().or(z.date()).default(() => new Date().toISOString()),
  outputFormat: z.enum(['XLSX', 'CSV', 'PDF']).default('XLSX'),
  fields: z.array(
    z.object({
      fieldCode: z.string().min(1),
      label: z.string().min(1),
      dataType: z.enum(['STRING', 'NUMBER', 'DECIMAL', 'DATE', 'BOOLEAN']).default('STRING'),
      isRequired: z.boolean().default(true),
      validationRuleJson: z.string().optional().nullable(),
      sectionName: z.string().optional().nullable(),
      sequenceOrder: z.number().int().default(1),
    })
  ).min(1, 'At least one regulatory field is required'),
});

export const RegulatoryReportRunStartSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  academicYearId: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  reportingPeriod: z.string().min(1, 'Reporting period is required'),
});

export const RegulatoryReportRunApproveSchema = z.object({
  reportRunId: z.string().min(1, 'Report run ID is required'),
  remarks: z.string().optional().nullable(),
});

export const RegulatorySubmissionRecordSchema = z.object({
  reportRunId: z.string().min(1, 'Report run ID is required'),
  submissionReference: z.string().optional().nullable(),
  acknowledgementNumber: z.string().optional().nullable(),
  submissionDocumentUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const DataQualityRuleCreateSchema = z.object({
  datasetCode: z.string().min(1, 'Dataset code is required'),
  ruleCode: z.string().min(1, 'Rule code is required'),
  title: z.string().min(1, 'Rule title is required'),
  severity: z.enum(['ERROR', 'WARNING']).default('ERROR'),
  checkType: z.enum(['MISSING_REQUIRED', 'DUPLICATE', 'INVALID_RELATION', 'OUT_OF_RANGE']),
  ruleConfigJson: z.string(),
});
