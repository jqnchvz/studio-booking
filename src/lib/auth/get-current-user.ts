import { cookies } from 'next/headers';
import { verifyToken } from './session';
import { db } from '../db';
import { isSessionValid } from './session-store';

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
        role: true,
        organizationId: true,
        createdAt: true,
        passwordChangedAt: true,
      },
    });

    if (!user) return null;

    // Reject tokens issued before the last password change
    if (user.passwordChangedAt && payload.iat) {
      const changedAtSeconds = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (payload.iat < changedAtSeconds) {
        return null;
      }
    }

    // Check concurrent session validity in Redis (skip for legacy tokens without sessionId)
    if (payload.sessionId) {
      try {
        const valid = await isSessionValid(payload.userId, payload.sessionId);
        if (!valid) return null;
      } catch {
        // If Redis is unavailable, allow the request (graceful degradation)
      }
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
