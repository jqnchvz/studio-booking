import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Shared verification logic used by both GET (backward compat) and POST handlers
 */
async function verifyEmailToken(token: string | null): Promise<NextResponse> {
  try {
    // Validate token exists
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification token is required',
          message: 'Missing verification token',
        },
        { status: 400 }
      );
    }

    // Find user by verification token
    const user = await db.user.findUnique({
      where: { verificationToken: token },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        verificationTokenExpiry: true,
      },
    });

    // Check if user exists with this token
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid verification token',
          message: 'The verification link is invalid or has already been used',
        },
        { status: 400 }
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already verified',
          message: 'This email address has already been verified',
        },
        { status: 400 }
      );
    }

    // Check token expiry
    if (!user.verificationTokenExpiry || user.verificationTokenExpiry < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token expired',
          message: 'The verification link has expired. Please request a new one',
        },
        { status: 400 }
      );
    }

    // Update user - verify email and clear token
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      email: user.email,
    });
  } catch (error) {
    console.error('Email verification error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Verification failed',
        message: 'An error occurred while verifying your email. Please try again',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/verify-email
 * Preferred: token submitted in request body
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return verifyEmailToken(body.token ?? null);
}

/**
 * GET /api/auth/verify-email
 * Backward compatibility: token in query params
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return verifyEmailToken(searchParams.get('token'));
}
