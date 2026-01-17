import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionCookieName } from '@/lib/auth/session';

/**
 * POST /api/auth/logout
 * Logs out the current user by clearing the session cookie
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookieName = getSessionCookieName();

    // Delete the session cookie
    cookieStore.delete(sessionCookieName);

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
