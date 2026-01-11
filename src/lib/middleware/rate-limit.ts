import { NextRequest } from 'next/server';

/**
 * Rate limit configuration
 */
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_REQUESTS = 5;

/**
 * In-memory store for rate limiting
 * Structure: Map<IP, Array<timestamp>>
 */
const requestLog = new Map<string, number[]>();

/**
 * Clean up old entries from the request log
 * Removes timestamps older than the rate limit window
 */
function cleanupOldEntries() {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW;

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

  // Fallback to direct IP (development)
  return request.ip || 'unknown';
}

/**
 * Check if a request should be rate limited
 * @param request - Next.js request object
 * @returns Object with allowed status and retry information
 */
export function checkRateLimit(request: NextRequest): {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
} {
  // Clean up old entries periodically
  cleanupOldEntries();

  const ip = getClientIP(request);
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW;

  // Get existing timestamps for this IP
  const timestamps = requestLog.get(ip) || [];

  // Filter out old timestamps
  const recentTimestamps = timestamps.filter((ts) => ts > cutoff);

  // Check if limit exceeded
  if (recentTimestamps.length >= MAX_REQUESTS) {
    const oldestTimestamp = Math.min(...recentTimestamps);
    const resetTime = new Date(oldestTimestamp + RATE_LIMIT_WINDOW);

    return {
      allowed: false,
      remaining: 0,
      resetTime,
    };
  }

  // Add current timestamp
  recentTimestamps.push(now);
  requestLog.set(ip, recentTimestamps);

  // Calculate reset time (earliest timestamp + window)
  const earliestTimestamp = Math.min(...recentTimestamps);
  const resetTime = new Date(earliestTimestamp + RATE_LIMIT_WINDOW);

  return {
    allowed: true,
    remaining: MAX_REQUESTS - recentTimestamps.length,
    resetTime,
  };
}

/**
 * Create rate limit headers for HTTP response
 */
export function getRateLimitHeaders(
  remaining: number,
  resetTime: Date
): Record<string, string> {
  return {
    'X-RateLimit-Limit': MAX_REQUESTS.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetTime.toISOString(),
  };
}
