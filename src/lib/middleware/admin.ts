import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/session';
import { db } from '@/lib/db';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

type RequireAdminResult =
  | { success: true; user: AdminUser }
  | { success: false; response: NextResponse };

/**
 * Guard helper for admin-only API routes.
 * Checks cookie → verifies JWT → fetches user from DB → checks isAdmin.
 *
 * Usage in an API route:
 *   const result = await requireAdmin(request);
 *   if (!result.success) return result.response;
 *   const { user } = result;
 */
export async function requireAdmin(request: NextRequest): Promise<RequireAdminResult> {
  const sessionCookie = request.cookies.get('session');

  if (!sessionCookie) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  const payload = verifyToken(sessionCookie.value);
  if (!payload) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      ),
    };
  }

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, isAdmin: true },
  });

  if (!user) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      ),
    };
  }

  if (!user.isAdmin) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      ),
    };
  }

  return { success: true, user };
}
