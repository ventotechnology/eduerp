-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('SCHOOL', 'COLLEGE', 'SCHOOL_AND_COLLEGE', 'MADRASHA', 'UNIVERSITY', 'POLYTECHNIC', 'TECHNICAL_INSTITUTE', 'TRAINING_INSTITUTE', 'OTHER');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLATFORM_SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT_ADMIN', 'BILLING_ADMIN', 'SALES_ADMIN', 'SUPER_ADMIN', 'OWNER', 'CHAIRMAN', 'TRUSTEE', 'VICE_CHANCELLOR', 'PRO_VICE_CHANCELLOR', 'REGISTRAR', 'PRINCIPAL', 'VICE_PRINCIPAL', 'DEAN', 'HEAD_OF_DEPARTMENT', 'COORDINATOR', 'TEACHER', 'FACULTY', 'ACCOUNTANT', 'HR_MANAGER', 'LIBRARIAN', 'HOSTEL_MANAGER', 'TRANSPORT_MANAGER', 'ADMISSION_OFFICER', 'STUDENT', 'PARENT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'LOCKED', 'PENDING_VERIFICATION');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "customDomain" TEXT,
    "institutionType" "InstitutionType" NOT NULL DEFAULT 'SCHOOL',
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'PROFESSIONAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDemoTenant" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantDomain" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "name" TEXT NOT NULL,
    "priceMonthlyBdt" DOUBLE PRECISION NOT NULL,
    "priceMonthlyUsd" DOUBLE PRECISION NOT NULL,
    "maxStudents" INTEGER NOT NULL,
    "maxCampuses" INTEGER NOT NULL,
    "maxStorageGb" INTEGER NOT NULL,
    "includedSms" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanFeature" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PlanFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "lastBilledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "eiin" TEXT,
    "instituteCode" TEXT,
    "mpoStatus" BOOLEAN NOT NULL DEFAULT false,
    "universityCode" TEXT,
    "boardAffiliation" TEXT,
    "madrashaBoardInfo" TEXT,
    "ugcInfo" TEXT,
    "ministryInfo" TEXT,
    "address" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "upazilaThana" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "establishmentYear" INTEGER,
    "principalHeadName" TEXT,
    "principalHeadTitle" TEXT,
    "logoUrl" TEXT,
    "sealUrl" TEXT,
    "signatureUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#2563eb',
    "secondaryColor" TEXT NOT NULL DEFAULT '#0f172a',
    "currencyCode" TEXT NOT NULL DEFAULT 'BDT',
    "currencySymbol" TEXT NOT NULL DEFAULT '৳',
    "currencyPrecision" INTEGER NOT NULL DEFAULT 2,
    "financialLockDate" TIMESTAMP(3),

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campus" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Main Campus',
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "avatarUrl" TEXT,
    "isMfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "admissionStartDate" TIMESTAMP(3),
    "admissionEndDate" TIMESTAMP(3),
    "classStartDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "registrationStartDate" TIMESTAMP(3),
    "registrationEndDate" TIMESTAMP(3),
    "addDropDeadline" TIMESTAMP(3),
    "examStartDate" TIMESTAMP(3),
    "examEndDate" TIMESTAMP(3),
    "resultPublishDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakStartTime" TEXT,
    "breakEndTime" TEXT,
    "applicableLevel" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicGroup" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectCombinationTemplate" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "compulsorySubjectCodes" TEXT NOT NULL,
    "electiveSubjectCodes" TEXT NOT NULL,
    "fourthSubjectChoices" TEXT NOT NULL,
    "practicalSubjectCodes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubjectCombinationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSubjectRegistration" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "isFourthSubject" BOOLEAN NOT NULL DEFAULT false,
    "isElective" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentSubjectRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "deanName" TEXT,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "facultyId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "headName" TEXT,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "degreeLevel" TEXT NOT NULL,
    "durationYears" DOUBLE PRECISION NOT NULL DEFAULT 4.0,
    "totalCredits" DOUBLE PRECISION,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Curriculum" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "Curriculum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumVersion" (
    "id" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "versionCode" TEXT NOT NULL,
    "effectiveSessionId" TEXT,
    "totalCredits" DOUBLE PRECISION NOT NULL DEFAULT 144.0,
    "minCgpa" DOUBLE PRECISION NOT NULL DEFAULT 2.00,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurriculumVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumCourse" (
    "id" TEXT NOT NULL,
    "curriculumVersionId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "semesterNumber" INTEGER NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "minGradePoint" DOUBLE PRECISION NOT NULL DEFAULT 2.00,

    CONSTRAINT "CurriculumCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "numericValue" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "stage" TEXT,
    "promotionTargetClass" TEXT,
    "shift" TEXT NOT NULL DEFAULT 'Morning',

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" TEXT,
    "roomNumber" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 40,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'COMPULSORY',
    "fullMarks" INTEGER NOT NULL DEFAULT 100,
    "passMarks" INTEGER NOT NULL DEFAULT 33,
    "theoryMarks" INTEGER NOT NULL DEFAULT 70,
    "practicalMarks" INTEGER NOT NULL DEFAULT 0,
    "assignmentMarks" INTEGER NOT NULL DEFAULT 20,
    "attendanceMarks" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "creditHours" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "lectureCredits" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "labCredits" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "prerequisites" TEXT,
    "courseType" TEXT NOT NULL DEFAULT 'CORE',

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoursePrerequisite" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "prerequisiteCourseId" TEXT NOT NULL,
    "minGradePoint" DOUBLE PRECISION NOT NULL DEFAULT 2.00,

    CONSTRAINT "CoursePrerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseOffering" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sectionName" TEXT NOT NULL,
    "teacherId" TEXT,
    "classroomId" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 45,
    "enrolledCount" INTEGER NOT NULL DEFAULT 0,
    "scheduleJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "userId" TEXT,
    "studentIdNumber" TEXT NOT NULL,
    "admissionNumber" TEXT NOT NULL,
    "rollNumber" TEXT,
    "registrationNumber" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "religion" TEXT,
    "nationality" TEXT NOT NULL DEFAULT 'Bangladeshi',
    "nidBirthCertNumber" TEXT,
    "presentAddress" TEXT NOT NULL,
    "permanentAddress" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "sectionId" TEXT,
    "batchId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "guardianId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guardian" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "fatherName" TEXT NOT NULL,
    "fatherPhone" TEXT NOT NULL,
    "fatherProfession" TEXT,
    "motherName" TEXT NOT NULL,
    "motherPhone" TEXT,
    "motherProfession" TEXT,
    "guardianName" TEXT NOT NULL,
    "guardianPhone" TEXT NOT NULL,
    "guardianRelation" TEXT NOT NULL DEFAULT 'Father',
    "address" TEXT,
    "emergencyContact" TEXT,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentGuardian" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL DEFAULT 'PRIMARY',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "canPickup" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentGuardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionApplication" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "applicationNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "religion" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "presentAddress" TEXT NOT NULL,
    "permanentAddress" TEXT NOT NULL,
    "desiredClassId" TEXT,
    "desiredProgramId" TEXT,
    "guardianName" TEXT NOT NULL,
    "guardianPhone" TEXT NOT NULL,
    "guardianRelation" TEXT NOT NULL DEFAULT 'Father',
    "guardianOccupation" TEXT,
    "previousSchool" TEXT,
    "previousGpa" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "applicationFeeStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "testScore" DOUBLE PRECISION,
    "meritRank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionTest" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "totalMarks" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "passMarks" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "questionsJson" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AdmissionTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionTestAttempt" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "answersJson" TEXT,
    "score" DOUBLE PRECISION,
    "isEvaluated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AdmissionTestAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT,
    "academicYearId" TEXT,
    "classId" TEXT,
    "sectionId" TEXT,
    "rollNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "academicStatus" TEXT NOT NULL DEFAULT 'REGULAR',

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseRegistration" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "courseOfferingId" TEXT,
    "semester" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ENROLLED',
    "gradePoint" DOUBLE PRECISION,
    "letterGrade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HifzDailyRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sabakPara" INTEGER,
    "sabakSurah" TEXT,
    "sabakAyatStart" INTEGER,
    "sabakAyatEnd" INTEGER,
    "sabakGrade" TEXT,
    "sabkiPara" INTEGER,
    "sabkiPages" INTEGER,
    "sabkiGrade" TEXT,
    "dourParaStart" INTEGER,
    "dourParaEnd" INTEGER,
    "dourGrade" TEXT,
    "totalParasMemorized" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "teacherNotes" TEXT,
    "evaluatedBy" TEXT,

    CONSTRAINT "HifzDailyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThesisRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT,
    "supervisorName" TEXT NOT NULL,
    "coSupervisorName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROPOSAL_SUBMITTED',
    "proposalDate" TIMESTAMP(3),
    "defenseDate" TIMESTAMP(3),
    "defenseGrade" TEXT,
    "defenseScore" DOUBLE PRECISION,
    "plagiarismPercent" DOUBLE PRECISION,
    "fileUrl" TEXT,

    CONSTRAINT "ThesisRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchProject" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "principalInvestigator" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "fundingAgency" TEXT,
    "grantAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ONGOING',
    "publicationsCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ResearchProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "userId" TEXT,
    "employeeCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "designation" TEXT NOT NULL,
    "department" TEXT,
    "departmentId" TEXT,
    "positionId" TEXT,
    "supervisorId" TEXT,
    "category" TEXT NOT NULL DEFAULT 'TEACHING',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "academicRank" TEXT,
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "employmentType" TEXT NOT NULL DEFAULT 'PERMANENT',
    "basicSalary" DOUBLE PRECISION NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nidNumber" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "nationality" TEXT DEFAULT 'Bangladeshi',
    "bloodGroup" TEXT,
    "presentAddress" TEXT,
    "permanentAddress" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "campusId" TEXT,
    "departmentId" TEXT,
    "positionCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'TEACHING',
    "grade" TEXT,
    "reportsToPositionId" TEXT,
    "authorizedHeadcount" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyProfile" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "academicRank" TEXT NOT NULL DEFAULT 'Lecturer',
    "specialization" TEXT,
    "researchArea" TEXT,
    "officeRoom" TEXT,
    "officeHours" TEXT,
    "biography" TEXT,
    "orcidId" TEXT,
    "googleScholarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacultyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeDocument" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "documentNumber" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeQualification" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Bangladesh',
    "passingYear" INTEGER NOT NULL,
    "resultGrade" TEXT NOT NULL,
    "certificateUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeQualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeExperience" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "employerName" TEXT NOT NULL,
    "positionTitle" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "durationMonths" INTEGER,
    "referenceContact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRequisition" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "requisitionNumber" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "requestedHeadcount" INTEGER NOT NULL DEFAULT 1,
    "reason" TEXT NOT NULL,
    "requiredByDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobVacancy" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "campusId" TEXT,
    "departmentId" TEXT,
    "positionId" TEXT NOT NULL,
    "vacancyCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "jobType" TEXT NOT NULL DEFAULT 'BOTH',
    "employmentType" TEXT NOT NULL DEFAULT 'PERMANENT',
    "responsibilities" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "closingDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobVacancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobCandidate" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "vacancyId" TEXT NOT NULL,
    "applicantNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "cvUrl" TEXT,
    "highestQualification" TEXT,
    "experienceYears" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'DIRECT',
    "stage" TEXT NOT NULL DEFAULT 'APPLIED',
    "convertedEmployeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateInterview" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "interviewDate" TIMESTAMP(3) NOT NULL,
    "roundName" TEXT NOT NULL,
    "interviewers" TEXT NOT NULL,
    "criteriaScores" TEXT,
    "totalScore" DOUBLE PRECISION,
    "comments" TEXT,
    "recommendation" TEXT NOT NULL DEFAULT 'HOLD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateInterview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobOffer" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "offerNumber" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL DEFAULT 'PERMANENT',
    "proposedJoiningDate" TIMESTAMP(3) NOT NULL,
    "offeredGrossSalary" DOUBLE PRECISION NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeOnboarding" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "templateName" TEXT NOT NULL DEFAULT 'Standard Staff Onboarding',
    "tasks" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "completionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentContract" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "contractType" TEXT NOT NULL DEFAULT 'PERMANENT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "probationEndDate" TIMESTAMP(3),
    "grossSalaryReference" DOUBLE PRECISION NOT NULL,
    "termsAndConditions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmploymentContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeBankAccount" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumberMasked" TEXT NOT NULL,
    "accountNumberEncrypted" TEXT,
    "routingNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrShift" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "shiftCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "graceMinutes" INTEGER NOT NULL DEFAULT 15,
    "breakMinutes" INTEGER NOT NULL DEFAULT 60,
    "workingHours" DOUBLE PRECISION NOT NULL DEFAULT 8.0,
    "isNightShift" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HrShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeRoster" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "rosterDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeRoster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeRawPunch" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "punchTime" TIMESTAMP(3) NOT NULL,
    "punchType" TEXT NOT NULL,
    "deviceSource" TEXT NOT NULL DEFAULT 'BIOMETRIC',
    "deviceId" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeRawPunch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeDailyAttendance" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "attendanceDate" TIMESTAMP(3) NOT NULL,
    "shiftId" TEXT,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "earlyDepartureMinutes" INTEGER NOT NULL DEFAULT 0,
    "actualWorkingHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeDailyAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceCorrectionRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "attendanceDate" TIMESTAMP(3) NOT NULL,
    "originalStatus" TEXT NOT NULL,
    "requestedStatus" TEXT NOT NULL,
    "requestedCheckIn" TIMESTAMP(3),
    "requestedCheckOut" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "reviewedBy" TEXT,
    "reviewComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceCorrectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OvertimeRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "overtimeDate" TIMESTAMP(3) NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "approvedBy" TEXT,
    "approvedHourlyRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OvertimeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrLeaveType" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "annualQuotaDays" INTEGER NOT NULL DEFAULT 14,
    "carryForwardMaxDays" INTEGER NOT NULL DEFAULT 0,
    "requiresProof" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HrLeaveType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrLeavePolicy" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL DEFAULT 'PERMANENT',
    "category" TEXT NOT NULL DEFAULT 'TEACHING',
    "annualEntitlement" INTEGER NOT NULL DEFAULT 14,
    "accrualFrequency" TEXT NOT NULL DEFAULT 'ANNUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HrLeavePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeLeaveBalance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "earned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "used" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adjusted" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carriedForward" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeLeaveBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeLeaveLedger" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionType" TEXT NOT NULL,
    "days" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "referenceId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeLeaveLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeLeaveApplication" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" DOUBLE PRECISION NOT NULL,
    "isHalfDay" BOOLEAN NOT NULL DEFAULT false,
    "halfDayType" TEXT,
    "reason" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeLeaveApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeePromotionHistory" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "previousPositionId" TEXT,
    "newPositionId" TEXT,
    "previousAcademicRank" TEXT,
    "newAcademicRank" TEXT,
    "reason" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeePromotionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeTransferHistory" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "previousCampusId" TEXT,
    "newCampusId" TEXT,
    "previousDepartmentId" TEXT,
    "newDepartmentId" TEXT,
    "reason" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeTransferHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeIncrementRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "previousGrossSalary" DOUBLE PRECISION NOT NULL,
    "newGrossSalary" DOUBLE PRECISION NOT NULL,
    "incrementAmount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeIncrementRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeAdditionalDuty" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "dutyTitle" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "allowanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeAdditionalDuty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSkill" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "proficiencyLevel" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceCycle" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeGoal" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "weightagePercentage" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "targetMetric" TEXT NOT NULL,
    "achievementScore" DOUBLE PRECISION,
    "employeeSelfComment" TEXT,
    "managerComment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeePerformanceReview" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "teachingScore" DOUBLE PRECISION,
    "researchScore" DOUBLE PRECISION,
    "serviceScore" DOUBLE PRECISION,
    "overallScore" DOUBLE PRECISION,
    "rating" TEXT,
    "selfReviewSummary" TEXT,
    "managerReviewSummary" TEXT,
    "moderationComment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeePerformanceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingProgram" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "trainingType" TEXT NOT NULL DEFAULT 'PEDAGOGY',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeTrainingEnrollment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "trainingProgramId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOMINATED',
    "completionDate" TIMESTAMP(3),
    "certificateUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeTrainingEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeDisciplinaryCase" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "allegation" TEXT NOT NULL,
    "evidenceUrls" TEXT,
    "explanation" TEXT,
    "findings" TEXT,
    "outcomeAction" TEXT NOT NULL DEFAULT 'NO_ACTION',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "investigatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeDisciplinaryCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeWarning" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "warningLevel" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "acknowledgementStatus" TEXT NOT NULL DEFAULT 'ISSUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeWarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeGrievance" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "isConfidential" BOOLEAN NOT NULL DEFAULT true,
    "assignedTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "resolutionSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeGrievance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSeparation" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "separationType" TEXT NOT NULL DEFAULT 'RESIGNATION',
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "noticePeriodDays" INTEGER NOT NULL DEFAULT 30,
    "lastWorkingDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeSeparation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeExitClearance" (
    "id" TEXT NOT NULL,
    "separationId" TEXT NOT NULL,
    "departmentCleared" BOOLEAN NOT NULL DEFAULT false,
    "libraryCleared" BOOLEAN NOT NULL DEFAULT false,
    "financeCleared" BOOLEAN NOT NULL DEFAULT false,
    "itEquipmentCleared" BOOLEAN NOT NULL DEFAULT false,
    "hostelCleared" BOOLEAN NOT NULL DEFAULT false,
    "overallStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "finalPayrollInputData" TEXT,
    "clearedBy" TEXT,
    "clearedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeExitClearance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "departmentId" TEXT,
    "qualification" TEXT NOT NULL,
    "specialization" TEXT,
    "weeklyHours" INTEGER NOT NULL DEFAULT 20,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveApplication" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRecord" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "payrollPeriodId" TEXT,
    "monthYear" TEXT NOT NULL,
    "basicSalary" DOUBLE PRECISION NOT NULL,
    "houseRent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "medicalAllowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transportAllowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherAllowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "providentFundDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "loanDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "advanceDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netSalary" DOUBLE PRECISION NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PAID',
    "paymentDate" TIMESTAMP(3),
    "payslipNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "classId" TEXT,
    "sectionId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "periodNumber" INTEGER,
    "subjectCode" TEXT,
    "takenByUserId" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "periodNumber" INTEGER,
    "subjectCode" TEXT,
    "remarks" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "totalFloors" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classroom" (
    "id" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "buildingId" TEXT,
    "floorNumber" INTEGER DEFAULT 1,
    "roomNumber" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CLASSROOM',
    "hasProjector" BOOLEAN NOT NULL DEFAULT false,
    "hasAirConditioner" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Period" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "campusId" TEXT,
    "shiftId" TEXT,
    "periodNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isBreak" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherAvailability" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "periodId" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,

    CONSTRAINT "TeacherAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherAssignment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "subjectId" TEXT,
    "courseOfferingId" TEXT,
    "classId" TEXT,
    "sectionId" TEXT,
    "weeklyPeriods" INTEGER NOT NULL DEFAULT 4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableEntry" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "academicYearId" TEXT,
    "sessionId" TEXT,
    "campusId" TEXT,
    "sectionId" TEXT,
    "courseOfferingId" TEXT,
    "subjectId" TEXT,
    "periodId" TEXT,
    "classroomId" TEXT NOT NULL,
    "teacherId" TEXT,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "isDoublePeriod" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimetableEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnologyTrade" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "btebCode" TEXT,
    "durationSemesters" INTEGER NOT NULL DEFAULT 8,
    "description" TEXT,

    CONSTRAINT "TechnologyTrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkshopLogEntry" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskTitle" TEXT NOT NULL,
    "instructorName" TEXT NOT NULL,
    "completionStatus" TEXT NOT NULL DEFAULT 'COMPLETED',
    "score" DOUBLE PRECISION,
    "teacherRemarks" TEXT,

    CONSTRAINT "WorkshopLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustrialAttachment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "supervisorName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "evaluationScore" DOUBLE PRECISION,
    "reportStatus" TEXT NOT NULL DEFAULT 'IN_PROGRESS',

    CONSTRAINT "IndustrialAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicCalendarEvent" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "campusId" TEXT,
    "title" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicCalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentComponent" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "maxMarks" DOUBLE PRECISION NOT NULL,
    "passMarks" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "roundingRule" TEXT NOT NULL DEFAULT 'HALF_UP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarkDistributionTemplate" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "academicLevel" TEXT,
    "componentsJson" TEXT NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarkDistributionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "examTypeCode" TEXT NOT NULL DEFAULT 'TERM',
    "termNumber" INTEGER NOT NULL DEFAULT 1,
    "targetClassId" TEXT,
    "targetProgramId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "markEntryDeadline" TIMESTAMP(3),
    "moderationDeadline" TIMESTAMP(3),
    "publicationDeadline" TIMESTAMP(3),
    "publicationStatus" TEXT NOT NULL DEFAULT 'INTERNAL',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSchedule" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "subjectId" TEXT,
    "courseId" TEXT,
    "courseOfferingId" TEXT,
    "classId" TEXT,
    "sectionId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 180,
    "roomId" TEXT,
    "invigilatorName" TEXT,
    "invigilatorId" TEXT,
    "maxMarks" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "instructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamEligibility" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ELIGIBLE',
    "attendancePercentage" DOUBLE PRECISION,
    "financialClearance" BOOLEAN NOT NULL DEFAULT true,
    "isOverridden" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "overriddenBy" TEXT,
    "overriddenAt" TIMESTAMP(3),
    "hallTicketNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamEligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarksEntry" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT,
    "courseOfferingId" TEXT,
    "theoryMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "practicalMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "assignmentMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attendanceMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "letterGrade" TEXT NOT NULL,
    "gradePoint" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PASS',
    "workflowStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "markStatus" TEXT NOT NULL DEFAULT 'MARK',
    "componentScoresJson" TEXT,
    "enteredByUserId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarksEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarkAuditLog" (
    "id" TEXT NOT NULL,
    "marksEntryId" TEXT NOT NULL,
    "previousScore" DOUBLE PRECISION NOT NULL,
    "newScore" DOUBLE PRECISION NOT NULL,
    "componentName" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "reason" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "changedByName" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarkAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradingScale" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gradeType" TEXT NOT NULL,

    CONSTRAINT "GradingScale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "gpaOrCgpa" DOUBLE PRECISION NOT NULL,
    "letterGrade" TEXT NOT NULL,
    "position" INTEGER,
    "isPassed" BOOLEAN NOT NULL DEFAULT true,
    "remarks" TEXT,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamResultSnapshot" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "gpa" DOUBLE PRECISION NOT NULL,
    "cgpa" DOUBLE PRECISION,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "letterGrade" TEXT NOT NULL,
    "isPassed" BOOLEAN NOT NULL,
    "failedSubjectsCount" INTEGER NOT NULL DEFAULT 0,
    "positionInClass" INTEGER,
    "positionInSection" INTEGER,
    "subjectResultsJson" TEXT NOT NULL,
    "gradingScaleSnapshot" TEXT NOT NULL,
    "publicationStatus" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "correctionReason" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamResultSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficialTranscript" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "transcriptType" TEXT NOT NULL,
    "transcriptNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalCreditsCompleted" DOUBLE PRECISION NOT NULL,
    "cgpa" DOUBLE PRECISION NOT NULL,
    "degreeAwarded" TEXT,
    "academicStatus" TEXT NOT NULL DEFAULT 'GOOD_STANDING',
    "dataSnapshotJson" TEXT NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "qrVerificationUrl" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfficialTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "certificateType" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "studentName" TEXT,
    "fatherName" TEXT,
    "motherName" TEXT,
    "programOrClass" TEXT,
    "gpaOrDivision" TEXT,
    "passingYear" INTEGER,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "integrityHash" TEXT NOT NULL DEFAULT '',
    "qrVerificationUrl" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revocationReason" TEXT,
    "revokedBy" TEXT,
    "revokedAt" TIMESTAMP(3),
    "signatoryTitle" TEXT DEFAULT 'Principal',
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionBatch" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "examId" TEXT,
    "fromAcademicYearId" TEXT NOT NULL,
    "toAcademicYearId" TEXT NOT NULL,
    "fromClassId" TEXT NOT NULL,
    "toClassId" TEXT,
    "processedBy" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalStudents" INTEGER NOT NULL,
    "promotedCount" INTEGER NOT NULL,
    "repeatedCount" INTEGER NOT NULL,
    "conditionalCount" INTEGER NOT NULL,
    "graduatedCount" INTEGER NOT NULL,
    "rulesAppliedJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentPromotionRecord" (
    "id" TEXT NOT NULL,
    "promotionBatchId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "finalGpa" DOUBLE PRECISION NOT NULL,
    "isPassed" BOOLEAN NOT NULL,
    "failedSubjectCodes" TEXT,
    "fromSectionId" TEXT,
    "toSectionId" TEXT,
    "isOverridden" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "overriddenBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentPromotionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraduationRecord" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "graduationDate" TIMESTAMP(3) NOT NULL,
    "finalCgpa" DOUBLE PRECISION NOT NULL,
    "totalCreditsCompleted" DOUBLE PRECISION NOT NULL,
    "degreeClassification" TEXT NOT NULL,
    "thesisTitle" TEXT,
    "internshipOrganization" TEXT,
    "convocationBatch" TEXT,
    "certificateNumber" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "approvedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GraduationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalYear" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FiscalYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalPeriod" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "fiscalYearId" TEXT,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "reopenedAt" TIMESTAMP(3),
    "reopenedBy" TEXT,
    "reopenedReason" TEXT,

    CONSTRAINT "FiscalPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChartOfAccount" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subtype" TEXT,
    "parentId" TEXT,
    "isHeader" BOOLEAN NOT NULL DEFAULT false,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ChartOfAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostCenter" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departmentId" TEXT,
    "campusId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fund" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Fund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountMapping" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "mappingKey" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "AccountMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "fiscalYearId" TEXT,
    "fiscalPeriodId" TEXT,
    "entryNumber" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'POSTED',
    "postedBy" TEXT,
    "approvedBy" TEXT,
    "isPosted" BOOLEAN NOT NULL DEFAULT true,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversalOfId" TEXT,
    "reversalReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "costCenterId" TEXT,
    "fundId" TEXT,
    "debitAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creditAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "memo" TEXT,

    CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeType" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isTaxable" BOOLEAN NOT NULL DEFAULT false,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FeeType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeStructure" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "feeTypeId" TEXT,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "frequency" TEXT NOT NULL,
    "academicYearId" TEXT,
    "targetClassId" TEXT,
    "targetProgramId" TEXT,
    "targetClass" TEXT,
    "targetProgram" TEXT,
    "dueDayOfMonth" INTEGER DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LateFeeRule" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "feeTypeId" TEXT,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 10,
    "fineType" TEXT NOT NULL DEFAULT 'FLAT',
    "fineAmount" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "maxFineAmount" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LateFeeRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScholarshipMaster" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MERIT',
    "benefitType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "benefitValue" DOUBLE PRECISION NOT NULL,
    "criteria" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ScholarshipMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScholarshipApplication" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedAmount" DOUBLE PRECISION,
    "reason" TEXT NOT NULL,
    "documentsUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewRemarks" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "ScholarshipApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScholarshipAward" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "applicationId" TEXT,
    "awardType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "awardValue" DOUBLE PRECISION NOT NULL,
    "effectiveStartDate" TIMESTAMP(3) NOT NULL,
    "effectiveEndDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "approvedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScholarshipAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeWaiver" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "waiverType" TEXT NOT NULL DEFAULT 'TUITION_WAIVER',
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeWaiver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "billingPeriod" TEXT,
    "subTotal" DOUBLE PRECISION NOT NULL,
    "scholarshipAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountReason" TEXT,
    "waiverAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fineAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueAmount" DOUBLE PRECISION NOT NULL,
    "advanceApplied" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "transactionRef" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "allocatedAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentCreditBalance" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "availableCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentCreditBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentCreditTransaction" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentCreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundRequest" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "paymentId" TEXT,
    "invoiceId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "journalEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefundRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionBankAccount" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "branchName" TEXT,
    "accountName" TEXT NOT NULL,
    "accountNumberMasked" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "ledgerAccountId" TEXT,
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InstitutionBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChequeRecord" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "bankAccountId" TEXT,
    "studentId" TEXT,
    "vendorId" TEXT,
    "chequeNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "chequeDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'RECEIVED',
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "depositDate" TIMESTAMP(3),
    "clearanceDate" TIMESTAMP(3),
    "bounceReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChequeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankReconciliation" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "statementDate" TIMESTAMP(3) NOT NULL,
    "statementEndingBalance" DOUBLE PRECISION NOT NULL,
    "bookEndingBalance" DOUBLE PRECISION NOT NULL,
    "difference" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "reconciledBy" TEXT,
    "reconciledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "vendorCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "taxIdNumber" TEXT,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 30,
    "ledgerAccountId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorBill" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "billDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "subTotal" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dueAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "expenseAccountId" TEXT,
    "journalEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseRequest" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "department" TEXT,
    "vendorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "paidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "receiptUrl" TEXT,
    "journalEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "fiscalYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalBudget" DOUBLE PRECISION NOT NULL,
    "revisedBudget" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLine" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "departmentId" TEXT,
    "campusId" TEXT,
    "costCenterId" TEXT,
    "allocatedAmount" DOUBLE PRECISION NOT NULL,
    "revisedAmount" DOUBLE PRECISION,
    "spentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "BudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetRevisionLog" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "budgetLineId" TEXT,
    "previousAmount" DOUBLE PRECISION NOT NULL,
    "newAmount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "revisedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetRevisionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructure" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "basicPercentage" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "houseRentPercentage" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "medicalPercentage" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "transportAllowance" DOUBLE PRECISION NOT NULL DEFAULT 2000,
    "pfEmployeePercentage" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
    "pfEmployerPercentage" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
    "taxDeductionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSalaryAssignment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "salaryStructureId" TEXT NOT NULL,
    "grossSalary" DOUBLE PRECISION NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeSalaryAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollPeriod" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalGrossPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDeductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalNetPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "journalEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeLoan" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "principalAmount" DOUBLE PRECISION NOT NULL,
    "monthlyInstallment" DOUBLE PRECISION NOT NULL,
    "totalPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingBalance" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeLoan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryAdvance" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "recoveredAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingAmount" DOUBLE PRECISION NOT NULL,
    "advanceDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryAdvance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "isbn" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "totalCopies" INTEGER NOT NULL DEFAULT 1,
    "availableCopies" INTEGER NOT NULL DEFAULT 1,
    "shelfLocation" TEXT,
    "isEBook" BOOLEAN NOT NULL DEFAULT false,
    "eBookFileUrl" TEXT,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hostel" (
    "id" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'BOYS',
    "totalRooms" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "superName" TEXT,

    CONSTRAINT "Hostel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "driverPhone" TEXT NOT NULL,
    "routeTitle" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'IDLE',

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetRecord" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "purchaseCost" DOUBLE PRECISION NOT NULL,
    "currentLocation" TEXT NOT NULL,
    "custodianName" TEXT,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',

    CONSTRAINT "AssetRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL DEFAULT 'ALL',
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "category" TEXT NOT NULL DEFAULT 'ACADEMIC',

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisciplineRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "actionTaken" TEXT,
    "reportedBy" TEXT NOT NULL,

    CONSTRAINT "DisciplineRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomField" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "options" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "userRole" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "previousState" TEXT,
    "newState" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "campusId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "buildingId" TEXT,
    "floorLocation" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Library" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "openingHours" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryCatalog" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "isbn" TEXT,
    "author" TEXT NOT NULL,
    "editor" TEXT,
    "publisher" TEXT,
    "edition" TEXT,
    "publicationYear" INTEGER,
    "language" TEXT NOT NULL DEFAULT 'English',
    "category" TEXT NOT NULL DEFAULT 'General',
    "subject" TEXT,
    "resourceType" TEXT NOT NULL DEFAULT 'BOOK',
    "keywords" TEXT,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "isDigital" BOOLEAN NOT NULL DEFAULT false,
    "digitalFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryCopy" (
    "id" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "accessionNumber" TEXT NOT NULL,
    "barcode" TEXT,
    "qrCode" TEXT,
    "shelf" TEXT,
    "rack" TEXT,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "acquisitionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acquisitionCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availabilityStatus" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryCopy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryBorrowingPolicy" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "memberType" TEXT NOT NULL DEFAULT 'STUDENT',
    "maxBooks" INTEGER NOT NULL DEFAULT 3,
    "loanDurationDays" INTEGER NOT NULL DEFAULT 14,
    "renewalLimit" INTEGER NOT NULL DEFAULT 2,
    "finePerOverdueDay" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "graceDays" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryBorrowingPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryMember" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "memberType" TEXT NOT NULL DEFAULT 'STUDENT',
    "studentId" TEXT,
    "employeeId" TEXT,
    "membershipNumber" TEXT NOT NULL,
    "policyId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookIssue" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "copyId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "renewCount" INTEGER NOT NULL DEFAULT 0,
    "overdueDays" INTEGER NOT NULL DEFAULT 0,
    "fineAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finePaid" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "damageNotes" TEXT,
    "issuedBy" TEXT,
    "returnedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookReservation" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "reservationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priorityOrder" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryStocktake" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "stocktakeDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalScanned" INTEGER NOT NULL DEFAULT 0,
    "foundCount" INTEGER NOT NULL DEFAULT 0,
    "missingCount" INTEGER NOT NULL DEFAULT 0,
    "damagedCount" INTEGER NOT NULL DEFAULT 0,
    "wrongShelfCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "conductedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryStocktake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelMaster" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'BOYS',
    "address" TEXT,
    "wardenName" TEXT,
    "wardenPhone" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelBlock" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "totalFloors" INTEGER NOT NULL DEFAULT 4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelRoom" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "blockId" TEXT,
    "roomNumber" TEXT NOT NULL,
    "floorNumber" INTEGER NOT NULL DEFAULT 1,
    "roomType" TEXT NOT NULL DEFAULT 'DOUBLE',
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "monthlyRent" DOUBLE PRECISION NOT NULL DEFAULT 3000,
    "hasAttachedBath" BOOLEAN NOT NULL DEFAULT false,
    "hasAirConditioner" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelBed" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "bedNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelBed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelApplication" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "preferredRoomType" TEXT NOT NULL DEFAULT 'DOUBLE',
    "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "reviewedBy" TEXT,
    "reviewRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelAllocation" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "bedId" TEXT NOT NULL,
    "allocationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "depositAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "allocatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelCheckIn" (
    "id" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "checkInDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "initialBedCondition" TEXT NOT NULL DEFAULT 'GOOD',
    "keyCardNumber" TEXT,
    "depositPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "checkedInBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelTransferHistory" (
    "id" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "previousBedId" TEXT NOT NULL,
    "newBedId" TEXT NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelTransferHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelVisitorLog" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "residentStudentId" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL,
    "visitorPhone" TEXT NOT NULL,
    "visitorNid" TEXT,
    "relationship" TEXT,
    "purpose" TEXT NOT NULL,
    "entryTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitTime" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelVisitorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelAttendance" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "remarks" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportVehicle" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "vehicleType" TEXT NOT NULL DEFAULT 'BUS',
    "makeModel" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 40,
    "manufactureYear" INTEGER,
    "fuelType" TEXT NOT NULL DEFAULT 'DIESEL',
    "ownership" TEXT NOT NULL DEFAULT 'OWNED',
    "insuranceExpiry" TIMESTAMP(3),
    "fitnessExpiry" TIMESTAMP(3),
    "taxExpiry" TIMESTAMP(3),
    "assignedDriverId" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportRoute" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "campusId" TEXT,
    "routeCode" TEXT NOT NULL,
    "routeName" TEXT NOT NULL,
    "startPoint" TEXT NOT NULL,
    "endPoint" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 60,
    "monthlyFee" DOUBLE PRECISION NOT NULL DEFAULT 2000,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteStop" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "stopOrder" INTEGER NOT NULL DEFAULT 1,
    "stopName" TEXT NOT NULL,
    "pickupTime" TEXT NOT NULL,
    "dropTime" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "feeZone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RouteStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportSubscription" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "memberType" TEXT NOT NULL DEFAULT 'STUDENT',
    "studentId" TEXT,
    "employeeId" TEXT,
    "vehicleId" TEXT,
    "routeId" TEXT NOT NULL,
    "pickupStopId" TEXT NOT NULL,
    "dropStopId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "monthlyFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripSchedule" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverName" TEXT,
    "tripType" TEXT NOT NULL DEFAULT 'MORNING_PICKUP',
    "scheduledStartTime" TEXT NOT NULL,
    "scheduledEndTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportBoardingEvent" (
    "id" TEXT NOT NULL,
    "tripId" TEXT,
    "subscriptionId" TEXT,
    "studentId" TEXT,
    "eventTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL DEFAULT 'BOARDED',
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "scannedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportBoardingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GpsTelemetryRecord" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speedKmH" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "headingDegrees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accuracyMeters" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'DEVICE_WEBHOOK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GpsTelemetryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportIncident" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "routeId" TEXT,
    "incidentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "incidentType" TEXT NOT NULL DEFAULT 'BREAKDOWN',
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "actionTaken" TEXT,
    "reportedBy" TEXT NOT NULL,
    "resolutionStatus" TEXT NOT NULL DEFAULT 'REPORTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelLog" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "logDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantityLiters" DOUBLE PRECISION NOT NULL,
    "fuelCost" DOUBLE PRECISION NOT NULL,
    "odometerReading" DOUBLE PRECISION NOT NULL,
    "receiptNumber" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuelLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleMaintenanceRecord" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceType" TEXT NOT NULL DEFAULT 'ROUTINE',
    "description" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "odometerReading" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nextServiceDueOdometer" DOUBLE PRECISION,
    "nextServiceDueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleMaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Canteen" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "operatorType" TEXT NOT NULL DEFAULT 'INSTITUTION_OWNED',
    "vendorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Canteen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanteenItem" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "canteenId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'SNACKS',
    "salePrice" DOUBLE PRECISION NOT NULL,
    "costPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "stockItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanteenItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanteenMenu" (
    "id" TEXT NOT NULL,
    "canteenId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mealPeriod" TEXT NOT NULL DEFAULT 'LUNCH',
    "itemIds" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanteenMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanteenWallet" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "userType" TEXT NOT NULL DEFAULT 'STUDENT',
    "studentId" TEXT,
    "employeeId" TEXT,
    "walletNumber" TEXT NOT NULL,
    "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanteenWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanteenWalletLedger" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL DEFAULT 'PURCHASE',
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "referenceId" TEXT,
    "notes" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanteenWalletLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanteenSpendingLimit" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "dailyLimit" DOUBLE PRECISION NOT NULL DEFAULT 500,
    "weeklyLimit" DOUBLE PRECISION NOT NULL DEFAULT 2500,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanteenSpendingLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanteenPosSale" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "canteenId" TEXT NOT NULL,
    "saleNumber" TEXT NOT NULL,
    "saleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buyerType" TEXT NOT NULL DEFAULT 'STUDENT',
    "studentId" TEXT,
    "employeeId" TEXT,
    "paymentMode" TEXT NOT NULL DEFAULT 'CASH',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "cashierName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanteenPosSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanteenSaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CanteenSaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryCategory" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "campusId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CENTRAL_STORE',
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'PCS',
    "reorderLevel" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "standardCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trackSerial" BOOLEAN NOT NULL DEFAULT false,
    "trackBatch" BOOLEAN NOT NULL DEFAULT false,
    "hasExpiry" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockLedger" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceAfterQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceAfterValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "notes" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransfer" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "fromWarehouseId" TEXT NOT NULL,
    "toWarehouseId" TEXT NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransferItem" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "requestedQty" DOUBLE PRECISION NOT NULL,
    "sentQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "receivedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "StockTransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockIssueRecord" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "issueNumber" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "issuedToType" TEXT NOT NULL DEFAULT 'DEPARTMENT',
    "departmentId" TEXT,
    "employeeId" TEXT,
    "studentId" TEXT,
    "facilityId" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purpose" TEXT NOT NULL,
    "issuedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockIssueRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockIssueItem" (
    "id" TEXT NOT NULL,
    "issueRecordId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "StockIssueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedAsset" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'COMPUTER',
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchaseCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supplierVendorId" TEXT,
    "warrantyExpiry" TIMESTAMP(3),
    "warrantyProvider" TEXT,
    "currentBuildingId" TEXT,
    "currentRoomId" TEXT,
    "currentCustodianEmployeeId" TEXT,
    "currentDepartmentId" TEXT,
    "depreciationMethod" TEXT NOT NULL DEFAULT 'STRAIGHT_LINE',
    "depreciationRatePercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "salvageValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accumulatedDepreciation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bookValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FixedAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetAssignmentHistory" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "assignedToType" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "employeeId" TEXT,
    "departmentId" TEXT,
    "roomId" TEXT,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnDate" TIMESTAMP(3),
    "conditionOnAssign" TEXT NOT NULL DEFAULT 'GOOD',
    "conditionOnReturn" TEXT,
    "remarks" TEXT,
    "assignedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetAssignmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetMaintenance" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceType" TEXT NOT NULL DEFAULT 'SERVICING',
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vendorName" TEXT,
    "description" TEXT NOT NULL,
    "performedBy" TEXT,
    "nextServiceDue" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetDisposal" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "disposalDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disposalType" TEXT NOT NULL DEFAULT 'SCRAPPED',
    "saleAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "realizedGainLoss" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "approvedBy" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetDisposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequisition" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "requisitionNumber" TEXT NOT NULL,
    "departmentId" TEXT,
    "requestedByEmployeeId" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requiredByDate" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT NOT NULL,
    "estimatedTotalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequisitionItem" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "itemId" TEXT,
    "itemName" TEXT NOT NULL,
    "specification" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "estimatedUnitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedTotalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "PurchaseRequisitionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestForQuotation" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "rfqNumber" TEXT NOT NULL,
    "requisitionId" TEXT,
    "title" TEXT NOT NULL,
    "deadlineDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "termsConditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestForQuotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorQuotation" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT,
    "institutionId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "submissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validityDate" TIMESTAMP(3) NOT NULL,
    "totalQuotedAmount" DOUBLE PRECISION NOT NULL,
    "paymentTerms" TEXT,
    "deliveryLeadDays" INTEGER NOT NULL DEFAULT 7,
    "attachmentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorQuotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorQuotationItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "taxPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "VendorQuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "requisitionId" TEXT,
    "quotationId" TEXT,
    "vendorId" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDeliveryDate" TIMESTAMP(3) NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "itemId" TEXT,
    "itemName" TEXT NOT NULL,
    "orderedQuantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "taxPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "receivedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptNote" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "grnNumber" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "challanNumber" TEXT,
    "deliveryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedByEmployeeId" TEXT,
    "overallStatus" TEXT NOT NULL DEFAULT 'ACCEPTED_FULL',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoodsReceiptNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptItem" (
    "id" TEXT NOT NULL,
    "grnId" TEXT NOT NULL,
    "poItemId" TEXT,
    "itemId" TEXT,
    "receivedQuantity" DOUBLE PRECISION NOT NULL,
    "acceptedQuantity" DOUBLE PRECISION NOT NULL,
    "rejectedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "totalAcceptedCost" DOUBLE PRECISION NOT NULL,
    "rejectionReason" TEXT,

    CONSTRAINT "GoodsReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRequest" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "requesterType" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "requesterEmployeeId" TEXT,
    "requesterStudentId" TEXT,
    "category" TEXT NOT NULL DEFAULT 'ELECTRICAL',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "facilityId" TEXT,
    "roomId" TEXT,
    "assetId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceWorkOrder" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "workOrderNumber" TEXT NOT NULL,
    "assignedTechnicianEmployeeId" TEXT,
    "technicianName" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedDate" TIMESTAMP(3),
    "laborCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "partsCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "resolutionSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceWorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorRecord" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "passNumber" TEXT NOT NULL,
    "visitorName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "idProofType" TEXT NOT NULL DEFAULT 'NID',
    "idProofNumber" TEXT,
    "organization" TEXT,
    "purpose" TEXT NOT NULL,
    "visitingPersonType" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "hostEmployeeId" TEXT,
    "studentId" TEXT,
    "gateName" TEXT NOT NULL DEFAULT 'Main Gate',
    "entryTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'CHECKED_IN',
    "gateStaffUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentPickupAuthorization" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "authorizedPersonName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "nidNumber" TEXT,
    "photoUrl" TEXT,
    "relationToStudent" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentPickupAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleGateLog" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "vehiclePlateNumber" TEXT NOT NULL,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "vehicleType" TEXT NOT NULL DEFAULT 'CAR',
    "purpose" TEXT NOT NULL,
    "gateName" TEXT NOT NULL DEFAULT 'Main Gate',
    "entryTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitTime" TIMESTAMP(3),
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleGateLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityBooking" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "bookingNumber" TEXT NOT NULL,
    "facilityId" TEXT,
    "classroomId" TEXT,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requesterType" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "attendeeCount" INTEGER NOT NULL DEFAULT 20,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "approvedBy" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacilityBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsCourse" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "academicYearId" TEXT,
    "sessionId" TEXT,
    "classId" TEXT,
    "sectionId" TEXT,
    "subjectId" TEXT,
    "courseOfferingId" TEXT,
    "primaryTeacherId" TEXT NOT NULL,
    "coTeacherIds" TEXT,
    "coordinatorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsSyllabus" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "overview" TEXT,
    "objectives" TEXT,
    "learningOutcomesDesc" TEXT,
    "requiredMaterials" TEXT,
    "assessmentBreakdown" TEXT,
    "policies" TEXT,
    "officeHours" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsSyllabus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsLearningOutcome" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bloomLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LmsLearningOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsModule" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sequenceOrder" INTEGER NOT NULL DEFAULT 1,
    "releaseType" TEXT NOT NULL DEFAULT 'IMMEDIATE',
    "releaseDate" TIMESTAMP(3),
    "prerequisiteModuleId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsLesson" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "contentType" TEXT NOT NULL DEFAULT 'RICH_TEXT',
    "fileUrl" TEXT,
    "videoUrl" TEXT,
    "estimatedDurationMinutes" INTEGER NOT NULL DEFAULT 30,
    "sequenceOrder" INTEGER NOT NULL DEFAULT 1,
    "completionRule" TEXT NOT NULL DEFAULT 'MANUAL_CHECK',
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsLessonProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LmsLessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsCourseProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "completedActivitiesCount" INTEGER NOT NULL DEFAULT 0,
    "totalActivitiesCount" INTEGER NOT NULL DEFAULT 0,
    "progressPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LmsCourseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsCourseAnnouncement" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "targetSectionId" TEXT,
    "authorName" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LmsCourseAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsHomework" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "attachmentUrl" TEXT,
    "maxMarks" DOUBLE PRECISION DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsHomework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsHomeworkSubmission" (
    "id" TEXT NOT NULL,
    "homeworkId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentText" TEXT,
    "attachmentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "teacherRemarks" TEXT,
    "scoreObtained" DOUBLE PRECISION,

    CONSTRAINT "LmsHomeworkSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsAssignment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "totalMarks" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "weightPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "lateDeadline" TIMESTAMP(3),
    "lateSubmissionPolicy" TEXT NOT NULL DEFAULT 'ALLOWED',
    "latePenaltyPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "submissionType" TEXT NOT NULL DEFAULT 'FILE',
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "rubricId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsRubric" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "totalPoints" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsRubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsRubricCriterion" (
    "id" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "maxPoints" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "LmsRubricCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsRubricLevel" (
    "id" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "points" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "LmsRubricLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsAssignmentSubmission" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentText" TEXT,
    "fileUrls" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "score" DOUBLE PRECISION,
    "rubricScoresJson" TEXT,
    "feedbackText" TEXT,
    "gradedByEmployeeId" TEXT,
    "gradedAt" TIMESTAMP(3),
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "penaltyDeducted" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "LmsAssignmentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsQuestionBank" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "subjectId" TEXT,
    "courseId" TEXT,
    "topic" TEXT,
    "learningOutcomeCode" TEXT,
    "questionType" TEXT NOT NULL DEFAULT 'MCQ_SINGLE',
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "bloomTaxonomy" TEXT,
    "questionText" TEXT NOT NULL,
    "explanation" TEXT,
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "optionsJson" TEXT,
    "correctAnswerJson" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "createdByEmployeeId" TEXT,
    "approvedByEmployeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsQuestionBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsQuiz" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "openTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closeTime" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "totalMarks" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "passMark" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT true,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT true,
    "showResultsPolicy" TEXT NOT NULL DEFAULT 'AFTER_DEADLINE',
    "negativeMarkingRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsQuizQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "questionBankId" TEXT,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL DEFAULT 'MCQ_SINGLE',
    "optionsJson" TEXT,
    "correctAnswerJson" TEXT NOT NULL,
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sequenceOrder" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LmsQuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsQuizAttempt" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serverExpiryAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "scoreObtained" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LmsQuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsQuizResponse" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "studentAnswerJson" TEXT,
    "isAutoGraded" BOOLEAN NOT NULL DEFAULT false,
    "scoreAwarded" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "teacherComments" TEXT,
    "gradedByEmployeeId" TEXT,

    CONSTRAINT "LmsQuizResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsOnlineClass" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT,
    "teacherEmployeeId" TEXT NOT NULL,
    "classDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "meetingProvider" TEXT NOT NULL DEFAULT 'GOOGLE_MEET',
    "meetingUrl" TEXT NOT NULL,
    "meetingPasscode" TEXT,
    "recordingUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsOnlineClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsOnlineClassAttendance" (
    "id" TEXT NOT NULL,
    "onlineClassId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "durationMinutes" INTEGER NOT NULL DEFAULT 0,
    "attendanceStatus" TEXT NOT NULL DEFAULT 'PRESENT',
    "source" TEXT NOT NULL DEFAULT 'LMS_JOIN_EVENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LmsOnlineClassAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsDiscussion" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "postsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsDiscussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsDiscussionPost" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentPostId" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsDiscussionPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsGradebookItem" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "referenceId" TEXT,
    "title" TEXT NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "weightPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "assessmentComponentId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsGradebookItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsGradebookScore" (
    "id" TEXT NOT NULL,
    "gradebookItemId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "scoreObtained" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalWeightedScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isOverridden" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "overriddenByEmployeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsGradebookScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LmsLearningActivityLog" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "detailsJson" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LmsLearningActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportingDataset" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'ACADEMIC',
    "requiredPermission" TEXT,
    "isPlatformDataset" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportingDataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportingField" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dataType" TEXT NOT NULL DEFAULT 'STRING',
    "sourceModel" TEXT NOT NULL,
    "sourceField" TEXT NOT NULL,
    "isSortable" BOOLEAN NOT NULL DEFAULT true,
    "isFilterable" BOOLEAN NOT NULL DEFAULT true,
    "isGroupable" BOOLEAN NOT NULL DEFAULT true,
    "allowAggregation" BOOLEAN NOT NULL DEFAULT false,
    "classification" TEXT NOT NULL DEFAULT 'INTERNAL',
    "piiMaskingType" TEXT NOT NULL DEFAULT 'NONE',
    "requiredPermission" TEXT,
    "isExportable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportingField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportDefinition" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT,
    "campusId" TEXT,
    "datasetId" TEXT NOT NULL,
    "datasetCode" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerUserId" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isStandard" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "defaultSortField" TEXT,
    "defaultSortDirection" TEXT NOT NULL DEFAULT 'ASC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportColumn" (
    "id" TEXT NOT NULL,
    "reportDefinitionId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "displayLabel" TEXT NOT NULL,
    "sequenceOrder" INTEGER NOT NULL DEFAULT 1,
    "columnWidth" INTEGER,
    "formattingJson" TEXT,
    "aggregateType" TEXT,

    CONSTRAINT "ReportColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportFilter" (
    "id" TEXT NOT NULL,
    "reportDefinitionId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "valueJson" TEXT NOT NULL,
    "sequenceOrder" INTEGER NOT NULL DEFAULT 1,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ReportFilter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSort" (
    "id" TEXT NOT NULL,
    "reportDefinitionId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'ASC',
    "priority" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ReportSort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportGroup" (
    "id" TEXT NOT NULL,
    "reportDefinitionId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "sequenceOrder" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ReportGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportCalculatedField" (
    "id" TEXT NOT NULL,
    "reportDefinitionId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "formulaExpression" TEXT NOT NULL,
    "dataType" TEXT NOT NULL DEFAULT 'DECIMAL',

    CONSTRAINT "ReportCalculatedField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportExecution" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "reportDefinitionId" TEXT,
    "datasetCode" TEXT NOT NULL,
    "executedByUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "filterParamsJson" TEXT,
    "errorDetails" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSnapshot" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "reportDefinitionId" TEXT,
    "datasetCode" TEXT NOT NULL,
    "definitionVersion" INTEGER NOT NULL DEFAULT 1,
    "parametersJson" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "dataHash" TEXT NOT NULL,
    "snapshotDataJson" TEXT NOT NULL,
    "generatedByUserId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportExport" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "reportDefinitionId" TEXT,
    "exportFormat" TEXT NOT NULL,
    "sensitiveDataIncluded" BOOLEAN NOT NULL DEFAULT false,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "fileSize" INTEGER,
    "exportedByUserId" TEXT NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardDefinition" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'EXECUTIVE',
    "isStandard" BOOLEAN NOT NULL DEFAULT false,
    "layoutJson" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardWidget" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "widgetType" TEXT NOT NULL,
    "datasetCode" TEXT NOT NULL,
    "reportDefinitionId" TEXT,
    "queryConfigJson" TEXT NOT NULL,
    "gridPositionJson" TEXT,
    "refreshIntervalSec" INTEGER NOT NULL DEFAULT 300,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardWidget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSchedule" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "reportDefinitionId" TEXT NOT NULL,
    "scheduleFrequency" TEXT NOT NULL,
    "recipientsJson" TEXT NOT NULL,
    "outputFormat" TEXT NOT NULL DEFAULT 'XLSX',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "deliveryStatus" TEXT NOT NULL DEFAULT 'REPORT_SCHEDULING_ENGINE_REAL; EMAIL_DELIVERY_PROVIDER_PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryAgency" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "description" TEXT,
    "jurisdiction" TEXT NOT NULL DEFAULT 'BANGLADESH',
    "websiteUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegulatoryAgency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryTemplate" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "agencyCode" TEXT NOT NULL,
    "templateCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "institutionType" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveUntil" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "outputFormat" TEXT NOT NULL DEFAULT 'XLSX',
    "isStandard" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegulatoryTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryTemplateField" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "fieldCode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "dataType" TEXT NOT NULL DEFAULT 'STRING',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "validationRuleJson" TEXT,
    "sectionName" TEXT,
    "sequenceOrder" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "RegulatoryTemplateField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryFieldMapping" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateFieldId" TEXT NOT NULL,
    "sourceDatasetCode" TEXT NOT NULL,
    "sourceFieldKey" TEXT NOT NULL,
    "transformRule" TEXT NOT NULL DEFAULT 'DIRECT',
    "transformConfigJson" TEXT,

    CONSTRAINT "RegulatoryFieldMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryReportRun" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "academicYearId" TEXT,
    "sessionId" TEXT,
    "reportingPeriod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "preparerUserId" TEXT NOT NULL,
    "reviewerUserId" TEXT,
    "approverUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "snapshotDataJson" TEXT,
    "snapshotHash" TEXT,
    "exportedAt" TIMESTAMP(3),
    "exportFormat" TEXT,
    "integrationStatus" TEXT NOT NULL DEFAULT 'REGULATORY_DATA_VALIDATION_REAL; REGULATORY_EXPORT_REAL; EXTERNAL_GOVERNMENT_SUBMISSION_API_PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegulatoryReportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryValidationIssue" (
    "id" TEXT NOT NULL,
    "reportRunId" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'ERROR',
    "fieldCode" TEXT NOT NULL,
    "sourceRecordId" TEXT,
    "sourceRecordType" TEXT,
    "message" TEXT NOT NULL,
    "resolutionLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegulatoryValidationIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatorySubmissionRecord" (
    "id" TEXT NOT NULL,
    "reportRunId" TEXT NOT NULL,
    "submittedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submissionReference" TEXT,
    "acknowledgementNumber" TEXT,
    "submittedByUserId" TEXT NOT NULL,
    "submissionDocumentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegulatorySubmissionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataQualityRule" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT,
    "datasetCode" TEXT NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'ERROR',
    "checkType" TEXT NOT NULL,
    "ruleConfigJson" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataQualityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataQualityIssue" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "datasetCode" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "recordTitle" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'ERROR',
    "details" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "DataQualityIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_customDomain_key" ON "Tenant"("customDomain");

-- CreateIndex
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_isActive_idx" ON "Tenant"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TenantDomain_domain_key" ON "TenantDomain"("domain");

-- CreateIndex
CREATE INDEX "TenantDomain_tenantId_idx" ON "TenantDomain"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_tier_key" ON "SubscriptionPlan"("tier");

-- CreateIndex
CREATE INDEX "Subscription_tenantId_status_idx" ON "Subscription"("tenantId", "status");

-- CreateIndex
CREATE INDEX "UsageRecord_tenantId_metric_idx" ON "UsageRecord"("tenantId", "metric");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_tenantId_key" ON "Institution"("tenantId");

-- CreateIndex
CREATE INDEX "Institution_tenantId_idx" ON "Institution"("tenantId");

-- CreateIndex
CREATE INDEX "Campus_institutionId_idx" ON "Campus"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Campus_institutionId_code_key" ON "Campus"("institutionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_role_idx" ON "User"("tenantId", "role");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_token_key" ON "UserSession"("token");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_token_idx" ON "UserSession"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "AcademicYear_institutionId_idx" ON "AcademicYear"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_institutionId_name_key" ON "AcademicYear"("institutionId", "name");

-- CreateIndex
CREATE INDEX "Session_academicYearId_idx" ON "Session"("academicYearId");

-- CreateIndex
CREATE INDEX "Shift_institutionId_idx" ON "Shift"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_institutionId_code_key" ON "Shift"("institutionId", "code");

-- CreateIndex
CREATE INDEX "AcademicGroup_institutionId_idx" ON "AcademicGroup"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicGroup_institutionId_code_key" ON "AcademicGroup"("institutionId", "code");

-- CreateIndex
CREATE INDEX "SubjectCombinationTemplate_institutionId_idx" ON "SubjectCombinationTemplate"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectCombinationTemplate_institutionId_code_key" ON "SubjectCombinationTemplate"("institutionId", "code");

-- CreateIndex
CREATE INDEX "StudentSubjectRegistration_studentId_idx" ON "StudentSubjectRegistration"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSubjectRegistration_studentId_sessionId_subjectId_key" ON "StudentSubjectRegistration"("studentId", "sessionId", "subjectId");

-- CreateIndex
CREATE INDEX "Faculty_institutionId_idx" ON "Faculty"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_institutionId_code_key" ON "Faculty"("institutionId", "code");

-- CreateIndex
CREATE INDEX "Department_institutionId_idx" ON "Department"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_institutionId_code_key" ON "Department"("institutionId", "code");

-- CreateIndex
CREATE INDEX "Program_departmentId_idx" ON "Program"("departmentId");

-- CreateIndex
CREATE INDEX "Batch_programId_idx" ON "Batch"("programId");

-- CreateIndex
CREATE INDEX "Curriculum_programId_idx" ON "Curriculum"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "Curriculum_institutionId_code_key" ON "Curriculum"("institutionId", "code");

-- CreateIndex
CREATE INDEX "CurriculumVersion_curriculumId_idx" ON "CurriculumVersion"("curriculumId");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumVersion_curriculumId_versionCode_key" ON "CurriculumVersion"("curriculumId", "versionCode");

-- CreateIndex
CREATE INDEX "CurriculumCourse_curriculumVersionId_idx" ON "CurriculumCourse"("curriculumVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumCourse_curriculumVersionId_courseId_key" ON "CurriculumCourse"("curriculumVersionId", "courseId");

-- CreateIndex
CREATE INDEX "Class_institutionId_idx" ON "Class"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Class_institutionId_name_shift_key" ON "Class"("institutionId", "name", "shift");

-- CreateIndex
CREATE INDEX "Section_classId_idx" ON "Section"("classId");

-- CreateIndex
CREATE INDEX "Subject_classId_idx" ON "Subject"("classId");

-- CreateIndex
CREATE INDEX "Course_programId_idx" ON "Course"("programId");

-- CreateIndex
CREATE INDEX "CoursePrerequisite_courseId_idx" ON "CoursePrerequisite"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CoursePrerequisite_courseId_prerequisiteCourseId_key" ON "CoursePrerequisite"("courseId", "prerequisiteCourseId");

-- CreateIndex
CREATE INDEX "CourseOffering_sessionId_idx" ON "CourseOffering"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseOffering_courseId_sessionId_sectionName_key" ON "CourseOffering"("courseId", "sessionId", "sectionName");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE INDEX "Student_campusId_idx" ON "Student"("campusId");

-- CreateIndex
CREATE INDEX "Student_studentIdNumber_idx" ON "Student"("studentIdNumber");

-- CreateIndex
CREATE INDEX "Student_status_idx" ON "Student"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_userId_key" ON "Guardian"("userId");

-- CreateIndex
CREATE INDEX "StudentGuardian_studentId_idx" ON "StudentGuardian"("studentId");

-- CreateIndex
CREATE INDEX "StudentGuardian_guardianId_idx" ON "StudentGuardian"("guardianId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentGuardian_studentId_guardianId_key" ON "StudentGuardian"("studentId", "guardianId");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionApplication_applicationNumber_key" ON "AdmissionApplication"("applicationNumber");

-- CreateIndex
CREATE INDEX "AdmissionApplication_institutionId_status_idx" ON "AdmissionApplication"("institutionId", "status");

-- CreateIndex
CREATE INDEX "AdmissionApplication_applicationNumber_idx" ON "AdmissionApplication"("applicationNumber");

-- CreateIndex
CREATE INDEX "AdmissionTest_institutionId_idx" ON "AdmissionTest"("institutionId");

-- CreateIndex
CREATE INDEX "AdmissionTestAttempt_applicationId_idx" ON "AdmissionTestAttempt"("applicationId");

-- CreateIndex
CREATE INDEX "AdmissionTestAttempt_testId_idx" ON "AdmissionTestAttempt"("testId");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_idx" ON "Enrollment"("studentId");

-- CreateIndex
CREATE INDEX "Enrollment_sessionId_idx" ON "Enrollment"("sessionId");

-- CreateIndex
CREATE INDEX "Enrollment_academicYearId_idx" ON "Enrollment"("academicYearId");

-- CreateIndex
CREATE INDEX "CourseRegistration_studentId_courseId_idx" ON "CourseRegistration"("studentId", "courseId");

-- CreateIndex
CREATE INDEX "CourseRegistration_courseOfferingId_idx" ON "CourseRegistration"("courseOfferingId");

-- CreateIndex
CREATE INDEX "HifzDailyRecord_studentId_date_idx" ON "HifzDailyRecord"("studentId", "date");

-- CreateIndex
CREATE INDEX "ThesisRecord_studentId_idx" ON "ThesisRecord"("studentId");

-- CreateIndex
CREATE INDEX "ResearchProject_institutionId_idx" ON "ResearchProject"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "Employee_campusId_idx" ON "Employee"("campusId");

-- CreateIndex
CREATE INDEX "Employee_employeeCode_idx" ON "Employee"("employeeCode");

-- CreateIndex
CREATE INDEX "Employee_departmentId_idx" ON "Employee"("departmentId");

-- CreateIndex
CREATE INDEX "Employee_positionId_idx" ON "Employee"("positionId");

-- CreateIndex
CREATE INDEX "Employee_status_idx" ON "Employee"("status");

-- CreateIndex
CREATE INDEX "Position_institutionId_idx" ON "Position"("institutionId");

-- CreateIndex
CREATE INDEX "Position_departmentId_idx" ON "Position"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Position_institutionId_positionCode_key" ON "Position"("institutionId", "positionCode");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyProfile_employeeId_key" ON "FacultyProfile"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeDocument_employeeId_idx" ON "EmployeeDocument"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeDocument_expiryDate_idx" ON "EmployeeDocument"("expiryDate");

-- CreateIndex
CREATE INDEX "EmployeeQualification_employeeId_idx" ON "EmployeeQualification"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeExperience_employeeId_idx" ON "EmployeeExperience"("employeeId");

-- CreateIndex
CREATE INDEX "JobRequisition_institutionId_idx" ON "JobRequisition"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "JobRequisition_institutionId_requisitionNumber_key" ON "JobRequisition"("institutionId", "requisitionNumber");

-- CreateIndex
CREATE INDEX "JobVacancy_institutionId_idx" ON "JobVacancy"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "JobVacancy_institutionId_vacancyCode_key" ON "JobVacancy"("institutionId", "vacancyCode");

-- CreateIndex
CREATE UNIQUE INDEX "JobCandidate_convertedEmployeeId_key" ON "JobCandidate"("convertedEmployeeId");

-- CreateIndex
CREATE INDEX "JobCandidate_institutionId_idx" ON "JobCandidate"("institutionId");

-- CreateIndex
CREATE INDEX "JobCandidate_vacancyId_idx" ON "JobCandidate"("vacancyId");

-- CreateIndex
CREATE UNIQUE INDEX "JobCandidate_institutionId_applicantNumber_key" ON "JobCandidate"("institutionId", "applicantNumber");

-- CreateIndex
CREATE INDEX "CandidateInterview_candidateId_idx" ON "CandidateInterview"("candidateId");

-- CreateIndex
CREATE INDEX "JobOffer_institutionId_idx" ON "JobOffer"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "JobOffer_institutionId_offerNumber_key" ON "JobOffer"("institutionId", "offerNumber");

-- CreateIndex
CREATE INDEX "EmployeeOnboarding_employeeId_idx" ON "EmployeeOnboarding"("employeeId");

-- CreateIndex
CREATE INDEX "EmploymentContract_employeeId_idx" ON "EmploymentContract"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeBankAccount_employeeId_key" ON "EmployeeBankAccount"("employeeId");

-- CreateIndex
CREATE INDEX "HrShift_institutionId_idx" ON "HrShift"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "HrShift_institutionId_shiftCode_key" ON "HrShift"("institutionId", "shiftCode");

-- CreateIndex
CREATE INDEX "EmployeeRoster_employeeId_idx" ON "EmployeeRoster"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeRoster_shiftId_idx" ON "EmployeeRoster"("shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeRoster_employeeId_rosterDate_key" ON "EmployeeRoster"("employeeId", "rosterDate");

-- CreateIndex
CREATE INDEX "EmployeeRawPunch_institutionId_idx" ON "EmployeeRawPunch"("institutionId");

-- CreateIndex
CREATE INDEX "EmployeeRawPunch_employeeId_punchTime_idx" ON "EmployeeRawPunch"("employeeId", "punchTime");

-- CreateIndex
CREATE INDEX "EmployeeDailyAttendance_institutionId_idx" ON "EmployeeDailyAttendance"("institutionId");

-- CreateIndex
CREATE INDEX "EmployeeDailyAttendance_employeeId_idx" ON "EmployeeDailyAttendance"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeDailyAttendance_attendanceDate_idx" ON "EmployeeDailyAttendance"("attendanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeDailyAttendance_employeeId_attendanceDate_key" ON "EmployeeDailyAttendance"("employeeId", "attendanceDate");

-- CreateIndex
CREATE INDEX "AttendanceCorrectionRequest_employeeId_idx" ON "AttendanceCorrectionRequest"("employeeId");

-- CreateIndex
CREATE INDEX "OvertimeRequest_employeeId_idx" ON "OvertimeRequest"("employeeId");

-- CreateIndex
CREATE INDEX "HrLeaveType_institutionId_idx" ON "HrLeaveType"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "HrLeaveType_institutionId_code_key" ON "HrLeaveType"("institutionId", "code");

-- CreateIndex
CREATE INDEX "HrLeavePolicy_institutionId_idx" ON "HrLeavePolicy"("institutionId");

-- CreateIndex
CREATE INDEX "EmployeeLeaveBalance_employeeId_idx" ON "EmployeeLeaveBalance"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeLeaveBalance_employeeId_leaveTypeId_year_key" ON "EmployeeLeaveBalance"("employeeId", "leaveTypeId", "year");

-- CreateIndex
CREATE INDEX "EmployeeLeaveLedger_employeeId_idx" ON "EmployeeLeaveLedger"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeLeaveApplication_employeeId_idx" ON "EmployeeLeaveApplication"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeLeaveApplication_leaveTypeId_idx" ON "EmployeeLeaveApplication"("leaveTypeId");

-- CreateIndex
CREATE INDEX "EmployeePromotionHistory_employeeId_idx" ON "EmployeePromotionHistory"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeTransferHistory_employeeId_idx" ON "EmployeeTransferHistory"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeIncrementRequest_employeeId_idx" ON "EmployeeIncrementRequest"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeAdditionalDuty_employeeId_idx" ON "EmployeeAdditionalDuty"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeSkill_employeeId_idx" ON "EmployeeSkill"("employeeId");

-- CreateIndex
CREATE INDEX "PerformanceCycle_institutionId_idx" ON "PerformanceCycle"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceCycle_institutionId_name_key" ON "PerformanceCycle"("institutionId", "name");

-- CreateIndex
CREATE INDEX "EmployeeGoal_employeeId_idx" ON "EmployeeGoal"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeGoal_cycleId_idx" ON "EmployeeGoal"("cycleId");

-- CreateIndex
CREATE INDEX "EmployeePerformanceReview_employeeId_idx" ON "EmployeePerformanceReview"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeePerformanceReview_cycleId_idx" ON "EmployeePerformanceReview"("cycleId");

-- CreateIndex
CREATE INDEX "TrainingProgram_institutionId_idx" ON "TrainingProgram"("institutionId");

-- CreateIndex
CREATE INDEX "EmployeeTrainingEnrollment_employeeId_idx" ON "EmployeeTrainingEnrollment"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeTrainingEnrollment_trainingProgramId_idx" ON "EmployeeTrainingEnrollment"("trainingProgramId");

-- CreateIndex
CREATE INDEX "EmployeeDisciplinaryCase_institutionId_idx" ON "EmployeeDisciplinaryCase"("institutionId");

-- CreateIndex
CREATE INDEX "EmployeeDisciplinaryCase_employeeId_idx" ON "EmployeeDisciplinaryCase"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeDisciplinaryCase_institutionId_caseNumber_key" ON "EmployeeDisciplinaryCase"("institutionId", "caseNumber");

-- CreateIndex
CREATE INDEX "EmployeeWarning_employeeId_idx" ON "EmployeeWarning"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeGrievance_institutionId_idx" ON "EmployeeGrievance"("institutionId");

-- CreateIndex
CREATE INDEX "EmployeeGrievance_employeeId_idx" ON "EmployeeGrievance"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeGrievance_institutionId_ticketNumber_key" ON "EmployeeGrievance"("institutionId", "ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSeparation_employeeId_key" ON "EmployeeSeparation"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeSeparation_institutionId_idx" ON "EmployeeSeparation"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeExitClearance_separationId_key" ON "EmployeeExitClearance"("separationId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_employeeId_key" ON "Teacher"("employeeId");

-- CreateIndex
CREATE INDEX "LeaveApplication_employeeId_idx" ON "LeaveApplication"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRecord_payslipNumber_key" ON "PayrollRecord"("payslipNumber");

-- CreateIndex
CREATE INDEX "PayrollRecord_employeeId_idx" ON "PayrollRecord"("employeeId");

-- CreateIndex
CREATE INDEX "PayrollRecord_payrollPeriodId_idx" ON "PayrollRecord"("payrollPeriodId");

-- CreateIndex
CREATE INDEX "AttendanceSession_campusId_date_idx" ON "AttendanceSession"("campusId", "date");

-- CreateIndex
CREATE INDEX "AttendanceRecord_studentId_date_idx" ON "AttendanceRecord"("studentId", "date");

-- CreateIndex
CREATE INDEX "AttendanceRecord_sessionId_idx" ON "AttendanceRecord"("sessionId");

-- CreateIndex
CREATE INDEX "Building_campusId_idx" ON "Building"("campusId");

-- CreateIndex
CREATE UNIQUE INDEX "Building_campusId_code_key" ON "Building"("campusId", "code");

-- CreateIndex
CREATE INDEX "Classroom_campusId_idx" ON "Classroom"("campusId");

-- CreateIndex
CREATE INDEX "Period_institutionId_idx" ON "Period"("institutionId");

-- CreateIndex
CREATE INDEX "TeacherAvailability_teacherId_dayOfWeek_idx" ON "TeacherAvailability"("teacherId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "TeacherAssignment_teacherId_idx" ON "TeacherAssignment"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherAssignment_sectionId_idx" ON "TeacherAssignment"("sectionId");

-- CreateIndex
CREATE INDEX "TimetableEntry_classroomId_dayOfWeek_startTime_idx" ON "TimetableEntry"("classroomId", "dayOfWeek", "startTime");

-- CreateIndex
CREATE INDEX "TimetableEntry_sectionId_dayOfWeek_startTime_idx" ON "TimetableEntry"("sectionId", "dayOfWeek", "startTime");

-- CreateIndex
CREATE INDEX "TimetableEntry_teacherId_dayOfWeek_startTime_idx" ON "TimetableEntry"("teacherId", "dayOfWeek", "startTime");

-- CreateIndex
CREATE INDEX "TechnologyTrade_institutionId_idx" ON "TechnologyTrade"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "TechnologyTrade_institutionId_code_key" ON "TechnologyTrade"("institutionId", "code");

-- CreateIndex
CREATE INDEX "WorkshopLogEntry_studentId_date_idx" ON "WorkshopLogEntry"("studentId", "date");

-- CreateIndex
CREATE INDEX "IndustrialAttachment_studentId_idx" ON "IndustrialAttachment"("studentId");

-- CreateIndex
CREATE INDEX "AcademicCalendarEvent_institutionId_startDate_idx" ON "AcademicCalendarEvent"("institutionId", "startDate");

-- CreateIndex
CREATE INDEX "AssessmentComponent_institutionId_idx" ON "AssessmentComponent"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentComponent_institutionId_code_key" ON "AssessmentComponent"("institutionId", "code");

-- CreateIndex
CREATE INDEX "MarkDistributionTemplate_institutionId_idx" ON "MarkDistributionTemplate"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "MarkDistributionTemplate_institutionId_code_key" ON "MarkDistributionTemplate"("institutionId", "code");

-- CreateIndex
CREATE INDEX "Exam_sessionId_idx" ON "Exam"("sessionId");

-- CreateIndex
CREATE INDEX "Exam_institutionId_idx" ON "Exam"("institutionId");

-- CreateIndex
CREATE INDEX "ExamSchedule_examId_date_idx" ON "ExamSchedule"("examId", "date");

-- CreateIndex
CREATE INDEX "ExamSchedule_roomId_date_idx" ON "ExamSchedule"("roomId", "date");

-- CreateIndex
CREATE INDEX "ExamEligibility_examId_idx" ON "ExamEligibility"("examId");

-- CreateIndex
CREATE INDEX "ExamEligibility_studentId_idx" ON "ExamEligibility"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamEligibility_examId_studentId_key" ON "ExamEligibility"("examId", "studentId");

-- CreateIndex
CREATE INDEX "MarksEntry_examId_idx" ON "MarksEntry"("examId");

-- CreateIndex
CREATE INDEX "MarksEntry_studentId_idx" ON "MarksEntry"("studentId");

-- CreateIndex
CREATE INDEX "MarkAuditLog_marksEntryId_idx" ON "MarkAuditLog"("marksEntryId");

-- CreateIndex
CREATE INDEX "GradingScale_institutionId_idx" ON "GradingScale"("institutionId");

-- CreateIndex
CREATE INDEX "Result_examId_idx" ON "Result"("examId");

-- CreateIndex
CREATE INDEX "Result_studentId_idx" ON "Result"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Result_examId_studentId_key" ON "Result"("examId", "studentId");

-- CreateIndex
CREATE INDEX "ExamResultSnapshot_examId_studentId_idx" ON "ExamResultSnapshot"("examId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamResultSnapshot_examId_studentId_version_key" ON "ExamResultSnapshot"("examId", "studentId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "OfficialTranscript_transcriptNumber_key" ON "OfficialTranscript"("transcriptNumber");

-- CreateIndex
CREATE INDEX "OfficialTranscript_institutionId_idx" ON "OfficialTranscript"("institutionId");

-- CreateIndex
CREATE INDEX "OfficialTranscript_studentId_idx" ON "OfficialTranscript"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateNumber_key" ON "Certificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "Certificate_institutionId_idx" ON "Certificate"("institutionId");

-- CreateIndex
CREATE INDEX "Certificate_studentId_idx" ON "Certificate"("studentId");

-- CreateIndex
CREATE INDEX "PromotionBatch_institutionId_idx" ON "PromotionBatch"("institutionId");

-- CreateIndex
CREATE INDEX "StudentPromotionRecord_promotionBatchId_idx" ON "StudentPromotionRecord"("promotionBatchId");

-- CreateIndex
CREATE INDEX "StudentPromotionRecord_studentId_idx" ON "StudentPromotionRecord"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationRecord_studentId_key" ON "GraduationRecord"("studentId");

-- CreateIndex
CREATE INDEX "GraduationRecord_institutionId_idx" ON "GraduationRecord"("institutionId");

-- CreateIndex
CREATE INDEX "FiscalYear_institutionId_idx" ON "FiscalYear"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalYear_institutionId_name_key" ON "FiscalYear"("institutionId", "name");

-- CreateIndex
CREATE INDEX "FiscalPeriod_institutionId_idx" ON "FiscalPeriod"("institutionId");

-- CreateIndex
CREATE INDEX "ChartOfAccount_institutionId_idx" ON "ChartOfAccount"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "ChartOfAccount_institutionId_code_key" ON "ChartOfAccount"("institutionId", "code");

-- CreateIndex
CREATE INDEX "CostCenter_institutionId_idx" ON "CostCenter"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "CostCenter_institutionId_code_key" ON "CostCenter"("institutionId", "code");

-- CreateIndex
CREATE INDEX "Fund_institutionId_idx" ON "Fund"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Fund_institutionId_code_key" ON "Fund"("institutionId", "code");

-- CreateIndex
CREATE INDEX "AccountMapping_institutionId_idx" ON "AccountMapping"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountMapping_institutionId_mappingKey_key" ON "AccountMapping"("institutionId", "mappingKey");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_entryNumber_key" ON "JournalEntry"("entryNumber");

-- CreateIndex
CREATE INDEX "JournalEntry_institutionId_idx" ON "JournalEntry"("institutionId");

-- CreateIndex
CREATE INDEX "JournalEntry_entryDate_idx" ON "JournalEntry"("entryDate");

-- CreateIndex
CREATE INDEX "JournalLine_journalEntryId_idx" ON "JournalLine"("journalEntryId");

-- CreateIndex
CREATE INDEX "JournalLine_accountId_idx" ON "JournalLine"("accountId");

-- CreateIndex
CREATE INDEX "FeeType_institutionId_idx" ON "FeeType"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeType_institutionId_code_key" ON "FeeType"("institutionId", "code");

-- CreateIndex
CREATE INDEX "FeeStructure_institutionId_idx" ON "FeeStructure"("institutionId");

-- CreateIndex
CREATE INDEX "LateFeeRule_institutionId_idx" ON "LateFeeRule"("institutionId");

-- CreateIndex
CREATE INDEX "ScholarshipMaster_institutionId_idx" ON "ScholarshipMaster"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "ScholarshipMaster_institutionId_code_key" ON "ScholarshipMaster"("institutionId", "code");

-- CreateIndex
CREATE INDEX "ScholarshipApplication_institutionId_idx" ON "ScholarshipApplication"("institutionId");

-- CreateIndex
CREATE INDEX "ScholarshipApplication_studentId_idx" ON "ScholarshipApplication"("studentId");

-- CreateIndex
CREATE INDEX "ScholarshipAward_institutionId_idx" ON "ScholarshipAward"("institutionId");

-- CreateIndex
CREATE INDEX "ScholarshipAward_studentId_idx" ON "ScholarshipAward"("studentId");

-- CreateIndex
CREATE INDEX "FeeWaiver_institutionId_idx" ON "FeeWaiver"("institutionId");

-- CreateIndex
CREATE INDEX "FeeWaiver_studentId_idx" ON "FeeWaiver"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_studentId_idx" ON "Invoice"("studentId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_transactionRef_key" ON "PaymentTransaction"("transactionRef");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_receiptNumber_key" ON "PaymentTransaction"("receiptNumber");

-- CreateIndex
CREATE INDEX "PaymentTransaction_invoiceId_idx" ON "PaymentTransaction"("invoiceId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_paymentId_idx" ON "PaymentAllocation"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_invoiceId_idx" ON "PaymentAllocation"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentCreditBalance_studentId_key" ON "StudentCreditBalance"("studentId");

-- CreateIndex
CREATE INDEX "StudentCreditBalance_institutionId_idx" ON "StudentCreditBalance"("institutionId");

-- CreateIndex
CREATE INDEX "StudentCreditTransaction_studentId_idx" ON "StudentCreditTransaction"("studentId");

-- CreateIndex
CREATE INDEX "RefundRequest_institutionId_idx" ON "RefundRequest"("institutionId");

-- CreateIndex
CREATE INDEX "RefundRequest_studentId_idx" ON "RefundRequest"("studentId");

-- CreateIndex
CREATE INDEX "InstitutionBankAccount_institutionId_idx" ON "InstitutionBankAccount"("institutionId");

-- CreateIndex
CREATE INDEX "ChequeRecord_institutionId_idx" ON "ChequeRecord"("institutionId");

-- CreateIndex
CREATE INDEX "BankReconciliation_institutionId_idx" ON "BankReconciliation"("institutionId");

-- CreateIndex
CREATE INDEX "Vendor_institutionId_idx" ON "Vendor"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_institutionId_vendorCode_key" ON "Vendor"("institutionId", "vendorCode");

-- CreateIndex
CREATE INDEX "VendorBill_institutionId_idx" ON "VendorBill"("institutionId");

-- CreateIndex
CREATE INDEX "VendorBill_vendorId_idx" ON "VendorBill"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorBill_institutionId_billNumber_key" ON "VendorBill"("institutionId", "billNumber");

-- CreateIndex
CREATE INDEX "ExpenseRequest_institutionId_idx" ON "ExpenseRequest"("institutionId");

-- CreateIndex
CREATE INDEX "Budget_institutionId_idx" ON "Budget"("institutionId");

-- CreateIndex
CREATE INDEX "BudgetLine_budgetId_idx" ON "BudgetLine"("budgetId");

-- CreateIndex
CREATE INDEX "BudgetLine_accountId_idx" ON "BudgetLine"("accountId");

-- CreateIndex
CREATE INDEX "BudgetRevisionLog_budgetId_idx" ON "BudgetRevisionLog"("budgetId");

-- CreateIndex
CREATE INDEX "SalaryStructure_institutionId_idx" ON "SalaryStructure"("institutionId");

-- CreateIndex
CREATE INDEX "EmployeeSalaryAssignment_employeeId_idx" ON "EmployeeSalaryAssignment"("employeeId");

-- CreateIndex
CREATE INDEX "PayrollPeriod_institutionId_idx" ON "PayrollPeriod"("institutionId");

-- CreateIndex
CREATE INDEX "EmployeeLoan_institutionId_idx" ON "EmployeeLoan"("institutionId");

-- CreateIndex
CREATE INDEX "EmployeeLoan_employeeId_idx" ON "EmployeeLoan"("employeeId");

-- CreateIndex
CREATE INDEX "SalaryAdvance_institutionId_idx" ON "SalaryAdvance"("institutionId");

-- CreateIndex
CREATE INDEX "SalaryAdvance_employeeId_idx" ON "SalaryAdvance"("employeeId");

-- CreateIndex
CREATE INDEX "Book_campusId_idx" ON "Book"("campusId");

-- CreateIndex
CREATE INDEX "Hostel_campusId_idx" ON "Hostel"("campusId");

-- CreateIndex
CREATE INDEX "Vehicle_campusId_idx" ON "Vehicle"("campusId");

-- CreateIndex
CREATE INDEX "AssetRecord_institutionId_idx" ON "AssetRecord"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetRecord_institutionId_assetTag_key" ON "AssetRecord"("institutionId", "assetTag");

-- CreateIndex
CREATE INDEX "Notice_institutionId_idx" ON "Notice"("institutionId");

-- CreateIndex
CREATE INDEX "Event_institutionId_idx" ON "Event"("institutionId");

-- CreateIndex
CREATE INDEX "DisciplineRecord_studentId_idx" ON "DisciplineRecord"("studentId");

-- CreateIndex
CREATE INDEX "CustomField_institutionId_idx" ON "CustomField"("institutionId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_action_idx" ON "AuditLog"("tenantId", "action");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "Facility_institutionId_idx" ON "Facility"("institutionId");

-- CreateIndex
CREATE INDEX "Facility_campusId_idx" ON "Facility"("campusId");

-- CreateIndex
CREATE UNIQUE INDEX "Facility_institutionId_code_key" ON "Facility"("institutionId", "code");

-- CreateIndex
CREATE INDEX "Library_institutionId_idx" ON "Library"("institutionId");

-- CreateIndex
CREATE INDEX "Library_campusId_idx" ON "Library"("campusId");

-- CreateIndex
CREATE UNIQUE INDEX "Library_institutionId_code_key" ON "Library"("institutionId", "code");

-- CreateIndex
CREATE INDEX "LibraryCatalog_institutionId_idx" ON "LibraryCatalog"("institutionId");

-- CreateIndex
CREATE INDEX "LibraryCatalog_libraryId_idx" ON "LibraryCatalog"("libraryId");

-- CreateIndex
CREATE INDEX "LibraryCatalog_isbn_idx" ON "LibraryCatalog"("isbn");

-- CreateIndex
CREATE INDEX "LibraryCatalog_title_idx" ON "LibraryCatalog"("title");

-- CreateIndex
CREATE INDEX "LibraryCopy_accessionNumber_idx" ON "LibraryCopy"("accessionNumber");

-- CreateIndex
CREATE INDEX "LibraryCopy_barcode_idx" ON "LibraryCopy"("barcode");

-- CreateIndex
CREATE INDEX "LibraryCopy_availabilityStatus_idx" ON "LibraryCopy"("availabilityStatus");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryCopy_catalogId_accessionNumber_key" ON "LibraryCopy"("catalogId", "accessionNumber");

-- CreateIndex
CREATE INDEX "LibraryBorrowingPolicy_institutionId_idx" ON "LibraryBorrowingPolicy"("institutionId");

-- CreateIndex
CREATE INDEX "LibraryMember_institutionId_idx" ON "LibraryMember"("institutionId");

-- CreateIndex
CREATE INDEX "LibraryMember_studentId_idx" ON "LibraryMember"("studentId");

-- CreateIndex
CREATE INDEX "LibraryMember_employeeId_idx" ON "LibraryMember"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryMember_institutionId_membershipNumber_key" ON "LibraryMember"("institutionId", "membershipNumber");

-- CreateIndex
CREATE INDEX "BookIssue_institutionId_idx" ON "BookIssue"("institutionId");

-- CreateIndex
CREATE INDEX "BookIssue_copyId_idx" ON "BookIssue"("copyId");

-- CreateIndex
CREATE INDEX "BookIssue_memberId_idx" ON "BookIssue"("memberId");

-- CreateIndex
CREATE INDEX "BookIssue_status_idx" ON "BookIssue"("status");

-- CreateIndex
CREATE INDEX "BookReservation_institutionId_idx" ON "BookReservation"("institutionId");

-- CreateIndex
CREATE INDEX "BookReservation_catalogId_idx" ON "BookReservation"("catalogId");

-- CreateIndex
CREATE INDEX "BookReservation_memberId_idx" ON "BookReservation"("memberId");

-- CreateIndex
CREATE INDEX "LibraryStocktake_institutionId_idx" ON "LibraryStocktake"("institutionId");

-- CreateIndex
CREATE INDEX "LibraryStocktake_libraryId_idx" ON "LibraryStocktake"("libraryId");

-- CreateIndex
CREATE INDEX "HostelMaster_institutionId_idx" ON "HostelMaster"("institutionId");

-- CreateIndex
CREATE INDEX "HostelMaster_campusId_idx" ON "HostelMaster"("campusId");

-- CreateIndex
CREATE UNIQUE INDEX "HostelMaster_institutionId_code_key" ON "HostelMaster"("institutionId", "code");

-- CreateIndex
CREATE INDEX "HostelBlock_hostelId_idx" ON "HostelBlock"("hostelId");

-- CreateIndex
CREATE UNIQUE INDEX "HostelBlock_hostelId_code_key" ON "HostelBlock"("hostelId", "code");

-- CreateIndex
CREATE INDEX "HostelRoom_hostelId_idx" ON "HostelRoom"("hostelId");

-- CreateIndex
CREATE UNIQUE INDEX "HostelRoom_hostelId_roomNumber_key" ON "HostelRoom"("hostelId", "roomNumber");

-- CreateIndex
CREATE INDEX "HostelBed_roomId_idx" ON "HostelBed"("roomId");

-- CreateIndex
CREATE INDEX "HostelBed_status_idx" ON "HostelBed"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HostelBed_roomId_bedNumber_key" ON "HostelBed"("roomId", "bedNumber");

-- CreateIndex
CREATE INDEX "HostelApplication_institutionId_idx" ON "HostelApplication"("institutionId");

-- CreateIndex
CREATE INDEX "HostelApplication_studentId_idx" ON "HostelApplication"("studentId");

-- CreateIndex
CREATE INDEX "HostelAllocation_institutionId_idx" ON "HostelAllocation"("institutionId");

-- CreateIndex
CREATE INDEX "HostelAllocation_studentId_idx" ON "HostelAllocation"("studentId");

-- CreateIndex
CREATE INDEX "HostelAllocation_bedId_idx" ON "HostelAllocation"("bedId");

-- CreateIndex
CREATE UNIQUE INDEX "HostelCheckIn_allocationId_key" ON "HostelCheckIn"("allocationId");

-- CreateIndex
CREATE INDEX "HostelTransferHistory_allocationId_idx" ON "HostelTransferHistory"("allocationId");

-- CreateIndex
CREATE INDEX "HostelTransferHistory_studentId_idx" ON "HostelTransferHistory"("studentId");

-- CreateIndex
CREATE INDEX "HostelVisitorLog_institutionId_idx" ON "HostelVisitorLog"("institutionId");

-- CreateIndex
CREATE INDEX "HostelVisitorLog_hostelId_idx" ON "HostelVisitorLog"("hostelId");

-- CreateIndex
CREATE INDEX "HostelAttendance_hostelId_idx" ON "HostelAttendance"("hostelId");

-- CreateIndex
CREATE INDEX "HostelAttendance_studentId_idx" ON "HostelAttendance"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "HostelAttendance_hostelId_studentId_date_key" ON "HostelAttendance"("hostelId", "studentId", "date");

-- CreateIndex
CREATE INDEX "TransportVehicle_institutionId_idx" ON "TransportVehicle"("institutionId");

-- CreateIndex
CREATE INDEX "TransportVehicle_campusId_idx" ON "TransportVehicle"("campusId");

-- CreateIndex
CREATE UNIQUE INDEX "TransportVehicle_institutionId_vehicleNumber_key" ON "TransportVehicle"("institutionId", "vehicleNumber");

-- CreateIndex
CREATE INDEX "TransportRoute_institutionId_idx" ON "TransportRoute"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "TransportRoute_institutionId_routeCode_key" ON "TransportRoute"("institutionId", "routeCode");

-- CreateIndex
CREATE INDEX "RouteStop_routeId_idx" ON "RouteStop"("routeId");

-- CreateIndex
CREATE UNIQUE INDEX "RouteStop_routeId_stopOrder_key" ON "RouteStop"("routeId", "stopOrder");

-- CreateIndex
CREATE INDEX "TransportSubscription_institutionId_idx" ON "TransportSubscription"("institutionId");

-- CreateIndex
CREATE INDEX "TransportSubscription_studentId_idx" ON "TransportSubscription"("studentId");

-- CreateIndex
CREATE INDEX "TransportSubscription_employeeId_idx" ON "TransportSubscription"("employeeId");

-- CreateIndex
CREATE INDEX "TransportSubscription_routeId_idx" ON "TransportSubscription"("routeId");

-- CreateIndex
CREATE INDEX "TripSchedule_institutionId_idx" ON "TripSchedule"("institutionId");

-- CreateIndex
CREATE INDEX "TripSchedule_routeId_idx" ON "TripSchedule"("routeId");

-- CreateIndex
CREATE INDEX "TripSchedule_vehicleId_idx" ON "TripSchedule"("vehicleId");

-- CreateIndex
CREATE INDEX "TransportBoardingEvent_tripId_idx" ON "TransportBoardingEvent"("tripId");

-- CreateIndex
CREATE INDEX "TransportBoardingEvent_subscriptionId_idx" ON "TransportBoardingEvent"("subscriptionId");

-- CreateIndex
CREATE INDEX "GpsTelemetryRecord_vehicleId_timestamp_idx" ON "GpsTelemetryRecord"("vehicleId", "timestamp");

-- CreateIndex
CREATE INDEX "TransportIncident_institutionId_idx" ON "TransportIncident"("institutionId");

-- CreateIndex
CREATE INDEX "TransportIncident_vehicleId_idx" ON "TransportIncident"("vehicleId");

-- CreateIndex
CREATE INDEX "FuelLog_institutionId_idx" ON "FuelLog"("institutionId");

-- CreateIndex
CREATE INDEX "FuelLog_vehicleId_idx" ON "FuelLog"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleMaintenanceRecord_institutionId_idx" ON "VehicleMaintenanceRecord"("institutionId");

-- CreateIndex
CREATE INDEX "VehicleMaintenanceRecord_vehicleId_idx" ON "VehicleMaintenanceRecord"("vehicleId");

-- CreateIndex
CREATE INDEX "Canteen_institutionId_idx" ON "Canteen"("institutionId");

-- CreateIndex
CREATE INDEX "Canteen_campusId_idx" ON "Canteen"("campusId");

-- CreateIndex
CREATE UNIQUE INDEX "Canteen_institutionId_code_key" ON "Canteen"("institutionId", "code");

-- CreateIndex
CREATE INDEX "CanteenItem_institutionId_idx" ON "CanteenItem"("institutionId");

-- CreateIndex
CREATE INDEX "CanteenItem_canteenId_idx" ON "CanteenItem"("canteenId");

-- CreateIndex
CREATE UNIQUE INDEX "CanteenItem_canteenId_itemCode_key" ON "CanteenItem"("canteenId", "itemCode");

-- CreateIndex
CREATE INDEX "CanteenMenu_canteenId_date_idx" ON "CanteenMenu"("canteenId", "date");

-- CreateIndex
CREATE INDEX "CanteenWallet_institutionId_idx" ON "CanteenWallet"("institutionId");

-- CreateIndex
CREATE INDEX "CanteenWallet_studentId_idx" ON "CanteenWallet"("studentId");

-- CreateIndex
CREATE INDEX "CanteenWallet_employeeId_idx" ON "CanteenWallet"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "CanteenWallet_institutionId_walletNumber_key" ON "CanteenWallet"("institutionId", "walletNumber");

-- CreateIndex
CREATE INDEX "CanteenWalletLedger_walletId_idx" ON "CanteenWalletLedger"("walletId");

-- CreateIndex
CREATE INDEX "CanteenWalletLedger_transactionType_idx" ON "CanteenWalletLedger"("transactionType");

-- CreateIndex
CREATE UNIQUE INDEX "CanteenSpendingLimit_walletId_key" ON "CanteenSpendingLimit"("walletId");

-- CreateIndex
CREATE INDEX "CanteenPosSale_institutionId_idx" ON "CanteenPosSale"("institutionId");

-- CreateIndex
CREATE INDEX "CanteenPosSale_canteenId_idx" ON "CanteenPosSale"("canteenId");

-- CreateIndex
CREATE UNIQUE INDEX "CanteenPosSale_institutionId_saleNumber_key" ON "CanteenPosSale"("institutionId", "saleNumber");

-- CreateIndex
CREATE INDEX "CanteenSaleItem_saleId_idx" ON "CanteenSaleItem"("saleId");

-- CreateIndex
CREATE INDEX "InventoryCategory_institutionId_idx" ON "InventoryCategory"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryCategory_institutionId_code_key" ON "InventoryCategory"("institutionId", "code");

-- CreateIndex
CREATE INDEX "Warehouse_institutionId_idx" ON "Warehouse"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_institutionId_code_key" ON "Warehouse"("institutionId", "code");

-- CreateIndex
CREATE INDEX "InventoryItem_institutionId_idx" ON "InventoryItem"("institutionId");

-- CreateIndex
CREATE INDEX "InventoryItem_categoryId_idx" ON "InventoryItem"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_institutionId_sku_key" ON "InventoryItem"("institutionId", "sku");

-- CreateIndex
CREATE INDEX "StockLedger_institutionId_idx" ON "StockLedger"("institutionId");

-- CreateIndex
CREATE INDEX "StockLedger_warehouseId_idx" ON "StockLedger"("warehouseId");

-- CreateIndex
CREATE INDEX "StockLedger_itemId_idx" ON "StockLedger"("itemId");

-- CreateIndex
CREATE INDEX "StockLedger_transactionType_idx" ON "StockLedger"("transactionType");

-- CreateIndex
CREATE INDEX "StockTransfer_institutionId_idx" ON "StockTransfer"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "StockTransfer_institutionId_transferNumber_key" ON "StockTransfer"("institutionId", "transferNumber");

-- CreateIndex
CREATE INDEX "StockTransferItem_transferId_idx" ON "StockTransferItem"("transferId");

-- CreateIndex
CREATE INDEX "StockIssueRecord_institutionId_idx" ON "StockIssueRecord"("institutionId");

-- CreateIndex
CREATE INDEX "StockIssueRecord_warehouseId_idx" ON "StockIssueRecord"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "StockIssueRecord_institutionId_issueNumber_key" ON "StockIssueRecord"("institutionId", "issueNumber");

-- CreateIndex
CREATE INDEX "StockIssueItem_issueRecordId_idx" ON "StockIssueItem"("issueRecordId");

-- CreateIndex
CREATE INDEX "FixedAsset_institutionId_idx" ON "FixedAsset"("institutionId");

-- CreateIndex
CREATE INDEX "FixedAsset_campusId_idx" ON "FixedAsset"("campusId");

-- CreateIndex
CREATE INDEX "FixedAsset_assetTag_idx" ON "FixedAsset"("assetTag");

-- CreateIndex
CREATE INDEX "FixedAsset_status_idx" ON "FixedAsset"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FixedAsset_institutionId_assetTag_key" ON "FixedAsset"("institutionId", "assetTag");

-- CreateIndex
CREATE INDEX "AssetAssignmentHistory_assetId_idx" ON "AssetAssignmentHistory"("assetId");

-- CreateIndex
CREATE INDEX "AssetAssignmentHistory_employeeId_idx" ON "AssetAssignmentHistory"("employeeId");

-- CreateIndex
CREATE INDEX "AssetMaintenance_assetId_idx" ON "AssetMaintenance"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetDisposal_assetId_key" ON "AssetDisposal"("assetId");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_institutionId_idx" ON "PurchaseRequisition"("institutionId");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_requestedByEmployeeId_idx" ON "PurchaseRequisition"("requestedByEmployeeId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequisition_institutionId_requisitionNumber_key" ON "PurchaseRequisition"("institutionId", "requisitionNumber");

-- CreateIndex
CREATE INDEX "PurchaseRequisitionItem_requisitionId_idx" ON "PurchaseRequisitionItem"("requisitionId");

-- CreateIndex
CREATE INDEX "RequestForQuotation_institutionId_idx" ON "RequestForQuotation"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestForQuotation_institutionId_rfqNumber_key" ON "RequestForQuotation"("institutionId", "rfqNumber");

-- CreateIndex
CREATE INDEX "VendorQuotation_institutionId_idx" ON "VendorQuotation"("institutionId");

-- CreateIndex
CREATE INDEX "VendorQuotation_vendorId_idx" ON "VendorQuotation"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorQuotation_institutionId_vendorId_quotationNumber_key" ON "VendorQuotation"("institutionId", "vendorId", "quotationNumber");

-- CreateIndex
CREATE INDEX "VendorQuotationItem_quotationId_idx" ON "VendorQuotationItem"("quotationId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_institutionId_idx" ON "PurchaseOrder"("institutionId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_vendorId_idx" ON "PurchaseOrder"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_institutionId_poNumber_key" ON "PurchaseOrder"("institutionId", "poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_poId_idx" ON "PurchaseOrderItem"("poId");

-- CreateIndex
CREATE INDEX "GoodsReceiptNote_institutionId_idx" ON "GoodsReceiptNote"("institutionId");

-- CreateIndex
CREATE INDEX "GoodsReceiptNote_poId_idx" ON "GoodsReceiptNote"("poId");

-- CreateIndex
CREATE INDEX "GoodsReceiptNote_warehouseId_idx" ON "GoodsReceiptNote"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceiptNote_institutionId_grnNumber_key" ON "GoodsReceiptNote"("institutionId", "grnNumber");

-- CreateIndex
CREATE INDEX "GoodsReceiptItem_grnId_idx" ON "GoodsReceiptItem"("grnId");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_institutionId_idx" ON "MaintenanceRequest"("institutionId");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_campusId_idx" ON "MaintenanceRequest"("campusId");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_status_idx" ON "MaintenanceRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceRequest_institutionId_ticketNumber_key" ON "MaintenanceRequest"("institutionId", "ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceWorkOrder_requestId_key" ON "MaintenanceWorkOrder"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceWorkOrder_workOrderNumber_key" ON "MaintenanceWorkOrder"("workOrderNumber");

-- CreateIndex
CREATE INDEX "MaintenanceWorkOrder_requestId_idx" ON "MaintenanceWorkOrder"("requestId");

-- CreateIndex
CREATE INDEX "VisitorRecord_institutionId_idx" ON "VisitorRecord"("institutionId");

-- CreateIndex
CREATE INDEX "VisitorRecord_campusId_idx" ON "VisitorRecord"("campusId");

-- CreateIndex
CREATE INDEX "VisitorRecord_status_idx" ON "VisitorRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "VisitorRecord_institutionId_passNumber_key" ON "VisitorRecord"("institutionId", "passNumber");

-- CreateIndex
CREATE INDEX "StudentPickupAuthorization_institutionId_idx" ON "StudentPickupAuthorization"("institutionId");

-- CreateIndex
CREATE INDEX "StudentPickupAuthorization_studentId_idx" ON "StudentPickupAuthorization"("studentId");

-- CreateIndex
CREATE INDEX "VehicleGateLog_institutionId_idx" ON "VehicleGateLog"("institutionId");

-- CreateIndex
CREATE INDEX "VehicleGateLog_campusId_idx" ON "VehicleGateLog"("campusId");

-- CreateIndex
CREATE INDEX "FacilityBooking_institutionId_idx" ON "FacilityBooking"("institutionId");

-- CreateIndex
CREATE INDEX "FacilityBooking_campusId_idx" ON "FacilityBooking"("campusId");

-- CreateIndex
CREATE INDEX "FacilityBooking_bookingDate_idx" ON "FacilityBooking"("bookingDate");

-- CreateIndex
CREATE INDEX "FacilityBooking_status_idx" ON "FacilityBooking"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FacilityBooking_institutionId_bookingNumber_key" ON "FacilityBooking"("institutionId", "bookingNumber");

-- CreateIndex
CREATE INDEX "LmsCourse_institutionId_campusId_idx" ON "LmsCourse"("institutionId", "campusId");

-- CreateIndex
CREATE INDEX "LmsCourse_classId_sectionId_subjectId_idx" ON "LmsCourse"("classId", "sectionId", "subjectId");

-- CreateIndex
CREATE INDEX "LmsCourse_courseOfferingId_idx" ON "LmsCourse"("courseOfferingId");

-- CreateIndex
CREATE INDEX "LmsCourse_primaryTeacherId_idx" ON "LmsCourse"("primaryTeacherId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsCourse_institutionId_code_key" ON "LmsCourse"("institutionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "LmsSyllabus_courseId_key" ON "LmsSyllabus"("courseId");

-- CreateIndex
CREATE INDEX "LmsLearningOutcome_courseId_idx" ON "LmsLearningOutcome"("courseId");

-- CreateIndex
CREATE INDEX "LmsModule_courseId_sequenceOrder_idx" ON "LmsModule"("courseId", "sequenceOrder");

-- CreateIndex
CREATE INDEX "LmsLesson_moduleId_sequenceOrder_idx" ON "LmsLesson"("moduleId", "sequenceOrder");

-- CreateIndex
CREATE INDEX "LmsLessonProgress_studentId_idx" ON "LmsLessonProgress"("studentId");

-- CreateIndex
CREATE INDEX "LmsLessonProgress_lessonId_idx" ON "LmsLessonProgress"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsLessonProgress_studentId_lessonId_key" ON "LmsLessonProgress"("studentId", "lessonId");

-- CreateIndex
CREATE INDEX "LmsCourseProgress_studentId_idx" ON "LmsCourseProgress"("studentId");

-- CreateIndex
CREATE INDEX "LmsCourseProgress_courseId_idx" ON "LmsCourseProgress"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsCourseProgress_studentId_courseId_key" ON "LmsCourseProgress"("studentId", "courseId");

-- CreateIndex
CREATE INDEX "LmsCourseAnnouncement_courseId_idx" ON "LmsCourseAnnouncement"("courseId");

-- CreateIndex
CREATE INDEX "LmsHomework_courseId_dueDate_idx" ON "LmsHomework"("courseId", "dueDate");

-- CreateIndex
CREATE INDEX "LmsHomeworkSubmission_homeworkId_idx" ON "LmsHomeworkSubmission"("homeworkId");

-- CreateIndex
CREATE INDEX "LmsHomeworkSubmission_studentId_idx" ON "LmsHomeworkSubmission"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsHomeworkSubmission_homeworkId_studentId_key" ON "LmsHomeworkSubmission"("homeworkId", "studentId");

-- CreateIndex
CREATE INDEX "LmsAssignment_courseId_dueDate_idx" ON "LmsAssignment"("courseId", "dueDate");

-- CreateIndex
CREATE INDEX "LmsRubric_institutionId_idx" ON "LmsRubric"("institutionId");

-- CreateIndex
CREATE INDEX "LmsRubricCriterion_rubricId_idx" ON "LmsRubricCriterion"("rubricId");

-- CreateIndex
CREATE INDEX "LmsRubricLevel_criterionId_idx" ON "LmsRubricLevel"("criterionId");

-- CreateIndex
CREATE INDEX "LmsAssignmentSubmission_assignmentId_idx" ON "LmsAssignmentSubmission"("assignmentId");

-- CreateIndex
CREATE INDEX "LmsAssignmentSubmission_studentId_idx" ON "LmsAssignmentSubmission"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsAssignmentSubmission_assignmentId_studentId_attemptNumbe_key" ON "LmsAssignmentSubmission"("assignmentId", "studentId", "attemptNumber");

-- CreateIndex
CREATE INDEX "LmsQuestionBank_institutionId_questionType_difficulty_idx" ON "LmsQuestionBank"("institutionId", "questionType", "difficulty");

-- CreateIndex
CREATE INDEX "LmsQuestionBank_subjectId_topic_idx" ON "LmsQuestionBank"("subjectId", "topic");

-- CreateIndex
CREATE INDEX "LmsQuiz_courseId_closeTime_idx" ON "LmsQuiz"("courseId", "closeTime");

-- CreateIndex
CREATE INDEX "LmsQuizQuestion_quizId_sequenceOrder_idx" ON "LmsQuizQuestion"("quizId", "sequenceOrder");

-- CreateIndex
CREATE INDEX "LmsQuizAttempt_quizId_idx" ON "LmsQuizAttempt"("quizId");

-- CreateIndex
CREATE INDEX "LmsQuizAttempt_studentId_idx" ON "LmsQuizAttempt"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsQuizAttempt_quizId_studentId_attemptNumber_key" ON "LmsQuizAttempt"("quizId", "studentId", "attemptNumber");

-- CreateIndex
CREATE INDEX "LmsQuizResponse_attemptId_idx" ON "LmsQuizResponse"("attemptId");

-- CreateIndex
CREATE INDEX "LmsQuizResponse_questionId_idx" ON "LmsQuizResponse"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsQuizResponse_attemptId_questionId_key" ON "LmsQuizResponse"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "LmsOnlineClass_courseId_classDate_idx" ON "LmsOnlineClass"("courseId", "classDate");

-- CreateIndex
CREATE INDEX "LmsOnlineClassAttendance_onlineClassId_idx" ON "LmsOnlineClassAttendance"("onlineClassId");

-- CreateIndex
CREATE INDEX "LmsOnlineClassAttendance_studentId_idx" ON "LmsOnlineClassAttendance"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsOnlineClassAttendance_onlineClassId_studentId_key" ON "LmsOnlineClassAttendance"("onlineClassId", "studentId");

-- CreateIndex
CREATE INDEX "LmsDiscussion_courseId_idx" ON "LmsDiscussion"("courseId");

-- CreateIndex
CREATE INDEX "LmsDiscussionPost_discussionId_idx" ON "LmsDiscussionPost"("discussionId");

-- CreateIndex
CREATE INDEX "LmsDiscussionPost_parentPostId_idx" ON "LmsDiscussionPost"("parentPostId");

-- CreateIndex
CREATE INDEX "LmsGradebookItem_courseId_idx" ON "LmsGradebookItem"("courseId");

-- CreateIndex
CREATE INDEX "LmsGradebookScore_gradebookItemId_idx" ON "LmsGradebookScore"("gradebookItemId");

-- CreateIndex
CREATE INDEX "LmsGradebookScore_studentId_idx" ON "LmsGradebookScore"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "LmsGradebookScore_gradebookItemId_studentId_key" ON "LmsGradebookScore"("gradebookItemId", "studentId");

-- CreateIndex
CREATE INDEX "LmsLearningActivityLog_institutionId_studentId_idx" ON "LmsLearningActivityLog"("institutionId", "studentId");

-- CreateIndex
CREATE INDEX "LmsLearningActivityLog_courseId_activityType_idx" ON "LmsLearningActivityLog"("courseId", "activityType");

-- CreateIndex
CREATE UNIQUE INDEX "ReportingDataset_code_key" ON "ReportingDataset"("code");

-- CreateIndex
CREATE INDEX "ReportingField_datasetId_idx" ON "ReportingField"("datasetId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportingField_datasetId_fieldKey_key" ON "ReportingField"("datasetId", "fieldKey");

-- CreateIndex
CREATE INDEX "ReportDefinition_institutionId_idx" ON "ReportDefinition"("institutionId");

-- CreateIndex
CREATE INDEX "ReportDefinition_datasetId_idx" ON "ReportDefinition"("datasetId");

-- CreateIndex
CREATE INDEX "ReportDefinition_ownerUserId_idx" ON "ReportDefinition"("ownerUserId");

-- CreateIndex
CREATE INDEX "ReportColumn_reportDefinitionId_idx" ON "ReportColumn"("reportDefinitionId");

-- CreateIndex
CREATE INDEX "ReportFilter_reportDefinitionId_idx" ON "ReportFilter"("reportDefinitionId");

-- CreateIndex
CREATE INDEX "ReportSort_reportDefinitionId_idx" ON "ReportSort"("reportDefinitionId");

-- CreateIndex
CREATE INDEX "ReportGroup_reportDefinitionId_idx" ON "ReportGroup"("reportDefinitionId");

-- CreateIndex
CREATE INDEX "ReportCalculatedField_reportDefinitionId_idx" ON "ReportCalculatedField"("reportDefinitionId");

-- CreateIndex
CREATE INDEX "ReportExecution_institutionId_idx" ON "ReportExecution"("institutionId");

-- CreateIndex
CREATE INDEX "ReportExecution_reportDefinitionId_idx" ON "ReportExecution"("reportDefinitionId");

-- CreateIndex
CREATE INDEX "ReportExecution_executedByUserId_idx" ON "ReportExecution"("executedByUserId");

-- CreateIndex
CREATE INDEX "ReportSnapshot_institutionId_idx" ON "ReportSnapshot"("institutionId");

-- CreateIndex
CREATE INDEX "ReportSnapshot_reportDefinitionId_idx" ON "ReportSnapshot"("reportDefinitionId");

-- CreateIndex
CREATE INDEX "ReportExport_institutionId_idx" ON "ReportExport"("institutionId");

-- CreateIndex
CREATE INDEX "ReportExport_reportDefinitionId_idx" ON "ReportExport"("reportDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardDefinition_code_key" ON "DashboardDefinition"("code");

-- CreateIndex
CREATE INDEX "DashboardDefinition_institutionId_idx" ON "DashboardDefinition"("institutionId");

-- CreateIndex
CREATE INDEX "DashboardWidget_dashboardId_idx" ON "DashboardWidget"("dashboardId");

-- CreateIndex
CREATE INDEX "ReportSchedule_institutionId_idx" ON "ReportSchedule"("institutionId");

-- CreateIndex
CREATE INDEX "ReportSchedule_reportDefinitionId_idx" ON "ReportSchedule"("reportDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "RegulatoryAgency_code_key" ON "RegulatoryAgency"("code");

-- CreateIndex
CREATE INDEX "RegulatoryTemplate_agencyId_idx" ON "RegulatoryTemplate"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "RegulatoryTemplate_templateCode_version_key" ON "RegulatoryTemplate"("templateCode", "version");

-- CreateIndex
CREATE INDEX "RegulatoryTemplateField_templateId_idx" ON "RegulatoryTemplateField"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "RegulatoryTemplateField_templateId_fieldCode_key" ON "RegulatoryTemplateField"("templateId", "fieldCode");

-- CreateIndex
CREATE INDEX "RegulatoryFieldMapping_templateId_idx" ON "RegulatoryFieldMapping"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "RegulatoryFieldMapping_templateId_templateFieldId_key" ON "RegulatoryFieldMapping"("templateId", "templateFieldId");

-- CreateIndex
CREATE INDEX "RegulatoryReportRun_institutionId_idx" ON "RegulatoryReportRun"("institutionId");

-- CreateIndex
CREATE INDEX "RegulatoryReportRun_templateId_idx" ON "RegulatoryReportRun"("templateId");

-- CreateIndex
CREATE INDEX "RegulatoryValidationIssue_reportRunId_idx" ON "RegulatoryValidationIssue"("reportRunId");

-- CreateIndex
CREATE UNIQUE INDEX "RegulatorySubmissionRecord_reportRunId_key" ON "RegulatorySubmissionRecord"("reportRunId");

-- CreateIndex
CREATE UNIQUE INDEX "DataQualityRule_ruleCode_key" ON "DataQualityRule"("ruleCode");

-- CreateIndex
CREATE INDEX "DataQualityRule_institutionId_idx" ON "DataQualityRule"("institutionId");

-- CreateIndex
CREATE INDEX "DataQualityIssue_institutionId_idx" ON "DataQualityIssue"("institutionId");

-- CreateIndex
CREATE INDEX "DataQualityIssue_ruleId_idx" ON "DataQualityIssue"("ruleId");

-- AddForeignKey
ALTER TABLE "TenantDomain" ADD CONSTRAINT "TenantDomain_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanFeature" ADD CONSTRAINT "PlanFeature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageRecord" ADD CONSTRAINT "UsageRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Institution" ADD CONSTRAINT "Institution_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campus" ADD CONSTRAINT "Campus_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicGroup" ADD CONSTRAINT "AcademicGroup_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectCombinationTemplate" ADD CONSTRAINT "SubjectCombinationTemplate_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectCombinationTemplate" ADD CONSTRAINT "SubjectCombinationTemplate_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AcademicGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSubjectRegistration" ADD CONSTRAINT "StudentSubjectRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSubjectRegistration" ADD CONSTRAINT "StudentSubjectRegistration_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSubjectRegistration" ADD CONSTRAINT "StudentSubjectRegistration_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curriculum" ADD CONSTRAINT "Curriculum_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curriculum" ADD CONSTRAINT "Curriculum_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumVersion" ADD CONSTRAINT "CurriculumVersion_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "Curriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumCourse" ADD CONSTRAINT "CurriculumCourse_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculumCourse" ADD CONSTRAINT "CurriculumCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePrerequisite" ADD CONSTRAINT "CoursePrerequisite_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePrerequisite" ADD CONSTRAINT "CoursePrerequisite_prerequisiteCourseId_fkey" FOREIGN KEY ("prerequisiteCourseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardian" ADD CONSTRAINT "StudentGuardian_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardian" ADD CONSTRAINT "StudentGuardian_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_desiredClassId_fkey" FOREIGN KEY ("desiredClassId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_desiredProgramId_fkey" FOREIGN KEY ("desiredProgramId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionTest" ADD CONSTRAINT "AdmissionTest_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionTestAttempt" ADD CONSTRAINT "AdmissionTestAttempt_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "AdmissionApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionTestAttempt" ADD CONSTRAINT "AdmissionTestAttempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "AdmissionTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRegistration" ADD CONSTRAINT "CourseRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRegistration" ADD CONSTRAINT "CourseRegistration_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRegistration" ADD CONSTRAINT "CourseRegistration_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HifzDailyRecord" ADD CONSTRAINT "HifzDailyRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThesisRecord" ADD CONSTRAINT "ThesisRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchProject" ADD CONSTRAINT "ResearchProject_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_reportsToPositionId_fkey" FOREIGN KEY ("reportsToPositionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyProfile" ADD CONSTRAINT "FacultyProfile_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeQualification" ADD CONSTRAINT "EmployeeQualification_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeExperience" ADD CONSTRAINT "EmployeeExperience_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequisition" ADD CONSTRAINT "JobRequisition_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequisition" ADD CONSTRAINT "JobRequisition_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobVacancy" ADD CONSTRAINT "JobVacancy_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobVacancy" ADD CONSTRAINT "JobVacancy_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobVacancy" ADD CONSTRAINT "JobVacancy_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobVacancy" ADD CONSTRAINT "JobVacancy_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCandidate" ADD CONSTRAINT "JobCandidate_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCandidate" ADD CONSTRAINT "JobCandidate_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "JobVacancy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCandidate" ADD CONSTRAINT "JobCandidate_convertedEmployeeId_fkey" FOREIGN KEY ("convertedEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateInterview" ADD CONSTRAINT "CandidateInterview_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "JobCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "JobCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeOnboarding" ADD CONSTRAINT "EmployeeOnboarding_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentContract" ADD CONSTRAINT "EmploymentContract_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeBankAccount" ADD CONSTRAINT "EmployeeBankAccount_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrShift" ADD CONSTRAINT "HrShift_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeRoster" ADD CONSTRAINT "EmployeeRoster_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeRoster" ADD CONSTRAINT "EmployeeRoster_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "HrShift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeRawPunch" ADD CONSTRAINT "EmployeeRawPunch_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeRawPunch" ADD CONSTRAINT "EmployeeRawPunch_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDailyAttendance" ADD CONSTRAINT "EmployeeDailyAttendance_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDailyAttendance" ADD CONSTRAINT "EmployeeDailyAttendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDailyAttendance" ADD CONSTRAINT "EmployeeDailyAttendance_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "HrShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceCorrectionRequest" ADD CONSTRAINT "AttendanceCorrectionRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimeRequest" ADD CONSTRAINT "OvertimeRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrLeaveType" ADD CONSTRAINT "HrLeaveType_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrLeavePolicy" ADD CONSTRAINT "HrLeavePolicy_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrLeavePolicy" ADD CONSTRAINT "HrLeavePolicy_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "HrLeaveType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLeaveBalance" ADD CONSTRAINT "EmployeeLeaveBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLeaveBalance" ADD CONSTRAINT "EmployeeLeaveBalance_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "HrLeaveType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLeaveLedger" ADD CONSTRAINT "EmployeeLeaveLedger_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLeaveLedger" ADD CONSTRAINT "EmployeeLeaveLedger_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "HrLeaveType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLeaveApplication" ADD CONSTRAINT "EmployeeLeaveApplication_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLeaveApplication" ADD CONSTRAINT "EmployeeLeaveApplication_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "HrLeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePromotionHistory" ADD CONSTRAINT "EmployeePromotionHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTransferHistory" ADD CONSTRAINT "EmployeeTransferHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeIncrementRequest" ADD CONSTRAINT "EmployeeIncrementRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeAdditionalDuty" ADD CONSTRAINT "EmployeeAdditionalDuty_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSkill" ADD CONSTRAINT "EmployeeSkill_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceCycle" ADD CONSTRAINT "PerformanceCycle_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeGoal" ADD CONSTRAINT "EmployeeGoal_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeGoal" ADD CONSTRAINT "EmployeeGoal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "PerformanceCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePerformanceReview" ADD CONSTRAINT "EmployeePerformanceReview_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePerformanceReview" ADD CONSTRAINT "EmployeePerformanceReview_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "PerformanceCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingProgram" ADD CONSTRAINT "TrainingProgram_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTrainingEnrollment" ADD CONSTRAINT "EmployeeTrainingEnrollment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTrainingEnrollment" ADD CONSTRAINT "EmployeeTrainingEnrollment_trainingProgramId_fkey" FOREIGN KEY ("trainingProgramId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDisciplinaryCase" ADD CONSTRAINT "EmployeeDisciplinaryCase_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDisciplinaryCase" ADD CONSTRAINT "EmployeeDisciplinaryCase_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeWarning" ADD CONSTRAINT "EmployeeWarning_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeGrievance" ADD CONSTRAINT "EmployeeGrievance_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeGrievance" ADD CONSTRAINT "EmployeeGrievance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSeparation" ADD CONSTRAINT "EmployeeSeparation_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSeparation" ADD CONSTRAINT "EmployeeSeparation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeExitClearance" ADD CONSTRAINT "EmployeeExitClearance_separationId_fkey" FOREIGN KEY ("separationId") REFERENCES "EmployeeSeparation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRecord" ADD CONSTRAINT "PayrollRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRecord" ADD CONSTRAINT "PayrollRecord_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "PayrollPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Period" ADD CONSTRAINT "Period_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Period" ADD CONSTRAINT "Period_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAvailability" ADD CONSTRAINT "TeacherAvailability_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAvailability" ADD CONSTRAINT "TeacherAvailability_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnologyTrade" ADD CONSTRAINT "TechnologyTrade_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopLogEntry" ADD CONSTRAINT "WorkshopLogEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustrialAttachment" ADD CONSTRAINT "IndustrialAttachment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicCalendarEvent" ADD CONSTRAINT "AcademicCalendarEvent_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentComponent" ADD CONSTRAINT "AssessmentComponent_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkDistributionTemplate" ADD CONSTRAINT "MarkDistributionTemplate_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_targetClassId_fkey" FOREIGN KEY ("targetClassId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_targetProgramId_fkey" FOREIGN KEY ("targetProgramId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamEligibility" ADD CONSTRAINT "ExamEligibility_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamEligibility" ADD CONSTRAINT "ExamEligibility_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarksEntry" ADD CONSTRAINT "MarksEntry_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarksEntry" ADD CONSTRAINT "MarksEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarksEntry" ADD CONSTRAINT "MarksEntry_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarksEntry" ADD CONSTRAINT "MarksEntry_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkAuditLog" ADD CONSTRAINT "MarkAuditLog_marksEntryId_fkey" FOREIGN KEY ("marksEntryId") REFERENCES "MarksEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingScale" ADD CONSTRAINT "GradingScale_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResultSnapshot" ADD CONSTRAINT "ExamResultSnapshot_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResultSnapshot" ADD CONSTRAINT "ExamResultSnapshot_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialTranscript" ADD CONSTRAINT "OfficialTranscript_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficialTranscript" ADD CONSTRAINT "OfficialTranscript_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionBatch" ADD CONSTRAINT "PromotionBatch_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionBatch" ADD CONSTRAINT "PromotionBatch_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPromotionRecord" ADD CONSTRAINT "StudentPromotionRecord_promotionBatchId_fkey" FOREIGN KEY ("promotionBatchId") REFERENCES "PromotionBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPromotionRecord" ADD CONSTRAINT "StudentPromotionRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraduationRecord" ADD CONSTRAINT "GraduationRecord_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraduationRecord" ADD CONSTRAINT "GraduationRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraduationRecord" ADD CONSTRAINT "GraduationRecord_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalYear" ADD CONSTRAINT "FiscalYear_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalPeriod" ADD CONSTRAINT "FiscalPeriod_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalPeriod" ADD CONSTRAINT "FiscalPeriod_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartOfAccount" ADD CONSTRAINT "ChartOfAccount_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartOfAccount" ADD CONSTRAINT "ChartOfAccount_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ChartOfAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostCenter" ADD CONSTRAINT "CostCenter_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fund" ADD CONSTRAINT "Fund_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountMapping" ADD CONSTRAINT "AccountMapping_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_fiscalPeriodId_fkey" FOREIGN KEY ("fiscalPeriodId") REFERENCES "FiscalPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartOfAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeType" ADD CONSTRAINT "FeeType_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_feeTypeId_fkey" FOREIGN KEY ("feeTypeId") REFERENCES "FeeType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LateFeeRule" ADD CONSTRAINT "LateFeeRule_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LateFeeRule" ADD CONSTRAINT "LateFeeRule_feeTypeId_fkey" FOREIGN KEY ("feeTypeId") REFERENCES "FeeType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipMaster" ADD CONSTRAINT "ScholarshipMaster_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipApplication" ADD CONSTRAINT "ScholarshipApplication_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipApplication" ADD CONSTRAINT "ScholarshipApplication_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "ScholarshipMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipApplication" ADD CONSTRAINT "ScholarshipApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipAward" ADD CONSTRAINT "ScholarshipAward_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipAward" ADD CONSTRAINT "ScholarshipAward_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "ScholarshipMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipAward" ADD CONSTRAINT "ScholarshipAward_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipAward" ADD CONSTRAINT "ScholarshipAward_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ScholarshipApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeWaiver" ADD CONSTRAINT "FeeWaiver_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeWaiver" ADD CONSTRAINT "FeeWaiver_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "PaymentTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCreditBalance" ADD CONSTRAINT "StudentCreditBalance_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCreditBalance" ADD CONSTRAINT "StudentCreditBalance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCreditTransaction" ADD CONSTRAINT "StudentCreditTransaction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionBankAccount" ADD CONSTRAINT "InstitutionBankAccount_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChequeRecord" ADD CONSTRAINT "ChequeRecord_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChequeRecord" ADD CONSTRAINT "ChequeRecord_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "InstitutionBankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChequeRecord" ADD CONSTRAINT "ChequeRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChequeRecord" ADD CONSTRAINT "ChequeRecord_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankReconciliation" ADD CONSTRAINT "BankReconciliation_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankReconciliation" ADD CONSTRAINT "BankReconciliation_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "InstitutionBankAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseRequest" ADD CONSTRAINT "ExpenseRequest_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseRequest" ADD CONSTRAINT "ExpenseRequest_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ChartOfAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetRevisionLog" ADD CONSTRAINT "BudgetRevisionLog_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetRevisionLog" ADD CONSTRAINT "BudgetRevisionLog_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructure" ADD CONSTRAINT "SalaryStructure_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalaryAssignment" ADD CONSTRAINT "EmployeeSalaryAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalaryAssignment" ADD CONSTRAINT "EmployeeSalaryAssignment_salaryStructureId_fkey" FOREIGN KEY ("salaryStructureId") REFERENCES "SalaryStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollPeriod" ADD CONSTRAINT "PayrollPeriod_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLoan" ADD CONSTRAINT "EmployeeLoan_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLoan" ADD CONSTRAINT "EmployeeLoan_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryAdvance" ADD CONSTRAINT "SalaryAdvance_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryAdvance" ADD CONSTRAINT "SalaryAdvance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hostel" ADD CONSTRAINT "Hostel_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetRecord" ADD CONSTRAINT "AssetRecord_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplineRecord" ADD CONSTRAINT "DisciplineRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Library" ADD CONSTRAINT "Library_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Library" ADD CONSTRAINT "Library_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryCatalog" ADD CONSTRAINT "LibraryCatalog_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryCatalog" ADD CONSTRAINT "LibraryCatalog_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryCopy" ADD CONSTRAINT "LibraryCopy_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "LibraryCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryBorrowingPolicy" ADD CONSTRAINT "LibraryBorrowingPolicy_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryMember" ADD CONSTRAINT "LibraryMember_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryMember" ADD CONSTRAINT "LibraryMember_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryMember" ADD CONSTRAINT "LibraryMember_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryMember" ADD CONSTRAINT "LibraryMember_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "LibraryBorrowingPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookIssue" ADD CONSTRAINT "BookIssue_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookIssue" ADD CONSTRAINT "BookIssue_copyId_fkey" FOREIGN KEY ("copyId") REFERENCES "LibraryCopy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookIssue" ADD CONSTRAINT "BookIssue_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LibraryMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookReservation" ADD CONSTRAINT "BookReservation_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookReservation" ADD CONSTRAINT "BookReservation_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "LibraryCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookReservation" ADD CONSTRAINT "BookReservation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LibraryMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryStocktake" ADD CONSTRAINT "LibraryStocktake_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryStocktake" ADD CONSTRAINT "LibraryStocktake_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelMaster" ADD CONSTRAINT "HostelMaster_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelMaster" ADD CONSTRAINT "HostelMaster_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelBlock" ADD CONSTRAINT "HostelBlock_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "HostelMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelRoom" ADD CONSTRAINT "HostelRoom_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "HostelMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelRoom" ADD CONSTRAINT "HostelRoom_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "HostelBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelBed" ADD CONSTRAINT "HostelBed_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "HostelRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelApplication" ADD CONSTRAINT "HostelApplication_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelApplication" ADD CONSTRAINT "HostelApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelApplication" ADD CONSTRAINT "HostelApplication_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "HostelMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAllocation" ADD CONSTRAINT "HostelAllocation_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAllocation" ADD CONSTRAINT "HostelAllocation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAllocation" ADD CONSTRAINT "HostelAllocation_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "HostelBed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelCheckIn" ADD CONSTRAINT "HostelCheckIn_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "HostelAllocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelTransferHistory" ADD CONSTRAINT "HostelTransferHistory_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "HostelAllocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelTransferHistory" ADD CONSTRAINT "HostelTransferHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelVisitorLog" ADD CONSTRAINT "HostelVisitorLog_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelVisitorLog" ADD CONSTRAINT "HostelVisitorLog_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "HostelMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAttendance" ADD CONSTRAINT "HostelAttendance_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "HostelMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAttendance" ADD CONSTRAINT "HostelAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportVehicle" ADD CONSTRAINT "TransportVehicle_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportVehicle" ADD CONSTRAINT "TransportVehicle_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportVehicle" ADD CONSTRAINT "TransportVehicle_assignedDriverId_fkey" FOREIGN KEY ("assignedDriverId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportRoute" ADD CONSTRAINT "TransportRoute_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportRoute" ADD CONSTRAINT "TransportRoute_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportSubscription" ADD CONSTRAINT "TransportSubscription_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportSubscription" ADD CONSTRAINT "TransportSubscription_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportSubscription" ADD CONSTRAINT "TransportSubscription_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportSubscription" ADD CONSTRAINT "TransportSubscription_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "TransportVehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportSubscription" ADD CONSTRAINT "TransportSubscription_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportSubscription" ADD CONSTRAINT "TransportSubscription_pickupStopId_fkey" FOREIGN KEY ("pickupStopId") REFERENCES "RouteStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportSubscription" ADD CONSTRAINT "TransportSubscription_dropStopId_fkey" FOREIGN KEY ("dropStopId") REFERENCES "RouteStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripSchedule" ADD CONSTRAINT "TripSchedule_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripSchedule" ADD CONSTRAINT "TripSchedule_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripSchedule" ADD CONSTRAINT "TripSchedule_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "TransportVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportBoardingEvent" ADD CONSTRAINT "TransportBoardingEvent_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "TripSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportBoardingEvent" ADD CONSTRAINT "TransportBoardingEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "TransportSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpsTelemetryRecord" ADD CONSTRAINT "GpsTelemetryRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "TransportVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportIncident" ADD CONSTRAINT "TransportIncident_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportIncident" ADD CONSTRAINT "TransportIncident_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "TransportVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportIncident" ADD CONSTRAINT "TransportIncident_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelLog" ADD CONSTRAINT "FuelLog_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelLog" ADD CONSTRAINT "FuelLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "TransportVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMaintenanceRecord" ADD CONSTRAINT "VehicleMaintenanceRecord_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMaintenanceRecord" ADD CONSTRAINT "VehicleMaintenanceRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "TransportVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Canteen" ADD CONSTRAINT "Canteen_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Canteen" ADD CONSTRAINT "Canteen_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Canteen" ADD CONSTRAINT "Canteen_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenItem" ADD CONSTRAINT "CanteenItem_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenItem" ADD CONSTRAINT "CanteenItem_canteenId_fkey" FOREIGN KEY ("canteenId") REFERENCES "Canteen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenItem" ADD CONSTRAINT "CanteenItem_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenMenu" ADD CONSTRAINT "CanteenMenu_canteenId_fkey" FOREIGN KEY ("canteenId") REFERENCES "Canteen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenWallet" ADD CONSTRAINT "CanteenWallet_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenWallet" ADD CONSTRAINT "CanteenWallet_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenWallet" ADD CONSTRAINT "CanteenWallet_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenWalletLedger" ADD CONSTRAINT "CanteenWalletLedger_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "CanteenWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenSpendingLimit" ADD CONSTRAINT "CanteenSpendingLimit_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "CanteenWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenPosSale" ADD CONSTRAINT "CanteenPosSale_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenPosSale" ADD CONSTRAINT "CanteenPosSale_canteenId_fkey" FOREIGN KEY ("canteenId") REFERENCES "Canteen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenSaleItem" ADD CONSTRAINT "CanteenSaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "CanteenPosSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanteenSaleItem" ADD CONSTRAINT "CanteenSaleItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CanteenItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryCategory" ADD CONSTRAINT "InventoryCategory_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "InventoryCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLedger" ADD CONSTRAINT "StockLedger_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLedger" ADD CONSTRAINT "StockLedger_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLedger" ADD CONSTRAINT "StockLedger_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "StockTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockIssueRecord" ADD CONSTRAINT "StockIssueRecord_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockIssueRecord" ADD CONSTRAINT "StockIssueRecord_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockIssueItem" ADD CONSTRAINT "StockIssueItem_issueRecordId_fkey" FOREIGN KEY ("issueRecordId") REFERENCES "StockIssueRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockIssueItem" ADD CONSTRAINT "StockIssueItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedAsset" ADD CONSTRAINT "FixedAsset_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedAsset" ADD CONSTRAINT "FixedAsset_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedAsset" ADD CONSTRAINT "FixedAsset_supplierVendorId_fkey" FOREIGN KEY ("supplierVendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedAsset" ADD CONSTRAINT "FixedAsset_currentCustodianEmployeeId_fkey" FOREIGN KEY ("currentCustodianEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignmentHistory" ADD CONSTRAINT "AssetAssignmentHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "FixedAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignmentHistory" ADD CONSTRAINT "AssetAssignmentHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "FixedAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDisposal" ADD CONSTRAINT "AssetDisposal_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "FixedAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisition" ADD CONSTRAINT "PurchaseRequisition_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisition" ADD CONSTRAINT "PurchaseRequisition_requestedByEmployeeId_fkey" FOREIGN KEY ("requestedByEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisitionItem" ADD CONSTRAINT "PurchaseRequisitionItem_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "PurchaseRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisitionItem" ADD CONSTRAINT "PurchaseRequisitionItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestForQuotation" ADD CONSTRAINT "RequestForQuotation_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestForQuotation" ADD CONSTRAINT "RequestForQuotation_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "PurchaseRequisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorQuotation" ADD CONSTRAINT "VendorQuotation_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RequestForQuotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorQuotation" ADD CONSTRAINT "VendorQuotation_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorQuotation" ADD CONSTRAINT "VendorQuotation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorQuotationItem" ADD CONSTRAINT "VendorQuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "VendorQuotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "PurchaseRequisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "VendorQuotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNote" ADD CONSTRAINT "GoodsReceiptNote_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNote" ADD CONSTRAINT "GoodsReceiptNote_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNote" ADD CONSTRAINT "GoodsReceiptNote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNote" ADD CONSTRAINT "GoodsReceiptNote_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "GoodsReceiptNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_poItemId_fkey" FOREIGN KEY ("poItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceWorkOrder" ADD CONSTRAINT "MaintenanceWorkOrder_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaintenanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorRecord" ADD CONSTRAINT "VisitorRecord_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorRecord" ADD CONSTRAINT "VisitorRecord_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPickupAuthorization" ADD CONSTRAINT "StudentPickupAuthorization_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPickupAuthorization" ADD CONSTRAINT "StudentPickupAuthorization_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleGateLog" ADD CONSTRAINT "VehicleGateLog_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleGateLog" ADD CONSTRAINT "VehicleGateLog_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityBooking" ADD CONSTRAINT "FacilityBooking_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityBooking" ADD CONSTRAINT "FacilityBooking_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityBooking" ADD CONSTRAINT "FacilityBooking_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsCourse" ADD CONSTRAINT "LmsCourse_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsCourse" ADD CONSTRAINT "LmsCourse_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsCourse" ADD CONSTRAINT "LmsCourse_primaryTeacherId_fkey" FOREIGN KEY ("primaryTeacherId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsSyllabus" ADD CONSTRAINT "LmsSyllabus_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsLearningOutcome" ADD CONSTRAINT "LmsLearningOutcome_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsModule" ADD CONSTRAINT "LmsModule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsLesson" ADD CONSTRAINT "LmsLesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "LmsModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsLessonProgress" ADD CONSTRAINT "LmsLessonProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsLessonProgress" ADD CONSTRAINT "LmsLessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "LmsLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsCourseProgress" ADD CONSTRAINT "LmsCourseProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsCourseProgress" ADD CONSTRAINT "LmsCourseProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsCourseAnnouncement" ADD CONSTRAINT "LmsCourseAnnouncement_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsHomework" ADD CONSTRAINT "LmsHomework_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsHomeworkSubmission" ADD CONSTRAINT "LmsHomeworkSubmission_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "LmsHomework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsHomeworkSubmission" ADD CONSTRAINT "LmsHomeworkSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsAssignment" ADD CONSTRAINT "LmsAssignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsAssignment" ADD CONSTRAINT "LmsAssignment_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "LmsRubric"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsRubric" ADD CONSTRAINT "LmsRubric_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsRubricCriterion" ADD CONSTRAINT "LmsRubricCriterion_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "LmsRubric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsRubricLevel" ADD CONSTRAINT "LmsRubricLevel_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "LmsRubricCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsAssignmentSubmission" ADD CONSTRAINT "LmsAssignmentSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "LmsAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsAssignmentSubmission" ADD CONSTRAINT "LmsAssignmentSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsAssignmentSubmission" ADD CONSTRAINT "LmsAssignmentSubmission_gradedByEmployeeId_fkey" FOREIGN KEY ("gradedByEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsQuestionBank" ADD CONSTRAINT "LmsQuestionBank_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsQuiz" ADD CONSTRAINT "LmsQuiz_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsQuizQuestion" ADD CONSTRAINT "LmsQuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "LmsQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsQuizQuestion" ADD CONSTRAINT "LmsQuizQuestion_questionBankId_fkey" FOREIGN KEY ("questionBankId") REFERENCES "LmsQuestionBank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsQuizAttempt" ADD CONSTRAINT "LmsQuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "LmsQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsQuizAttempt" ADD CONSTRAINT "LmsQuizAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsQuizResponse" ADD CONSTRAINT "LmsQuizResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "LmsQuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsQuizResponse" ADD CONSTRAINT "LmsQuizResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "LmsQuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsOnlineClass" ADD CONSTRAINT "LmsOnlineClass_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsOnlineClass" ADD CONSTRAINT "LmsOnlineClass_teacherEmployeeId_fkey" FOREIGN KEY ("teacherEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsOnlineClassAttendance" ADD CONSTRAINT "LmsOnlineClassAttendance_onlineClassId_fkey" FOREIGN KEY ("onlineClassId") REFERENCES "LmsOnlineClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsOnlineClassAttendance" ADD CONSTRAINT "LmsOnlineClassAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsDiscussion" ADD CONSTRAINT "LmsDiscussion_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsDiscussionPost" ADD CONSTRAINT "LmsDiscussionPost_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "LmsDiscussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsDiscussionPost" ADD CONSTRAINT "LmsDiscussionPost_parentPostId_fkey" FOREIGN KEY ("parentPostId") REFERENCES "LmsDiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsGradebookItem" ADD CONSTRAINT "LmsGradebookItem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LmsCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsGradebookScore" ADD CONSTRAINT "LmsGradebookScore_gradebookItemId_fkey" FOREIGN KEY ("gradebookItemId") REFERENCES "LmsGradebookItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsGradebookScore" ADD CONSTRAINT "LmsGradebookScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsLearningActivityLog" ADD CONSTRAINT "LmsLearningActivityLog_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LmsLearningActivityLog" ADD CONSTRAINT "LmsLearningActivityLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportingField" ADD CONSTRAINT "ReportingField_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "ReportingDataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportDefinition" ADD CONSTRAINT "ReportDefinition_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportDefinition" ADD CONSTRAINT "ReportDefinition_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportDefinition" ADD CONSTRAINT "ReportDefinition_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "ReportingDataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportColumn" ADD CONSTRAINT "ReportColumn_reportDefinitionId_fkey" FOREIGN KEY ("reportDefinitionId") REFERENCES "ReportDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportFilter" ADD CONSTRAINT "ReportFilter_reportDefinitionId_fkey" FOREIGN KEY ("reportDefinitionId") REFERENCES "ReportDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSort" ADD CONSTRAINT "ReportSort_reportDefinitionId_fkey" FOREIGN KEY ("reportDefinitionId") REFERENCES "ReportDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportGroup" ADD CONSTRAINT "ReportGroup_reportDefinitionId_fkey" FOREIGN KEY ("reportDefinitionId") REFERENCES "ReportDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCalculatedField" ADD CONSTRAINT "ReportCalculatedField_reportDefinitionId_fkey" FOREIGN KEY ("reportDefinitionId") REFERENCES "ReportDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExecution" ADD CONSTRAINT "ReportExecution_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExecution" ADD CONSTRAINT "ReportExecution_reportDefinitionId_fkey" FOREIGN KEY ("reportDefinitionId") REFERENCES "ReportDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSnapshot" ADD CONSTRAINT "ReportSnapshot_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSnapshot" ADD CONSTRAINT "ReportSnapshot_reportDefinitionId_fkey" FOREIGN KEY ("reportDefinitionId") REFERENCES "ReportDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExport" ADD CONSTRAINT "ReportExport_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExport" ADD CONSTRAINT "ReportExport_reportDefinitionId_fkey" FOREIGN KEY ("reportDefinitionId") REFERENCES "ReportDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardDefinition" ADD CONSTRAINT "DashboardDefinition_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardWidget" ADD CONSTRAINT "DashboardWidget_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "DashboardDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardWidget" ADD CONSTRAINT "DashboardWidget_reportDefinitionId_fkey" FOREIGN KEY ("reportDefinitionId") REFERENCES "ReportDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSchedule" ADD CONSTRAINT "ReportSchedule_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSchedule" ADD CONSTRAINT "ReportSchedule_reportDefinitionId_fkey" FOREIGN KEY ("reportDefinitionId") REFERENCES "ReportDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryTemplate" ADD CONSTRAINT "RegulatoryTemplate_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "RegulatoryAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryTemplateField" ADD CONSTRAINT "RegulatoryTemplateField_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RegulatoryTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryFieldMapping" ADD CONSTRAINT "RegulatoryFieldMapping_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RegulatoryTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryFieldMapping" ADD CONSTRAINT "RegulatoryFieldMapping_templateFieldId_fkey" FOREIGN KEY ("templateFieldId") REFERENCES "RegulatoryTemplateField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryReportRun" ADD CONSTRAINT "RegulatoryReportRun_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryReportRun" ADD CONSTRAINT "RegulatoryReportRun_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RegulatoryTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatoryValidationIssue" ADD CONSTRAINT "RegulatoryValidationIssue_reportRunId_fkey" FOREIGN KEY ("reportRunId") REFERENCES "RegulatoryReportRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegulatorySubmissionRecord" ADD CONSTRAINT "RegulatorySubmissionRecord_reportRunId_fkey" FOREIGN KEY ("reportRunId") REFERENCES "RegulatoryReportRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataQualityRule" ADD CONSTRAINT "DataQualityRule_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataQualityIssue" ADD CONSTRAINT "DataQualityIssue_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataQualityIssue" ADD CONSTRAINT "DataQualityIssue_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "DataQualityRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

