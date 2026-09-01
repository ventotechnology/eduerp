import { db } from '../db';
import { AppError } from '../errors/app-error';
import { InstitutionType } from '@prisma/client';
import { VenominOutboxService } from '../venomin/outbox-service';

export interface OnboardingStepDefinition {
  step: number;
  key: string;
  title: string;
  description: string;
  isOptional: boolean;
  requiredForTypes?: InstitutionType[];
}

export const ONBOARDING_STEPS: OnboardingStepDefinition[] = [
  { step: 1, key: 'INSTITUTION_PROFILE', title: 'Institution Profile', description: 'Official name, address, contact details and board affiliation.', isOptional: false },
  { step: 2, key: 'BRANDING', title: 'Branding & Identity', description: 'Logo, institutional colors, and letterhead headers.', isOptional: true },
  { step: 3, key: 'ACADEMIC_YEAR', title: 'Academic Calendar', description: 'Active academic year, term schedules, and working days.', isOptional: false },
  { step: 4, key: 'CAMPUS', title: 'Campus Infrastructure', description: 'Main campus address, buildings, and branch locations.', isOptional: false },
  { step: 5, key: 'CLASSES', title: 'Classes & Programs', description: 'Grade levels, academic departments, or degree programs.', isOptional: false },
  { step: 6, key: 'SECTIONS', title: 'Sections & Classrooms', description: 'Section divisions (e.g. Sec A, Sec B) and classroom capacity.', isOptional: false },
  { step: 7, key: 'SUBJECTS', title: 'Curriculum & Subjects', description: 'Course catalog, subject codes, and credit hours.', isOptional: false },
  { step: 8, key: 'STAFF', title: 'Faculty & Workforce', description: 'Teacher profiles, designations, and administrative staff.', isOptional: false },
  { step: 9, key: 'FEE_STRUCTURE', title: 'Fee Structure & Invoicing', description: 'Tuition fees, admission charges, and monthly billing heads.', isOptional: false },
  { step: 10, key: 'ADMISSION_SETTINGS', title: 'Online Admission Portal', description: 'Public application forms, admission tests, and intake quotas.', isOptional: true },
  { step: 11, key: 'PAYMENT_GATEWAY', title: 'Payment Collection', description: 'bKash merchant checkout, Nagad, and bank deposit accounts.', isOptional: true },
  { step: 12, key: 'STUDENT_IMPORT', title: 'Student SIS Onboarding', description: 'Upload student roster from CSV or register first batch.', isOptional: false },
  { step: 13, key: 'COMMUNICATION', title: 'Notification Alerts', description: 'SMS gateway, parent notification templates, and circulars.', isOptional: true },
  { step: 14, key: 'GO_LIVE', title: 'Review & Go Live', description: 'Audit configuration checklist and activate live operations.', isOptional: false }
];

