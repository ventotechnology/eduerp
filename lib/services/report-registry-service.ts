import { db } from '@/lib/db';
import { AppError } from '@/lib/errors/app-error';

export interface GovernedFieldDefinition {
  fieldKey: string;
  label: string;
  dataType: 'STRING' | 'NUMBER' | 'DECIMAL' | 'DATE' | 'DATETIME' | 'BOOLEAN' | 'ENUM' | 'CURRENCY' | 'PERCENTAGE';
  sourceModel: string;
  sourceField: string;
  isSortable?: boolean;
  isFilterable?: boolean;
  isGroupable?: boolean;
  allowAggregation?: boolean;
  classification?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  piiMaskingType?: 'NONE' | 'PHONE' | 'EMAIL' | 'NID' | 'BANK_ACCOUNT';
  requiredPermission?: string;
  isExportable?: boolean;
}

export interface GovernedDatasetDefinition {
  code: string;
  name: string;
  description: string;
  category: 'ACADEMIC' | 'FINANCE' | 'HR' | 'FACILITIES' | 'LMS' | 'GOVERNANCE' | 'PLATFORM';
  requiredPermission?: string;
  isPlatformDataset?: boolean;
  fields: GovernedFieldDefinition[];
}

export const GOVERNED_DATASETS: GovernedDatasetDefinition[] = [
  {
    code: 'STUDENTS',
    name: 'Students & SIS Master Catalog',
    description: 'Comprehensive student directory, demographics, admission records, and current academic status.',
    category: 'ACADEMIC',
    requiredPermission: 'STUDENTS:VIEW',
    fields: [
      { fieldKey: 'id', label: 'System ID', dataType: 'STRING', sourceModel: 'Student', sourceField: 'id' },
      { fieldKey: 'studentIdNumber', label: 'Student ID Number', dataType: 'STRING', sourceModel: 'Student', sourceField: 'studentIdNumber', isSortable: true, isFilterable: true, isGroupable: false },
      { fieldKey: 'admissionNumber', label: 'Admission Number', dataType: 'STRING', sourceModel: 'Student', sourceField: 'admissionNumber', isSortable: true, isFilterable: true },
      { fieldKey: 'firstName', label: 'First Name', dataType: 'STRING', sourceModel: 'Student', sourceField: 'firstName', isSortable: true, isFilterable: true },
      { fieldKey: 'lastName', label: 'Last Name', dataType: 'STRING', sourceModel: 'Student', sourceField: 'lastName', isSortable: true, isFilterable: true },
      { fieldKey: 'gender', label: 'Gender', dataType: 'ENUM', sourceModel: 'Student', sourceField: 'gender', isFilterable: true, isGroupable: true },
      { fieldKey: 'dateOfBirth', label: 'Date of Birth', dataType: 'DATE', sourceModel: 'Student', sourceField: 'dateOfBirth', isSortable: true, isFilterable: true },
      { fieldKey: 'bloodGroup', label: 'Blood Group', dataType: 'STRING', sourceModel: 'Student', sourceField: 'bloodGroup', isFilterable: true, isGroupable: true },
      { fieldKey: 'religion', label: 'Religion', dataType: 'STRING', sourceModel: 'Student', sourceField: 'religion', isFilterable: true, isGroupable: true },
      { fieldKey: 'phone', label: 'Phone Number', dataType: 'STRING', sourceModel: 'Student', sourceField: 'phone', classification: 'CONFIDENTIAL', piiMaskingType: 'PHONE' },
      { fieldKey: 'email', label: 'Email Address', dataType: 'STRING', sourceModel: 'Student', sourceField: 'email', classification: 'CONFIDENTIAL', piiMaskingType: 'EMAIL' },
      { fieldKey: 'status', label: 'Enrollment Status', dataType: 'ENUM', sourceModel: 'Student', sourceField: 'status', isFilterable: true, isGroupable: true },
      { fieldKey: 'campusId', label: 'Campus ID', dataType: 'STRING', sourceModel: 'Student', sourceField: 'campusId', isFilterable: true, isGroupable: true },
      { fieldKey: 'createdAt', label: 'Registration Date', dataType: 'DATETIME', sourceModel: 'Student', sourceField: 'createdAt', isSortable: true, isFilterable: true },
    ],
  },
  {
    code: 'ENROLLMENTS',
    name: 'Class & Section Enrollments',
    description: 'Student enrollments across classes, sections, roll numbers, and academic years.',
    category: 'ACADEMIC',
    requiredPermission: 'ACADEMICS:VIEW',
    fields: [
      { fieldKey: 'id', label: 'Enrollment ID', dataType: 'STRING', sourceModel: 'Enrollment', sourceField: 'id' },
      { fieldKey: 'studentId', label: 'Student ID', dataType: 'STRING', sourceModel: 'Enrollment', sourceField: 'studentId', isFilterable: true },
      { fieldKey: 'rollNumber', label: 'Roll Number', dataType: 'STRING', sourceModel: 'Enrollment', sourceField: 'rollNumber', isSortable: true, isFilterable: true },
      { fieldKey: 'classId', label: 'Class ID', dataType: 'STRING', sourceModel: 'Enrollment', sourceField: 'classId', isFilterable: true, isGroupable: true },
      { fieldKey: 'sectionId', label: 'Section ID', dataType: 'STRING', sourceModel: 'Enrollment', sourceField: 'sectionId', isFilterable: true, isGroupable: true },
      { fieldKey: 'academicYearId', label: 'Academic Year ID', dataType: 'STRING', sourceModel: 'Enrollment', sourceField: 'academicYearId', isFilterable: true, isGroupable: true },
      { fieldKey: 'status', label: 'Status', dataType: 'ENUM', sourceModel: 'Enrollment', sourceField: 'status', isFilterable: true, isGroupable: true },
    ],
  },
  {
    code: 'FEES',
    name: 'Fee Invoices & Receivable Ledger',
    description: 'Billing records, discounts, waivers, balances, due dates, and payment statuses.',
    category: 'FINANCE',
    requiredPermission: 'FEES_INVOICES:VIEW',
    fields: [
      { fieldKey: 'id', label: 'Invoice ID', dataType: 'STRING', sourceModel: 'Invoice', sourceField: 'id' },
      { fieldKey: 'invoiceNumber', label: 'Invoice Number', dataType: 'STRING', sourceModel: 'Invoice', sourceField: 'invoiceNumber', isSortable: true, isFilterable: true },
      { fieldKey: 'studentId', label: 'Student ID', dataType: 'STRING', sourceModel: 'Invoice', sourceField: 'studentId', isFilterable: true },
      { fieldKey: 'totalAmount', label: 'Total Invoiced Amount', dataType: 'CURRENCY', sourceModel: 'Invoice', sourceField: 'totalAmount', isSortable: true, allowAggregation: true },
      { fieldKey: 'paidAmount', label: 'Paid Amount', dataType: 'CURRENCY', sourceModel: 'Invoice', sourceField: 'paidAmount', isSortable: true, allowAggregation: true },
      { fieldKey: 'waiverAmount', label: 'Waiver / Discount Amount', dataType: 'CURRENCY', sourceModel: 'Invoice', sourceField: 'waiverAmount', isSortable: true, allowAggregation: true },
      { fieldKey: 'balanceAmount', label: 'Outstanding Balance', dataType: 'CURRENCY', sourceModel: 'Invoice', sourceField: 'dueAmount', isSortable: true, allowAggregation: true },
      { fieldKey: 'status', label: 'Payment Status', dataType: 'ENUM', sourceModel: 'Invoice', sourceField: 'status', isFilterable: true, isGroupable: true },
      { fieldKey: 'dueDate', label: 'Due Date', dataType: 'DATE', sourceModel: 'Invoice', sourceField: 'dueDate', isSortable: true, isFilterable: true },
      { fieldKey: 'createdAt', label: 'Invoice Date', dataType: 'DATETIME', sourceModel: 'Invoice', sourceField: 'createdAt', isSortable: true, isFilterable: true },
    ],
  },
  {
    code: 'EMPLOYEES',
    name: 'HR & Faculty Directory',
    description: 'Staff profiles, designations, departments, contracts, and employment status.',
    category: 'HR',
    requiredPermission: 'EMPLOYEES:VIEW',
    fields: [
      { fieldKey: 'id', label: 'Employee ID', dataType: 'STRING', sourceModel: 'Employee', sourceField: 'id' },
      { fieldKey: 'employeeCode', label: 'Employee Code', dataType: 'STRING', sourceModel: 'Employee', sourceField: 'employeeCode', isSortable: true, isFilterable: true },
      { fieldKey: 'firstName', label: 'First Name', dataType: 'STRING', sourceModel: 'Employee', sourceField: 'firstName', isSortable: true, isFilterable: true },
      { fieldKey: 'lastName', label: 'Last Name', dataType: 'STRING', sourceModel: 'Employee', sourceField: 'lastName', isSortable: true, isFilterable: true },
      { fieldKey: 'designation', label: 'Designation', dataType: 'STRING', sourceModel: 'Employee', sourceField: 'designation', isFilterable: true, isGroupable: true },
      { fieldKey: 'departmentId', label: 'Department ID', dataType: 'STRING', sourceModel: 'Employee', sourceField: 'departmentId', isFilterable: true, isGroupable: true },
      { fieldKey: 'campusId', label: 'Campus ID', dataType: 'STRING', sourceModel: 'Employee', sourceField: 'campusId', isFilterable: true, isGroupable: true },
      { fieldKey: 'joiningDate', label: 'Joining Date', dataType: 'DATE', sourceModel: 'Employee', sourceField: 'joiningDate', isSortable: true, isFilterable: true },
      { fieldKey: 'basicSalary', label: 'Basic Salary', dataType: 'CURRENCY', sourceModel: 'Employee', sourceField: 'basicSalary', classification: 'RESTRICTED', requiredPermission: 'PAYROLL:VIEW', allowAggregation: true },
      { fieldKey: 'status', label: 'Employment Status', dataType: 'ENUM', sourceModel: 'Employee', sourceField: 'status', isFilterable: true, isGroupable: true },
      { fieldKey: 'phone', label: 'Phone', dataType: 'STRING', sourceModel: 'Employee', sourceField: 'phone', classification: 'CONFIDENTIAL', piiMaskingType: 'PHONE' },
      { fieldKey: 'email', label: 'Email', dataType: 'STRING', sourceModel: 'Employee', sourceField: 'email', classification: 'CONFIDENTIAL', piiMaskingType: 'EMAIL' },
    ],
  },
  {
    code: 'EXAM_RESULTS',
    name: 'Examination Marks & Result Tabulations',
    description: 'Marks entries across subjects, theory/practical breakdown, and GPA calculations.',
    category: 'ACADEMIC',
    requiredPermission: 'EXAMINATIONS:VIEW',
    fields: [
      { fieldKey: 'id', label: 'Result ID', dataType: 'STRING', sourceModel: 'MarksEntry', sourceField: 'id' },
      { fieldKey: 'examId', label: 'Exam ID', dataType: 'STRING', sourceModel: 'MarksEntry', sourceField: 'examId', isFilterable: true, isGroupable: true },
      { fieldKey: 'studentId', label: 'Student ID', dataType: 'STRING', sourceModel: 'MarksEntry', sourceField: 'studentId', isFilterable: true },
      { fieldKey: 'subjectId', label: 'Subject ID', dataType: 'STRING', sourceModel: 'MarksEntry', sourceField: 'subjectId', isFilterable: true, isGroupable: true },
      { fieldKey: 'theoryMarks', label: 'Theory Marks', dataType: 'NUMBER', sourceModel: 'MarksEntry', sourceField: 'theoryMarks', allowAggregation: true },
      { fieldKey: 'practicalMarks', label: 'Practical Marks', dataType: 'NUMBER', sourceModel: 'MarksEntry', sourceField: 'practicalMarks', allowAggregation: true },
      { fieldKey: 'assignmentMarks', label: 'Assignment / LMS Marks', dataType: 'NUMBER', sourceModel: 'MarksEntry', sourceField: 'assignmentMarks', allowAggregation: true },
      { fieldKey: 'totalMarks', label: 'Total Marks', dataType: 'NUMBER', sourceModel: 'MarksEntry', sourceField: 'totalMarks', isSortable: true, allowAggregation: true },
      { fieldKey: 'letterGrade', label: 'Letter Grade', dataType: 'STRING', sourceModel: 'MarksEntry', sourceField: 'letterGrade', isFilterable: true, isGroupable: true },
      { fieldKey: 'gradePoint', label: 'Grade Point', dataType: 'DECIMAL', sourceModel: 'MarksEntry', sourceField: 'gradePoint', isSortable: true, allowAggregation: true },
      { fieldKey: 'status', label: 'Result Status (PASS/FAIL)', dataType: 'ENUM', sourceModel: 'MarksEntry', sourceField: 'status', isFilterable: true, isGroupable: true },
    ],
  },
  {
    code: 'PLATFORM_TENANTS',
    name: 'SaaS Platform Tenants Master',
    description: 'SaaS tenant subscriptions, subscription tiers, and platform status (Platform Super Admin only).',
    category: 'PLATFORM',
    requiredPermission: 'TENANTS:VIEW',
    isPlatformDataset: true,
    fields: [
      { fieldKey: 'id', label: 'Tenant ID', dataType: 'STRING', sourceModel: 'Tenant', sourceField: 'id' },
      { fieldKey: 'slug', label: 'Tenant Slug', dataType: 'STRING', sourceModel: 'Tenant', sourceField: 'slug', isSortable: true, isFilterable: true },
      { fieldKey: 'institutionType', label: 'Institution Type', dataType: 'ENUM', sourceModel: 'Tenant', sourceField: 'institutionType', isFilterable: true, isGroupable: true },
      { fieldKey: 'subscriptionTier', label: 'Subscription Tier', dataType: 'ENUM', sourceModel: 'Tenant', sourceField: 'subscriptionTier', isFilterable: true, isGroupable: true },
      { fieldKey: 'isActive', label: 'Active Status', dataType: 'BOOLEAN', sourceModel: 'Tenant', sourceField: 'isActive', isFilterable: true, isGroupable: true },
      { fieldKey: 'createdAt', label: 'Onboarding Date', dataType: 'DATETIME', sourceModel: 'Tenant', sourceField: 'createdAt', isSortable: true, isFilterable: true },
    ],
  },
];

