import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { db } from '@/lib/db';
import {
  checkRateLimit,
  getRateLimitHeaders,
} from '@/lib/middleware/rate-limit';
import { sendEmailWithLogging } from '@/lib/email/send-email';
import { PasswordReset } from '../../../../../emails/password-reset';

/**
 * Validation schema for forgot password request
 */
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

/**
 * POST /api/auth/forgot-password
 * Initiates password reset process by sending reset email
 *
 * Security:
 * - Rate limited to prevent abuse
 * - Always returns success message (prevents email enumeration)
 * - Reset token expires after 1 hour
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Forgot password request received');

    // Check rate limiting
    const rateLimit = checkRateLimit(request);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Please try again later',
          resetTime: rateLimit.resetTime.toISOString(),
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetTime),
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = forgotPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Please enter a valid email address',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success message to prevent email enumeration
    // But only send email if user exists
    if (user) {
      // Generate reset token
      const resetToken = randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry

      // Update user with reset token
      await db.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      // Send reset email
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

      const emailResult = await sendEmailWithLogging({
        userId: user.id,
        type: 'password_reset',
        to: user.email,
        subject: 'Restablece tu contrasena - Reservapp',
        template: PasswordReset({
          resetUrl,
          email: user.email,
          name: user.name,
        }),
        metadata: {
          tokenExpiry: resetTokenExpiry.toISOString(),
        },
      });

      if (!emailResult.success) {
        console.error('❌ Failed to send password reset email:', emailResult.error);
        // Don't reveal the error to the user
      } else {
        console.log('📧 Password reset email sent to:', user.email);
      }
    } else {
      console.log('⚠️ Password reset requested for non-existent email:', email);
    }

    // Always return success (prevents email enumeration)
    return NextResponse.json(
      {
        success: true,
        message:
          'If an account with that email exists, we have sent a password reset link.',
      },
      {
        status: 200,
        headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetTime),
      }
    );
  } catch (error) {
    console.error('❌ Error in forgot password:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}
