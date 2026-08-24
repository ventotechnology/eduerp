import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { QA_ACCOUNT_DEFINITIONS } from '../lib/demo/demo-account-definitions';

export async function generateDemoMasterFiles() {
  console.log('=== EDUERP DEMO CLIENT CREDENTIAL VAULT & EXPORT GENERATOR ===');

  const privateDir = path.resolve(process.cwd(), 'private');
  const packsDir = path.resolve(privateDir, 'packs');

  if (!fs.existsSync(privateDir)) fs.mkdirSync(privateDir, { recursive: true, mode: 0o700 });
  if (!fs.existsSync(packsDir)) fs.mkdirSync(packsDir, { recursive: true, mode: 0o700 });

  // Read current live passwords from EDUERP-ONLINE-TEST-CREDENTIALS.txt if present
  const credsFile = path.resolve(process.cwd(), 'EDUERP-ONLINE-TEST-CREDENTIALS.txt');
  const passwordMap = new Map<string, string>();

  if (fs.existsSync(credsFile)) {
    const lines = fs.readFileSync(credsFile, 'utf-8').split('\n');
    let currentEmail = '';
    for (const line of lines) {
      if (line.startsWith('Email          :')) {
        currentEmail = line.replace('Email          :', '').trim();
      } else if (line.startsWith('Password       :') && currentEmail) {
        const pass = line.replace('Password       :', '').trim();
        passwordMap.set(currentEmail, pass);
        currentEmail = '';
      }
    }
  }

  // Combine definitions with passwords
  const fullAccounts = QA_ACCOUNT_DEFINITIONS.map(acct => ({
    ...acct,
    password: passwordMap.get(acct.email) || '[ROTATED_IN_DATABASE]'
  }));

  // 1. Generate Master Excel File (Multi-tab)
  const wb = XLSX.utils.book_new();

  // Tab 1: All Accounts
  const allData = fullAccounts.map((a, i) => ({
    '#': i + 1,
    'Institution Name': a.institutionName,
    'Vertical Engine': a.institutionType,
    'Tenant Slug': a.tenantSlug,
    'Role Persona': a.role,
    'Contact Name': a.name,
    'Login Email / Username': a.email,
    'Password': a.password,
    'Login Portal URL': 'https://eduerp.us/login',
    'Direct Landing URL': `https://eduerp.us${a.expectedLandingUrl}`,
    'Key Modules To Test': a.modulesToTest,
    'Persona Notes': a.notes
  }));
  const wsAll = XLSX.utils.json_to_sheet(allData);
  XLSX.utils.book_append_sheet(wb, wsAll, 'Master Accounts');

  // Specific tabs for each vertical
  const verticals = [
    { slug: 'platform', title: 'Platform Control' },
    { slug: 'demo-school', title: 'K-12 School' },
    { slug: 'demo-college', title: 'College HSC' },
    { slug: 'demo-school-college', title: 'School & College' },
    { slug: 'demo-madrasha', title: 'Madrasha & Hifz' },
    { slug: 'demo-university', title: 'University Credit' },
    { slug: 'demo-polytechnic', title: 'Polytechnic BTEB' },
    { slug: 'demo-vocational', title: 'Vocational NTVQF' },
    { slug: 'demo-training', title: 'Training Academy' }
  ];

  for (const v of verticals) {
    const vData = fullAccounts
      .filter(a => a.tenantSlug === v.slug)
      .map((a, i) => ({
        '#': i + 1,
        'Role Persona': a.role,
        'Designation / Name': a.name,
        'Login Email': a.email,
        'Password': a.password,
        'Portal URL': 'https://eduerp.us/login',
        'Landing Page': `https://eduerp.us${a.expectedLandingUrl}`,
        'Core Workflows To Evaluate': a.modulesToTest,
        'Description': a.notes
      }));
    const ws = XLSX.utils.json_to_sheet(vData);
    XLSX.utils.book_append_sheet(wb, ws, v.title.slice(0, 31));
  }

  const masterXlsxPath = path.join(privateDir, 'EDUERP-OWNER-MASTER-DEMO-CREDENTIALS.xlsx');
  XLSX.writeFile(wb, masterXlsxPath);
  console.log(`✅ Generated Master Excel: ${masterXlsxPath}`);

  // 2. Generate Master TXT
  let masterTxt = `================================================================================\n`;
  masterTxt += `EDUERP MASTER DEMO CREDENTIAL VAULT & QA EXECUTION MATRIX\n`;
  masterTxt += `Generated: ${new Date().toISOString()}\n`;
  masterTxt += `Total Accounts: ${fullAccounts.length}\n`;
  masterTxt += `Production Server: https://eduerp.us (PostgreSQL 16)\n`;
  masterTxt += `================================================================================\n\n`;

  for (const a of fullAccounts) {
    masterTxt += `--------------------------------------------------------------------------------\n`;
    masterTxt += `Institution    : ${a.institutionName} (${a.institutionType})\n`;
    masterTxt += `Tenant Slug    : ${a.tenantSlug}\n`;
    masterTxt += `Role           : ${a.role}\n`;
    masterTxt += `Name           : ${a.name}\n`;
    masterTxt += `Email          : ${a.email}\n`;
    masterTxt += `Password       : ${a.password}\n`;
    masterTxt += `Login URL      : https://eduerp.us/login\n`;
    masterTxt += `Landing URL    : https://eduerp.us${a.expectedLandingUrl}\n`;
    masterTxt += `Modules To Test: ${a.modulesToTest}\n`;
    masterTxt += `Notes          : ${a.notes}\n\n`;
  }

  const masterTxtPath = path.join(privateDir, 'EDUERP-OWNER-MASTER-DEMO-CREDENTIALS.txt');
  fs.writeFileSync(masterTxtPath, masterTxt, { mode: 0o600 });
  console.log(`✅ Generated Master TXT: ${masterTxtPath}`);

  // 3. Generate Testing Index Excel (High-level persona breakdown for QA & Clients)
  const wbIndex = XLSX.utils.book_new();
  const indexData = fullAccounts.map((a, i) => ({
    '#': i + 1,
    'Institution': a.institutionName,
    'Vertical': a.institutionType,
    'Role Persona': a.role,
    'Persona Name': a.name,
    'Login Username': a.email,
    'Direct Landing URL': `https://eduerp.us${a.expectedLandingUrl}`,
    'Target Workflows': a.modulesToTest
  }));
  const wsIndex = XLSX.utils.json_to_sheet(indexData);
  XLSX.utils.book_append_sheet(wbIndex, wsIndex, 'Testing Index');
  const indexXlsxPath = path.join(privateDir, 'EDUERP-DEMO-CLIENT-TESTING-INDEX.xlsx');
  XLSX.writeFile(wbIndex, indexXlsxPath);
  console.log(`✅ Generated Testing Index: ${indexXlsxPath}`);

  // 4. Generate 8 Per-Institution Client Packs (TXT, CSV, XLSX)
  for (const v of verticals.filter(v => v.slug !== 'platform')) {
    const vAccounts = fullAccounts.filter(a => a.tenantSlug === v.slug);
    
    // TXT
    let packTxt = `================================================================================\n`;
    packTxt += `EDUERP CLIENT DEMONSTRATION EVALUATION PACK\n`;
    packTxt += `Vertical       : ${v.title}\n`;
    packTxt += `Institution    : ${vAccounts[0]?.institutionName || v.title}\n`;
    packTxt += `Tenant URL     : https://eduerp.us/${v.slug}\n`;
    packTxt += `Login Portal   : https://eduerp.us/login\n`;
    packTxt += `Generated      : ${new Date().toISOString()}\n`;
    packTxt += `================================================================================\n\n`;
    packTxt += `INSTRUCTIONS FOR EVALUATION:\n`;
    packTxt += `1. Navigate to https://eduerp.us/login\n`;
    packTxt += `2. Enter the Email and Password for the role you wish to test.\n`;
    packTxt += `3. Test the recommended modules listed under each persona.\n\n`;

    for (const a of vAccounts) {
      packTxt += `--------------------------------------------------------------------------------\n`;
      packTxt += `Role           : ${a.role}\n`;
      packTxt += `Name           : ${a.name}\n`;
      packTxt += `Username       : ${a.email}\n`;
      packTxt += `Password       : ${a.password}\n`;
      packTxt += `Landing Page   : https://eduerp.us${a.expectedLandingUrl}\n`;
      packTxt += `Modules To Test: ${a.modulesToTest}\n`;
      packTxt += `Notes          : ${a.notes}\n\n`;
    }

    const packTxtPath = path.join(packsDir, `${v.slug}-evaluation-pack.txt`);
    fs.writeFileSync(packTxtPath, packTxt, { mode: 0o600 });

    // CSV
    let packCsv = 'Role,Name,Username,Password,Landing_URL,Modules_To_Test,Notes\n';
    vAccounts.forEach(a => {
      packCsv += `"${a.role}","${a.name}","${a.email}","${a.password}","https://eduerp.us${a.expectedLandingUrl}","${a.modulesToTest}","${a.notes}"\n`;
    });
    const packCsvPath = path.join(packsDir, `${v.slug}-evaluation-pack.csv`);
    fs.writeFileSync(packCsvPath, packCsv, { mode: 0o600 });

    // XLSX
    const wbPack = XLSX.utils.book_new();
    const packRows = vAccounts.map((a, idx) => ({
      '#': idx + 1,
      'Role Persona': a.role,
      'Full Name': a.name,
      'Login Username': a.email,
      'Password': a.password,
      'Landing URL': `https://eduerp.us${a.expectedLandingUrl}`,
      'Recommended Modules': a.modulesToTest,
      'Notes': a.notes
    }));
    const wsPack = XLSX.utils.json_to_sheet(packRows);
    XLSX.utils.book_append_sheet(wbPack, wsPack, v.title.slice(0, 31));
    const packXlsxPath = path.join(packsDir, `${v.slug}-evaluation-pack.xlsx`);
    XLSX.writeFile(wbPack, packXlsxPath);

    console.log(`✅ Generated Client Pack (TXT, CSV, XLSX): ${v.slug}`);
  }
}

if (require.main === module) {
  generateDemoMasterFiles()
    .then(() => {
      console.log('🎉 Demo master files & client packs generated successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error generating demo files:', err);
      process.exit(1);
    });
}
