export type AppErrorCode =
  | 'UNAUTHENTICATED'
  | 'UNAUTHORIZED'
  | 'TENANT_NOT_FOUND'
  | 'CROSS_TENANT_ACCESS'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INVALID_STATE_TRANSITION'
  | 'INSUFFICIENT_PERMISSION'
  | 'PREREQUISITE_NOT_MET'
  | 'CREDIT_LIMIT_EXCEEDED'
  | 'UNBALANCED_JOURNAL_ENTRY'
  | 'ROOM_CONFLICT'
  | 'TEACHER_CONFLICT'
  | 'TEACHER_UNAVAILABLE'
  | 'SECTION_CONFLICT'
  | 'INTERNAL_SERVER_ERROR';

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(message: string, code: AppErrorCode = 'INTERNAL_SERVER_ERROR', statusCode = 500, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static unauthenticated(msg = 'Authentication required'): AppError {
    return new AppError(msg, 'UNAUTHENTICATED', 401);
  }

  static forbidden(msg = 'Insufficient permissions for this operation', details?: any): AppError {
    return new AppError(msg, 'INSUFFICIENT_PERMISSION', 403, details);
  }

  static notFound(msg = 'Requested resource was not found'): AppError {
    return new AppError(msg, 'NOT_FOUND', 404);
  }

  static validation(msg = 'Validation error occurred', details?: any): AppError {
    return new AppError(msg, 'VALIDATION_ERROR', 400, details);
  }

  static badRequest(msg = 'Bad request'): AppError {
    return new AppError(msg, 'VALIDATION_ERROR', 400);
  }

  static conflict(msg = 'Resource conflict or duplicate constraint'): AppError {
    return new AppError(msg, 'CONFLICT', 409);
  }

  static invalidTransition(fromState: string, toState: string): AppError {
    return new AppError(
      `Invalid lifecycle transition from state '${fromState}' to '${toState}'.`,
      'INVALID_STATE_TRANSITION',
      400
    );
  }

  static crossTenant(): AppError {
    return new AppError(
      'Access Denied: Cross-tenant data boundary violation.',
      'CROSS_TENANT_ACCESS',
      403
    );
  }

  static internal(msg = 'Internal server error'): AppError {
    return new AppError(msg, 'INTERNAL_SERVER_ERROR', 500);
  }
}
