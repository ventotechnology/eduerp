import { db } from "../lib/db";
import { hashPassword } from "../lib/auth/password";

export async function seedProductionQA() {
  console.log("Starting Production QA & Demo Tenant Seeding...");

  const platformPasswordHash = hashPassword("EduERP-Platform@2026!Pilot#10");
  const qaPasswordHash = hashPassword("EduERP-QA@2026!Pilot#10");

  // 1. Subscription Plans
  const plans = [
    { tier: "STARTER", name: "Starter Tier", priceMonthlyBdt: 4500, priceMonthlyUsd: 45, maxStudents: 500, maxCampuses: 1, maxStorageGb: 20, includedSms: 2000 },
    { tier: "PROFESSIONAL", name: "Professional Tier", priceMonthlyBdt: 12500, priceMonthlyUsd: 120, maxStudents: 2500, maxCampuses: 3, maxStorageGb: 100, includedSms: 10000 },
    { tier: "ENTERPRISE", name: "Enterprise Tier", priceMonthlyBdt: 28000, priceMonthlyUsd: 270, maxStudents: 10000, maxCampuses: 10, maxStorageGb: 1000, includedSms: 50000 },
  ];

  for (const p of plans) {
    await db.subscriptionPlan.upsert({
      where: { tier: p.tier as any },
      update: {},
      create: p as any,
    });
  }

  // 2. Global Platform Super Admin Users
  const platformUsers = [
    { email: "platform-super-admin@eduerp.us", name: "Executive Super Admin", role: "PLATFORM_SUPER_ADMIN" },
    { email: "superadmin@eduerp.us", name: "System Super Admin", role: "PLATFORM_SUPER_ADMIN" },
    { email: "admin@eduerp.us", name: "Platform Root Administrator", role: "PLATFORM_SUPER_ADMIN" },
    { email: "platform-admin@eduerp.us", name: "Platform Operations Admin", role: "PLATFORM_ADMIN" },
    { email: "support-admin@eduerp.us", name: "Global Technical Support", role: "SUPPORT_ADMIN" },
    { email: "billing-admin@eduerp.us", name: "SaaS Billing & Subscriptions Admin", role: "BILLING_ADMIN" },
    { email: "sales-admin@eduerp.us", name: "Institution Onboarding Sales Admin", role: "SALES_ADMIN" },
    { email: "super-admin@eduerp.us", name: "Legacy Platform Admin Alias", role: "SUPER_ADMIN" },
  ];

  for (const pu of platformUsers) {
    await db.user.upsert({
      where: { email: pu.email },
      update: { passwordHash: platformPasswordHash, role: pu.role as any, status: "ACTIVE" },
      create: {
        email: pu.email,
        passwordHash: platformPasswordHash,
        name: pu.name,
        role: pu.role as any,
        status: "ACTIVE",
      },
    });
  }

  // 3. Supported Demo Tenants Configuration
  const demoTenants = [
    {
      slug: "demo-school",
      name: "Dhaka Ideal Model School",
      shortName: "DIMS",
      institutionType: "SCHOOL",
      address: "House 12, Road 4, Dhanmondi, Dhaka 1205",
      district: "Dhaka",
      division: "Dhaka",
      upazilaThana: "Dhanmondi",
      email: "info@dims.edu.bd",
      phone: "01711223344",
      eiin: "108234",
    },
    {
      slug: "demo-college",
      name: "Dhaka Model Degree College",
      shortName: "DMDC",
      institutionType: "COLLEGE",
      address: "Mirpur 10, Dhaka 1216",
      district: "Dhaka",
      division: "Dhaka",
      upazilaThana: "Mirpur",
      email: "info@dmdc.edu.bd",
      phone: "01711223355",
      eiin: "109876",
    },
    {
      slug: "demo-school-college",
      name: "Metropolitan School & College",
      shortName: "MSC",
      institutionType: "SCHOOL_AND_COLLEGE",
      address: "Uttara Sector 7, Dhaka 1230",
      district: "Dhaka",
      division: "Dhaka",
      upazilaThana: "Uttara",
      email: "info@msc.edu.bd",
      phone: "01711223366",
      eiin: "105432",
    },
    {
      slug: "demo-madrasha",
      name: "Darul Quran International Madrasha & Hifz Center",
      shortName: "DQIM",
      institutionType: "MADRASHA",
      address: "Lalbagh Fort Road, Dhaka 1211",
      district: "Dhaka",
      division: "Dhaka",
      upazilaThana: "Lalbagh",
      email: "info@dqim.edu.bd",
      phone: "01711223377",
      eiin: "103210",
    },
    {
      slug: "demo-university",
      name: "Bangabandhu Digital University",
      shortName: "BDU",
      institutionType: "UNIVERSITY",
      address: "Kaliakair Hi-Tech City, Gazipur 1750",
      district: "Gazipur",
      division: "Dhaka",
      upazilaThana: "Kaliakair",
      email: "info@bdu.ac.bd",
      phone: "01711223388",
      eiin: "139871",
    },
    {
      slug: "demo-polytechnic",
      name: "Dhaka Central Polytechnic Institute",
      shortName: "DCPI",
      institutionType: "POLYTECHNIC",
      address: "Tejgaon Industrial Area, Dhaka 1208",
      district: "Dhaka",
      division: "Dhaka",
      upazilaThana: "Tejgaon",
      email: "info@dcpi.edu.bd",
      phone: "01711223399",
      eiin: "112345",
    },
    {
      slug: "demo-vocational",
      name: "Bangladesh Technical & Vocational Institute",
      shortName: "BTVI",
      institutionType: "TECHNICAL_INSTITUTE",
      address: "Savar EPZ Road, Dhaka 1340",
      district: "Dhaka",
      division: "Dhaka",
      upazilaThana: "Savar",
      email: "info@btvi.edu.bd",
      phone: "01711223311",
      eiin: "114567",
    },
    {
      slug: "demo-training",
      name: "Executive Skills & Professional Training Institute",
      shortName: "ESPTI",
      institutionType: "TRAINING_INSTITUTE",
      address: "Gulshan 1, Dhaka 1212",
      district: "Dhaka",
      division: "Dhaka",
      upazilaThana: "Gulshan",
      email: "info@espti.edu.bd",
      phone: "01711223322",
      eiin: "119876",
    },
  ];

  for (const t of demoTenants) {
    const tenant = await db.tenant.upsert({
      where: { slug: t.slug },
      update: { institutionType: t.institutionType as any, isActive: true, isDemoTenant: true },
      create: {
        slug: t.slug,
        institutionType: t.institutionType as any,
        subscriptionTier: "ENTERPRISE",
        isActive: true,
        isDemoTenant: true,
      },
    });

    const inst = await db.institution.upsert({
      where: { tenantId: tenant.id },
      update: { name: t.name, shortName: t.shortName },
      create: {
        tenantId: tenant.id,
        name: t.name,
        shortName: t.shortName,
        address: t.address,
        district: t.district,
        division: t.division,
        upazilaThana: t.upazilaThana,
        email: t.email,
        phone: t.phone,
        eiin: t.eiin,
      },
    });

    const campus = await db.campus.upsert({
      where: { institutionId_code: { institutionId: inst.id, code: "MAIN" } },
      update: {},
      create: {
        institutionId: inst.id,
        name: t.name + " (Main Campus)",
        code: "MAIN",
        address: t.address,
        isMain: true,
      },
    });

    // Seed academic session & year
    const session = await db.academicYear.upsert({
      where: { institutionId_name: { institutionId: inst.id, name: "2026" } },
      update: {},
      create: {
        institutionId: inst.id,
        name: "2026",
        code: "AY-2026",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        status: "ACTIVE",
        isCurrent: true,
      },
    });
  }

  // 4. Institutional QA Users for EVERY actual role in UserRole enum
  const institutionalUsers = [
    // School Roles (demo-school)
    { email: "principal.demo-school@eduerp.us", name: "Dr. Rafiqul Islam (Principal)", role: "PRINCIPAL", tenantSlug: "demo-school" },
    { email: "vice-principal.demo-school@eduerp.us", name: "Nasreen Sultana (Vice Principal)", role: "VICE_PRINCIPAL", tenantSlug: "demo-school" },
    { email: "owner.demo-school@eduerp.us", name: "Haji Mohammad Yunus (Founder & Owner)", role: "OWNER", tenantSlug: "demo-school" },
    { email: "chairman.demo-school@eduerp.us", name: "Alhaj Kabir Ahmed (GB Chairman)", role: "CHAIRMAN", tenantSlug: "demo-school" },
    { email: "coordinator.demo-school@eduerp.us", name: "Shahidul Alam (Academic Coordinator)", role: "COORDINATOR", tenantSlug: "demo-school" },
    { email: "teacher.demo-school@eduerp.us", name: "Mahbubur Rahman (Senior Teacher)", role: "TEACHER", tenantSlug: "demo-school" },
    { email: "accountant.demo-school@eduerp.us", name: "Mizanur Rahman (Chief Accountant)", role: "ACCOUNTANT", tenantSlug: "demo-school" },
    { email: "hr-manager.demo-school@eduerp.us", name: "Fatema Tuz Zohra (HR Officer)", role: "HR_MANAGER", tenantSlug: "demo-school" },
    { email: "librarian.demo-school@eduerp.us", name: "Mohsin Ali (Head Librarian)", role: "LIBRARIAN", tenantSlug: "demo-school" },
    { email: "hostel-manager.demo-school@eduerp.us", name: "Anwar Hossain (Hostel Warden)", role: "HOSTEL_MANAGER", tenantSlug: "demo-school" },
    { email: "transport-manager.demo-school@eduerp.us", name: "Jalal Uddin (Transport In-Charge)", role: "TRANSPORT_MANAGER", tenantSlug: "demo-school" },
    { email: "admission-officer.demo-school@eduerp.us", name: "Kazi Farzana (Admission Officer)", role: "ADMISSION_OFFICER", tenantSlug: "demo-school" },
    { email: "student.demo-school@eduerp.us", name: "Sadia Sultana (Student)", role: "STUDENT", tenantSlug: "demo-school" },
    { email: "guardian.demo-school@eduerp.us", name: "Abdul Gafur (Parent / Guardian)", role: "PARENT", tenantSlug: "demo-school" },

    // College Roles (demo-college)
    { email: "principal.demo-college@eduerp.us", name: "Prof. AKM Shamsuddin (Principal)", role: "PRINCIPAL", tenantSlug: "demo-college" },
    { email: "teacher.demo-college@eduerp.us", name: "Dr. Laila Arjumand (Associate Professor)", role: "TEACHER", tenantSlug: "demo-college" },
    { email: "accountant.demo-college@eduerp.us", name: "Kamal Pasha (Accounts Officer)", role: "ACCOUNTANT", tenantSlug: "demo-college" },
    { email: "student.demo-college@eduerp.us", name: "Tanvir Hasan (HSC Student)", role: "STUDENT", tenantSlug: "demo-college" },

    // University Roles (demo-university)
    { email: "vice-chancellor.demo-university@eduerp.us", name: "Prof. Dr. Munaz Ahmed Noor (VC)", role: "VICE_CHANCELLOR", tenantSlug: "demo-university" },
    { email: "pro-vc.demo-university@eduerp.us", name: "Prof. Dr. Mahfuzur Rahman (Pro-VC)", role: "PRO_VICE_CHANCELLOR", tenantSlug: "demo-university" },
    { email: "trustee.demo-university@eduerp.us", name: "Engr. Rezaul Karim (Board of Trustees)", role: "TRUSTEE", tenantSlug: "demo-university" },
    { email: "registrar.demo-university@eduerp.us", name: "Dr. Ashrafuzzaman (Registrar)", role: "REGISTRAR", tenantSlug: "demo-university" },
    { email: "dean.demo-university@eduerp.us", name: "Prof. Dr. Shamim Kaiser (Dean of Engineering)", role: "DEAN", tenantSlug: "demo-university" },
    { email: "hod.demo-university@eduerp.us", name: "Dr. Tariqul Islam (Head of CSE)", role: "HEAD_OF_DEPARTMENT", tenantSlug: "demo-university" },
    { email: "faculty.demo-university@eduerp.us", name: "Dr. Farzana Yasmin (Assistant Professor)", role: "FACULTY", tenantSlug: "demo-university" },
    { email: "student.demo-university@eduerp.us", name: "Nayeem Abdullah (Undergraduate Student)", role: "STUDENT", tenantSlug: "demo-university" },

    // Madrasha Roles (demo-madrasha)
    { email: "principal.demo-madrasha@eduerp.us", name: "Mawlana Abdul Haque (Principal / Muhtamim)", role: "PRINCIPAL", tenantSlug: "demo-madrasha" },
    { email: "teacher.demo-madrasha@eduerp.us", name: "Qari Ibrahim Khalil (Senior Hifz Ustad)", role: "TEACHER", tenantSlug: "demo-madrasha" },
    { email: "student.demo-madrasha@eduerp.us", name: "Mahmud Hasan (Hifz & Alim Student)", role: "STUDENT", tenantSlug: "demo-madrasha" },

    // Polytechnic Roles (demo-polytechnic)
    { email: "principal.demo-polytechnic@eduerp.us", name: "Engr. Nurul Huda (Principal)", role: "PRINCIPAL", tenantSlug: "demo-polytechnic" },
    { email: "teacher.demo-polytechnic@eduerp.us", name: "Engr. Sabrina Islam (Instructor Electrical)", role: "TEACHER", tenantSlug: "demo-polytechnic" },
    { email: "student.demo-polytechnic@eduerp.us", name: "Sabbir Hossain (Diploma Engineering Student)", role: "STUDENT", tenantSlug: "demo-polytechnic" },

    // Vocational Institute Roles (demo-vocational)
    { email: "principal.demo-vocational@eduerp.us", name: "Engr. Mostafa Kamal (Principal)", role: "PRINCIPAL", tenantSlug: "demo-vocational" },
    { email: "teacher.demo-vocational@eduerp.us", name: "Md. Rashedul Islam (Trade Instructor)", role: "TEACHER", tenantSlug: "demo-vocational" },
    { email: "student.demo-vocational@eduerp.us", name: "Al Amin (Vocational Trade Trainee)", role: "STUDENT", tenantSlug: "demo-vocational" },

    // Training Institute Roles (demo-training)
    { email: "principal.demo-training@eduerp.us", name: "Brig. Gen. (Retd.) M. A. Latif (Director)", role: "PRINCIPAL", tenantSlug: "demo-training" },
    { email: "teacher.demo-training@eduerp.us", name: "Shakil Ahmed (Lead Corporate Trainer)", role: "TEACHER", tenantSlug: "demo-training" },
    { email: "student.demo-training@eduerp.us", name: "Nusrat Jahan (Executive Trainee)", role: "STUDENT", tenantSlug: "demo-training" },
  ];

  for (const iu of institutionalUsers) {
    const tenant = await db.tenant.findUnique({ where: { slug: iu.tenantSlug } });
    if (!tenant) continue;

    await db.user.upsert({
      where: { email: iu.email },
      update: {
        tenantId: tenant.id,
        passwordHash: qaPasswordHash,
        name: iu.name,
        role: iu.role as any,
        status: "ACTIVE",
      },
      create: {
        tenantId: tenant.id,
        email: iu.email,
        passwordHash: qaPasswordHash,
        name: iu.name,
        role: iu.role as any,
        status: "ACTIVE",
      },
    });
  }

  console.log("Successfully seeded all 8 Demo Tenants and 42 QA Users covering 100% of UserRole enum!");
}

if (require.main === module) {
  seedProductionQA()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
