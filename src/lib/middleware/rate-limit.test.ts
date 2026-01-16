import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  checkRateLimit,
  getRateLimitHeaders,
} from './rate-limit';

// Helper to create mock NextRequest
function createMockRequest(ip: string = '192.168.1.1'): NextRequest {
  const headers = new Headers();
  headers.set('x-forwarded-for', ip);

  return {
    headers,
  } as NextRequest;
}

describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    // Clear the rate limit store between tests by waiting
    // In production, this is handled by the cleanup function
    vi.clearAllTimers();
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const request = createMockRequest('192.168.1.1');
      const options = { maxAttempts: 5, windowMs: 60000 }; // 5 per minute

      // First request
      const result1 = checkRateLimit(request, options);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);
      expect(result1.maxAttempts).toBe(5);

      // Second request
      const result2 = checkRateLimit(request, options);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);

      // Third request
      const result3 = checkRateLimit(request, options);
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(2);
    });

    it('should block requests exceeding limit', () => {
      const request = createMockRequest('192.168.1.2');
      const options = { maxAttempts: 3, windowMs: 60000 };

      // Make 3 allowed requests
      for (let i = 0; i < 3; i++) {
        const result = checkRateLimit(request, options);
        expect(result.allowed).toBe(true);
      }

      // 4th request should be blocked
      const result4 = checkRateLimit(request, options);
      expect(result4.allowed).toBe(false);
      expect(result4.remaining).toBe(0);

      // 5th request should also be blocked
      const result5 = checkRateLimit(request, options);
      expect(result5.allowed).toBe(false);
      expect(result5.remaining).toBe(0);
    });

    it('should use default values when options not provided', () => {
      const request = createMockRequest('192.168.1.3');

      const result = checkRateLimit(request);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // Default is 5
      expect(result.maxAttempts).toBe(5);
    });

    it('should track different IPs separately', () => {
      const request1 = createMockRequest('192.168.1.10');
      const request2 = createMockRequest('192.168.1.11');
      const options = { maxAttempts: 2, windowMs: 60000 };

      // IP 1 makes 2 requests (limit reached)
      checkRateLimit(request1, options);
      const result1 = checkRateLimit(request1, options);
      expect(result1.remaining).toBe(0);

      // IP 2 should still be able to make requests
      const result2 = checkRateLimit(request2, options);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(1);
    });

    it('should return correct resetTime', () => {
      const request = createMockRequest('192.168.1.4');
      const windowMs = 60000; // 1 minute
      const options = { maxAttempts: 5, windowMs };

      const before = Date.now();
      const result = checkRateLimit(request, options);
      const after = Date.now();

      const resetTime = result.resetTime.getTime();
      const expectedResetMin = before + windowMs;
      const expectedResetMax = after + windowMs;

      expect(resetTime).toBeGreaterThanOrEqual(expectedResetMin);
      expect(resetTime).toBeLessThanOrEqual(expectedResetMax);
    });

    it('should handle x-real-ip header when x-forwarded-for is not present', () => {
      const headers = new Headers();
      headers.set('x-real-ip', '10.0.0.1');

      const request = { headers } as NextRequest;
      const options = { maxAttempts: 2, windowMs: 60000 };

      const result1 = checkRateLimit(request, options);
      const result2 = checkRateLimit(request, options);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(0);
    });

    it('should use "unknown" as fallback IP', () => {
      const headers = new Headers();
      const request = { headers } as NextRequest;
      const options = { maxAttempts: 2, windowMs: 60000 };

      const result = checkRateLimit(request, options);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('should respect custom windowMs', () => {
      const request = createMockRequest('192.168.1.5');
      const customWindow = 120000; // 2 minutes
      const options = { maxAttempts: 3, windowMs: customWindow };

      const before = Date.now();
      checkRateLimit(request, options);
      const result = checkRateLimit(request, options);
      const after = Date.now();

      const resetTime = result.resetTime.getTime();
      const expectedResetMin = before + customWindow;
      const expectedResetMax = after + customWindow;

      expect(resetTime).toBeGreaterThanOrEqual(expectedResetMin);
      expect(resetTime).toBeLessThanOrEqual(expectedResetMax);
    });

    it('should respect custom maxAttempts', () => {
      const request = createMockRequest('192.168.1.6');
      const options = { maxAttempts: 10, windowMs: 60000 };

      const result = checkRateLimit(request, options);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.maxAttempts).toBe(10);
    });

    it('should parse x-forwarded-for with multiple IPs correctly', () => {
      const headers = new Headers();
      // Simulate proxy chain: client IP, proxy1, proxy2
      headers.set('x-forwarded-for', '203.0.113.1, 198.51.100.1, 192.0.2.1');

      const request = { headers } as NextRequest;
      const options = { maxAttempts: 2, windowMs: 60000 };

      // Should use the first IP (client IP)
      const result1 = checkRateLimit(request, options);
      const result2 = checkRateLimit(request, options);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(0);
    });
  });

  describe('getRateLimitHeaders', () => {
    it('should return correct rate limit headers', () => {
      const remaining = 5;
      const resetTime = new Date('2024-01-01T12:00:00Z');
      const maxAttempts = 10;

      const headers = getRateLimitHeaders(remaining, resetTime, maxAttempts);

      expect(headers['X-RateLimit-Limit']).toBe('10');
      expect(headers['X-RateLimit-Remaining']).toBe('5');
      expect(headers['X-RateLimit-Reset']).toBe('2024-01-01T12:00:00.000Z');
    });

    it('should use default maxAttempts when not provided', () => {
      const remaining = 3;
      const resetTime = new Date();

      const headers = getRateLimitHeaders(remaining, resetTime);

      expect(headers['X-RateLimit-Limit']).toBe('5'); // Default
      expect(headers['X-RateLimit-Remaining']).toBe('3');
    });

    it('should handle zero remaining', () => {
      const remaining = 0;
      const resetTime = new Date();
      const maxAttempts = 5;

      const headers = getRateLimitHeaders(remaining, resetTime, maxAttempts);

      expect(headers['X-RateLimit-Remaining']).toBe('0');
    });

    it('should format resetTime as ISO string', () => {
      const resetTime = new Date('2024-06-15T14:30:45.123Z');
      const headers = getRateLimitHeaders(5, resetTime, 10);

      expect(headers['X-RateLimit-Reset']).toBe('2024-06-15T14:30:45.123Z');
      expect(headers['X-RateLimit-Reset']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});
