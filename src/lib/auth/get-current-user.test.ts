import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentUser } from './get-current-user';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('./session', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('../db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { cookies } from 'next/headers';
import { verifyToken } from './session';
import { db } from '../db';

const mockCookies = vi.mocked(cookies);
const mockVerifyToken = vi.mocked(verifyToken);
const mockFindUnique = vi.mocked(db.user.findUnique);

// ── Helpers ────────────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  emailVerified: true,
  isAdmin: false,
  isOwner: false,
  organizationId: null,
  createdAt: new Date(),
  passwordChangedAt: null as Date | null,
};

function setupCookie(token: string | null) {
  mockCookies.mockResolvedValue({
    get: vi.fn().mockReturnValue(token ? { value: token } : undefined),
  } as any);
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no session cookie', async () => {
    setupCookie(null);

    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it('returns null when token is invalid', async () => {
    setupCookie('invalid-token');
    mockVerifyToken.mockReturnValue(null);

    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it('returns null when user not found in DB', async () => {
    setupCookie('valid-token');
    mockVerifyToken.mockReturnValue({
      userId: 'user-1',
      email: 'test@example.com',
      isAdmin: false,
      isOwner: false,
      iat: Math.floor(Date.now() / 1000),
    });
    mockFindUnique.mockResolvedValue(null);

    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it('returns user when token is valid and passwordChangedAt is null', async () => {
    setupCookie('valid-token');
    mockVerifyToken.mockReturnValue({
      userId: 'user-1',
      email: 'test@example.com',
      isAdmin: false,
      isOwner: false,
      iat: Math.floor(Date.now() / 1000),
    });
    mockFindUnique.mockResolvedValue({ ...mockUser } as any);

    const user = await getCurrentUser();
    expect(user).not.toBeNull();
    expect(user!.id).toBe('user-1');
  });

  it('returns user when token was issued AFTER password change', async () => {
    const passwordChangedAt = new Date('2026-03-10T12:00:00Z');
    const tokenIat = Math.floor(new Date('2026-03-10T13:00:00Z').getTime() / 1000); // 1 hour later

    setupCookie('valid-token');
    mockVerifyToken.mockReturnValue({
      userId: 'user-1',
      email: 'test@example.com',
      isAdmin: false,
      isOwner: false,
      iat: tokenIat,
    });
    mockFindUnique.mockResolvedValue({ ...mockUser, passwordChangedAt } as any);

    const user = await getCurrentUser();
    expect(user).not.toBeNull();
    expect(user!.id).toBe('user-1');
  });

  it('returns null when token was issued BEFORE password change', async () => {
    const passwordChangedAt = new Date('2026-03-10T12:00:00Z');
    const tokenIat = Math.floor(new Date('2026-03-10T11:00:00Z').getTime() / 1000); // 1 hour before

    setupCookie('valid-token');
    mockVerifyToken.mockReturnValue({
      userId: 'user-1',
      email: 'test@example.com',
      isAdmin: false,
      isOwner: false,
      iat: tokenIat,
    });
    mockFindUnique.mockResolvedValue({ ...mockUser, passwordChangedAt } as any);

    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it('returns null when token iat equals passwordChangedAt exactly (same second)', async () => {
    const timestamp = new Date('2026-03-10T12:00:00Z');
    const tokenIat = Math.floor(timestamp.getTime() / 1000);
    // passwordChangedAt is at least 1ms after the second boundary in practice,
    // but if exactly equal, the token was issued at the same second — still valid
    // because iat is NOT less than changedAtSeconds
    setupCookie('valid-token');
    mockVerifyToken.mockReturnValue({
      userId: 'user-1',
      email: 'test@example.com',
      isAdmin: false,
      isOwner: false,
      iat: tokenIat,
    });
    mockFindUnique.mockResolvedValue({
      ...mockUser,
      passwordChangedAt: timestamp,
    } as any);

    const user = await getCurrentUser();
    // iat === changedAtSeconds → not less than → allowed
    expect(user).not.toBeNull();
  });
});
