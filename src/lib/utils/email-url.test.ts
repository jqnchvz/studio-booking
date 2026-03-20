import { describe, it, expect, afterEach } from 'vitest';
import { getAppUrl, getBusinessUrl } from './email-url';

describe('email-url utilities', () => {
  const originalAppDomain = process.env.APP_DOMAIN;
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (originalAppDomain !== undefined) {
      process.env.APP_DOMAIN = originalAppDomain;
    } else {
      delete process.env.APP_DOMAIN;
    }
    if (originalAppUrl !== undefined) {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    } else {
      delete process.env.NEXT_PUBLIC_APP_URL;
    }
  });

  describe('getAppUrl', () => {
    it('uses APP_DOMAIN with https for production', () => {
      process.env.APP_DOMAIN = 'reservapp.com';
      expect(getAppUrl()).toBe('https://reservapp.com');
    });

    it('uses APP_DOMAIN with http for localhost', () => {
      process.env.APP_DOMAIN = 'localhost:3000';
      expect(getAppUrl()).toBe('http://localhost:3000');
    });

    it('falls back to NEXT_PUBLIC_APP_URL when APP_DOMAIN is not set', () => {
      delete process.env.APP_DOMAIN;
      process.env.NEXT_PUBLIC_APP_URL = 'https://my-app.com';
      expect(getAppUrl()).toBe('https://my-app.com');
    });

    it('falls back to localhost when nothing is set', () => {
      delete process.env.APP_DOMAIN;
      delete process.env.NEXT_PUBLIC_APP_URL;
      expect(getAppUrl()).toBe('http://localhost:3000');
    });
  });

  describe('getBusinessUrl', () => {
    it('constructs subdomain URL for production', () => {
      process.env.APP_DOMAIN = 'reservapp.com';
      expect(getBusinessUrl('pilates')).toBe('https://pilates.reservapp.com');
    });

    it('constructs subdomain URL for localhost', () => {
      process.env.APP_DOMAIN = 'localhost:3000';
      expect(getBusinessUrl('pilates')).toBe('http://pilates.localhost:3000');
    });

    it('falls back to /b/slug path when APP_DOMAIN is not set', () => {
      delete process.env.APP_DOMAIN;
      process.env.NEXT_PUBLIC_APP_URL = 'https://reservapp.com';
      expect(getBusinessUrl('pilates')).toBe('https://reservapp.com/b/pilates');
    });

    it('falls back to localhost /b/slug when nothing is set', () => {
      delete process.env.APP_DOMAIN;
      delete process.env.NEXT_PUBLIC_APP_URL;
      expect(getBusinessUrl('pilates')).toBe('http://localhost:3000/b/pilates');
    });
  });
});
