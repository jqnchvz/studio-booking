import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionCookieName, getDeleteSessionCookieOptions, verifyToken } from '@/lib/auth/session';
import { removeSession } from '@/lib/auth/session-store';

/**
 * POST /api/auth/logout
 * Logs out the current user by clearing the session cookie
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookieName = getSessionCookieName();
    const sessionCookie = cookieStore.get(sessionCookieName);

    // Remove session from Redis tracking before clearing cookie
    if (sessionCookie) {
      const payload = verifyToken(sessionCookie.value);
      if (payload?.sessionId) {
        removeSession(payload.userId, payload.sessionId).catch((err) =>
          console.error('Failed to remove session from Redis:', err)
        );
      }
    }

    // Delete the session cookie (must match domain/path used when setting)
    cookieStore.delete(getDeleteSessionCookieOptions());

    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during logout',
      },
      { status: 500 }
    );
  }
}
