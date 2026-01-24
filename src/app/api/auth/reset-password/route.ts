import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { resetPasswordSchema } from '@/lib/validations/auth';
import bcrypt from 'bcrypt';

/**
 * POST /api/auth/reset-password
 * Resets user password using reset token
 *
 * Security:
 * - Verifies reset token exists and is not expired
 * - Validates new password strength
 * - Clears reset token after successful reset (single-use)
 * - Hashes password with bcrypt
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Password reset request received');

    // 1. Parse and validate request body
    const body = await request.json();
    const validationResult = resetPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      console.log('❌ Validation failed:', validationResult.error.issues);
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { token, newPassword } = validationResult.data;

    // 2. Find user by reset token
    const user = await db.user.findUnique({
      where: { resetToken: token },
    });

    if (!user) {
      console.log('❌ Invalid or expired reset token');
      return NextResponse.json(
        {
          error: 'Invalid or expired reset token',
          message: 'This reset link is invalid or has already been used',
        },
        { status: 400 }
      );
    }

    // 3. Check token expiry (1 hour from creation)
    if (
      !user.resetTokenExpiry ||
      new Date(user.resetTokenExpiry) < new Date()
    ) {
      console.log('❌ Reset token expired for user:', user.email);

      // Clear expired token
      await db.user.update({
        where: { id: user.id },
        data: {
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      return NextResponse.json(
        {
          error: 'Token expired',
          message:
            'This reset link has expired. Please request a new password reset.',
        },
        { status: 400 }
      );
    }

    console.log('✅ Valid reset token for user:', user.email);

    // 4. Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // 5. Update user password and clear reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    console.log('✅ Password reset successful for user:', user.email);

    // 6. Return success response
    return NextResponse.json(
      {
        success: true,
        message:
          'Password reset successful! You can now log in with your new password.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error resetting password:', error);

    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An error occurred while resetting your password',
      },
      { status: 500 }
    );
  }
}
