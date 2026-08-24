/**
 * Monetary Precision & Calculation Utility
 * 
 * Prevents IEEE-754 floating point imprecision across invoices, payments,
 * journals, scholarships, payroll, and general ledger calculations.
 * All internal math operates on integer minor currency units (cents/poisha).
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  precision: number;
}

export const DEFAULT_CURRENCY: CurrencyConfig = {
  code: 'BDT',
  symbol: '৳',
  precision: 2,
};

/**
 * Converts a floating-point money amount to integer minor units (e.g. cents/poisha).
 */
export function toMinorUnits(amount: number, precision: number = 2): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  const factor = Math.pow(10, precision);
  return Math.round(amount * factor);
}

/**
 * Converts integer minor units back to a float representation rounded to specified precision.
 */
export function fromMinorUnits(minorUnits: number, precision: number = 2): number {
  if (isNaN(minorUnits) || !isFinite(minorUnits)) return 0;
  const factor = Math.pow(10, precision);
  return minorUnits / factor;
}

/**
 * Safely rounds an amount to 2 decimal places.
 */
export function roundMoney(amount: number, precision: number = 2): number {
  return fromMinorUnits(toMinorUnits(amount, precision), precision);
}

/**
 * Exact monetary addition using integer minor units.
 */
export function addMoney(a: number, b: number, precision: number = 2): number {
  const sumMinor = toMinorUnits(a, precision) + toMinorUnits(b, precision);
  return fromMinorUnits(sumMinor, precision);
}

/**
 * Exact monetary subtraction using integer minor units.
 */
export function subtractMoney(a: number, b: number, precision: number = 2): number {
  const diffMinor = toMinorUnits(a, precision) - toMinorUnits(b, precision);
  return fromMinorUnits(diffMinor, precision);
}

/**
 * Calculates a percentage of an amount with safe rounding.
 */
export function calculatePercentage(amount: number, percentage: number, precision: number = 2): number {
  if (percentage <= 0 || amount <= 0) return 0;
  const minorAmount = toMinorUnits(amount, precision);
  const resultMinor = Math.round((minorAmount * percentage) / 100);
  return fromMinorUnits(resultMinor, precision);
}

/**
 * Validates strict double-entry equality between two sum amounts.
 */
export function areAmountsBalanced(debits: number, credits: number, precision: number = 2): boolean {
  const debitsMinor = toMinorUnits(debits, precision);
  const creditsMinor = toMinorUnits(credits, precision);
  return debitsMinor === creditsMinor;
}

/**
 * Computes authoritative net invoice amount:
 * Net = Gross - Scholarship - Discount - Waiver + Fine + Tax
 */
export function calculateNetInvoiceAmount(params: {
  subTotal: number;
  scholarshipAmount?: number;
  discountAmount?: number;
  waiverAmount?: number;
  fineAmount?: number;
  taxAmount?: number;
  precision?: number;
}): {
  subTotal: number;
  scholarshipAmount: number;
  discountAmount: number;
  waiverAmount: number;
  fineAmount: number;
  taxAmount: number;
  totalAmount: number;
} {
  const p = params.precision || 2;
  const subTotal = roundMoney(params.subTotal || 0, p);
  const scholarshipAmount = roundMoney(params.scholarshipAmount || 0, p);
  const discountAmount = roundMoney(params.discountAmount || 0, p);
  const waiverAmount = roundMoney(params.waiverAmount || 0, p);
  const fineAmount = roundMoney(params.fineAmount || 0, p);
  const taxAmount = roundMoney(params.taxAmount || 0, p);

  const subMinor = toMinorUnits(subTotal, p);
  const schMinor = toMinorUnits(scholarshipAmount, p);
  const disMinor = toMinorUnits(discountAmount, p);
  const waiMinor = toMinorUnits(waiverAmount, p);
  const fineMinor = toMinorUnits(fineAmount, p);
  const taxMinor = toMinorUnits(taxAmount, p);

  const totalMinor = Math.max(0, subMinor - schMinor - disMinor - waiMinor + fineMinor + taxMinor);
  const totalAmount = fromMinorUnits(totalMinor, p);

  return {
    subTotal,
    scholarshipAmount,
    discountAmount,
    waiverAmount,
    fineAmount,
    taxAmount,
    totalAmount,
  };
}

/**
 * Computes authoritative net payroll breakdown:
 * Gross = Basic + HouseRent + Medical + Transport + Other
 * Deductions = PF + Tax + Loan + Advance
 * Net = Gross - Deductions
 */
export function calculateNetPayrollBreakdown(params: {
  basicSalary: number;
  houseRent?: number;
  medicalAllowance?: number;
  transportAllowance?: number;
  otherAllowance?: number;
  providentFundDeduction?: number;
  taxDeduction?: number;
  loanDeduction?: number;
  advanceDeduction?: number;
  precision?: number;
}): {
  basicSalary: number;
  houseRent: number;
  medicalAllowance: number;
  transportAllowance: number;
  otherAllowance: number;
  grossSalary: number;
  providentFundDeduction: number;
  taxDeduction: number;
  loanDeduction: number;
  advanceDeduction: number;
  totalDeduction: number;
  netSalary: number;
} {
  const p = params.precision || 2;
  const basicSalary = roundMoney(params.basicSalary || 0, p);
  const houseRent = roundMoney(params.houseRent || 0, p);
  const medicalAllowance = roundMoney(params.medicalAllowance || 0, p);
  const transportAllowance = roundMoney(params.transportAllowance || 0, p);
  const otherAllowance = roundMoney(params.otherAllowance || 0, p);

  const pf = roundMoney(params.providentFundDeduction || 0, p);
  const tax = roundMoney(params.taxDeduction || 0, p);
  const loan = roundMoney(params.loanDeduction || 0, p);
  const adv = roundMoney(params.advanceDeduction || 0, p);

  const grossMinor = toMinorUnits(basicSalary, p) +
    toMinorUnits(houseRent, p) +
    toMinorUnits(medicalAllowance, p) +
    toMinorUnits(transportAllowance, p) +
    toMinorUnits(otherAllowance, p);

  const deductionMinor = toMinorUnits(pf, p) +
    toMinorUnits(tax, p) +
    toMinorUnits(loan, p) +
    toMinorUnits(adv, p);

  const netMinor = Math.max(0, grossMinor - deductionMinor);

  return {
    basicSalary,
    houseRent,
    medicalAllowance,
    transportAllowance,
    otherAllowance,
    grossSalary: fromMinorUnits(grossMinor, p),
    providentFundDeduction: pf,
    taxDeduction: tax,
    loanDeduction: loan,
    advanceDeduction: adv,
    totalDeduction: fromMinorUnits(deductionMinor, p),
    netSalary: fromMinorUnits(netMinor, p),
  };
}

/**
 * Formats a monetary amount into a human-readable string with currency symbol.
 */
export function formatMoney(amount: number, currency: CurrencyConfig = DEFAULT_CURRENCY): string {
  const rounded = roundMoney(amount, currency.precision);
  return `${currency.symbol} ${rounded.toLocaleString(undefined, {
    minimumFractionDigits: currency.precision,
    maximumFractionDigits: currency.precision,
  })}`;
}
