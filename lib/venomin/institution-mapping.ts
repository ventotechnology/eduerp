import { InstitutionType, SubscriptionTier } from '@prisma/client';

/**
 * Maps raw institution type from Venomin request to EduERP internal enum
 */
export function mapInstitutionType(rawType?: string): InstitutionType {
  if (!rawType) return InstitutionType.SCHOOL;

  const normalized = rawType.toUpperCase().trim().replace(/[\s-]+/g, '_');

  if (normalized.includes('MADRASHA') || normalized.includes('MADRASA') || normalized.includes('HIFZ') || normalized.includes('ISLAMIC')) {
    return InstitutionType.MADRASHA;
  }
  if (normalized.includes('UNIVERSITY') || normalized.includes('VARSITY')) {
    return InstitutionType.UNIVERSITY;
  }
  if (normalized.includes('COLLEGE') && normalized.includes('SCHOOL')) {
    return InstitutionType.SCHOOL_AND_COLLEGE;
  }
  if (normalized.includes('COLLEGE')) {
    return InstitutionType.COLLEGE;
  }
  if (normalized.includes('POLYTECHNIC')) {
    return InstitutionType.POLYTECHNIC;
  }
  if (normalized.includes('TECHNICAL') || normalized.includes('VOCATIONAL')) {
    return InstitutionType.TECHNICAL_INSTITUTE;
  }
  if (normalized.includes('TRAINING') || normalized.includes('INSTITUTE')) {
    return InstitutionType.TRAINING_INSTITUTE;
  }

  return InstitutionType.SCHOOL;
}

/**
 * Maps Venomin plan ID to EduERP subscription tier
 */
export function mapSubscriptionTier(rawPlan?: string): SubscriptionTier {
  if (!rawPlan) return SubscriptionTier.PROFESSIONAL;

  const clean = rawPlan.toUpperCase().trim();
  if (clean.includes('ENTERPRISE') || clean.includes('SCALE')) return SubscriptionTier.ENTERPRISE;
  if (clean.includes('PRO') || clean.includes('PROFESSIONAL')) return SubscriptionTier.PROFESSIONAL;
  if (clean.includes('STANDARD') || clean.includes('GROWTH')) return SubscriptionTier.STANDARD;
  return SubscriptionTier.STARTER;
}

/**
 * Generates an appropriate initial grade/class template based on institution type
 */
export function getInitialClassTemplates(type: InstitutionType): string[] {
  switch (type) {
    case InstitutionType.SCHOOL:
      return ['Play', 'Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

    case InstitutionType.COLLEGE:
      return ['Class 11 (HSC 1st Year)', 'Class 12 (HSC 2nd Year)'];

    case InstitutionType.SCHOOL_AND_COLLEGE:
      return ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

    case InstitutionType.MADRASHA:
      return ['Ebtedayee 1', 'Ebtedayee 2', 'Ebtedayee 3', 'Ebtedayee 4', 'Ebtedayee 5', 'Dakhil 6', 'Dakhil 7', 'Dakhil 8', 'Dakhil 9', 'Dakhil 10', 'Alim 1st Year', 'Alim 2nd Year'];

    case InstitutionType.UNIVERSITY:
      return ['Undergraduate Level', 'Postgraduate Level'];

    case InstitutionType.POLYTECHNIC:
    case InstitutionType.TECHNICAL_INSTITUTE:
      return ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester'];

    case InstitutionType.TRAINING_INSTITUTE:
    default:
      return ['Batch 01', 'Batch 02'];
  }
}
