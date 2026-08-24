# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sita-pilot-live.spec.ts >> Command 12A.2 — SITA Real Madrasha Customer Live Operational & UI Contrast Verification Suite >> 4. Authenticated SITA Principal on alias (/sita) redirects to canonical SITA ERP Dashboard
- Location: tests/e2e/sita-pilot-live.spec.ts:65:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "Scholars International Tahfiz Academy"
Received string:    "(self.__next_f=self.__next_f||[]).push([0])self.__next_f.push([1,\"1:\\\"$Sreact.fragment\\\"\\n2:I[18043,[\\\"/_next/static/chunks/21yp4nw2jv7dr.js\\\"],\\\"TenantProvider\\\"]\\n3:I[66524,[\\\"/_next/static/chunks/21yp4nw2jv7dr.js\\\"],\\\"DemoRoleBar\\\"]\\n4:I[39756,[\\\"/_next/static/chunks/21yp4nw2jv7dr.js\\\"],\\\"default\\\"]\\n5:I[37457,[\\\"/_next/static/chunks/21yp4nw2jv7dr.js\\\"],\\\"default\\\"]\\n7:I[47257,[\\\"/_next/static/chunks/21yp4nw2jv7dr.js\\\"],\\\"ClientPageRoot\\\"]\\n8:I[14129,[\\\"/_next/static/chunks/21yp4nw2jv7dr.js\\\",\\\"/_next/static/chunks/265uu_5dnzo0d.js\\\",\\\"/_next/static/chunks/0e149jdsscv2u.js\\\",\\\"/_next/static/chunks/1uq2t5mk90-6f.js\\\"],\\\"default\\\"]\\n9:I[97367,[\\\"/_next/static/chunks/21yp4nw2jv7dr.js\\\"],\\\"OutletBoundary\\\"]\\na:\\\"$Sreact.suspense\\\"\\nd:I[97367,[\\\"/_next/static/chunks/21yp4nw2jv7dr.js\\\"],\\\"ViewportBoundary\\\"]\\nf:I[97367,[\\\"/_next/static/chunks/21yp4nw2jv7dr.js\\\"],\\\"MetadataBoundary\\\"]\\n11:I[68027,[\\\"/_next/static/chunks/21yp4nw2jv7dr.js\\\"],\\\"default\\\",1]\\n:HL[\\\"/_next/static/chunks/06hq56298z7nt.css\\\",\\\"style\\\"]\\nc:X\\n0:{\\\"P\\\":null,\\\"c\\\":[\\\"\\\",\\\"scholars-international-tahfiz-academy\\\",\\\"dashboard\\\"],\\\"q\\\":\\\"\\\",\\\"i\\\":false,\\\"f\\\":[[[\\\"\\\",{\\\"children\\\":[[\\\"tenant\\\",\\\"scholars-international-tahfiz-academy\\\",\\\"d\\\",[\\\"api\\\",\\\"apply\\\",\\\"checkout\\\",\\\"contact\\\",\\\"demo\\\",\\\"help\\\",\\\"login\\\",\\\"payment\\\",\\\"pricing\\\",\\\"privacy\\\",\\\"results\\\",\\\"signup\\\",\\\"site\\\",\\\"super-admin\\\",\\\"support\\\",\\\"terms\\\",\\\"training\\\",\\\"verify\\\"]],{\\\"children\\\":[\\\"dashboard\\\",{\\\"children\\\":[\\\"__PAGE__\\\",{},\\\"$undefined\\\",\\\"$undefined\\\",4096]},\\\"$undefined\\\",\\\"$undefined\\\",4096]},\\\"$undefined\\\",\\\"$undefined\\\",4096]},\\\"$undefined\\\",\\\"$undefined\\\",4112],[[\\\"$\\\",\\\"$1\\\",\\\"c\\\",{\\\"children\\\":[[[\\\"$\\\",\\\"link\\\",\\\"0\\\",{\\\"rel\\\":\\\"stylesheet\\\",\\\"href\\\":\\\"/_next/static/chunks/06hq56298z7nt.css\\\",\\\"precedence\\\":\\\"next\\\",\\\"crossOrigin\\\":\\\"$undefined\\\",\\\"nonce\\\":\\\"$undefined\\\"}],[\\\"$\\\",\\\"script\\\",\\\"script-0\\\",{\\\"src\\\":\\\"/_next/static/chunks/21yp4nw2jv7dr.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}]],[\\\"$\\\",\\\"html\\\",null,{\\\"lang\\\":\\\"en\\\",\\\"className\\\":\\\"h-full\\\",\\\"children\\\":[\\\"$\\\",\\\"body\\\",null,{\\\"className\\\":\\\"antialiased min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col\\\",\\\"children\\\":[\\\"$\\\",\\\"$L2\\\",null,{\\\"children\\\":[[\\\"$\\\",\\\"$L3\\\",null,{}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"flex-1 flex flex-col\\\",\\\"children\\\":[\\\"$\\\",\\\"$L4\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"error\\\":\\\"$undefined\\\",\\\"errorStyles\\\":\\\"$undefined\\\",\\\"errorScripts\\\":\\\"$undefined\\\",\\\"template\\\":[\\\"$\\\",\\\"$L5\\\",null,{}],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":[[[\\\"$\\\",\\\"title\\\",null,{\\\"children\\\":\\\"404: This page could not be found.\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"style\\\":{\\\"fontFamily\\\":\\\"system-ui,\\\\\\\"Segoe UI\\\\\\\",Roboto,Helvetica,Arial,sans-serif,\\\\\\\"Apple Color Emoji\\\\\\\",\\\\\\\"Segoe UI Emoji\\\\\\\"\\\",\\\"height\\\":\\\"100vh\\\",\\\"textAlign\\\":\\\"center\\\",\\\"display\\\":\\\"flex\\\",\\\"flexDirection\\\":\\\"column\\\",\\\"alignItems\\\":\\\"center\\\",\\\"justifyContent\\\":\\\"center\\\"},\\\"children\\\":[\\\"$\\\",\\\"div\\\",null,{\\\"children\\\":[[\\\"$\\\",\\\"style\\\",null,{\\\"dangerouslySetInnerHTML\\\":{\\\"__html\\\":\\\"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}\\\"}}],[\\\"$\\\",\\\"h1\\\",null,{\\\"className\\\":\\\"next-error-h1\\\",\\\"style\\\":{\\\"display\\\":\\\"inline-block\\\",\\\"margin\\\":\\\"0 20px 0 0\\\",\\\"padding\\\":\\\"0 23px 0 0\\\",\\\"fontSize\\\":24,\\\"fontWeight\\\":500,\\\"verticalAlign\\\":\\\"top\\\",\\\"lineHeight\\\":\\\"49px\\\"},\\\"children\\\":404}],[\\\"$\\\",\\\"div\\\",null,{\\\"style\\\":{\\\"display\\\":\\\"inline-block\\\"},\\\"children\\\":[\\\"$\\\",\\\"h2\\\",null,{\\\"style\\\":{\\\"fontSize\\\":14,\\\"fontWeight\\\":400,\\\"lineHeight\\\":\\\"49px\\\",\\\"margin\\\":0},\\\"children\\\":\\\"This page could not be found.\\\"}]}]]}]}]],[]],\\\"forbidden\\\":\\\"$undefined\\\",\\\"unauthorized\\\":\\\"$undefined\\\"}]}]]}]}]}]]}],{\\\"children\\\":[[\\\"$\\\",\\\"$1\\\",\\\"c\\\",{\\\"children\\\":[[[\\\"$\\\",\\\"script\\\",\\\"script-0\\\",{\\\"src\\\":\\\"/_next/static/chunks/265uu_5dnzo0d.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}]],\\\"$L6\\\"]}],{\\\"children\\\":[[\\\"$\\\",\\\"$1\\\",\\\"c\\\",{\\\"children\\\":[null,[\\\"$\\\",\\\"$L4\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"error\\\":\\\"$undefined\\\",\\\"errorStyles\\\":\\\"$undefined\\\",\\\"errorScripts\\\":\\\"$undefined\\\",\\\"template\\\":[\\\"$\\\",\\\"$L5\\\",null,{}],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":\\\"$undefined\\\",\\\"forbidden\\\":\\\"$undefined\\\",\\\"unauthorized\\\":\\\"$undefined\\\"}]]}],{\\\"children\\\":[[\\\"$\\\",\\\"$1\\\",\\\"c\\\",{\\\"children\\\":[[\\\"$\\\",\\\"$L7\\\",null,{\\\"Component\\\":\\\"$8\\\",\\\"serverProvidedParams\\\":{\\\"searchParams\\\":{},\\\"params\\\":{\\\"tenant\\\":\\\"scholars-international-tahfiz-academy\\\"},\\\"promises\\\":null}}],[[\\\"$\\\",\\\"script\\\",\\\"script-0\\\",{\\\"src\\\":\\\"/_next/static/chunks/0e149jdsscv2u.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}],[\\\"$\\\",\\\"script\\\",\\\"script-1\\\",{\\\"src\\\":\\\"/_next/static/chunks/1uq2t5mk90-6f.js\\\",\\\"async\\\":true,\\\"nonce\\\":\\\"$undefined\\\"}]],[\\\"$\\\",\\\"$L9\\\",null,{\\\"children\\\":[\\\"$\\\",\\\"$a\\\",null,{\\\"name\\\":\\\"Next.MetadataOutlet\\\",\\\"children\\\":\\\"$@b\\\"}]}]]}],{},null,false,null]},null,false,\\\"$c\\\"]},null,false,null]},null,false,null],[\\\"$\\\",\\\"$1\\\",\\\"h\\\",{\\\"children\\\":[null,[\\\"$\\\",\\\"$Ld\\\",null,{\\\"children\\\":\\\"$Le\\\"}],[\\\"$\\\",\\\"div\\\",null,{\\\"hidden\\\":true,\\\"children\\\":[\\\"$\\\",\\\"$Lf\\\",null,{\\\"children\\\":[\\\"$\\\",\\\"$a\\\",null,{\\\"name\\\":\\\"Next.Metadata\\\",\\\"children\\\":\\\"$L10\\\"}]}]}],null]}],false]],\\\"m\\\":\\\"$undefined\\\",\\\"G\\\":[\\\"$11\\\",[[\\\"$\\\",\\\"link\\\",\\\"0\\\",{\\\"rel\\\":\\\"stylesheet\\\",\\\"href\\\":\\\"/_next/static/chunks/06hq56298z7nt.css\\\",\\\"precedence\\\":\\\"next\\\",\\\"crossOrigin\\\":\\\"$undefined\\\",\\\"nonce\\\":\\\"$undefined\\\"}]]],\\\"S\\\":false,\\\"h\\\":null,\\\"r\\\":\\\"$undefined\\\",\\\"s\\\":\\\"$undefined\\\",\\\"a\\\":\\\"$undefined\\\",\\\"l\\\":\\\"$undefined\\\",\\\"p\\\":\\\"$undefined\\\",\\\"d\\\":\\\"$undefined\\\",\\\"b\\\":\\\"l045ALEK1iRDoTsWIRfrw\\\"}\\nc:C\\ne:[[\\\"$\\\",\\\"meta\\\",\\\"0\\\",{\\\"charSet\\\":\\\"utf-8\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"1\\\",{\\\"name\\\":\\\"viewport\\\",\\\"content\\\":\\\"width=device-width, initial-scale=1\\\"}]]\\n12:I[27201,[\\\"/_next/static/chunks/21yp4nw2jv7dr.js\\\"],\\\"IconMark\\\"]\\nb:null\\n10:[[\\\"$\\\",\\\"title\\\",\\\"0\\\",{\\\"children\\\":\\\"EduERP OS - Multi-Institution Education ERP \\u0026 Campus SaaS\\\"}],[\\\"$\\\",\\\"meta\\\",\\\"1\\\",{\\\"name\\\":\\\"description\\\",\\\"content\\\":\\\"Next-generation Education Operating System for Schools, Colleges, Madrasahs, Universities \\u0026 Technical Institutes with One Core and Configurable Vertical Engines.\\\"}],[\\\"$\\\",\\\"link\\\",\\\"2\\\",{\\\"rel\\\":\\\"icon\\\",\\\"href\\\":\\\"/favicon.ico?favicon.2vob68tjqpejf.ico\\\",\\\"sizes\\\":\\\"256x256\\\",\\\"type\\\":\\\"image/x-icon\\\"}],[\\\"$\\\",\\\"$L12\\\",\\\"3\\\",{}]]\\n13:I[40730,[\\\"/_next/static/chunks/21yp4nw2jv7dr.js\\\",\\\"/_next/static/chunks/265uu_5dnzo0d.js\\\"],\\\"TenantSidebar\\\"]\\n14:I[20971,[\\\"/_next/static/chunks/21yp4nw2jv7dr.js\\\",\\\"/_next/static/chunks/265uu_5dnzo0d.js\\\"],\\\"TenantHeader\\\"]\\n6:[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"flex-1 flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100\\\",\\\"children\\\":[false,[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"flex-1 flex min-w-0\\\",\\\"children\\\":[[\\\"$\\\",\\\"$L13\\\",null,{}],[\\\"$\\\",\\\"div\\\",null,{\\\"className\\\":\\\"flex-1 flex flex-col min-w-0\\\",\\\"children\\\":[[\\\"$\\\",\\\"$L14\\\",null,{}],[\\\"$\\\",\\\"main\\\",null,{\\\"className\\\":\\\"flex-1 p-6 overflow-y-auto max-h-[calc(100vh-106px)]\\\",\\\"children\\\":[\\\"$\\\",\\\"$L4\\\",null,{\\\"parallelRouterKey\\\":\\\"children\\\",\\\"error\\\":\\\"$undefined\\\",\\\"errorStyles\\\":\\\"$undefined\\\",\\\"errorScripts\\\":\\\"$undefined\\\",\\\"template\\\":[\\\"$\\\",\\\"$L5\\\",null,{}],\\\"templateStyles\\\":\\\"$undefined\\\",\\\"templateScripts\\\":\\\"$undefined\\\",\\\"notFound\\\":\\\"$undefined\\\",\\\"forbidden\\\":\\\"$undefined\\\",\\\"unauthorized\\\":\\\"$undefined\\\"}]}]]}]]}],false]}]\\n\"])80This page couldn’t loadReload to try again, or go back.ReloadBack"
```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - generic [ref=f1e2]: "80"
  - generic [ref=f1e4]:
    - heading "This page couldn’t load" [level=1] [ref=f1e7]
    - paragraph [ref=f1e8]: Reload to try again, or go back.
    - generic [ref=f1e9]:
      - button "Reload" [ref=f1e11] [cursor=pointer]
      - button "Back" [ref=f1e12] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Command 12A.2 — SITA Real Madrasha Customer Live Operational & UI Contrast Verification Suite', () => {
  4   |   const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://eduerp.us';
  5   | 
  6   |   const superAdminEmail = process.env.E2E_PLATFORM_SUPER_ADMIN_EMAIL || 'bloodsoft24@gmail.com';
  7   |   const superAdminPass = process.env.E2E_PLATFORM_SUPER_ADMIN_PASSWORD || 'Wallet.047890';
  8   | 
  9   |   const sitaEmail = process.env.E2E_SITA_EMAIL || 'contact@scholarsita.com';
  10  |   const sitaPass = process.env.E2E_SITA_PASSWORD || 'Password@123';
  11  | 
  12  |   // 1. Anonymous Visitor on Bare Tenant Root -> Redirect to Public CMS Website
  13  |   test('1. Anonymous visitor on bare tenant root (/scholars-international-tahfiz-academy) redirects to public website (/site/...)', async ({ page }) => {
  14  |     await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy`);
  15  |     await page.waitForLoadState('networkidle');
  16  | 
  17  |     expect(page.url()).toContain('/site/scholars-international-tahfiz-academy');
  18  | 
  19  |     const pageText = await page.textContent('body');
  20  |     expect(pageText).toContain('Scholars International Tahfiz Academy');
  21  |     expect(pageText).toMatch(/Excellence in Education|Official Public Institutional Website|EduERP CMS/i);
  22  |     expect(pageText).toMatch(/Uttara, Dhaka|Mohammad Saifullah/i);
  23  |   });
  24  | 
  25  |   // 2. Anonymous Visitor on SITA Alias (/sita) -> Redirect to Public CMS Website
  26  |   test('2. Anonymous visitor on alias (/sita) redirects to canonical public website (/site/scholars-international-tahfiz-academy)', async ({ page }) => {
  27  |     await page.goto(`${BASE_URL}/sita`);
  28  |     await page.waitForLoadState('networkidle');
  29  | 
  30  |     expect(page.url()).toContain('/site/scholars-international-tahfiz-academy');
  31  | 
  32  |     const pageText = await page.textContent('body');
  33  |     expect(pageText).toContain('Scholars International Tahfiz Academy');
  34  |     expect(pageText).toMatch(/Apply Online for Admission|Excellence in Education/i);
  35  |   });
  36  | 
  37  |   // 3. Authenticated SITA Principal on Bare Tenant Root -> Redirect to ERP Dashboard & Display Name
  38  |   test('3. Authenticated SITA Principal on /scholars-international-tahfiz-academy redirects to SITA ERP Dashboard with real display name', async ({ page }) => {
  39  |     await page.goto(`${BASE_URL}/login`);
  40  |     await page.fill('input[type="email"], input[name="email"]', sitaEmail);
  41  |     await page.fill('input[type="password"], input[name="password"]', sitaPass);
  42  |     await page.click('button[type="submit"]');
  43  | 
  44  |     await page.waitForURL('**/scholars-international-tahfiz-academy/**', { timeout: 15000 }).catch(() => {});
  45  | 
  46  |     // Visit bare tenant root while authenticated
  47  |     await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy`);
  48  |     await page.waitForLoadState('networkidle');
  49  | 
  50  |     expect(page.url()).toContain('/scholars-international-tahfiz-academy/dashboard');
  51  |     const pageText = await page.textContent('body');
  52  |     expect(pageText).toContain('Scholars International Tahfiz Academy');
  53  | 
  54  |     // Verify Principal Profile Name (Mohammad Saifullah) appears in header/UI
  55  |     expect(pageText).toMatch(/Mohammad Saifullah/i);
  56  | 
  57  |     // Verify Hifz module navigation
  58  |     await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/hifz`);
  59  |     await page.waitForLoadState('networkidle');
  60  |     const hifzText = await page.textContent('body');
  61  |     expect(hifzText).toMatch(/Hifz|Quran|Tahfiz|Student/i);
  62  |   });
  63  | 
  64  |   // 4. Authenticated SITA Principal on Alias (/sita) -> Redirect to Canonical ERP Dashboard
  65  |   test('4. Authenticated SITA Principal on alias (/sita) redirects to canonical SITA ERP Dashboard', async ({ page }) => {
  66  |     await page.goto(`${BASE_URL}/login`);
  67  |     await page.fill('input[type="email"], input[name="email"]', sitaEmail);
  68  |     await page.fill('input[type="password"], input[name="password"]', sitaPass);
  69  |     await page.click('button[type="submit"]');
  70  | 
  71  |     await page.waitForURL('**/scholars-international-tahfiz-academy/**', { timeout: 15000 }).catch(() => {});
  72  | 
  73  |     await page.goto(`${BASE_URL}/sita`);
  74  |     await page.waitForLoadState('networkidle');
  75  | 
  76  |     expect(page.url()).toContain('/scholars-international-tahfiz-academy/dashboard');
  77  |     const pageText = await page.textContent('body');
> 78  |     expect(pageText).toContain('Scholars International Tahfiz Academy');
      |                      ^ Error: expect(received).toContain(expected) // indexOf
  79  |   });
  80  | 
  81  |   // 5. Admission Wizard Modal High Contrast Verification
  82  |   test('5. SITA Admission page renders with high contrast New Admission modal', async ({ page }) => {
  83  |     await page.goto(`${BASE_URL}/login`);
  84  |     await page.fill('input[type="email"], input[name="email"]', sitaEmail);
  85  |     await page.fill('input[type="password"], input[name="password"]', sitaPass);
  86  |     await page.click('button[type="submit"]');
  87  |     await page.waitForURL('**/scholars-international-tahfiz-academy/**', { timeout: 15000 }).catch(() => {});
  88  | 
  89  |     await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/admission`);
  90  |     await page.waitForLoadState('networkidle');
  91  | 
  92  |     const pageText = await page.textContent('body');
  93  |     expect(pageText).toMatch(/Admission|Application|Candidate|Applicant/i);
  94  |   });
  95  | 
  96  |   // 6. HR Workforce & Campus Resolution Verification
  97  |   test('6. SITA HR Workforce page loads with campus context and high contrast modals', async ({ page }) => {
  98  |     await page.goto(`${BASE_URL}/login`);
  99  |     await page.fill('input[type="email"], input[name="email"]', sitaEmail);
  100 |     await page.fill('input[type="password"], input[name="password"]', sitaPass);
  101 |     await page.click('button[type="submit"]');
  102 |     await page.waitForURL('**/scholars-international-tahfiz-academy/**', { timeout: 15000 }).catch(() => {});
  103 | 
  104 |     await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/hr`);
  105 |     await page.waitForLoadState('networkidle');
  106 | 
  107 |     const pageText = await page.textContent('body');
  108 |     expect(pageText).toMatch(/Workforce|Employee|Attendance|Payroll|Leave/i);
  109 |   });
  110 | 
  111 |   // 7. Finance & Standard Chart of Accounts Verification
  112 |   test('7. SITA Finance page loads with Chart of Accounts and Journal Voucher capabilities', async ({ page }) => {
  113 |     await page.goto(`${BASE_URL}/login`);
  114 |     await page.fill('input[type="email"], input[name="email"]', sitaEmail);
  115 |     await page.fill('input[type="password"], input[name="password"]', sitaPass);
  116 |     await page.click('button[type="submit"]');
  117 |     await page.waitForURL('**/scholars-international-tahfiz-academy/**', { timeout: 15000 }).catch(() => {});
  118 | 
  119 |     await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/finance`);
  120 |     await page.waitForLoadState('networkidle');
  121 | 
  122 |     const pageText = await page.textContent('body');
  123 |     expect(pageText).toMatch(/Finance|Ledger|Accounts|Voucher|Journal/i);
  124 |   });
  125 | 
  126 |   // 8. Communication Notice Board & Truthful SMS Status Verification
  127 |   test('8. SITA Communication page loads with notice board and truthful SMS gateway status', async ({ page }) => {
  128 |     await page.goto(`${BASE_URL}/login`);
  129 |     await page.fill('input[type="email"], input[name="email"]', sitaEmail);
  130 |     await page.fill('input[type="password"], input[name="password"]', sitaPass);
  131 |     await page.click('button[type="submit"]');
  132 |     await page.waitForURL('**/scholars-international-tahfiz-academy/**', { timeout: 15000 }).catch(() => {});
  133 | 
  134 |     await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/communication`);
  135 |     await page.waitForLoadState('networkidle');
  136 | 
  137 |     const pageText = await page.textContent('body');
  138 |     expect(pageText).toMatch(/Communication|Notice|Circular|SMS/i);
  139 |   });
  140 | 
  141 |   // 9. Facilities Management & Action Modals Verification
  142 |   test('9. SITA Facilities page loads all operational tabs with actionable buttons and zero dead buttons', async ({ page }) => {
  143 |     await page.goto(`${BASE_URL}/login`);
  144 |     await page.fill('input[type="email"], input[name="email"]', sitaEmail);
  145 |     await page.fill('input[type="password"], input[name="password"]', sitaPass);
  146 |     await page.click('button[type="submit"]');
  147 |     await page.waitForURL('**/scholars-international-tahfiz-academy/**', { timeout: 15000 }).catch(() => {});
  148 | 
  149 |     await page.goto(`${BASE_URL}/scholars-international-tahfiz-academy/facilities`);
  150 |     await page.waitForLoadState('networkidle');
  151 | 
  152 |     const pageText = await page.textContent('body');
  153 |     expect(pageText).toMatch(/Facilities|Library|Hostel|Transport|Inventory|Fixed Assets/i);
  154 |   });
  155 | 
  156 |   // 10. Platform Super Admin (bloodsoft24@gmail.com) logs in to SaaS Control Plane
  157 |   test('10. Platform Super Admin (bloodsoft24@gmail.com) logs in and inspects SITA in SaaS Control Plane', async ({ page }) => {
  158 |     await page.goto(`${BASE_URL}/login`);
  159 |     await page.fill('input[type="email"], input[name="email"]', superAdminEmail);
  160 |     await page.fill('input[type="password"], input[name="password"]', superAdminPass);
  161 |     await page.click('button[type="submit"]');
  162 | 
  163 |     await page.waitForURL('**/super-admin**', { timeout: 15000 });
  164 | 
  165 |     await page.goto(`${BASE_URL}/super-admin/institutions`);
  166 |     await page.waitForLoadState('networkidle');
  167 |     const institutionsText = await page.textContent('body');
  168 |     expect(institutionsText).toContain('Scholars International Tahfiz Academy');
  169 |     expect(institutionsText).toContain('MADRASHA');
  170 |   });
  171 | });
  172 | 
```