import { describe, it, expect } from 'vitest';
import { SlugSchema } from './slug';

describe('SlugSchema', () => {
  function validate(slug: string) {
    return SlugSchema.safeParse({ slug });
  }

  it('accepts valid slugs', () => {
    expect(validate('pilates-studio').success).toBe(true);
    expect(validate('my-gym-123').success).toBe(true);
    expect(validate('abc').success).toBe(true);
    expect(validate('a1b').success).toBe(true);
  });

  it('rejects slugs shorter than 3 characters', () => {
    expect(validate('ab').success).toBe(false);
    expect(validate('a').success).toBe(false);
  });

  it('rejects slugs longer than 63 characters', () => {
    const longSlug = 'a'.repeat(64);
    expect(validate(longSlug).success).toBe(false);
  });

  it('accepts slugs exactly 63 characters', () => {
    const maxSlug = 'a'.repeat(63);
    expect(validate(maxSlug).success).toBe(true);
  });

  it('rejects uppercase characters', () => {
    expect(validate('Pilates-Studio').success).toBe(false);
    expect(validate('ABC').success).toBe(false);
  });

  it('rejects leading hyphen', () => {
    expect(validate('-pilates').success).toBe(false);
  });

  it('rejects trailing hyphen', () => {
    expect(validate('pilates-').success).toBe(false);
  });

  it('rejects special characters', () => {
    expect(validate('pilates_studio').success).toBe(false);
    expect(validate('pilates.studio').success).toBe(false);
    expect(validate('pilates studio').success).toBe(false);
    expect(validate('pilates@studio').success).toBe(false);
  });

  it('rejects reserved subdomains', () => {
    expect(validate('www').success).toBe(false);
    expect(validate('api').success).toBe(false);
    expect(validate('admin').success).toBe(false);
    expect(validate('mail').success).toBe(false);
  });

  it('accepts non-reserved slugs', () => {
    expect(validate('my-business').success).toBe(true);
    expect(validate('studio-pilates').success).toBe(true);
  });
});
