import { cookies } from 'next/headers';
import { verifyToken } from './session';
import { db } from '../db';

/**
 * Get the currently authenticated user from the session cookie
 * Used in server components and API routes
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return null;
    }

    // Verify the JWT token
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
      },
    });

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
