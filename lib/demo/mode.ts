/**
 * Demo Mode Configuration
 *
 * When DEMO_MODE=true or no real providers are configured:
 * - Return deterministic results from BENCHMARK_CASES
 * - Skip Inngest dispatch
 * - Skip real AI calls
 * - UI clearly indicates DEMO ANALYSIS
 *
 * Demo mode is NEVER disguised as real analysis.
 */

/** Is demo mode active? */
export function isDemoMode(): boolean {
  return (
    process.env.DEMO_MODE === 'true' ||
    process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
    !process.env.GEMINI_API_KEY ||
    process.env.ENABLE_REAL_ANALYSIS !== 'true'
  );
}

/** Is the real Gemini API configured? */
export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Is the async job queue (Inngest) configured? */
export function hasInngest(): boolean {
  return Boolean(process.env.INNGEST_EVENT_KEY);
}

/** Is the database configured? */
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** Is Vercel Blob configured? */
export function hasBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Summary of which services are available */
export function getServiceAvailability() {
  return {
    demoMode: isDemoMode(),
    database: hasDatabase(),
    blobStorage: hasBlobStorage(),
    gemini: hasGeminiKey(),
    inngest: hasInngest(),
    rateLimit: Boolean(process.env.UPSTASH_REDIS_REST_URL),
  };
}
