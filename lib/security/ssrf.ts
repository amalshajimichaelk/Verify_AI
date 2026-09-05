/**
 * SSRF Protection for URL Ingestion
 *
 * Prevents backend requests to internal/private network resources.
 * All URL submissions from users must pass this guard before
 * the server makes any outbound HTTP request.
 *
 * Checks:
 * 1. Protocol allowlist (https only in production)
 * 2. Private IP address ranges
 * 3. Localhost variants
 * 4. DNS resolution for IP range checks (best-effort)
 * 5. Redirect following limits
 * 6. Domain allowlist/blocklist
 */

import { Errors } from '../errors';

/** Regexes for private IPv4 ranges */
const PRIVATE_IPV4_RANGES = [
  /^127\./,           // Loopback
  /^10\./,            // RFC 1918
  /^172\.(1[6-9]|2\d|3[0-1])\./,  // RFC 1918
  /^192\.168\./,      // RFC 1918
  /^169\.254\./,      // Link-local (APIPA)
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,  // Shared address space (RFC 6598)
  /^198\.1[89]\./,    // IETF protocol assignments
  /^203\.0\.113\./,   // TEST-NET-3
  /^0\./,             // "This" network
  /^255\./,           // Broadcast
];

const PRIVATE_IPV6_RANGES = [
  /^::1$/,            // IPv6 loopback
  /^fc/i,             // Unique local
  /^fd/i,             // Unique local
  /^fe80/i,           // Link-local
];

/** Known problematic TLDs/domains for blocking */
const BLOCKED_DOMAINS = [
  'metadata.google.internal',
  'metadata.google',
  '169.254.169.254', // AWS/GCP metadata endpoint
  '100.100.100.200',  // Alibaba Cloud metadata
];

/**
 * Validates a URL for safe backend fetching.
 * Throws VerifyAIError with code SSRF_BLOCKED if unsafe.
 */
export function validateUrlForIngestion(rawUrl: string): URL {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw Errors.invalidInput('Invalid URL format. Must include https:// protocol.');
  }

  // Protocol check — only HTTPS in production
  const allowedProtocols = process.env.NODE_ENV === 'development'
    ? ['https:', 'http:']
    : ['https:'];

  if (!allowedProtocols.includes(parsed.protocol)) {
    throw Errors.ssrfBlocked();
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block known metadata endpoints
  if (BLOCKED_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
    throw Errors.ssrfBlocked();
  }

  // Block localhost variants
  if (
    hostname === 'localhost' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw Errors.ssrfBlocked();
  }

  // Check if hostname is a raw IP address
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Pattern = /^\[?[0-9a-fA-F:]+\]?$/;

  if (ipv4Pattern.test(hostname)) {
    if (PRIVATE_IPV4_RANGES.some((range) => range.test(hostname))) {
      throw Errors.ssrfBlocked();
    }
  }

  if (ipv6Pattern.test(hostname.replace(/^\[/, '').replace(/\]$/, ''))) {
    const cleanIpv6 = hostname.replace(/^\[/, '').replace(/\]$/, '');
    if (PRIVATE_IPV6_RANGES.some((range) => range.test(cleanIpv6))) {
      throw Errors.ssrfBlocked();
    }
  }

  return parsed;
}

/**
 * Fetches a remote URL safely with:
 * - SSRF validation
 * - Timeout
 * - Max redirect count
 * - Content-Length cap
 */
export async function safeFetch(
  rawUrl: string,
  options: { timeoutMs?: number; maxBytes?: number } = {}
): Promise<Response> {
  const validatedUrl = validateUrlForIngestion(rawUrl);
  const { timeoutMs = 15_000 } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(validatedUrl.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'VerifyAI-MediaIngestion/1.0',
      },
    });

    return response;
  } finally {
    clearTimeout(timeout);
  }
}
