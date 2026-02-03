import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import type { RegisterInput } from '@/lib/validations/auth';

/**
 * Number of salt rounds for bcrypt password hashing
 * Higher values = more secure but slower
 */
const SALT_ROUNDS = 10;

/**
 * JWT token expiry time for email verification tokens
 */
const VERIFICATION_TOKEN_EXPIRY = '24h';

/**
 * Hash a plain text password using bcrypt
 * @param password - Plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against
 * @returns True if passwords match, false otherwise
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a JWT verification token for email verification
 * @param userId - User ID to include in token payload
 * @returns JWT token string
 */
export function generateVerificationToken(userId: string): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return jwt.sign(
    { userId, type: 'email-verification' },
    secret,
    { expiresIn: VERIFICATION_TOKEN_EXPIRY }
  );
}

/**
 * Verify and decode a JWT verification token
 * @param token - JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): { userId: string; type: string } | null {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    const decoded = jwt.verify(token, secret) as { userId: string; type: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Validate user credentials for login
 * @param email - User email
 * @param password - Plain text password
 * @returns User data (without password hash) if credentials are valid
 * @throws Error if credentials are invalid or email not verified
 */
export async function validateCredentials(email: string, password: string) {
  // Find user by email
  const user = await db.user.findUnique({
    where: { email },
  });

  // If user not found, throw generic error (don't reveal if email exists)
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Compare password
  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Check if email is verified
  if (!user.emailVerified) {
    throw new Error('Email not verified');
  }

  // Return user without sensitive data
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
  };
}

/**
 * Create a new user in the database
 * @param data - User registration data
 * @returns Created user (without password hash)
 */
export async function createUser(data: RegisterInput) {
  const { email, password, name } = data;

  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash the password
  const passwordHash = await hashPassword(password);

  // First user to register becomes admin
  const userCount = await db.user.count();
  const isAdmin = userCount === 0;

  // Create the user
  const user = await db.user.create({
    data: {
      email,
      name,
      passwordHash,
      emailVerified: false,
      isAdmin,
    },
  });

  // Generate verification token
  const verificationToken = generateVerificationToken(user.id);

  // Update user with verification token
  const tokenExpiry = new Date();
  tokenExpiry.setHours(tokenExpiry.getHours() + 24);

  await db.user.update({
    where: { id: user.id },
    data: {
      verificationToken,
      verificationTokenExpiry: tokenExpiry,
    },
  });

  // Return user without sensitive data
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    verificationToken, // Return this so it can be sent via email
  };
}
