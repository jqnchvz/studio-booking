import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY environment variable is not set');
  if (key.length !== 64) throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns "iv:authTag:ciphertext" — all hex-encoded.
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a string produced by `encrypt`.
 * Returns null if decryption fails (wrong key, tampered data, etc.).
 */
export function decrypt(ciphertext: string): string | null {
  try {
    const key = getKey();
    const parts = ciphertext.split(':');
    if (parts.length !== 3) return null;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    return decipher.update(encrypted) + decipher.final('utf8');
  } catch {
    return null;
  }
}

/**
 * Mask a credential value for safe display — shows only the last 6 characters.
 * Returns an empty string if the value is null/undefined.
 */
export function maskCredential(value: string | null | undefined): string {
  if (!value) return '';
  if (value.length <= 6) return '••••••';
  return '••••••••••••••' + value.slice(-6);
}
