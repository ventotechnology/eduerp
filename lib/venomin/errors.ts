export const VENOMIN_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  AUTH_FAILED: 'AUTH_FAILED',
  PRODUCTION_MODE_BLOCKED: 'PRODUCTION_MODE_BLOCKED',
  INSUFFICIENT_SCOPE: 'INSUFFICIENT_SCOPE',
  INVALID_VERSION: 'INVALID_VERSION',
  INVALID_CONFIGURATION: 'INVALID_CONFIGURATION',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  TENANT_CREATION_FAILED: 'TENANT_CREATION_FAILED',
  PLAN_MAPPING_REQUIRED: 'PLAN_MAPPING_REQUIRED',
  INSTITUTION_TYPE_MAPPING_REQUIRED: 'INSTITUTION_TYPE_MAPPING_REQUIRED',
  SSO_INVALID: 'SSO_INVALID',
  WEBHOOK_DELIVERY_FAILED: 'WEBHOOK_DELIVERY_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type VenominErrorCode = (typeof VENOMIN_ERROR_CODES)[keyof typeof VENOMIN_ERROR_CODES];

export interface CustomerSafeError {
  errorCode: VenominErrorCode;
  safeMessage: string;
  status: number;
}

export function getCustomerSafeError(code: string): CustomerSafeError {
  switch (code) {
    case VENOMIN_ERROR_CODES.UNAUTHORIZED:
    case VENOMIN_ERROR_CODES.AUTH_FAILED:
      return {
        errorCode: VENOMIN_ERROR_CODES.AUTH_FAILED,
        safeMessage: 'Authentication credentials for EduERP integration were invalid or expired.',
        status: 401,
      };

    case VENOMIN_ERROR_CODES.PRODUCTION_MODE_BLOCKED:
      return {
        errorCode: VENOMIN_ERROR_CODES.PRODUCTION_MODE_BLOCKED,
        safeMessage: 'Live production operations are disabled in this environment.',
        status: 403,
      };

    case VENOMIN_ERROR_CODES.INSUFFICIENT_SCOPE:
      return {
        errorCode: VENOMIN_ERROR_CODES.INSUFFICIENT_SCOPE,
        safeMessage: 'Integration credentials lack required permissions for this action.',
        status: 403,
      };

    case VENOMIN_ERROR_CODES.INVALID_CONFIGURATION:
    case VENOMIN_ERROR_CODES.INSTITUTION_TYPE_MAPPING_REQUIRED:
      return {
        errorCode: VENOMIN_ERROR_CODES.INVALID_CONFIGURATION,
        safeMessage: 'The provided educational institution configuration or parameters are invalid.',
        status: 400,
      };

    case VENOMIN_ERROR_CODES.ACCOUNT_NOT_FOUND:
      return {
        errorCode: VENOMIN_ERROR_CODES.ACCOUNT_NOT_FOUND,
        safeMessage: 'The requested educational institution workspace was not found.',
        status: 404,
      };

    case VENOMIN_ERROR_CODES.SSO_INVALID:
      return {
        errorCode: VENOMIN_ERROR_CODES.SSO_INVALID,
        safeMessage: 'Single Sign-On authentication failed or the token has expired.',
        status: 401,
      };

    case VENOMIN_ERROR_CODES.PLAN_MAPPING_REQUIRED:
      return {
        errorCode: VENOMIN_ERROR_CODES.PLAN_MAPPING_REQUIRED,
        safeMessage: 'Selected educational subscription tier requires manual review or configuration.',
        status: 400,
      };

    default:
      return {
        errorCode: VENOMIN_ERROR_CODES.INTERNAL_ERROR,
        safeMessage: 'An internal error occurred while processing the educational institution request.',
        status: 500,
      };
  }
}
