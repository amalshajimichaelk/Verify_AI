/**
 * Structured Logger for VerifyAI
 *
 * Design principles:
 * - JSON output (compatible with Vercel log drains, Datadog, etc.)
 * - Never logs: media content, API keys, tokens, raw PII
 * - Includes: requestId, analysisId, jobId, stage, duration, userId (hashed), error codes
 * - Safe for production — debug logs suppressed in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: string; // Should be hashed before passing in
  jobId?: string;
  analysisId?: string;
  mediaAssetId?: string;
  stage?: string;
  durationMs?: number;
  errorCode?: string;
  provider?: string;
  [key: string]: unknown;
}

const isDev = process.env.NODE_ENV === 'development';

function log(level: LogLevel, message: string, context?: LogContext): void {
  // In production, skip debug-level logs
  if (!isDev && level === 'debug') return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    service: 'verifyai',
    ...context,
  };

  const output = JSON.stringify(entry);

  switch (level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    default:
      console.log(output);
  }
}

/** Hash a userId for safe logging (not reversible) */
export function hashUserId(userId: string): string {
  // Simple deterministic hash for log correlation without exposing real ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `u_${Math.abs(hash).toString(36)}`;
}

export const logger = {
  debug: (message: string, ctx?: LogContext) => log('debug', message, ctx),
  info: (message: string, ctx?: LogContext) => log('info', message, ctx),
  warn: (message: string, ctx?: LogContext) => log('warn', message, ctx),
  error: (message: string, ctx?: LogContext) => log('error', message, ctx),

  /** Log start of an analysis stage */
  stageStart: (jobId: string, stage: string, ctx?: Omit<LogContext, 'jobId' | 'stage'>) =>
    log('info', `[stage:start] ${stage}`, { jobId, stage, ...ctx }),

  /** Log completion of an analysis stage */
  stageComplete: (
    jobId: string,
    stage: string,
    durationMs: number,
    ctx?: Omit<LogContext, 'jobId' | 'stage' | 'durationMs'>
  ) => log('info', `[stage:done] ${stage}`, { jobId, stage, durationMs, ...ctx }),

  /** Log a provider call */
  providerCall: (provider: string, mediaType: string, ctx?: LogContext) =>
    log('info', `[provider] calling ${provider}`, { provider, mediaType, ...ctx }),
};
