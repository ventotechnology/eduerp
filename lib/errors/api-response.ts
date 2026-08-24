import { NextResponse } from 'next/server';
import { AppError } from './app-error';
import { ZodError } from 'zod';

export function successResponse<T>(data: T, message?: string, statusCode = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data
    },
    { status: statusCode }
  );
}

export function errorResponse(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        code: err.code,
        error: err.message,
        details: err.details
      },
      { status: err.statusCode }
    );
  }

  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        code: 'VALIDATION_ERROR',
        error: 'Input validation failed.',
        details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      },
      { status: 400 }
    );
  }

  console.error('Unhandled server error:', err);

  const message = err instanceof Error ? err.message : 'An unexpected error occurred';
  return NextResponse.json(
    {
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      error: message
    },
    { status: 500 }
  );
}
