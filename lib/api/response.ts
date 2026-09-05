/**
 * Structured API Response Helpers
 *
 * All API routes return consistent ApiResponse<T> envelopes.
 * Errors are always typed — no raw exceptions reach the client.
 */

import { NextResponse } from 'next/server';
import { toApiError } from '../errors';
import type { ApiResponse, ErrorCode } from '../../src/types';

/**
 * Returns a typed success response with 200 status.
 */
export function ok<T>(data: T, requestId?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data, requestId }, { status: 200 });
}

/**
 * Returns a typed success response with custom status.
 */
export function created<T>(data: T, requestId?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data, requestId }, { status: 201 });
}

/**
 * Returns a typed error response. Never exposes internal info.
 */
export function error(
  code: ErrorCode,
  message: string,
  statusCode = 400,
  requestId?: string
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    { success: false, error: { code, message }, requestId },
    { status: statusCode }
  );
}

/**
 * Converts any thrown error (VerifyAIError or unknown) to a safe HTTP response.
 */
export function fromError(err: unknown, requestId?: string): NextResponse<ApiResponse<never>> {
  const { code, message, statusCode } = toApiError(err);
  return error(code as ErrorCode, message, statusCode, requestId);
}

/**
 * Generates an RFC-style request ID for end-to-end tracing.
 * Format: req_{timestamp36}_{random9}
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * No content response (204).
 */
export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
