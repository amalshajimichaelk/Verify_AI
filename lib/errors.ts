/**
 * Typed Error System for VerifyAI
 *
 * Design principles:
 * - Every error has a typed code (ErrorCode union)
 * - HTTP status codes are part of the error
 * - Internal details are never exposed to users
 * - Safe serialization strips stack traces
 */

import type { ErrorCode } from '../src/types';

export class VerifyAIError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'VerifyAIError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  /** Returns a safe user-facing representation — no stack traces or internal info */
  toUserResponse(): { code: ErrorCode; message: string } {
    return { code: this.code, message: this.message };
  }
}

/** Pre-built factory methods for common error cases */
export const Errors = {
  unauthorized: () =>
    new VerifyAIError('UNAUTHORIZED', 'Authentication required.', 401),

  forbidden: () =>
    new VerifyAIError('FORBIDDEN', 'You do not have permission to access this resource.', 403),

  notFound: (resource: string) =>
    new VerifyAIError('NOT_FOUND', `${resource} not found.`, 404),

  rateLimited: () =>
    new VerifyAIError('RATE_LIMITED', 'Too many requests. Please wait before retrying.', 429),

  invalidInput: (message: string) =>
    new VerifyAIError('INVALID_INPUT', message, 400),

  unsupportedMedia: (message: string) =>
    new VerifyAIError('UNSUPPORTED_MEDIA', message, 415),

  fileTooLarge: (maxMb: number) =>
    new VerifyAIError('FILE_TOO_LARGE', `File exceeds the ${maxMb}MB limit.`, 413),

  ssrfBlocked: () =>
    new VerifyAIError('SSRF_BLOCKED', 'The provided URL is not allowed for security reasons.', 400),

  analysisFailed: (reason?: string) =>
    new VerifyAIError('ANALYSIS_FAILED', reason || 'Analysis failed. Please retry.', 500),

  modelUnavailable: () =>
    new VerifyAIError('MODEL_UNAVAILABLE', 'Analysis provider is temporarily unavailable.', 503),

  duplicateJob: (jobId: string) =>
    new VerifyAIError('DUPLICATE_JOB', `An analysis job is already active.`, 409, { existingJobId: jobId }),

  uploadFailed: (reason?: string) =>
    new VerifyAIError('UPLOAD_FAILED', reason || 'Media upload failed.', 500),

  timeout: () =>
    new VerifyAIError('TIMEOUT', 'The operation timed out. Please try again.', 504),

  internal: (message = 'An internal error occurred.') =>
    new VerifyAIError('API_ERROR', message, 500),
};

/**
 * Maps a VerifyAIError (or unknown error) to a safe HTTP response payload.
 * Never leaks stack traces or internal error details.
 */
export function toApiError(err: unknown): {
  code: ErrorCode;
  message: string;
  statusCode: number;
} {
  if (err instanceof VerifyAIError) {
    return {
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
    };
  }

  // Unknown error — return generic message, never expose internal
  console.error('[VerifyAI] Unhandled error:', err);
  return {
    code: 'API_ERROR',
    message: 'An unexpected error occurred. Please try again.',
    statusCode: 500,
  };
}

/** Type guard */
export function isVerifyAIError(err: unknown): err is VerifyAIError {
  return err instanceof VerifyAIError;
}
