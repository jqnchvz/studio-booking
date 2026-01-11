import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { registerSchema } from '@/lib/validations/auth';
import { createUser } from '@/lib/services/auth.service';
import {
  checkRateLimit,
  getRateLimitHeaders,
} from '@/lib/middleware/rate-limit';

/**
 * POST /api/auth/register
 * Register a new user with email verification
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limiting
    const rateLimit = checkRateLimit(request);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many registration attempts',
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
    const validatedData = registerSchema.parse(body);

    // Create user
    const user = await createUser(validatedData);

    // TODO(human): Email sending implementation
    // In production, send verification email here with user.verificationToken
    // For now, we return the token in the response (development only)

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
        },
        // Remove this in production - only for development/testing
        verificationToken: user.verificationToken,
      },
      {
        status: 201,
        headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetTime),
      }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Invalid input data',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle duplicate user error
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        {
          error: 'Registration failed',
          message: 'An account with this email already exists',
        },
        { status: 409 }
      );
    }

    // Handle unexpected errors
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        error: 'Registration failed',
        message: 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}
