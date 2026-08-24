import fs from 'fs';
import path from 'path';

interface QAUserEntry {
  institutionName: string;
  institutionType: string;
  tenantSlug: string;
  role: string;
  name: string;
  email: string;
  password: string;
  loginUrl: string;
  expectedLandingUrl: string;
  modulesToTest: string;
  notes: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

export function loadQACredentials(): QAUserEntry[] {
  const csvPath = path.join(process.cwd(), 'EDUERP-ONLINE-TEST-CREDENTIALS.csv');
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Credentials CSV not found at ${csvPath}`);
  }

  const lines = fs.readFileSync(csvPath, 'utf8').split('\n').filter(Boolean);
  const entries: QAUserEntry[] = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const parts = parseCSVLine(lines[i]);
    if (parts.length >= 7) {
      entries.push({
        institutionName: parts[0],
        institutionType: parts[1],
        tenantSlug: parts[2],
        role: parts[3],
        name: parts[4],
        email: parts[5],
        password: parts[6],
        loginUrl: parts[7] || 'https://eduerp.us/login',
        expectedLandingUrl: parts[8] || '',
        modulesToTest: parts[9] || '',
        notes: parts[10] || '',
      });
    }
  }

  return entries;
}

async function runLiveVerification() {
  const baseUrl = process.env.LIVE_APP_URL || 'https://eduerp.us';
  console.log(`=== STARTING EDUERP LIVE AUTHENTICATION VERIFICATION (${baseUrl}) ===\n`);

  // 1. Test OLD compromised passwords (MUST FAIL WITH 401)
  console.log('--- 1. Testing Old Passwords Rejection (Must return 401) ---');
  const oldPasswordTests = [
    { email: 'platform-super-admin@eduerp.us', oldPwd: 'EduERP-Platform@2026!Pilot#10' },
    { email: 'principal.demo-school@eduerp.us', oldPwd: 'EduERP-QA@2026!Pilot#10' },
    { email: 'student.demo-school@eduerp.us', oldPwd: 'EduERP-QA@2026!Pilot#10' }
  ];

  for (const t of oldPasswordTests) {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: t.email, password: t.oldPwd }),
    });

    if (res.status === 401) {
      console.log(`  ✅ PASS: Old password rejected for ${t.email} (HTTP 401)`);
    } else {
      console.error(`  ❌ FAIL: Old password was NOT rejected for ${t.email} (HTTP ${res.status})`);
      process.exit(1);
    }
  }

  // 2. Test NEW rotated unique passwords from private credentials catalog
  console.log('\n--- 2. Testing Newly Rotated Unique Passwords (Must return 200 with session) ---');
  const qaUsers = loadQACredentials();
  console.log(`Loaded ${qaUsers.length} QA accounts from private credentials catalog.\n`);

  let successCount = 0;
  let failCount = 0;

  for (const u of qaUsers) {
    try {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u.email, password: u.password }),
      });

      const data = await res.json().catch(() => ({}));
      const setCookie = res.headers.get('set-cookie');

      if (res.status === 200 && data.user && data.user.email === u.email && setCookie) {
        successCount++;
        console.log(`  ✅ [${u.role.padEnd(20)}] ${u.email.padEnd(42)} -> HTTP 200 OK (${u.institutionType})`);
      } else {
        failCount++;
        console.error(`  ❌ [${u.role.padEnd(20)}] ${u.email.padEnd(42)} -> HTTP ${res.status}: ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      failCount++;
      console.error(`  ❌ [${u.role.padEnd(20)}] ${u.email.padEnd(42)} -> Fetch error: ${err.message}`);
    }
  }

  console.log(`\n=== LIVE AUTHENTICATION SUMMARY ===`);
  console.log(`Total Accounts Tested : ${qaUsers.length}`);
  console.log(`Successful Logins     : ${successCount}`);
  console.log(`Failed Logins         : ${failCount}`);

  if (failCount > 0) {
    console.error(`\n❌ VERIFICATION FAILED: ${failCount} accounts failed authentication!`);
    process.exit(1);
  }

  console.log(`\n🎉 ALL ${successCount}/${qaUsers.length} QA ACCOUNTS VERIFIED 100% OPERATIONAL LIVE OVER HTTPS!\n`);
}

if (require.main === module) {
  runLiveVerification().catch((err) => {
    console.error('Execution error:', err);
    process.exit(1);
  });
}
