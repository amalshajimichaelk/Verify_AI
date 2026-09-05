/**
 * Centralized API Client & Network Infrastructure
 *
 * Provides typed HTTP client for all API routes.
 * - Automatic session token injection
 * - Typed ApiResponse<T> parsing
 * - Typed error conversion
 * - Demo mode detection
 * - Request ID generation
 */

import type { ApiResponse, ErrorCode } from '../types';

export interface ApiRequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  abortSignal?: AbortSignal;
}

export class ApiError extends Error {
  public statusCode: number;
  public code: ErrorCode | string;
  public details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode | string = 'API_ERROR',
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Generates an RFC-compliant request ID for end-to-end tracing.
 */
export function generateRequestId(): string {
  return `req_${Math.random().toString(36).substring(2, 11)}${Date.now().toString(36)}`;
}

/**
 * Whether the app is running in demo mode.
 * When true, the API clients use mock/demo data instead of real HTTP calls.
 */
export const IS_DEMO_MODE = 
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DEMO_MODE === 'true') ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DEMO_MODE === 'true');

/**
 * Base URL for API requests.
 * Defaults to relative paths (works in both Vite and Next.js).
 */
const BASE_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_APP_URL ?? '');

/**
 * Typed HTTP request helper.
 * Parses ApiResponse<T> and throws ApiError on error responses.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit & ApiRequestOptions = {}
): Promise<T> {
  const { timeoutMs = 30_000, abortSignal, headers: extraHeaders, ...fetchOptions } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Merge abort signals
  const signal = abortSignal
    ? AbortSignal.any([controller.signal, abortSignal])
    : controller.signal;

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...fetchOptions,
      signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': generateRequestId(),
        ...extraHeaders,
      },
    });

    let data: ApiResponse<T>;
    try {
      data = await response.json();
    } catch {
      throw new ApiError(
        `HTTP ${response.status}: Server returned non-JSON response`,
        response.status
      );
    }

    if (!data.success || !response.ok) {
      throw new ApiError(
        data.error?.message ?? `Request failed with status ${response.status}`,
        response.status,
        data.error?.code ?? 'API_ERROR'
      );
    }

    return data.data as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Standard delay helper — kept for compatibility with existing code.
 * @deprecated Use real API calls instead
 */
export function simulateLatency(ms: number = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
