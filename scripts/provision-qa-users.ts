import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db } from '../lib/db';
import { hashPassword, generateSecurePassword } from '../lib/auth/password';
import { QA_ACCOUNT_DEFINITIONS, QAAccountDefinition } from '../lib/demo/demo-account-definitions';

export { generateSecurePassword, QA_ACCOUNT_DEFINITIONS, type QAAccountDefinition };

export async function provisionQAUsers(options: { rotatePasswords?: boolean } = {}) {
  console.log('=== EDUERP SAFE QA PROVISIONING & CREDENTIAL GENERATION ===');
  console.log(`Action: ${options.rotatePasswords ? 'ROTATING ALL PASSWORDS' : 'PROVISIONING / SYNCING QA USERS'}`);

  // 1. Subscription Plans & Gateways
  const { SaasPlanService } = await import('../lib/services/saas-plan.service');
  await SaasPlanService.seedInitialPlans();

  // 2. Demo Tenants & Institutions
  const demoTenants = [
    { slug: 'demo-school', name: 'Dhaka Ideal Model School', shortName: 'DIMS', institutionType: 'SCHOOL', district: 'Dhaka', division: 'Dhaka', address: '12/A Dhanmondi, Dhaka', phone: '+8801711000001', email: 'info@dims.edu.bd' },
    { slug: 'demo-college', name: 'Chittagong Model College', shortName: 'CMC', institutionType: 'COLLEGE', district: 'Chattogram', division: 'Chattogram', address: 'GEC Circle, Chattogram', phone: '+8801711000002', email: 'info@cmc.edu.bd' },
    { slug: 'demo-school-college', name: 'Rajshahi Model School & College', shortName: 'RMSC', institutionType: 'SCHOOL_AND_COLLEGE', district: 'Rajshahi', division: 'Rajshahi', address: 'Kazihata, Rajshahi', phone: '+8801711000003', email: 'info@rmsc.edu.bd' },
    { slug: 'demo-madrasha', name: 'Darul Uloom Islamia Madrasha', shortName: 'DUIM', institutionType: 'MADRASHA', district: 'Sylhet', division: 'Sylhet', address: 'Dargah Gate, Sylhet', phone: '+8801711000004', email: 'info@duim.edu.bd' },
    { slug: 'demo-university', name: 'Metropolitan University Bangladesh', shortName: 'MUB', institutionType: 'UNIVERSITY', district: 'Dhaka', division: 'Dhaka', address: 'Gulshan 2, Dhaka', phone: '+8801711000005', email: 'info@mub.edu.bd' },
    { slug: 'demo-polytechnic', name: 'Dhaka Polytechnic Institute', shortName: 'DPI', institutionType: 'POLYTECHNIC', district: 'Dhaka', division: 'Dhaka', address: 'Tejgaon I/A, Dhaka', phone: '+8801711000006', email: 'info@dpi.edu.bd' },
    { slug: 'demo-vocational', name: 'Bangladesh Technical Vocational Academy', shortName: 'BTVA', institutionType: 'TECHNICAL_INSTITUTE', district: 'Gazipur', division: 'Dhaka', address: 'Board Bazar, Gazipur', phone: '+8801711000007', email: 'info@btva.edu.bd' },
    { slug: 'demo-training', name: 'National Institute of Professional Training', shortName: 'NIPT', institutionType: 'TRAINING_INSTITUTE', district: 'Dhaka', division: 'Dhaka', address: 'Panthapath, Dhaka', phone: '+8801711000008', email: 'info@nipt.edu.bd' },
  ];

  const tenantMap = new Map<string, string>();

  for (const t of demoTenants) {
    const tenant = await db.tenant.upsert({
      where: { slug: t.slug },
      update: { isDemoTenant: true },
      create: {
        slug: t.slug,
        institutionType: t.institutionType as any,
        subscriptionTier: 'ENTERPRISE',
        isActive: true,
        isDemoTenant: true,
      },
    });
    tenantMap.set(t.slug, tenant.id);

    // Ensure institution record with required fields
    const institution = await db.institution.upsert({
      where: { tenantId: tenant.id },
      update: { name: t.name },
      create: {
        tenantId: tenant.id,
        name: t.name,
        shortName: t.shortName,
        instituteCode: t.shortName,
        address: t.address,
        district: t.district,
        division: t.division,
        upazilaThana: t.district,
        phone: t.phone,
        email: t.email,
      },
    });

    // Ensure Main Campus
    const campus = await db.campus.upsert({
      where: { institutionId_code: { institutionId: institution.id, code: 'MAIN' } },
      update: {},
      create: {
        institutionId: institution.id,
        name: `${t.name} (Main Campus)`,
        code: 'MAIN',
        address: t.address,
        isMain: true,
      },
    });

    // Ensure Academic Year 2026
    const ay = await db.academicYear.upsert({
      where: { institutionId_name: { institutionId: institution.id, name: '2026' } },
      update: { isCurrent: true, status: 'ACTIVE' },
      create: {
        institutionId: institution.id,
        name: '2026',
        code: 'AY-2026',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        status: 'ACTIVE',
        isCurrent: true,
      },
    });

    // Ensure Academic Session
    const existingSession = await db.session.findFirst({
      where: { academicYearId: ay.id }
    });
    if (!existingSession) {
      await db.session.create({
        data: {
          academicYearId: ay.id,
          name: 'Annual Session 2026',
          type: 'ANNUAL',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
        }
      });
    }

    // Ensure Shifts
    const morningShift = await db.shift.upsert({
      where: { institutionId_code: { institutionId: institution.id, code: 'SFT-MORN' } },
      update: {},
      create: {
        institutionId: institution.id,
        name: 'Morning Shift',
        code: 'SFT-MORN',
        startTime: '07:30',
        endTime: '12:30',
        isActive: true,
      },
    });

    // Ensure Default Classes depending on institution type
    const classNames = t.institutionType === 'COLLEGE'
      ? ['Class 11', 'Class 12']
      : t.institutionType === 'MADRASHA'
      ? ['Dakhil 6', 'Dakhil 7', 'Dakhil 8', 'Dakhil 9', 'Dakhil 10']
      : ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

    for (let seq = 0; seq < classNames.length; seq++) {
      const clsName = classNames[seq];
      const cls = await db.class.upsert({
        where: { institutionId_name_shift: { institutionId: institution.id, name: clsName, shift: 'Morning' } },
        update: {},
        create: {
          institutionId: institution.id,
          name: clsName,
          numericValue: seq + 6,
          sequence: seq + 1,
          shift: 'Morning',
          stage: 'SECONDARY',
        },
      });

      // Ensure Sections
      const existingSec = await db.section.findFirst({
        where: { classId: cls.id, name: 'Padma' }
      });
      if (!existingSec) {
        await db.section.create({
          data: {
            classId: cls.id,
            name: 'Padma',
            capacity: 40,
          },
        });
      }
    }

    // Ensure Polytechnic Trades if Polytechnic
    if (t.institutionType === 'POLYTECHNIC' || t.institutionType === 'TECHNICAL_INSTITUTE') {
      const existingTrade = await db.technologyTrade.findFirst({
        where: { institutionId: institution.id, code: 'CMT' }
      });
      if (!existingTrade) {
        await db.technologyTrade.create({
          data: {
            institutionId: institution.id,
            name: 'Computer Technology',
            code: 'CMT',
            btebCode: '685',
            durationSemesters: 8,
          },
        });
      }
    }

    // Ensure Admission Settings
    await db.admissionSetting.upsert({
      where: { institutionId: institution.id },
      update: {},
      create: {
        institutionId: institution.id,
        isOnlineAdmissionOpen: true,
        applicationFee: 0,
        admissionFeeDefault: 5000,
        isTestRequired: false,
        maxCapacityPerClass: 40,
        applicationNumberPrefix: t.shortName || 'APP',
      },
    });
  }

  // 3. User Provisioning & Secure Random Password Generation
  const generatedCredentials: Array<QAAccountDefinition & { password: string }> = [];

  for (const acct of QA_ACCOUNT_DEFINITIONS) {
    const isPlatform = acct.tenantSlug === 'platform';
    const tenantId = isPlatform ? null : (tenantMap.get(acct.tenantSlug) || null);

    const randomPassword = generateSecurePassword();
    const passwordHash = hashPassword(randomPassword);

    const user = await db.user.upsert({
      where: { email: acct.email },
      update: {
        passwordHash,
        role: acct.role as any,
        tenantId,
        status: 'ACTIVE',
      },
      create: {
        email: acct.email,
        passwordHash,
        name: acct.name,
        role: acct.role as any,
        tenantId,
        status: 'ACTIVE',
      },
    });

    if (user && tenantId) {
      const tenantInst = await db.tenant.findUnique({
        where: { id: tenantId },
        include: { institution: { include: { campuses: true } } }
      });
      const campus = tenantInst?.institution?.campuses[0];
      if (campus && (acct.role === 'TEACHER' || acct.role === 'FACULTY' || acct.role === 'PRINCIPAL' || acct.role === 'HR_MANAGER' || acct.role === 'ACCOUNTANT')) {
        const emp = await db.employee.upsert({
          where: { userId: user.id },
          update: { campusId: campus.id },
          create: {
            campusId: campus.id,
            userId: user.id,
            employeeCode: `EMP-${acct.role.slice(0, 3)}-${acct.tenantSlug.slice(0, 4)}`,
            firstName: acct.name.split(' ')[0],
            lastName: acct.name.split(' ').slice(1).join(' ') || 'Staff',
            designation: acct.role === 'TEACHER' ? 'Senior Teacher' : acct.role,
            department: 'Academic Administration',
            email: acct.email,
            phone: '01711223344',
            basicSalary: 40000,
            joiningDate: new Date('2020-01-01'),
            status: 'ACTIVE',
          }
        });

        if (acct.role === 'TEACHER' || acct.role === 'FACULTY') {
          await db.teacher.upsert({
            where: { employeeId: emp.id },
            update: {},
            create: {
              employeeId: emp.id,
              specialization: 'General Studies',
              qualification: 'Master of Education',
            }
          });
        }
      }
    }

    generatedCredentials.push({
      ...acct,
      password: randomPassword,
    });
  }

  // 4. Output Private Credentials Files (Strictly Git-Ignored)
  const txtContent = [
    '====================================================================================================',
    'PRIVATE QA CREDENTIALS — ROTATED AFTER COMMAND 10 SECURITY REMEDIATION — DO NOT COMMIT',
    '====================================================================================================',
    `Generated At: ${new Date().toISOString()}`,
    `Total Accounts: ${generatedCredentials.length}`,
    'Security Note: Every account has a unique, cryptographically random 26-character password.',
    'Only the PBKDF2 hashes are stored in the database. Plaintext exists only in this private file.',
    '====================================================================================================\n',
  ];

  for (const c of generatedCredentials) {
    txtContent.push(`--------------------------------------------------------------------------------`);
    txtContent.push(`Institution    : ${c.institutionName} (${c.institutionType})`);
    txtContent.push(`Tenant Slug    : ${c.tenantSlug}`);
    txtContent.push(`Role           : ${c.role}`);
    txtContent.push(`Name           : ${c.name}`);
    txtContent.push(`Email          : ${c.email}`);
    txtContent.push(`Password       : ${c.password}`);
    txtContent.push(`Login URL      : ${c.loginUrl}`);
    txtContent.push(`Landing URL    : ${c.expectedLandingUrl}`);
    txtContent.push(`Modules To Test: ${c.modulesToTest}`);
    txtContent.push(`Notes          : ${c.notes}\n`);
  }

  const csvRows = [
    'Institution Name,Institution Type,Tenant Slug,Role,Name,Email,Temporary Password,Login URL,Expected Landing URL,Main Modules To Test,Notes'
  ];

  for (const c of generatedCredentials) {
    csvRows.push([
      `"${c.institutionName}"`,
      `"${c.institutionType}"`,
      `"${c.tenantSlug}"`,
      `"${c.role}"`,
      `"${c.name}"`,
      `"${c.email}"`,
      `"${c.password}"`,
      `"${c.loginUrl}"`,
      `"${c.expectedLandingUrl}"`,
      `"${c.modulesToTest}"`,
      `"${c.notes}"`
    ].join(','));
  }

  const projectRoot = process.cwd();
  const txtPath = path.join(projectRoot, 'EDUERP-ONLINE-TEST-CREDENTIALS.txt');
  const csvPath = path.join(projectRoot, 'EDUERP-ONLINE-TEST-CREDENTIALS.csv');
  const envE2EPath = path.join(projectRoot, '.env.e2e.local');

  // Build .env.e2e.local key-values
  const envLines = [
    '# Local E2E Credentials - Generated by provision-qa-users.ts',
    '# DO NOT COMMIT TO GIT',
    'PLAYWRIGHT_TEST_BASE_URL=https://eduerp.us',
  ];

  const findCred = (slug: string, role: string) =>
    generatedCredentials.find((c) => c.tenantSlug === slug && c.role === role) ||
    generatedCredentials.find((c) => c.role === role);

  const pAdmin = findCred('platform', 'PLATFORM_SUPER_ADMIN');
  if (pAdmin) {
    envLines.push(`E2E_PLATFORM_ADMIN_EMAIL="${pAdmin.email}"`);
    envLines.push(`E2E_PLATFORM_ADMIN_PASSWORD="${pAdmin.password}"`);
  }

  const pOpsAdmin = findCred('platform', 'PLATFORM_ADMIN');
  if (pOpsAdmin) {
    envLines.push(`E2E_PLATFORM_OPS_ADMIN_EMAIL="${pOpsAdmin.email}"`);
    envLines.push(`E2E_PLATFORM_OPS_ADMIN_PASSWORD="${pOpsAdmin.password}"`);
  }

  const pBillingAdmin = findCred('platform', 'BILLING_ADMIN');
  if (pBillingAdmin) {
    envLines.push(`E2E_BILLING_ADMIN_EMAIL="${pBillingAdmin.email}"`);
    envLines.push(`E2E_BILLING_ADMIN_PASSWORD="${pBillingAdmin.password}"`);
  }

  const pSupportAdmin = findCred('platform', 'SUPPORT_ADMIN');
  if (pSupportAdmin) {
    envLines.push(`E2E_SUPPORT_ADMIN_EMAIL="${pSupportAdmin.email}"`);
    envLines.push(`E2E_SUPPORT_ADMIN_PASSWORD="${pSupportAdmin.password}"`);
  }

  const pSalesAdmin = findCred('platform', 'SALES_ADMIN');
  if (pSalesAdmin) {
    envLines.push(`E2E_SALES_ADMIN_EMAIL="${pSalesAdmin.email}"`);
    envLines.push(`E2E_SALES_ADMIN_PASSWORD="${pSalesAdmin.password}"`);
  }

  // 1. School
  const principal = findCred('demo-school', 'PRINCIPAL');
  if (principal) {
    envLines.push(`E2E_PRINCIPAL_EMAIL="${principal.email}"`);
    envLines.push(`E2E_PRINCIPAL_PASSWORD="${principal.password}"`);
  }

  const admission = findCred('demo-school', 'ADMISSION_OFFICER');
  if (admission) {
    envLines.push(`E2E_ADMISSION_EMAIL="${admission.email}"`);
    envLines.push(`E2E_ADMISSION_PASSWORD="${admission.password}"`);
  }

  const teacher = findCred('demo-school', 'TEACHER');
  if (teacher) {
    envLines.push(`E2E_TEACHER_EMAIL="${teacher.email}"`);
    envLines.push(`E2E_TEACHER_PASSWORD="${teacher.password}"`);
  }

  const accountant = findCred('demo-school', 'ACCOUNTANT');
  if (accountant) {
    envLines.push(`E2E_ACCOUNTANT_EMAIL="${accountant.email}"`);
    envLines.push(`E2E_ACCOUNTANT_PASSWORD="${accountant.password}"`);
  }

  const hr = findCred('demo-school', 'HR_MANAGER') || findCred('demo-school', 'HR_ADMIN');
  if (hr) {
    envLines.push(`E2E_HR_EMAIL="${hr.email}"`);
    envLines.push(`E2E_HR_PASSWORD="${hr.password}"`);
  }

  const exam = findCred('demo-school', 'COORDINATOR') || findCred('demo-school', 'VICE_PRINCIPAL') || principal;
  if (exam) {
    envLines.push(`E2E_EXAM_EMAIL="${exam.email}"`);
    envLines.push(`E2E_EXAM_PASSWORD="${exam.password}"`);
  }

  const student = findCred('demo-school', 'STUDENT');
  if (student) {
    envLines.push(`E2E_STUDENT_EMAIL="${student.email}"`);
    envLines.push(`E2E_STUDENT_PASSWORD="${student.password}"`);
  }

  const parent = findCred('demo-school', 'PARENT');
  if (parent) {
    envLines.push(`E2E_PARENT_EMAIL="${parent.email}"`);
    envLines.push(`E2E_PARENT_PASSWORD="${parent.password}"`);
  }

  // 2. College
  const collegeHead = findCred('demo-college', 'PRINCIPAL');
  if (collegeHead) {
    envLines.push(`E2E_COLLEGE_PRINCIPAL_EMAIL="${collegeHead.email}"`);
    envLines.push(`E2E_COLLEGE_PRINCIPAL_PASSWORD="${collegeHead.password}"`);
  }

  // 3. School & College
  const schoolCollegeHead = findCred('demo-school-college', 'PRINCIPAL');
  if (schoolCollegeHead) {
    envLines.push(`E2E_SCHOOL_COLLEGE_PRINCIPAL_EMAIL="${schoolCollegeHead.email}"`);
    envLines.push(`E2E_SCHOOL_COLLEGE_PRINCIPAL_PASSWORD="${schoolCollegeHead.password}"`);
  }

  // 4. Madrasha
  const madrashaHead = findCred('demo-madrasha', 'PRINCIPAL');
  if (madrashaHead) {
    envLines.push(`E2E_MADRASHA_PRINCIPAL_EMAIL="${madrashaHead.email}"`);
    envLines.push(`E2E_MADRASHA_PRINCIPAL_PASSWORD="${madrashaHead.password}"`);
  }

  // 5. University
  const uniVC = findCred('demo-university', 'VICE_CHANCELLOR');
  if (uniVC) {
    envLines.push(`E2E_UNIVERSITY_VC_EMAIL="${uniVC.email}"`);
    envLines.push(`E2E_UNIVERSITY_VC_PASSWORD="${uniVC.password}"`);
  }

  // 6. Polytechnic
  const polyHead = findCred('demo-polytechnic', 'PRINCIPAL');
  if (polyHead) {
    envLines.push(`E2E_POLYTECHNIC_PRINCIPAL_EMAIL="${polyHead.email}"`);
    envLines.push(`E2E_POLYTECHNIC_PRINCIPAL_PASSWORD="${polyHead.password}"`);
  }

  // 7. Vocational
  const vocHead = findCred('demo-vocational', 'PRINCIPAL');
  if (vocHead) {
    envLines.push(`E2E_VOCATIONAL_PRINCIPAL_EMAIL="${vocHead.email}"`);
    envLines.push(`E2E_VOCATIONAL_PRINCIPAL_PASSWORD="${vocHead.password}"`);
  }

  // 8. Training
  const trainHead = findCred('demo-training', 'PRINCIPAL');
  if (trainHead) {
    envLines.push(`E2E_TRAINING_PRINCIPAL_EMAIL="${trainHead.email}"`);
    envLines.push(`E2E_TRAINING_PRINCIPAL_PASSWORD="${trainHead.password}"`);
  }

  fs.writeFileSync(txtPath, txtContent.join('\n'), { mode: 0o600 });
  fs.writeFileSync(csvPath, csvRows.join('\n'), { mode: 0o600 });
  fs.writeFileSync(envE2EPath, envLines.join('\n') + '\n', { mode: 0o600 });

  // On VPS if running as root, write to private admin directory as well
  const vpsPrivateDir = '/root/eduerp-private';
  if (fs.existsSync('/root') && process.getuid && process.getuid() === 0) {
    try {
      fs.mkdirSync(vpsPrivateDir, { recursive: true, mode: 0o700 });
      fs.writeFileSync(path.join(vpsPrivateDir, 'EDUERP-ONLINE-TEST-CREDENTIALS.txt'), txtContent.join('\n'), { mode: 0o600 });
      fs.writeFileSync(path.join(vpsPrivateDir, '.env.e2e.local'), envLines.join('\n') + '\n', { mode: 0o600 });
    } catch {
      // Ignore
    }
  }

  console.log(`✅ Provisioned ${generatedCredentials.length} QA accounts across 8 demo institutions + Platform.`);
  console.log(`🔒 Unique cryptographic passwords generated and hashed.`);
  console.log(`📄 Private credentials saved to ${txtPath} (mode 0600, gitignored).`);
  console.log(`📊 CSV catalog saved to ${csvPath} (mode 0600, gitignored).`);
  console.log(`🔐 E2E environment secrets saved to ${envE2EPath} (mode 0600, gitignored).`);
}

if (require.main === module) {
  const isRotate = process.argv.includes('--rotate');
  provisionQAUsers({ rotatePasswords: isRotate })
    .then(() => {
      console.log('=== QA PROVISIONING COMPLETED SUCCESSFULLY ===');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ QA PROVISIONING ERROR:', err);
      process.exit(1);
    });
}
