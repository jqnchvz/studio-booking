import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { requireAdmin } from './admin';

// Mock dependencies
vi.mock('@/lib/auth/session', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { verifyToken } from '@/lib/auth/session';
import { db } from '@/lib/db';

function createMockRequest(sessionValue?: string): NextRequest {
  const url = 'http://localhost:3000/api/admin/test';
  const request = new NextRequest(url);

  if (sessionValue) {
    request.cookies.set('session', sessionValue);
  }

  return request;
}

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when no session cookie is present', async () => {
    const request = createMockRequest();

    const result = await requireAdmin(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      const body = await result.response.json();
      expect(result.response.status).toBe(401);
      expect(body.error).toBe('Authentication required');
    }
  });

  it('should return 401 when JWT token is invalid', async () => {
    vi.mocked(verifyToken).mockReturnValue(null);
    const request = createMockRequest('invalid-token');

    const result = await requireAdmin(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      const body = await result.response.json();
      expect(result.response.status).toBe(401);
      expect(body.error).toBe('Invalid or expired session');
    }
  });

  it('should return 404 when user does not exist in database', async () => {
    vi.mocked(verifyToken).mockReturnValue({ userId: 'deleted-user', email: 'gone@example.com' });
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    const request = createMockRequest('valid-token');

    const result = await requireAdmin(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      const body = await result.response.json();
      expect(result.response.status).toBe(404);
      expect(body.error).toBe('User not found');
    }
  });

  it('should return 403 when user is not an admin', async () => {
    vi.mocked(verifyToken).mockReturnValue({ userId: 'user-1', email: 'user@example.com' });
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Regular User',
      isAdmin: false,
    } as never);
    const request = createMockRequest('valid-token');

    const result = await requireAdmin(request);

    expect(result.success).toBe(false);
    if (!result.success) {
      const body = await result.response.json();
      expect(result.response.status).toBe(403);
      expect(body.error).toBe('Admin access required');
    }
  });

  it('should return success with user when caller is admin', async () => {
    const adminUser = {
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin User',
      isAdmin: true,
    };
    vi.mocked(verifyToken).mockReturnValue({ userId: 'admin-1', email: 'admin@example.com' });
    vi.mocked(db.user.findUnique).mockResolvedValue(adminUser as never);
    const request = createMockRequest('valid-token');

    const result = await requireAdmin(request);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user).toEqual(adminUser);
    }
  });

  it('should query the database with the userId from the JWT', async () => {
    vi.mocked(verifyToken).mockReturnValue({ userId: 'user-xyz', email: 'test@example.com' });
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    const request = createMockRequest('valid-token');

    await requireAdmin(request);

    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-xyz' },
      select: { id: true, email: true, name: true, isAdmin: true },
    });
  });

  it('should not query the database when token verification fails', async () => {
    vi.mocked(verifyToken).mockReturnValue(null);
    const request = createMockRequest('bad-token');

    await requireAdmin(request);

    expect(db.user.findUnique).not.toHaveBeenCalled();
  });
});
