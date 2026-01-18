import { cookies } from 'next/headers';
import { verifyToken, getSessionCookieName } from './session';
import { db } from '@/lib/db';

/**
 * Get current authenticated user from session cookie
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    // Get session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(getSessionCookieName());

    if (!sessionCookie) {
      return null;
    }

    // Verify token
    const payload = verifyToken(sessionCookie.value);

    if (!payload) {
      return null;
    }

    // Fetch user from database
    const user = await db.user.findUnique({
      where: { id: payload.userId },
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

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
