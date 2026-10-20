import 'server-only';
import { NextResponse } from 'next/server';

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export class ValidationFailed extends Error {
  errors: Record<string, string[]>;
  constructor(errors: Record<string, string[]>) {
    super('Validation failed');
    this.errors = errors;
    this.name = 'ValidationFailed';
  }
}

/** Port of the Express `errorHandler` middleware - same statuses and bodies. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function errorResponse(err: any): NextResponse {
  if (err instanceof ValidationFailed) {
    return NextResponse.json({ message: 'Validation failed', errors: err.errors }, { status: 422 });
  }

  if (err instanceof ApiError) {
    return NextResponse.json({ message: err.message }, { status: err.statusCode });
  }

  // Mongoose validation error
  if (err?.name === 'ValidationError' && err.errors) {
    const errors: Record<string, string[]> = {};
    Object.keys(err.errors).forEach((key) => {
      errors[key] = [err.errors[key].message];
    });
    return NextResponse.json({ message: 'Validation failed', errors }, { status: 422 });
  }

  // Mongoose duplicate key error
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return NextResponse.json(
      { message: 'Validation failed', errors: { [field]: [`${field} is already taken`] } },
      { status: 400 }
    );
  }

  // Mongoose cast error (invalid ObjectId)
  if (err?.name === 'CastError') {
    return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
  }

  // JWT errors
  if (err?.name === 'JsonWebTokenError') {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }
  if (err?.name === 'TokenExpiredError') {
    return NextResponse.json({ message: 'Token expired' }, { status: 401 });
  }

  console.error('Unhandled Error:', err);
  return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
}
