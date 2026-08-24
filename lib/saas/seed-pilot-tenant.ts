import { db } from '../db';
import { hashPassword } from '../auth/password';
import { SaasPlanService } from '../services/saas-plan.service';
import { UserRole } from '@prisma/client';

export async function seedPilotTenant() {
  // 1. Ensure all 4 commercial SaaS plans exist
  await SaasPlanService.seedDefaultPlans();

  const proPlan = await db.subscriptionPlan.findFirst({
    where: { code: 'PROFESSIONAL' }
  });

  if (!proPlan) {
    throw new Error('Professional SaaS plan not found.');
  }

  const slug = 'pilot-academy-qa';
  const ownerEmail = 'owner@pilot-academy.qa';
  const now = new Date();
  const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  // Check if pilot tenant already exists
  let tenant = await db.tenant.findUnique({
    where: { slug }
  });

  const passwordHash = await hashPassword('PilotQA@2026#Secure');

  if (!tenant) {
    tenant = await db.tenant.create({
      data: {
        slug,
        institutionType: 'SCHOOL',
        subscriptionTier: 'PROFESSIONAL',
        status: 'ACTIVE_PAID',
        isActive: true,
        isDemoTenant: false,
        isTestTenant: true,
        provisioningKey: `PILOT-${slug}-${now.getTime()}`
      }
    });

    const institution = await db.institution.create({
      data: {
        tenantId: tenant.id,
        name: 'Vento EduERP Pilot Academy QA',
        shortName: 'PILOT-QA',
        address: 'House 42, Road 11, Banani, Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        upazilaThana: 'Banani',
        phone: '+8801335556688',
        email: ownerEmail,
        currencyCode: 'BDT',
        currencySymbol: '৳'
      }
    });

    await db.campus.create({
      data: {
        institutionId: institution.id,
        name: 'Main Campus (Banani)',
        code: 'MAIN',
        address: 'House 42, Road 11, Banani, Dhaka',
        phone: '+8801335556688',
        email: ownerEmail,
        isMain: true
      }
    });

    await db.academicYear.create({
      data: {
        institutionId: institution.id,
        name: 'Academic Year 2026',
        code: 'AY-2026',
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 11, 31),
        isCurrent: true,
        status: 'ACTIVE'
      }
    });

    // Create Owner User
    await db.user.upsert({
      where: { email: ownerEmail },
      create: {
        tenantId: tenant.id,
        email: ownerEmail,
        passwordHash,
        name: 'Dr. Rafiqul Islam (QA Principal)',
        phone: '+8801335556688',
        role: UserRole.PRINCIPAL,
        status: 'ACTIVE',
        forcePasswordChange: false
      },
      update: {
        tenantId: tenant.id,
        passwordHash,
        role: UserRole.PRINCIPAL
      }
    });

    // Create Subscription
    await db.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: proPlan.id,
        billingCycle: 'ANNUAL',
        startDate: now,
        endDate: oneYearLater,
        currentPeriodStart: now,
        currentPeriodEnd: oneYearLater,
        nextBillingDate: oneYearLater,
        status: 'ACTIVE',
        autoRenew: true
      }
    });

    // Create Initial Onboarding Progress
    await db.tenantOnboardingProgress.create({
      data: {
        tenantId: tenant.id,
        currentStep: 1,
        completedSteps: [1, 3, 4],
        isCompleted: false
      }
    });
  } else {
    // Update properties to ensure flags are correct
    await db.tenant.update({
      where: { id: tenant.id },
      data: {
        isTestTenant: true,
        isDemoTenant: false,
        status: 'ACTIVE_PAID',
        isActive: true
      }
    });
  }

  return {
    tenantId: tenant.id,
    slug,
    ownerEmail,
    plan: proPlan.name
  };
}
