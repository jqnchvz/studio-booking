import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateToken,
  verifyToken,
  setSessionCookie,
  getSessionCookieName,
} from './session';

describe('Session Utilities', () => {
  const mockPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    isAdmin: false,
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should throw error if JWT_SECRET is not set', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      expect(() => generateToken(mockPayload)).toThrow(
        'JWT_SECRET environment variable is not set'
      );

      // Restore
      process.env.JWT_SECRET = originalSecret;
    });

    it('should encode payload data in token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
      expect(decoded?.isAdmin).toBe(mockPayload.isAdmin);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
      expect(decoded?.isAdmin).toBe(mockPayload.isAdmin);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('should return null for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';
      const decoded = verifyToken(malformedToken);

      expect(decoded).toBeNull();
    });

    it('should return null for empty token', () => {
      const decoded = verifyToken('');

      expect(decoded).toBeNull();
    });

    it('should throw error if JWT_SECRET is not set', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      expect(() => verifyToken('some.token.here')).toThrow(
        'JWT_SECRET environment variable is not set'
      );

      // Restore
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('setSessionCookie', () => {
    const token = 'test-jwt-token';

    it('should return correct cookie configuration', () => {
      const cookie = setSessionCookie(token);

      expect(cookie.name).toBe('session');
      expect(cookie.value).toBe(token);
      expect(cookie.httpOnly).toBe(true);
      expect(cookie.sameSite).toBe('lax');
      expect(cookie.path).toBe('/');
      expect(cookie.maxAge).toBe(60 * 60 * 24 * 7); // 7 days in seconds
    });

    it('should set secure flag in production', () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV ='production';

      const cookie = setSessionCookie(token);
      expect(cookie.secure).toBe(true);

      // Restore
      (process.env as any).NODE_ENV =originalEnv;
    });

    it('should not set secure flag in development', () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV ='development';

      const cookie = setSessionCookie(token);
      expect(cookie.secure).toBe(false);

      // Restore
      (process.env as any).NODE_ENV =originalEnv;
    });

    it('should not set secure flag in test environment', () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV ='test';

      const cookie = setSessionCookie(token);
      expect(cookie.secure).toBe(false);

      // Restore
      (process.env as any).NODE_ENV =originalEnv;
    });
  });

  describe('getSessionCookieName', () => {
    it('should return the session cookie name', () => {
      const cookieName = getSessionCookieName();

      expect(cookieName).toBe('session');
      expect(typeof cookieName).toBe('string');
    });
  });
});
