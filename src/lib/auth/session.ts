import jwt from 'jsonwebtoken';

/**
 * JWT payload for session tokens
 */
export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string; // unique session identifier for concurrent session tracking
  iat?: number; // issued-at (added by jwt.sign, used for passwordChangedAt check)
}

/**
 * JWT token expiry time for session tokens (7 days)
 */
const SESSION_TOKEN_EXPIRY = '7d';

const JWT_SECRET_MIN_LENGTH = 32;

/**
 * Session cookie configuration
 */
const COOKIE_NAME = 'session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Retrieve and validate the JWT secret from environment variables.
 * Throws if the secret is missing or shorter than 32 characters.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  if (secret.length < JWT_SECRET_MIN_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters (current: ${secret.length}). Generate one with: openssl rand -base64 48`
    );
  }

  return secret;
}

/**
 * Generate a JWT session token
 * @param payload - User data to encode in token
 * @returns JWT token string
 */
export function generateToken(payload: SessionPayload): string {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn: SESSION_TOKEN_EXPIRY });
}

/**
 * Verify and decode a JWT session token
 * @param token - JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): SessionPayload | null {
  const secret = getJwtSecret();

  try {
    const decoded = jwt.verify(token, secret) as SessionPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Get session cookie configuration
 * @param token - JWT token value
 * @returns Cookie configuration object
 */
export function setSessionCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  };
}

/**
 * Get cookie name for session
 * @returns Cookie name string
 */
export function getSessionCookieName(): string {
  return COOKIE_NAME;
}
