import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { removeAllSessions, getSessionCount } from '@/lib/auth/session-store';

/**
 * GET /api/user/sessions
 * Get the number of active sessions for the current user
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await getSessionCount(user.id);
    return NextResponse.json({ activeSessions: count });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: 'Error al obtener sesiones' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/sessions
 * Logout all devices — removes all sessions from Redis.
 * The current session's cookie is NOT cleared (user stays logged in on this device),
 * but the session ID will no longer be in Redis, so the next request will require re-login.
 */
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const removed = await removeAllSessions(user.id);

    return NextResponse.json({
      success: true,
      message: 'Todas las sesiones han sido cerradas',
      sessionsRemoved: removed,
    });
  } catch (error) {
    console.error('Logout all sessions error:', error);
    return NextResponse.json(
      { error: 'Error al cerrar sesiones' },
      { status: 500 }
    );
  }
}
