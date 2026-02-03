import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { promoteUserSchema } from '@/lib/validations/admin';
import { db } from '@/lib/db';

/**
 * PATCH /api/admin/users/[id]/promote
 * Promote or demote a user's admin status.
 * Requires the caller to be an admin.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Guard: caller must be an admin
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const { user: caller } = adminResult;
    const { id: targetUserId } = await params;

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const parsed = promoteUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { isAdmin } = parsed.data;

    // Prevent self-demotion: an admin cannot remove their own admin status
    if (caller.id === targetUserId && !isAdmin) {
      return NextResponse.json(
        { error: 'Cannot remove your own admin privileges' },
        { status: 400 }
      );
    }

    // Verify target user exists
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update admin status
    const updatedUser = await db.user.update({
      where: { id: targetUserId },
      data: { isAdmin },
      select: { id: true, email: true, name: true, isAdmin: true },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Promote user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
