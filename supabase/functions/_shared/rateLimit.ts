/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } from './config.ts';
import { corsHeaders } from './cors.ts';

// In-memory IP timestamp cache
const ipRequestHistory = new Map<string, number[]>();

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '127.0.0.1';
}

/**
 * Validates whether the incoming IP is within rate limits.
 * Returns null if allowed, or a 429 Response if exceeded.
 */
export function enforceRateLimit(req: Request): Response | null {
  const ip = getClientIp(req);
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  const timestamps = (ipRequestHistory.get(ip) || []).filter((t) => t > windowStart);

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldest = timestamps[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000));

    return new Response(
      JSON.stringify({
        error: 'Too many requests. Rate limit exceeded for unauthenticated queries.',
        retry_after_seconds: retryAfter,
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
        },
      }
    );
  }

  timestamps.push(now);
  ipRequestHistory.set(ip, timestamps);

  // Periodically cleanup stale IPs
  if (ipRequestHistory.size > 2000) {
    for (const [key, times] of ipRequestHistory.entries()) {
      const valid = times.filter((t) => t > windowStart);
      if (valid.length === 0) {
        ipRequestHistory.delete(key);
      } else {
        ipRequestHistory.set(key, valid);
      }
    }
  }

  return null;
}
