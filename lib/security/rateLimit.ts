/**
 * Rate Limiter — Upstash Redis
 *
 * Wraps @upstash/ratelimit for per-endpoint, per-user rate limiting.
 * Falls back gracefully if Redis is not configured (dev/demo mode).
 */

import { Errors } from '../errors';

interface RateLimitConfig {
  requests: number;
  windowSeconds: number;
}

/** Per-endpoint rate limit configurations */
export const RATE_LIMITS = {
  upload: { requests: 20, windowSeconds: 3600 },           // 20 uploads/hour
  analyze: { requests: 50, windowSeconds: 3600 },           // 50 analyses/hour
  sourceQuery: { requests: 100, windowSeconds: 3600 },      // 100 source lookups/hour
  reportGenerate: { requests: 20, windowSeconds: 3600 },    // 20 reports/hour
  authSensitive: { requests: 10, windowSeconds: 300 },      // 10/5min for auth endpoints
  general: { requests: 300, windowSeconds: 60 },            // 300 req/min general
} as const satisfies Record<string, RateLimitConfig>;

export type RateLimitEndpoint = keyof typeof RATE_LIMITS;

/**
 * Checks rate limit for a given identifier (userId or IP).
 * Throws RATE_LIMITED error if limit exceeded.
 * Silently passes if Upstash is not configured (dev/demo mode).
 */
export async function checkRateLimit(
  endpoint: RateLimitEndpoint,
  identifier: string
): Promise<void> {
  // If Upstash is not configured, skip rate limiting (dev/demo)
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return;
  }

  try {
    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis } = await import('@upstash/redis');

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    const config = RATE_LIMITS[endpoint];

    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, `${config.windowSeconds}s`),
      prefix: `verifyai:${endpoint}`,
    });

    const { success } = await ratelimit.limit(identifier);

    if (!success) {
      throw Errors.rateLimited();
    }
  } catch (err) {
    // Re-throw VerifyAIError (rate limited)
    if (err instanceof Error && err.name === 'VerifyAIError') {
      throw err;
    }
    // Redis error — fail open (don't block users due to Redis outage)
    console.warn('[rate-limit] Redis check failed, failing open:', err);
  }
}
