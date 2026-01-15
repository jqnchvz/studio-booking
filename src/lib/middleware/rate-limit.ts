import { NextRequest } from 'next/server';

/**
 * Rate limit configuration (defaults)
 */
const DEFAULT_RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const DEFAULT_MAX_REQUESTS = 5;

/**
 * Rate limit options
 */
export interface RateLimitOptions {
  maxAttempts?: number;
  windowMs?: number;
}

/**
 * In-memory store for rate limiting
 * Structure: Map<IP, Array<timestamp>>
 */
const requestLog = new Map<string, number[]>();

/**
 * Clean up old entries from the request log
 * Removes timestamps older than the rate limit window
 */
function cleanupOldEntries(windowMs: number = DEFAULT_RATE_LIMIT_WINDOW) {
  const now = Date.now();
  const cutoff = now - windowMs;

  for (const [ip, timestamps] of requestLog.entries()) {
    const validTimestamps = timestamps.filter((ts) => ts > cutoff);

    if (validTimestamps.length === 0) {
      requestLog.delete(ip);
    } else {
      requestLog.set(ip, validTimestamps);
    }
  }
}

/**
 * Get client IP address from request
 * Checks various headers for proxied requests
 */
function getClientIP(request: NextRequest): string {
  // Check for forwarded IP (when behind proxy/load balancer)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Check for real IP header
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to unknown (development/local)
  return 'unknown';
}

/**
 * Check if a request should be rate limited
 * @param request - Next.js request object
 * @param options - Optional rate limit configuration
 * @returns Object with allowed status and retry information
 */
export function checkRateLimit(
  request: NextRequest,
  options?: RateLimitOptions
): {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  maxAttempts: number;
} {
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_REQUESTS;
  const windowMs = options?.windowMs ?? DEFAULT_RATE_LIMIT_WINDOW;

  // Clean up old entries periodically
  cleanupOldEntries(windowMs);

  const ip = getClientIP(request);
  const now = Date.now();
  const cutoff = now - windowMs;

  // Get existing timestamps for this IP
  const timestamps = requestLog.get(ip) || [];

  // Filter out old timestamps
  const recentTimestamps = timestamps.filter((ts) => ts > cutoff);

  // Check if limit exceeded
  if (recentTimestamps.length >= maxAttempts) {
    const oldestTimestamp = Math.min(...recentTimestamps);
    const resetTime = new Date(oldestTimestamp + windowMs);

    return {
      allowed: false,
      remaining: 0,
      resetTime,
      maxAttempts,
    };
  }

  // Add current timestamp
  recentTimestamps.push(now);
  requestLog.set(ip, recentTimestamps);

  // Calculate reset time (earliest timestamp + window)
  const earliestTimestamp = Math.min(...recentTimestamps);
  const resetTime = new Date(earliestTimestamp + windowMs);

  return {
    allowed: true,
    remaining: maxAttempts - recentTimestamps.length,
    resetTime,
    maxAttempts,
  };
}

/**
 * Create rate limit headers for HTTP response
 * @param remaining - Number of remaining requests
 * @param resetTime - Time when the rate limit resets
 * @param maxAttempts - Maximum number of attempts allowed
 */
export function getRateLimitHeaders(
  remaining: number,
  resetTime: Date,
  maxAttempts: number = DEFAULT_MAX_REQUESTS
): Record<string, string> {
  return {
    'X-RateLimit-Limit': maxAttempts.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetTime.toISOString(),
  };
}
