import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from './route';

// Mock dependencies
vi.mock('@/lib/middleware/admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';

const adminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
};

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/admin/users/user-1/promote', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('PATCH /api/admin/users/[id]/promote', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: caller is an admin
    vi.mocked(requireAdmin).mockResolvedValue({
      success: true as const,
      user: adminUser,
    });
  });

  it('should return the requireAdmin error response when caller is not admin', async () => {
    const { NextResponse } = await import('next/server');
    const errorResponse = NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
    vi.mocked(requireAdmin).mockResolvedValue({
      success: false as const,
      response: errorResponse,
    });

    const request = createRequest({ role: 'admin' });
    const response = await PATCH(request, createParams('user-2'));

    expect(response.status).toBe(403);
  });

  it('should return 400 for invalid JSON body', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/admin/users/user-2/promote',
      { method: 'PATCH', body: 'not-json' }
    );

    const response = await PATCH(request, createParams('user-2'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid JSON body');
  });

  it('should return 400 when role field is missing', async () => {
    const request = createRequest({});

    const response = await PATCH(request, createParams('user-2'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid input');
  });

  it('should return 400 when role is not a valid enum value', async () => {
    const request = createRequest({ role: 'superadmin' });

    const response = await PATCH(request, createParams('user-2'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid input');
  });

  it('should return 400 when admin tries to remove own admin privileges', async () => {
    const request = createRequest({ role: 'user' });

    // Caller is admin-1, target is also admin-1
    const response = await PATCH(request, createParams('admin-1'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Cannot remove your own admin privileges');
  });

  it('should allow admin to promote themselves (no-op but valid)', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'admin-1' } as never);
    vi.mocked(db.user.update).mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
    } as never);

    const request = createRequest({ role: 'admin' });
    const response = await PATCH(request, createParams('admin-1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user.role).toBe('admin');
  });

  it('should return 404 when target user does not exist', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    const request = createRequest({ role: 'admin' });
    const response = await PATCH(request, createParams('nonexistent'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('User not found');
  });

  it('should promote a user to admin successfully', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'user-2' } as never);
    vi.mocked(db.user.update).mockResolvedValue({
      id: 'user-2',
      email: 'user@example.com',
      name: 'Regular User',
      role: 'admin',
    } as never);

    const request = createRequest({ role: 'admin' });
    const response = await PATCH(request, createParams('user-2'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user).toEqual({
      id: 'user-2',
      email: 'user@example.com',
      name: 'Regular User',
      role: 'admin',
    });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-2' },
      data: { role: 'admin' },
      select: { id: true, email: true, name: true, role: true },
    });
  });

  it('should demote a different user from admin successfully', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'admin-2' } as never);
    vi.mocked(db.user.update).mockResolvedValue({
      id: 'admin-2',
      email: 'admin2@example.com',
      name: 'Other Admin',
      role: 'user',
    } as never);

    const request = createRequest({ role: 'user' });
    const response = await PATCH(request, createParams('admin-2'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user.role).toBe('user');
  });

  it('should not call db.user.update when target user is not found', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    const request = createRequest({ role: 'admin' });
    await PATCH(request, createParams('nonexistent'));

    expect(db.user.update).not.toHaveBeenCalled();
  });
});
