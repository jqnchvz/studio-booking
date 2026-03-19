import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { removeAllSessions, getSessionCount } from '@/lib/auth/session-store';

/**
 * GET /api/admin/users/[id]/sessions
 * Get active session count for a user (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const { id: targetUserId } = await params;
    const count = await getSessionCount(targetUserId);

    return NextResponse.json({ userId: targetUserId, activeSessions: count });
  } catch (error) {
    console.error('Admin get sessions error:', error);
    return NextResponse.json(
      { error: 'Error al obtener sesiones' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]/sessions
 * Force-logout all sessions for a user (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const { id: targetUserId } = await params;
    const removed = await removeAllSessions(targetUserId);

    return NextResponse.json({
      success: true,
      message: 'Todas las sesiones del usuario han sido cerradas',
      userId: targetUserId,
      sessionsRemoved: removed,
    });
  } catch (error) {
    console.error('Admin force-logout error:', error);
    return NextResponse.json(
      { error: 'Error al cerrar sesiones del usuario' },
      { status: 500 }
    );
  }
}
