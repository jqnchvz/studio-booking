import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateVerificationToken,
  verifyToken,
  validateCredentials,
  createUser,
} from './auth.service';
import { db } from '@/lib/db';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'MyPassword123!';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hashes are long
    });

    it('should create different hashes for the same password', async () => {
      const password = 'SamePassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Hashes should be different due to salt
      expect(hash1).not.toBe(hash2);
    });

    it('should create valid bcrypt hashes', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);

      // bcrypt hashes start with $2a$, $2b$, or $2y$
      expect(hashedPassword).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'MyPassword123!';
      const hashedPassword = await hashPassword(password);

      const isValid = await verifyPassword(password, hashedPassword);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashedPassword = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hashedPassword);

      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const password = 'MyPassword123!';
      const hashedPassword = await hashPassword(password);

      const isValid = await verifyPassword('', hashedPassword);

      expect(isValid).toBe(false);
    });

    it('should handle case-sensitive passwords correctly', async () => {
      const password = 'CaseSensitive123!';
      const hashedPassword = await hashPassword(password);

      const isValidLower = await verifyPassword('casesensitive123!', hashedPassword);
      const isValidUpper = await verifyPassword('CASESENSITIVE123!', hashedPassword);

      expect(isValidLower).toBe(false);
      expect(isValidUpper).toBe(false);
    });
  });

  describe('generateVerificationToken', () => {
    it('should generate a valid JWT token', () => {
      const userId = 'user-123';
      const token = generateVerificationToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should encode userId and type in token', () => {
      const userId = 'user-456';
      const token = generateVerificationToken(userId);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(userId);
      expect(decoded?.type).toBe('email-verification');
    });

    it('should throw error if JWT_SECRET is not set', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      expect(() => generateVerificationToken('user-123')).toThrow(
        'JWT_SECRET environment variable is not set'
      );

      // Restore
      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const userId = 'user-789';
      const token = generateVerificationToken(userId);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(userId);
      expect(decoded?.type).toBe('email-verification');
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

  describe('validateCredentials', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: '', // Will be set in tests
      emailVerified: true,
      isAdmin: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      verificationToken: null,
      verificationTokenExpiry: null,
      resetToken: null,
      resetTokenExpiry: null,
    };

    it('should validate correct credentials and return user data', async () => {
      const password = 'ValidPassword123!';
      const passwordHash = await hashPassword(password);

      vi.mocked(db.user.findUnique).mockResolvedValueOnce({
        ...mockUser,
        passwordHash,
      });

      const result = await validateCredentials('test@example.com', password);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        emailVerified: mockUser.emailVerified,
        isAdmin: mockUser.isAdmin,
        createdAt: mockUser.createdAt,
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw "Invalid credentials" for non-existent email', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);

      await expect(
        validateCredentials('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw "Invalid credentials" for wrong password', async () => {
      const correctPassword = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const passwordHash = await hashPassword(correctPassword);

      vi.mocked(db.user.findUnique).mockResolvedValueOnce({
        ...mockUser,
        passwordHash,
      });

      await expect(
        validateCredentials('test@example.com', wrongPassword)
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw "Email not verified" for unverified email', async () => {
      const password = 'ValidPassword123!';
      const passwordHash = await hashPassword(password);

      vi.mocked(db.user.findUnique).mockResolvedValueOnce({
        ...mockUser,
        passwordHash,
        emailVerified: false,
      });

      await expect(
        validateCredentials('test@example.com', password)
      ).rejects.toThrow('Email not verified');
    });

    it('should call db.user.findUnique with correct email', async () => {
      const email = 'specific@example.com';
      const password = 'Password123!';

      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);

      await expect(validateCredentials(email, password)).rejects.toThrow();

      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('should not reveal if email exists through different error messages', async () => {
      // Non-existent email
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);
      let error1: Error | undefined;
      try {
        await validateCredentials('nonexistent@example.com', 'password');
      } catch (err) {
        error1 = err as Error;
      }

      // Wrong password
      const passwordHash = await hashPassword('correct');
      vi.mocked(db.user.findUnique).mockResolvedValueOnce({
        ...mockUser,
        passwordHash,
      });
      let error2: Error | undefined;
      try {
        await validateCredentials('test@example.com', 'wrong');
      } catch (err) {
        error2 = err as Error;
      }

      // Both should have the same generic error message
      expect(error1?.message).toBe('Invalid credentials');
      expect(error2?.message).toBe('Invalid credentials');
    });
  });

  describe('createUser', () => {
    const registerData = {
      email: 'new@example.com',
      password: 'NewPassword123!',
      name: 'New User',
    };

    const createdUser = {
      id: 'new-user-1',
      email: 'new@example.com',
      name: 'New User',
      passwordHash: 'hashed',
      emailVerified: false,
      isAdmin: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      verificationToken: null,
      verificationTokenExpiry: null,
      resetToken: null,
      resetTokenExpiry: null,
    };

    it('should set isAdmin to true for the first user', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(db.user.count).mockResolvedValueOnce(0);
      vi.mocked(db.user.create).mockResolvedValueOnce({
        ...createdUser,
        isAdmin: true,
      });
      vi.mocked(db.user.update).mockResolvedValueOnce(createdUser as never);

      await createUser(registerData);

      expect(db.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isAdmin: true }),
      });
    });

    it('should set isAdmin to false for subsequent users', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(db.user.count).mockResolvedValueOnce(5);
      vi.mocked(db.user.create).mockResolvedValueOnce(createdUser);
      vi.mocked(db.user.update).mockResolvedValueOnce(createdUser as never);

      await createUser(registerData);

      expect(db.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isAdmin: false }),
      });
    });

    it('should throw error if user with email already exists', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(createdUser);

      await expect(createUser(registerData)).rejects.toThrow(
        'User with this email already exists'
      );
      expect(db.user.create).not.toHaveBeenCalled();
    });

    it('should return user data without passwordHash', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(db.user.count).mockResolvedValueOnce(1);
      vi.mocked(db.user.create).mockResolvedValueOnce(createdUser);
      vi.mocked(db.user.update).mockResolvedValueOnce(createdUser as never);

      const result = await createUser(registerData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('verificationToken');
      expect(result).not.toHaveProperty('passwordHash');
    });
  });
});
