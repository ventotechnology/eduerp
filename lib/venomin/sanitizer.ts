/**
 * Strict Recursive Privacy & Security Sanitizer for EduERP -> Venomin Integration
 *
 * Excludes at minimum:
 * - Credentials & Auth: password*, token*, secret*, cookie*, authorization*, apiKey*
 * - Student / Minor PII: student*, guardian*, parent*, dob*, birth*, nid*, passport*,
 *   medical*, health*, allergy*, disability*, specialNeeds*, photo*, biometric*
 * - Academic Records: attendance*, grade*, result*, mark*, transcript*, assessment*, disciplinary*, gpa*, cgpa*
 * - Financial & Payroll: bank*, accountNumber*, card*, cvv*, pin*, salary*, payroll*
 */

const BLOCKED_KEY_PATTERNS = [
  /^password/i,
  /^token/i,
  /^secret/i,
  /^cookie/i,
  /^authorization/i,
  /^apiKey/i,
  /^api_key/i,
  /^authSecret/i,
  /^sessionSecret/i,
  /^jwtSecret/i,

  // Student & Minor PII
  /^student/i,
  /^guardian/i,
  /^parent/i,
  /^dob/i,
  /^birth/i,
  /^dateOfBirth/i,
  /^nid/i,
  /^passport/i,
  /^medical/i,
  /^health/i,
  /^allergy/i,
  /^disability/i,
  /^specialNeeds/i,
  /^photo/i,
  /^biometric/i,
  /^candidate/i,
  /^applicant/i,
  /^admission/i,
  /^enrollment/i,

  // Academic Performance & Attendance
  /^attendance/i,
  /attendance/i,
  /^grade/i,
  /grade/i,
  /^result/i,
  /result/i,
  /^mark/i,
  /^marks/i,
  /marks/i,
  /^exam/i,
  /exam/i,
  /^transcript/i,
  /transcript/i,
  /^assessment/i,
  /^disciplinary/i,
  /^gpa/i,
  /^cgpa/i,
  /^hifz/i,


  // Student Fees (must never become SaaS payment facts)
  /^studentFee/i,
  /^tuition/i,
  /^waiver/i,
  /^scholarship/i,

  // Banking & Staff Financials
  /^bank/i,
  /^accountNumber/i,
  /^account_number/i,
  /^card/i,
  /^cvv/i,
  /^pin/i,
  /^salary/i,
  /^payroll/i,
  /^remuneration/i,
];

// Whitelist of allowed metadata keys that might match patterns above but are institution-level safe
const ALLOWED_EXACT_KEYS = new Set([
  'isSynthetic',
  'syntheticReason',
  'tenantId',
  'tenantSlug',
  'tenantCode',
  'institutionId',
  'institutionName',
  'institutionType',
  'campusId',
  'campusName',
  'planId',
  'planCode',
  'planName',
  'subscriptionTier',
  'billingCycle',
  'amount',
  'currency',
  'currencyCode',
  'status',
  'orderId',
  'orderNumber',
  'invoiceId',
  'invoiceNumber',
  'transactionId',
  'trxId',
  'paymentMethod',
  'gateway',
  'ticketId',
  'ticketNumber',
  'subject',
  'categoryCode',
  'priority',
  'relatedModule',
  'occurredAt',
  'createdAt',
  'updatedAt',
]);

export function isBlockedKey(key: string): boolean {
  if (ALLOWED_EXACT_KEYS.has(key)) {
    return false;
  }
  return BLOCKED_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Recursively sanitizes any payload object or array
 */
export function sanitizeIntegrationPayload<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (data instanceof Date) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeIntegrationPayload(item)) as unknown as T;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (isBlockedKey(key)) {
      continue;
    }
    if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeIntegrationPayload(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}
