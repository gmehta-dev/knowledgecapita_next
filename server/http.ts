import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import type Joi from 'joi';
import { connectDB } from './db';
import { ApiError, ValidationFailed, errorResponse } from './errors';

export type RouteContext<P = Record<string, string>> = { params: Promise<P> };

/**
 * Wraps a Route Handler: connects to MongoDB and maps thrown errors to the
 * legacy Express error responses.
 */
export function handler<P = Record<string, string>>(
  fn: (req: NextRequest, ctx: RouteContext<P>) => Promise<Response>
) {
  return async (req: NextRequest, ctx: RouteContext<P>): Promise<Response> => {
    try {
      await connectDB();
      return await fn(req, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

/** Equivalent of express.json() + express.urlencoded(): always returns an object. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readBody(req: NextRequest): Promise<any> {
  const type = req.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    const text = await req.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      throw new ApiError(400, 'Invalid JSON body');
    }
  }
  if (type.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(await req.text()));
  }
  return {};
}

/** Port of the `validate(schema)` middleware. Validates only; the raw body is used afterwards (as before). */
export function validate(schema: Joi.ObjectSchema, body: unknown): void {
  const { error } = schema.validate(body, { abortEarly: false });
  if (!error) return;

  const errors: Record<string, string[]> = {};
  error.details.forEach((detail) => {
    const key = detail.path.join('.');
    if (!errors[key]) errors[key] = [];
    errors[key].push(detail.message);
  });
  throw new ValidationFailed(errors);
}

export function assertObjectId(id: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid ID format');
  }
}
