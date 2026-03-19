import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getAppDomain,
  getMainDomainUrl,
  getSubdomainUrl,
  extractSubdomain,
  isReservedSubdomain,
  isMainDomain,
  RESERVED_SUBDOMAINS,
} from './domain';

describe('domain utilities', () => {
  const originalAppDomain = process.env.APP_DOMAIN;

  afterEach(() => {
    if (originalAppDomain !== undefined) {
      process.env.APP_DOMAIN = originalAppDomain;
    } else {
      delete process.env.APP_DOMAIN;
    }
  });

  describe('getAppDomain', () => {
    it('returns the APP_DOMAIN env var', () => {
      process.env.APP_DOMAIN = 'reservapp.com';
      expect(getAppDomain()).toBe('reservapp.com');
    });

    it('throws if APP_DOMAIN is not set', () => {
      delete process.env.APP_DOMAIN;
      expect(() => getAppDomain()).toThrow('APP_DOMAIN environment variable is not set');
    });

    it('throws if APP_DOMAIN is empty', () => {
      process.env.APP_DOMAIN = '';
      expect(() => getAppDomain()).toThrow('APP_DOMAIN environment variable is not set');
    });
  });

  describe('getMainDomainUrl', () => {
    it('returns https URL for production domain', () => {
      process.env.APP_DOMAIN = 'reservapp.com';
      expect(getMainDomainUrl()).toBe('https://reservapp.com');
    });

    it('returns http URL for localhost', () => {
      process.env.APP_DOMAIN = 'localhost:3000';
      expect(getMainDomainUrl()).toBe('http://localhost:3000');
    });

    it('returns http URL for localhost without port', () => {
      process.env.APP_DOMAIN = 'localhost';
      expect(getMainDomainUrl()).toBe('http://localhost');
    });
  });

  describe('getSubdomainUrl', () => {
    it('constructs subdomain URL for production', () => {
      process.env.APP_DOMAIN = 'reservapp.com';
      expect(getSubdomainUrl('pilates-studio')).toBe('https://pilates-studio.reservapp.com');
    });

    it('constructs subdomain URL for localhost with port', () => {
      process.env.APP_DOMAIN = 'localhost:3000';
      expect(getSubdomainUrl('pilates-studio')).toBe('http://pilates-studio.localhost:3000');
    });

    it('constructs subdomain URL for localhost without port', () => {
      process.env.APP_DOMAIN = 'localhost';
      expect(getSubdomainUrl('my-gym')).toBe('http://my-gym.localhost');
    });
  });

  describe('extractSubdomain', () => {
    beforeEach(() => {
      process.env.APP_DOMAIN = 'reservapp.com';
    });

    it('extracts subdomain from production host', () => {
      expect(extractSubdomain('pilates-studio.reservapp.com')).toBe('pilates-studio');
    });

    it('returns null for main domain (no subdomain)', () => {
      expect(extractSubdomain('reservapp.com')).toBeNull();
    });

    it('extracts www as a subdomain', () => {
      expect(extractSubdomain('www.reservapp.com')).toBe('www');
    });

    it('returns null for unrelated domain', () => {
      expect(extractSubdomain('other-site.com')).toBeNull();
    });

    it('returns null for partial domain match', () => {
      expect(extractSubdomain('notreservapp.com')).toBeNull();
    });

    it('returns null for multi-level subdomains', () => {
      expect(extractSubdomain('a.b.reservapp.com')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(extractSubdomain('')).toBeNull();
    });

    describe('with localhost', () => {
      beforeEach(() => {
        process.env.APP_DOMAIN = 'localhost:3000';
      });

      it('extracts subdomain from localhost with port', () => {
        expect(extractSubdomain('pilates-studio.localhost:3000')).toBe('pilates-studio');
      });

      it('returns null for plain localhost with port', () => {
        expect(extractSubdomain('localhost:3000')).toBeNull();
      });

      it('returns null for localhost with different port', () => {
        expect(extractSubdomain('localhost:4000')).toBeNull();
      });

      it('extracts subdomain from localhost without port', () => {
        process.env.APP_DOMAIN = 'localhost';
        expect(extractSubdomain('my-gym.localhost')).toBe('my-gym');
      });

      it('returns null for plain localhost without port', () => {
        process.env.APP_DOMAIN = 'localhost';
        expect(extractSubdomain('localhost')).toBeNull();
      });
    });
  });

  describe('isReservedSubdomain', () => {
    it('returns true for "www"', () => {
      expect(isReservedSubdomain('www')).toBe(true);
    });

    it('returns true for "api"', () => {
      expect(isReservedSubdomain('api')).toBe(true);
    });

    it('returns true for "admin"', () => {
      expect(isReservedSubdomain('admin')).toBe(true);
    });

    it('returns true for "staging"', () => {
      expect(isReservedSubdomain('staging')).toBe(true);
    });

    it('returns true for uppercase reserved name', () => {
      expect(isReservedSubdomain('WWW')).toBe(true);
    });

    it('returns true for mixed case reserved name', () => {
      expect(isReservedSubdomain('Admin')).toBe(true);
    });

    it('returns false for a regular business slug', () => {
      expect(isReservedSubdomain('pilates-studio')).toBe(false);
    });

    it('returns false for a numeric slug', () => {
      expect(isReservedSubdomain('studio-123')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isReservedSubdomain('')).toBe(false);
    });

    it('includes all expected reserved names', () => {
      expect(RESERVED_SUBDOMAINS).toContain('www');
      expect(RESERVED_SUBDOMAINS).toContain('api');
      expect(RESERVED_SUBDOMAINS).toContain('admin');
      expect(RESERVED_SUBDOMAINS).toContain('app');
      expect(RESERVED_SUBDOMAINS).toContain('mail');
      expect(RESERVED_SUBDOMAINS).toContain('cdn');
      expect(RESERVED_SUBDOMAINS).toContain('blog');
      expect(RESERVED_SUBDOMAINS.length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('isMainDomain', () => {
    beforeEach(() => {
      process.env.APP_DOMAIN = 'reservapp.com';
    });

    it('returns true for the main domain', () => {
      expect(isMainDomain('reservapp.com')).toBe(true);
    });

    it('returns false for a subdomain', () => {
      expect(isMainDomain('pilates.reservapp.com')).toBe(false);
    });

    it('returns true for an unrelated domain', () => {
      // Unrelated domains have no subdomain extracted, so isMainDomain returns true
      expect(isMainDomain('other-site.com')).toBe(true);
    });

    it('returns true for localhost main domain', () => {
      process.env.APP_DOMAIN = 'localhost:3000';
      expect(isMainDomain('localhost:3000')).toBe(true);
    });

    it('returns false for localhost subdomain', () => {
      process.env.APP_DOMAIN = 'localhost:3000';
      expect(isMainDomain('test.localhost:3000')).toBe(false);
    });
  });
});