export class TenantOnboardingService {
  /**
   * Retrieves or initializes the 14-step onboarding progress for a tenant
   */
  static async getOnboardingProgress(tenantId: string) {
    let progress = await db.tenantOnboardingProgress.findUnique({
      where: { tenantId }
    });

    if (!progress) {
      progress = await db.tenantOnboardingProgress.create({
        data: {
          tenantId,
          currentStep: 1,
          completedSteps: [],
          isCompleted: false
        }
      });
    }

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      include: {
        institution: {
          include: {
            campuses: true,
            academicYears: true,
            classes: {
              include: { sections: true }
            }
          }
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          take: 1
        }
      }
    });

    const completedArray: number[] = Array.isArray(progress.completedSteps)
      ? (progress.completedSteps as number[])
      : [];

    return {
      progress: {
        id: progress.id,
        currentStep: progress.currentStep,
        completedSteps: completedArray,
        isCompleted: progress.isCompleted,
        totalSteps: ONBOARDING_STEPS.length,
        completionPercent: Math.round((completedArray.length / ONBOARDING_STEPS.length) * 100)
      },
      steps: ONBOARDING_STEPS.map((s) => ({
        ...s,
        isCompleted: completedArray.includes(s.step),
        isCurrent: progress?.currentStep === s.step
      })),
      tenant
    };
  }

  /**
   * Saves step completion and advances to the next step
   */
  static async completeStep(tenantId: string, stepNumber: number, stepData?: any) {
    const existing = await db.tenantOnboardingProgress.findUnique({
      where: { tenantId }
    });

    const completed: number[] = Array.isArray(existing?.completedSteps)
      ? [...(existing.completedSteps as number[])]
      : [];

    if (!completed.includes(stepNumber)) {
      completed.push(stepNumber);
      completed.sort((a, b) => a - b);
    }

    const nextStep = Math.min(14, Math.max(stepNumber + 1, existing?.currentStep || 1));
    const isCompleted = completed.length >= 10 && stepNumber === 14;

    const updated = await db.tenantOnboardingProgress.upsert({
      where: { tenantId },
      create: {
        tenantId,
        currentStep: nextStep,
        completedSteps: completed,
        isCompleted,
        completedAt: isCompleted ? new Date() : null
      },
      update: {
        currentStep: nextStep,
        completedSteps: completed,
        isCompleted: isCompleted ? true : undefined,
        completedAt: isCompleted ? new Date() : undefined,
        updatedAt: new Date()
      }
    });

    if (stepNumber === 1 && (!existing || !Array.isArray(existing.completedSteps) || (existing.completedSteps as any[]).length === 0)) {
      await VenominOutboxService.emitOutboxEvent(db, {
        eventType: 'ONBOARDING_STARTED',
        category: 'CUSTOMER',
        sourceRecordType: 'TENANT',
        sourceRecordId: tenantId,
        sourceTenantId: tenantId,
        payload: {
          tenantId,
          stepNumber: 1,
          status: 'IN_PROGRESS',
        },
      });
    }

    if (isCompleted) {
      await VenominOutboxService.emitOutboxEvent(db, {
        eventType: 'ONBOARDING_COMPLETED',
        category: 'CUSTOMER',
        sourceRecordType: 'TENANT',
        sourceRecordId: tenantId,
        sourceTenantId: tenantId,
        payload: {
          tenantId,
          isCompleted: true,
          completedAt: new Date().toISOString(),
        },
      });
    }

    return updated;

  }

  /**
   * Applies an academic starter template to initialize structural classes, sections, and subjects
   */
  static async applyAcademicTemplate(tenantId: string, templateType: string) {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      include: { institution: true }
    });

    if (!tenant || !tenant.institution) {
      throw AppError.notFound(`Tenant or institution not found for ID ${tenantId}`);
    }

    const institutionId = tenant.institution.id;

    return db.$transaction(async (tx) => {
      // 1. Ensure Academic Year
      let ay = await tx.academicYear.findFirst({
        where: { institutionId, isCurrent: true }
      });

      const currentYear = new Date().getFullYear();
      if (!ay) {
        ay = await tx.academicYear.create({
          data: {
            institutionId,
            name: `Academic Year ${currentYear}`,
            code: `AY-${currentYear}`,
            startDate: new Date(currentYear, 0, 1),
            endDate: new Date(currentYear, 11, 31),
            isCurrent: true,
            status: 'ACTIVE'
          }
        });
      }

      // 2. Apply template-specific structures
      switch (templateType.toUpperCase()) {
        case 'BANGLADESH_SCHOOL':
        case 'SCHOOL': {
          const schoolClasses = [
            { name: 'Class 1', num: 1, stage: 'PRIMARY' },
            { name: 'Class 2', num: 2, stage: 'PRIMARY' },
            { name: 'Class 3', num: 3, stage: 'PRIMARY' },
            { name: 'Class 4', num: 4, stage: 'PRIMARY' },
            { name: 'Class 5', num: 5, stage: 'PRIMARY' },
            { name: 'Class 6', num: 6, stage: 'SECONDARY' },
            { name: 'Class 7', num: 7, stage: 'SECONDARY' },
            { name: 'Class 8', num: 8, stage: 'SECONDARY' },
            { name: 'Class 9', num: 9, stage: 'SECONDARY' },
            { name: 'Class 10', num: 10, stage: 'SECONDARY' }
          ];

          for (const item of schoolClasses) {
            const cls = await tx.class.create({
              data: {
                institutionId,
                name: item.name,
                numericValue: item.num,
                stage: item.stage,
                shift: 'Morning',
                sequence: item.num
              }
            });

            await tx.section.createMany({
              data: [
                { classId: cls.id, name: 'Section A (Padma)', capacity: 40 },
                { classId: cls.id, name: 'Section B (Meghna)', capacity: 40 }
              ]
            });
          }
          break;
        }

        case 'BANGLADESH_COLLEGE_HSC':
        case 'COLLEGE': {
          const collegeClasses = [
            { name: 'Class 11 (HSC 1st Year - Science)', num: 11, stage: 'HIGHER_SECONDARY' },
            { name: 'Class 11 (HSC 1st Year - Commerce)', num: 11, stage: 'HIGHER_SECONDARY' },
            { name: 'Class 11 (HSC 1st Year - Humanities)', num: 11, stage: 'HIGHER_SECONDARY' },
            { name: 'Class 12 (HSC 2nd Year - Science)', num: 12, stage: 'HIGHER_SECONDARY' },
            { name: 'Class 12 (HSC 2nd Year - Commerce)', num: 12, stage: 'HIGHER_SECONDARY' },
            { name: 'Class 12 (HSC 2nd Year - Humanities)', num: 12, stage: 'HIGHER_SECONDARY' }
          ];

          for (let i = 0; i < collegeClasses.length; i++) {
            const item = collegeClasses[i];
            const cls = await tx.class.create({
              data: {
                institutionId,
                name: item.name,
                numericValue: item.num,
                stage: item.stage,
                shift: 'Day',
                sequence: i + 1
              }
            });

            await tx.section.create({
              data: { classId: cls.id, name: 'Section A', capacity: 60 }
            });
          }
          break;
        }

        case 'MADRASHA': {
          const madrashaClasses = [
            { name: 'Ibtedayi 1', num: 1, stage: 'PRIMARY' },
            { name: 'Ibtedayi 5', num: 5, stage: 'PRIMARY' },
            { name: 'Dakhil 6', num: 6, stage: 'SECONDARY' },
            { name: 'Dakhil 9', num: 9, stage: 'SECONDARY' },
            { name: 'Dakhil 10', num: 10, stage: 'SECONDARY' },
            { name: 'Alim 1st Year', num: 11, stage: 'HIGHER_SECONDARY' },
            { name: 'Hifzul Quran Unit', num: 0, stage: 'HIFZ' }
          ];

          for (let i = 0; i < madrashaClasses.length; i++) {
            const item = madrashaClasses[i];
            const cls = await tx.class.create({
              data: {
                institutionId,
                name: item.name,
                numericValue: item.num,
                stage: item.stage,
                shift: 'Morning',
                sequence: i + 1
              }
            });

            await tx.section.create({
              data: { classId: cls.id, name: 'Section A (Noor)', capacity: 35 }
            });
          }
          break;
        }

        case 'POLYTECHNIC': {
          const polyDepartments = [
            'Computer Technology',
            'Electrical Technology',
            'Civil Technology',
            'Mechanical Technology'
          ];

          for (let i = 0; i < polyDepartments.length; i++) {
            const deptName = polyDepartments[i];
            const cls = await tx.class.create({
              data: {
                institutionId,
                name: `${deptName} - 1st Semester`,
                numericValue: 1,
                stage: 'DIPLOMA_ENGINEERING',
                shift: 'Day',
                sequence: i + 1
              }
            });

            await tx.section.create({
              data: { classId: cls.id, name: 'Shift 1 - Group A', capacity: 50 }
            });
          }
          break;
        }

        case 'UNIVERSITY': {
          const universityPrograms = [
            { name: 'B.Sc. in Computer Science & Engineering', code: 'CSE' },
            { name: 'Bachelor of Business Administration', code: 'BBA' },
            { name: 'B.A. in English Language & Literature', code: 'ENG' }
          ];

          for (let i = 0; i < universityPrograms.length; i++) {
            const prog = universityPrograms[i];
            const cls = await tx.class.create({
              data: {
                institutionId,
                name: `${prog.name} (Spring Intake)`,
                numericValue: 1,
                stage: 'UNDERGRADUATE',
                shift: 'Day',
                sequence: i + 1
              }
            });

            await tx.section.create({
              data: { classId: cls.id, name: `${prog.code}-SEC-1`, capacity: 45 }
            });
          }
          break;
        }

        default: {
          const cls = await tx.class.create({
            data: {
              institutionId,
              name: 'General Batch 1',
              numericValue: 1,
              stage: 'GENERAL',
              shift: 'Day',
              sequence: 1
            }
          });

          await tx.section.create({
            data: { classId: cls.id, name: 'Section A', capacity: 30 }
          });
        }
      }

      // Mark Step 5 (Classes) and Step 6 (Sections) as completed
      await this.completeStep(tenantId, 5);
      await this.completeStep(tenantId, 6);

      return {
        success: true,
        template: templateType,
        message: `Academic template '${templateType}' successfully applied with structural classes and sections.`
      };
    });
  }
}
