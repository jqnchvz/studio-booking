import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from './route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as sessionModule from '@/lib/auth/session';
import * as emailModule from '@/lib/email/send-email';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth/session', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('@/lib/email/send-email', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('../../../../../emails/verify-email', () => ({
  default: vi.fn(() => '<div>Verification Email</div>'),
}));

describe('GET /api/user/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user profile with valid session', async () => {
    // Setup mocks
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: true,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(sessionModule.verifyToken).mockReturnValue({
      userId: 'user-123',
      email: 'test@example.com',
    });

    vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any);

    // Create request with session cookie
    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'GET',
      headers: {
        Cookie: 'session=valid-token',
      },
    });

    // Call handler
    const response = await GET(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.user.id).toBe(mockUser.id);
    expect(data.user.email).toBe(mockUser.email);
    expect(data.user.name).toBe(mockUser.name);
    expect(data.user.emailVerified).toBe(mockUser.emailVerified);
    expect(data.user.isAdmin).toBe(mockUser.isAdmin);
    expect(sessionModule.verifyToken).toHaveBeenCalledWith('valid-token');
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it('should return 401 without session cookie', async () => {
    // Create request without session cookie
    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'GET',
    });

    // Call handler
    const response = await GET(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(data.message).toBe('No session found');
  });

  it('should return 401 with invalid session token', async () => {
    // Setup mock to return null (invalid token)
    vi.mocked(sessionModule.verifyToken).mockReturnValue(null);

    // Create request with invalid session cookie
    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'GET',
      headers: {
        Cookie: 'session=invalid-token',
      },
    });

    // Call handler
    const response = await GET(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(data.message).toBe('Invalid session');
    expect(sessionModule.verifyToken).toHaveBeenCalledWith('invalid-token');
  });

  it('should return 404 if user not found', async () => {
    // Setup mocks
    vi.mocked(sessionModule.verifyToken).mockReturnValue({
      userId: 'non-existent-user',
      email: 'test@example.com',
    });

    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'GET',
      headers: {
        Cookie: 'session=valid-token',
      },
    });

    // Call handler
    const response = await GET(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });
});

