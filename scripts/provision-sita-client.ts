import { db } from '../lib/db';
import { hashPassword } from '../lib/auth/password';
import { SaasPlanService } from '../lib/services/saas-plan.service';

export interface ProvisionResult {
  success: boolean;
  platformSuperAdmin: { email: string; role: string; updated: boolean };
  platformAdmin: { email: string; role: string; updated: boolean };
  sitaTenant: {
    id: string;
    slug: string;
    name: string;
    institutionType: string;
    isDemoTenant: boolean;
    isTestTenant: boolean;
    ownerEmail: string;
    ownerRole: string;
    campusName: string;
    subscriptionPlan: string;
    pilotDays: number;
    created: boolean;
  };
}

/**
 * Idempotent provisioning script for Command 12A:
 * 1. Platform Super Admin (bloodsoft24@gmail.com)
 * 2. Platform Admin (walletmix@gmail.com)
 * 3. Real Customer Madrasha Tenant: Scholars International Tahfiz Academy (SITA)
 */
export async function provisionSitaAndPlatformAccounts(options: {
  superAdminPass?: string;
  adminPass?: string;
  sitaOwnerPass?: string;
} = {}): Promise<ProvisionResult> {
  const superAdminEmail = 'bloodsoft24@gmail.com'.toLowerCase().trim();
  const superAdminPass = options.superAdminPass || 'Wallet.047890';

  const platformAdminEmail = 'walletmix@gmail.com'.toLowerCase().trim();
  const platformAdminPass = options.adminPass || 'Wallet.047890';

  const sitaOwnerEmail = 'contact@scholarsita.com'.toLowerCase().trim();
  const sitaOwnerPass = options.sitaOwnerPass || 'Password@123';

  // 1. Ensure Default SaaS Plans exist
  await SaasPlanService.seedDefaultPlans();
  const enterprisePlan = await db.subscriptionPlan.findUnique({
    where: { code: 'ENTERPRISE' }
  }) || await db.subscriptionPlan.findFirst({
    where: { name: { contains: 'Enterprise', mode: 'insensitive' } }
  });

  if (!enterprisePlan) {
    throw new Error('ENTERPRISE SubscriptionPlan could not be located or created.');
  }

  // 2. Provision / Update Platform Super Admin
  const existingSuperAdmin = await db.user.findUnique({
    where: { email: superAdminEmail }
  });

  const superAdminHash = hashPassword(superAdminPass);
  let superAdminUser;
  if (existingSuperAdmin) {
    superAdminUser = await db.user.update({
      where: { id: existingSuperAdmin.id },
      data: {
        role: 'PLATFORM_SUPER_ADMIN',
        status: 'ACTIVE',
        passwordHash: superAdminHash,
        tenantId: null,
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });
    // Invalidate stale sessions
    await db.userSession.deleteMany({ where: { userId: existingSuperAdmin.id } });
  } else {
    superAdminUser = await db.user.create({
      data: {
        email: superAdminEmail,
        name: 'Platform Super Admin',
        role: 'PLATFORM_SUPER_ADMIN',
        status: 'ACTIVE',
        passwordHash: superAdminHash,
        tenantId: null
      }
    });
  }

  // 3. Provision / Update Platform Admin
  const existingPlatformAdmin = await db.user.findUnique({
    where: { email: platformAdminEmail }
  });

  const platformAdminHash = hashPassword(platformAdminPass);
  let platformAdminUser;
  if (existingPlatformAdmin) {
    platformAdminUser = await db.user.update({
      where: { id: existingPlatformAdmin.id },
      data: {
        role: 'PLATFORM_ADMIN',
        status: 'ACTIVE',
        passwordHash: platformAdminHash,
        tenantId: null,
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });
    // Invalidate stale sessions
    await db.userSession.deleteMany({ where: { userId: existingPlatformAdmin.id } });
  } else {
    platformAdminUser = await db.user.create({
      data: {
        email: platformAdminEmail,
        name: 'Platform Operations Admin',
        role: 'PLATFORM_ADMIN',
        status: 'ACTIVE',
        passwordHash: platformAdminHash,
        tenantId: null
      }
    });
  }

  // 4. Provision / Update Real Customer Madrasha Tenant (SITA)
  const canonicalSlug = 'scholars-international-tahfiz-academy';

  let tenant = await db.tenant.findUnique({
    where: { slug: canonicalSlug },
    include: { institution: true, subscriptions: true }
  });

  let tenantCreated = false;
  if (!tenant) {
    tenant = await db.tenant.create({
      data: {
        slug: canonicalSlug,
        institutionType: 'MADRASHA',
        subscriptionTier: 'ENTERPRISE',
        status: 'ACTIVE_TRIAL',
        isActive: true,
        isDemoTenant: false,
        isTestTenant: false
      },
      include: { institution: true, subscriptions: true }
    });
    tenantCreated = true;
  } else {
    // Ensure all flags reflect a real commercial customer
    tenant = await db.tenant.update({
      where: { id: tenant.id },
      data: {
        institutionType: 'MADRASHA',
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
        isDemoTenant: false,
        isTestTenant: false,
        status: 'ACTIVE_TRIAL'
      },
      include: { institution: true, subscriptions: true }
    });
  }

  // 5. Ensure Tenant Domain Alias
  const existingDomain = await db.tenantDomain.findUnique({
    where: { domain: 'sita.eduerp.us' }
  });
  if (!existingDomain) {
    await db.tenantDomain.create({
      data: {
        tenantId: tenant.id,
        domain: 'sita.eduerp.us',
        isPrimary: false,
        isVerified: true,
        sslStatus: 'ISSUED',
        redirectToPrimary: true
      }
    });
  }

  // 6. Ensure Institution Record
  const institutionData = {
    name: 'Scholars International Tahfiz Academy',
    shortName: 'SITA',
    address: 'House 05, Road 09, Sector 04, Uttara, Dhaka-1230',
    district: 'Dhaka',
    division: 'Dhaka',
    upazilaThana: 'Uttara',
    phone: '01988115666',
    email: sitaOwnerEmail,
    principalHeadName: 'Mohammad Saifullah',
    principalHeadTitle: 'Principal / Muhtamim',
    madrashaBoardInfo: 'Bangladesh Madrasah Education Board (BMEB)',
    boardAffiliation: 'Madrasah Education Board',
    currencyCode: 'BDT',
    currencySymbol: '৳',
    currencyPrecision: 2,
    primaryColor: '#059669', // Emerald Green for Madrasha
    secondaryColor: '#0f172a'
  };

  let institution = await db.institution.findUnique({
    where: { tenantId: tenant.id }
  });

  if (!institution) {
    institution = await db.institution.create({
      data: {
        tenantId: tenant.id,
        ...institutionData
      }
    });
  } else {
    institution = await db.institution.update({
      where: { id: institution.id },
      data: institutionData
    });
  }

  // 7. Ensure Main Campus
  let mainCampus = await db.campus.findFirst({
    where: { institutionId: institution.id, isMain: true }
  });

  const campusData = {
    name: 'SITA Main Campus',
    code: 'SITA-MAIN',
    type: 'Main Campus',
    address: 'House 05, Road 09, Sector 04, Uttara, Dhaka-1230',
    phone: '01988115666',
    email: sitaOwnerEmail,
    isMain: true
  };

  if (!mainCampus) {
    mainCampus = await db.campus.create({
      data: {
        institutionId: institution.id,
        ...campusData
      }
    });
  } else {
    mainCampus = await db.campus.update({
      where: { id: mainCampus.id },
      data: campusData
    });
  }

  // 8. Provision Organization Head Account (Mohammad Saifullah)
  const existingSitaOwner = await db.user.findUnique({
    where: { email: sitaOwnerEmail }
  });

  const sitaOwnerHash = hashPassword(sitaOwnerPass);
  let sitaOwnerUser;
  if (existingSitaOwner) {
    sitaOwnerUser = await db.user.update({
      where: { id: existingSitaOwner.id },
      data: {
        name: 'Mohammad Saifullah',
        role: 'PRINCIPAL',
        status: 'ACTIVE',
        passwordHash: sitaOwnerHash,
        tenantId: tenant.id,
        phone: '01988115666',
        forcePasswordChange: false,
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });
    // Invalidate stale sessions
    await db.userSession.deleteMany({ where: { userId: existingSitaOwner.id } });
  } else {
    sitaOwnerUser = await db.user.create({
      data: {
        email: sitaOwnerEmail,
        name: 'Mohammad Saifullah',
        role: 'PRINCIPAL',
        status: 'ACTIVE',
        passwordHash: sitaOwnerHash,
        tenantId: tenant.id,
        phone: '01988115666',
        forcePasswordChange: false
      }
    });
  }

  // 9. Provision 30-Day Complimentary Pilot Subscription
  const activeSubscription = await db.subscription.findFirst({
    where: {
      tenantId: tenant.id,
      status: { in: ['ACTIVE', 'TRIALING'] }
    }
  });

  const now = new Date();
  const pilotEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (!activeSubscription) {
    await db.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: enterprisePlan.id,
        billingCycle: 'MONTHLY',
        startDate: now,
        endDate: pilotEnd,
        currentPeriodStart: now,
        currentPeriodEnd: pilotEnd,
        nextBillingDate: pilotEnd,
        status: 'ACTIVE',
        trialEndsAt: pilotEnd,
        autoRenew: false
      }
    });
  } else {
    // Extend or update existing subscription to ensure Enterprise plan and 30-day validity
    await db.subscription.update({
      where: { id: activeSubscription.id },
      data: {
        planId: enterprisePlan.id,
        endDate: activeSubscription.endDate < now ? pilotEnd : activeSubscription.endDate,
        currentPeriodEnd: activeSubscription.endDate < now ? pilotEnd : activeSubscription.currentPeriodEnd,
        status: 'ACTIVE',
        trialEndsAt: pilotEnd
      }
    });
  }

  // 10. Ensure Key Feature Overrides for Madrasha Pilot
  const pilotFeatures = [
    { key: 'HIFZ_TRACKING', reason: 'SITA Tahfiz Academy 30-Para Hifz Pilot' },
    { key: 'LMS_COMPLETE', reason: 'SITA Tahfiz Academy Digital Learning' },
    { key: 'ONLINE_ADMISSION', reason: 'SITA Student Online Intake' },
    { key: 'PRIORITY_SUPPORT', reason: 'SITA Enterprise Pilot VIP Support' }
  ];

  for (const feat of pilotFeatures) {
    await db.tenantFeatureOverride.upsert({
      where: {
        tenantId_featureKey: {
          tenantId: tenant.id,
          featureKey: feat.key
        }
      },
      update: {
        isEnabled: true,
        expiresAt: pilotEnd,
        reason: feat.reason,
        grantedBy: 'Platform Super Admin'
      },
      create: {
        tenantId: tenant.id,
        featureKey: feat.key,
        isEnabled: true,
        expiresAt: pilotEnd,
        reason: feat.reason,
        grantedBy: 'Platform Super Admin'
      }
    });
  }

  // 11. Ensure Tenant Onboarding Progress
  await db.tenantOnboardingProgress.upsert({
    where: { tenantId: tenant.id },
    update: {
      completedSteps: [1, 2, 4]
    },
    create: {
      tenantId: tenant.id,
      currentStep: 1,
      completedSteps: [1, 2, 4],
      isCompleted: false
    }
  });

  return {
    success: true,
    platformSuperAdmin: {
      email: superAdminUser.email,
      role: superAdminUser.role,
      updated: !!existingSuperAdmin
    },
    platformAdmin: {
      email: platformAdminUser.email,
      role: platformAdminUser.role,
      updated: !!existingPlatformAdmin
    },
    sitaTenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: institution.name,
      institutionType: tenant.institutionType,
      isDemoTenant: tenant.isDemoTenant,
      isTestTenant: tenant.isTestTenant,
      ownerEmail: sitaOwnerUser.email,
      ownerRole: sitaOwnerUser.role,
      campusName: mainCampus.name,
      subscriptionPlan: enterprisePlan.name,
      pilotDays: 30,
      created: tenantCreated
    }
  };
}

if (require.main === module) {
  provisionSitaAndPlatformAccounts()
    .then((result) => {
      console.log('✅ Command 12A Provisioning Successful:');
      console.log(JSON.stringify({
        success: result.success,
        platformSuperAdmin: result.platformSuperAdmin.email,
        platformAdmin: result.platformAdmin.email,
        sitaTenantSlug: result.sitaTenant.slug,
        sitaOwner: result.sitaTenant.ownerEmail,
        isDemoTenant: result.sitaTenant.isDemoTenant,
        isTestTenant: result.sitaTenant.isTestTenant,
        plan: result.sitaTenant.subscriptionPlan
      }, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Command 12A Provisioning Error:', err);
      process.exit(1);
    });
}
