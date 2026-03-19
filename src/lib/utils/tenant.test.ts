import { describe, it, expect, vi } from 'vitest';
import { getOrgFromHeaders, getDayName } from './tenant';

// getTenantOrg requires DB — tested via integration. Unit tests cover the pure functions.

describe('tenant utilities', () => {
  describe('getOrgFromHeaders', () => {
    it('returns org context when headers are present', () => {
      const headers = new Headers();
      headers.set('x-org-id', 'org-123');
      headers.set('x-org-slug', 'pilates-studio');
      headers.set('x-org-name', 'Pilates Studio');

      const result = getOrgFromHeaders(headers);
      expect(result).toEqual({
        id: 'org-123',
        slug: 'pilates-studio',
        name: 'Pilates Studio',
      });
    });

    it('returns null when x-org-id is missing', () => {
      const headers = new Headers();
      expect(getOrgFromHeaders(headers)).toBeNull();
    });

    it('returns empty strings for missing slug/name when id is present', () => {
      const headers = new Headers();
      headers.set('x-org-id', 'org-123');

      const result = getOrgFromHeaders(headers);
      expect(result).toEqual({
        id: 'org-123',
        slug: '',
        name: '',
      });
    });
  });

  describe('getDayName', () => {
    it('returns correct Spanish day names', () => {
      expect(getDayName(0)).toBe('Dom');
      expect(getDayName(1)).toBe('Lun');
      expect(getDayName(2)).toBe('Mar');
      expect(getDayName(3)).toBe('Mié');
      expect(getDayName(4)).toBe('Jue');
      expect(getDayName(5)).toBe('Vie');
      expect(getDayName(6)).toBe('Sáb');
    });

    it('returns empty string for invalid day number', () => {
      expect(getDayName(7)).toBe('');
      expect(getDayName(-1)).toBe('');
    });
  });
});
