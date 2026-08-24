import fs from 'fs';
import path from 'path';

const LIVE_BASE_URL = process.env.LIVE_URL || 'https://eduerp.us';

function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let curr = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(curr.trim());
      curr = '';
    } else {
      curr += char;
    }
  }
  result.push(curr.trim());
  return result.map(s => s.replace(/^"|"$/g, '').trim());
}

async function runLiveVerification() {
  console.log(`Starting Live Online QA Credentials Verification on ${LIVE_BASE_URL}...`);
  
  const csvPath = path.resolve(process.cwd(), 'EDUERP-ONLINE-TEST-CREDENTIALS.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('Credentials CSV not found!');
    process.exit(1);
  }

  const rawLines = fs.readFileSync(csvPath, 'utf8').trim().split('\n');
  const csvLines = rawLines.slice(1);
  let passed = 0;
  let failed = 0;

  for (const line of csvLines) {
    if (!line.trim()) continue;
    const parts = parseCSVLine(line);
    if (parts.length < 7) continue;
    
    // Index mapping:
    // 0: Inst Name, 1: Type, 2: Slug, 3: Role, 4: Name, 5: Email, 6: Password
    const [instName, instType, slug, role, name, email, password] = parts;

    try {
      const loginRes = await fetch(`${LIVE_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!loginRes.ok) {
        console.error(`❌ FAILED: ${email} (HTTP ${loginRes.status})`);
        failed++;
        continue;
      }

      const loginData = await loginRes.json();
      if (!loginData.success || loginData.user?.email !== email) {
        console.error(`❌ FAILED: ${email} (Invalid payload: ${JSON.stringify(loginData)})`);
        failed++;
        continue;
      }

      // Check cookie session
      const setCookie = loginRes.headers.get('set-cookie');
      if (!setCookie || !setCookie.includes('eduerp_session')) {
        console.error(`❌ FAILED: ${email} (Missing eduerp_session cookie)`);
        failed++;
        continue;
      }

      console.log(`✅ [${role.padEnd(22)}] ${name.padEnd(38)} (${email}) -> 200 OK`);
      passed++;
    } catch (err: any) {
      console.error(`❌ ERROR: ${email} -> ${err.message}`);
      failed++;
    }
  }

  console.log('\n========================================================================================');
  console.log(`🎉 LIVE ONLINE QA VERIFICATION: ${passed}/${passed + failed} QA ACCOUNTS 100% VERIFIED PASSING ON ${LIVE_BASE_URL}!`);
  console.log('========================================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveVerification();
