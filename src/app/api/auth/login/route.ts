import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ZodError } from 'zod';
import { loginSchema } from '@/lib/validations/auth';
import { validateCredentials } from '@/lib/services/auth.service';
import { generateToken, setSessionCookie } from '@/lib/auth/session';
import {
  checkRateLimit,
  getRateLimitHeaders,
} from '@/lib/middleware/rate-limit';

/**
 * POST /api/auth/login
 * Authenticate user and create session
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limiting (10 attempts per hour)
    const rateLimit = checkRateLimit(request, {
      maxAttempts: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many login attempts',
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
    const validatedData = loginSchema.parse(body);

    // Validate credentials
    const user = await validateCredentials(
      validatedData.email,
      validatedData.password
    );

    // Generate JWT session token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Set session cookie
    const { name, value, ...options } = setSessionCookie(token);
    const cookieStore = await cookies();
    cookieStore.set(name, value, options);

    // Return success response with user data
    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          isAdmin: user.isAdmin,
        },
      },
      {
        status: 200,
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
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle credential validation errors
    if (error instanceof Error) {
      if (error.message === 'Invalid credentials') {
        return NextResponse.json(
          {
            error: 'Authentication failed',
            message: 'Invalid email or password',
          },
          { status: 401 }
        );
      }

      if (error.message === 'Email not verified') {
        return NextResponse.json(
          {
            error: 'Email not verified',
            message: 'Please verify your email before logging in',
          },
          { status: 403 }
        );
      }
    }

    // Handle unexpected errors
    console.error('Login error:', error);
    return NextResponse.json(
      {
        error: 'Login failed',
        message: 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}