describe('PATCH /api/user/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  it('should update user profile with valid data', async () => {
    // Setup mocks
    const currentUser = {
      id: 'user-123',
      email: 'old@example.com',
      name: 'Old Name',
      emailVerified: true,
      passwordHash: 'hashed-password',
    };

    const updatedUser = {
      id: 'user-123',
      email: 'old@example.com',
      name: 'New Name',
      emailVerified: true,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(sessionModule.verifyToken).mockReturnValue({
      userId: 'user-123',
      email: 'old@example.com',
    });

    vi.mocked(db.user.findUnique).mockResolvedValue(currentUser as any);
    vi.mocked(db.user.update).mockResolvedValue(updatedUser as any);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      headers: {
        Cookie: 'session=valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'New Name' }),
    });

    // Call handler
    const response = await PATCH(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.user.name).toBe('New Name');
    expect(data.message).toBe('Profile updated successfully.');
    // emailChanged is not returned when email doesn't change
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: { name: 'New Name' },
      select: expect.any(Object),
    });
  });

  it('should trigger email verification when email changes', async () => {
    // Setup mocks
    const currentUser = {
      id: 'user-123',
      email: 'old@example.com',
      name: 'Test User',
      emailVerified: true,
      passwordHash: 'hashed-password',
    };

    const updatedUser = {
      id: 'user-123',
      email: 'new@example.com',
      name: 'Test User',
      emailVerified: false,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(sessionModule.verifyToken).mockReturnValue({
      userId: 'user-123',
      email: 'old@example.com',
    });

    vi.mocked(db.user.findUnique)
      .mockResolvedValueOnce(currentUser as any)
      .mockResolvedValueOnce(null); // No duplicate email

    vi.mocked(db.user.update).mockResolvedValue(updatedUser as any);

    vi.mocked(emailModule.sendEmail).mockResolvedValue({
      success: true,
      messageId: 'msg-123',
    });

    // Create request
    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      headers: {
        Cookie: 'session=valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'new@example.com' }),
    });

    // Call handler
    const response = await PATCH(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.user.email).toBe('new@example.com');
    expect(data.user.emailVerified).toBe(false);
    expect(data.emailChanged).toBe(true);
    expect(data.message).toContain('Please verify your new email address');
    expect(emailModule.sendEmail).toHaveBeenCalled();
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          email: 'new@example.com',
          emailVerified: false,
          verificationToken: expect.any(String),
          verificationTokenExpiry: expect.any(Date),
        }),
      })
    );
  });

  it('should return 400 for duplicate email', async () => {
    // Setup mocks
    const currentUser = {
      id: 'user-123',
      email: 'old@example.com',
      name: 'Test User',
      emailVerified: true,
    };

    const existingUser = {
      id: 'user-456',
      email: 'existing@example.com',
      name: 'Other User',
    };

    vi.mocked(sessionModule.verifyToken).mockReturnValue({
      userId: 'user-123',
      email: 'old@example.com',
    });

    vi.mocked(db.user.findUnique)
      .mockResolvedValueOnce(currentUser as any)
      .mockResolvedValueOnce(existingUser as any); // Email exists

    // Create request
    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      headers: {
        Cookie: 'session=valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'existing@example.com' }),
    });

    // Call handler
    const response = await PATCH(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(400);
    expect(data.error).toBe('Email already exists');
    expect(data.message).toContain('already associated with another account');
  });

  it('should return 400 for invalid input', async () => {
    // Setup mocks
    vi.mocked(sessionModule.verifyToken).mockReturnValue({
      userId: 'user-123',
      email: 'test@example.com',
    });

    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    } as any);

    // Create request with invalid data
    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      headers: {
        Cookie: 'session=valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'X' }), // Too short
    });

    // Call handler
    const response = await PATCH(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid input');
    expect(data.details).toBeDefined();
  });

  it('should return 401 without authentication', async () => {
    // Create request without session cookie
    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'New Name' }),
    });

    // Call handler
    const response = await PATCH(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(data.message).toBe('No session found');
  });

  it('should handle email send failures with rollback', async () => {
    // Setup mocks
    const currentUser = {
      id: 'user-123',
      email: 'old@example.com',
      name: 'Test User',
      emailVerified: true,
      passwordHash: 'hashed-password',
    };

    const tempUpdatedUser = {
      id: 'user-123',
      email: 'new@example.com',
      name: 'Test User',
      emailVerified: false,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(sessionModule.verifyToken).mockReturnValue({
      userId: 'user-123',
      email: 'old@example.com',
    });

    vi.mocked(db.user.findUnique)
      .mockResolvedValueOnce(currentUser as any)
      .mockResolvedValueOnce(null); // No duplicate email

    vi.mocked(db.user.update)
      .mockResolvedValueOnce(tempUpdatedUser as any) // Initial update
      .mockResolvedValueOnce(currentUser as any); // Rollback

    // Mock email send failure
    vi.mocked(emailModule.sendEmail).mockResolvedValue({
      success: false,
      error: 'Email service unavailable',
    });

    // Create request
    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      headers: {
        Cookie: 'session=valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'new@example.com' }),
    });

    // Call handler
    const response = await PATCH(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(500);
    expect(data.error).toBe('Email send failed');
    expect(data.message).toContain('Failed to send verification email');

    // Verify rollback was called
    expect(db.user.update).toHaveBeenCalledTimes(2);
    expect(db.user.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'user-123' },
      data: {
        email: currentUser.email,
        emailVerified: currentUser.emailVerified,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });
  });

  it('should handle email send exceptions with rollback', async () => {
    // Setup mocks
    const currentUser = {
      id: 'user-123',
      email: 'old@example.com',
      name: 'Test User',
      emailVerified: true,
      passwordHash: 'hashed-password',
    };

    const tempUpdatedUser = {
      id: 'user-123',
      email: 'new@example.com',
      name: 'Test User',
      emailVerified: false,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(sessionModule.verifyToken).mockReturnValue({
      userId: 'user-123',
      email: 'old@example.com',
    });

    vi.mocked(db.user.findUnique)
      .mockResolvedValueOnce(currentUser as any)
      .mockResolvedValueOnce(null); // No duplicate email

    vi.mocked(db.user.update)
      .mockResolvedValueOnce(tempUpdatedUser as any) // Initial update
      .mockResolvedValueOnce(currentUser as any); // Rollback

    // Mock email send exception
    vi.mocked(emailModule.sendEmail).mockRejectedValue(
      new Error('Network error')
    );

    // Create request
    const request = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      headers: {
        Cookie: 'session=valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'new@example.com' }),
    });

    // Call handler
    const response = await PATCH(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(500);
    expect(data.error).toBe('Email send failed');
    expect(data.message).toContain('Failed to send verification email');

    // Verify rollback was called
    expect(db.user.update).toHaveBeenCalledTimes(2);
    expect(db.user.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'user-123' },
      data: {
        email: currentUser.email,
        emailVerified: currentUser.emailVerified,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });
  });
});