/**
 * Initializes and syncs governed dataset registry in database
 */
export async function initializeReportingRegistry() {
  for (const ds of GOVERNED_DATASETS) {
    const dataset = await db.reportingDataset.upsert({
      where: { code: ds.code },
      update: {
        name: ds.name,
        description: ds.description,
        category: ds.category,
        requiredPermission: ds.requiredPermission,
        isPlatformDataset: ds.isPlatformDataset || false,
      },
      create: {
        code: ds.code,
        name: ds.name,
        description: ds.description,
        category: ds.category,
        requiredPermission: ds.requiredPermission,
        isPlatformDataset: ds.isPlatformDataset || false,
      },
    });

    for (const f of ds.fields) {
      await db.reportingField.upsert({
        where: {
          datasetId_fieldKey: {
            datasetId: dataset.id,
            fieldKey: f.fieldKey,
          },
        },
        update: {
          label: f.label,
          dataType: f.dataType,
          sourceModel: f.sourceModel,
          sourceField: f.sourceField,
          isSortable: f.isSortable !== undefined ? f.isSortable : true,
          isFilterable: f.isFilterable !== undefined ? f.isFilterable : true,
          isGroupable: f.isGroupable !== undefined ? f.isGroupable : true,
          allowAggregation: f.allowAggregation || false,
          classification: f.classification || 'INTERNAL',
          piiMaskingType: f.piiMaskingType || 'NONE',
          requiredPermission: f.requiredPermission || null,
          isExportable: f.isExportable !== undefined ? f.isExportable : true,
        },
        create: {
          datasetId: dataset.id,
          fieldKey: f.fieldKey,
          label: f.label,
          dataType: f.dataType,
          sourceModel: f.sourceModel,
          sourceField: f.sourceField,
          isSortable: f.isSortable !== undefined ? f.isSortable : true,
          isFilterable: f.isFilterable !== undefined ? f.isFilterable : true,
          isGroupable: f.isGroupable !== undefined ? f.isGroupable : true,
          allowAggregation: f.allowAggregation || false,
          classification: f.classification || 'INTERNAL',
          piiMaskingType: f.piiMaskingType || 'NONE',
          requiredPermission: f.requiredPermission || null,
          isExportable: f.isExportable !== undefined ? f.isExportable : true,
        },
      });
    }
  }
}

export async function getGovernedDatasets(isPlatformAdmin = false) {
  await initializeReportingRegistry();
  const where: any = { isActive: true };
  if (!isPlatformAdmin) {
    where.isPlatformDataset = false;
  }
  return db.reportingDataset.findMany({
    where,
    include: { fields: true },
    orderBy: { name: 'asc' },
  });
}

export async function getDatasetByCode(code: string) {
  await initializeReportingRegistry();
  const ds = await db.reportingDataset.findUnique({
    where: { code },
    include: { fields: true },
  });
  if (!ds) throw AppError.notFound(`Dataset with code '${code}' not found in registry.`);
  return ds;
}
