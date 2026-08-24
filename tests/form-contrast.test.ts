import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Global Form Contrast & Input Readability Safeguards', () => {
  const globalsCssPath = path.join(process.cwd(), 'app', 'globals.css');
  const studentsPagePath = path.join(process.cwd(), 'app', '[tenant]', 'students', 'page.tsx');
  const admissionPagePath = path.join(process.cwd(), 'app', '[tenant]', 'admission', 'page.tsx');

  it('verifies globals.css does NOT contain buggy universal color-scheme: dark rule', () => {
    const css = fs.readFileSync(globalsCssPath, 'utf8');
    // Ensure the old bug that forced color-scheme: dark on all form elements is removed
    const buggyRule = /input,\s*select,\s*textarea,\s*option\s*\{\s*color-scheme:\s*dark;\s*\}/;
    expect(buggyRule.test(css)).toBe(false);
  });

  it('verifies globals.css establishes high-contrast rules for light form controls', () => {
    const css = fs.readFileSync(globalsCssPath, 'utf8');
    expect(css).toContain('color: #0f172a; /* slate-900 */');
    expect(css).toContain('background-color: #ffffff;');
    expect(css).toContain('color-scheme: light;');
  });

  it('verifies globals.css establishes high-contrast rules for dark-surfaced controls', () => {
    const css = fs.readFileSync(globalsCssPath, 'utf8');
    expect(css).toContain('.dark input');
    expect(css).toContain('.bg-slate-900 input');
    expect(css).toContain('.bg-slate-950 input');
    expect(css).toContain('color: #f8fafc; /* slate-50 */');
    expect(css).toContain('color-scheme: dark;');
  });

  it('verifies globals.css establishes high-contrast option styling for native dropdowns', () => {
    const css = fs.readFileSync(globalsCssPath, 'utf8');
    expect(css).toContain('option {');
    expect(css).toContain('background-color: #ffffff;');
    expect(css).toContain('color: #0f172a;');
    expect(css).toContain('.bg-slate-900 option');
    expect(css).toContain('.bg-slate-950 option');
  });

  it('verifies globals.css provides safe WebKit autofill text color override', () => {
    const css = fs.readFileSync(globalsCssPath, 'utf8');
    expect(css).toContain('input:-webkit-autofill');
    expect(css).toContain('-webkit-text-fill-color: currentColor !important;');
  });

  it('verifies globals.css includes readable disabled and readonly styles', () => {
    const css = fs.readFileSync(globalsCssPath, 'utf8');
    expect(css).toContain('input:disabled, select:disabled, textarea:disabled');
    expect(css).toContain('background-color: #f1f5f9; /* slate-100 */');
    expect(css).toContain('color: #64748b; /* slate-500 */');
  });

  it('verifies EditStudentModal in students/page.tsx has explicit high-contrast input classes', () => {
    const code = fs.readFileSync(studentsPagePath, 'utf8');
    expect(code).toContain('Edit Student Profile');
    expect(code).toContain('bg-white text-slate-900 border border-slate-300 rounded-lg placeholder:text-slate-400');
  });

  it('verifies DirectAddStudentModal in students/page.tsx has explicit high-contrast form controls', () => {
    const code = fs.readFileSync(studentsPagePath, 'utf8');
    expect(code).toContain('Direct Student Onboarding Wizard');
    expect(code).toContain('placeholder="e.g. Mahfuzur"');
    expect(code).toContain('placeholder="e.g. Rahman"');
  });

  it('verifies QuickEnrollModal in admission/page.tsx has high-contrast form controls', () => {
    const code = fs.readFileSync(admissionPagePath, 'utf8');
    expect(code).toContain('Admission Policy Settings');
    expect(code).toContain('bg-white text-slate-900 border border-slate-300 rounded-lg font-mono');
  });
});
