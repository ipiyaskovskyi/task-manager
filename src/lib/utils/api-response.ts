import { NextResponse } from 'next/server';
import { AppError, ValidationError } from '../errors';

export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status });
}

export function errorResponse(error: unknown, status?: number): NextResponse {
  if (error instanceof AppError) {
    const response: { error: string; details?: unknown } = {
      error: error.message,
    };

    if (error instanceof ValidationError && error.details) {
      response.details = error.details;
    }

    return NextResponse.json(response, {
      status: status || error.statusCode || 500,
    });
  }

  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: status || 500 }
  );
}
