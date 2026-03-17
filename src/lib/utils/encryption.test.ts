import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt, maskCredential } from './encryption';

describe('encryption', () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    // A valid 64-char hex key (32 bytes)
    process.env.ENCRYPTION_KEY =
      'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
  });

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.ENCRYPTION_KEY = originalKey;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });

  describe('encrypt / decrypt round-trip', () => {
    it('round-trips a short string', () => {
      const plaintext = 'TEST-ACCESS-TOKEN-123';
      const ciphertext = encrypt(plaintext);
      expect(ciphertext).not.toBe(plaintext);
      expect(decrypt(ciphertext)).toBe(plaintext);
    });

    it('round-trips a long MercadoPago-style token', () => {
      const plaintext = 'APP_USR-1234567890123456-012345-abcdefabcdefabcdefabcdef-12345678';
      const ciphertext = encrypt(plaintext);
      expect(decrypt(ciphertext)).toBe(plaintext);
    });

    it('round-trips an empty string', () => {
      const ciphertext = encrypt('');
      expect(decrypt(ciphertext)).toBe('');
    });

    it('round-trips unicode characters', () => {
      const plaintext = 'clave-secreta-ñ-ü-€';
      expect(decrypt(encrypt(plaintext))).toBe(plaintext);
    });

    it('produces different ciphertext each time (random IV)', () => {
      const plaintext = 'same-input';
      const a = encrypt(plaintext);
      const b = encrypt(plaintext);
      expect(a).not.toBe(b); // different IVs
      expect(decrypt(a)).toBe(plaintext);
      expect(decrypt(b)).toBe(plaintext);
    });
  });

  describe('decrypt failure cases', () => {
    it('returns null for tampered ciphertext', () => {
      const ciphertext = encrypt('secret');
      // Flip a character in the encrypted portion
      const tampered = ciphertext.slice(0, -2) + 'ff';
      expect(decrypt(tampered)).toBeNull();
    });

    it('returns null for malformed string (missing parts)', () => {
      expect(decrypt('not-a-valid-ciphertext')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(decrypt('')).toBeNull();
    });

    it('returns null when decrypting with wrong key', () => {
      const ciphertext = encrypt('secret');
      // Change key
      process.env.ENCRYPTION_KEY =
        'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      expect(decrypt(ciphertext)).toBeNull();
    });
  });

  describe('encrypt throws without key', () => {
    it('throws if ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY environment variable is not set');
    });

    it('throws if ENCRYPTION_KEY is wrong length', () => {
      process.env.ENCRYPTION_KEY = 'tooshort';
      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must be a 64-character hex string');
    });
  });
});

describe('maskCredential', () => {
  it('masks a long string showing last 6 chars', () => {
    expect(maskCredential('APP_USR-1234567890')).toBe('••••••••••••••567890');
  });

  it('returns •••••• for short strings', () => {
    expect(maskCredential('abc')).toBe('••••••');
  });

  it('returns empty string for null', () => {
    expect(maskCredential(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(maskCredential(undefined)).toBe('');
  });
});
