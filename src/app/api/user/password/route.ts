import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth/session';
import { changePasswordSchema } from '@/lib/validations/auth';

/**
 * PUT /api/user/password
 * Changes the authenticated user's password.
 *
 * Security:
 * - Requires valid session token
 * - Verifies current password with bcrypt before allowing change
 * - Validates new password strength with Zod
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. Verify session
    const sessionCookie = request.cookies.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'No autorizado', message: 'Sesión no encontrada' },
        { status: 401 }
      );
    }

    const payload = verifyToken(sessionCookie.value);

    if (!payload) {
      return NextResponse.json(
        { error: 'No autorizado', message: 'Sesión inválida' },
        { status: 401 }
      );
    }

    // 2. Parse and validate body
    const body = await request.json();
    const result = changePasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.issues },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = result.data;

    // 3. Fetch user with password hash
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // 4. Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta', message: 'La contraseña actual es incorrecta' },
        { status: 400 }
      );
    }

    // 5. Hash new password and update
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash, passwordChangedAt: new Date() },
    });

    return NextResponse.json(
      { message: 'Contraseña actualizada correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
