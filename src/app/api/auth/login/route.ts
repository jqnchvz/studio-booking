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
import {
  generateSessionId,
  registerSession,
} from '@/lib/auth/session-store';

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
          error: 'Demasiados intentos de inicio de sesión',
          message: 'Por favor intenta nuevamente más tarde',
          resetTime: rateLimit.resetTime.toISOString(),
        },
        {
          status: 429,
          headers: getRateLimitHeaders(
            rateLimit.remaining,
            rateLimit.resetTime,
            rateLimit.maxAttempts
          ),
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

    // Generate JWT session token with unique session ID
    const sessionId = generateSessionId();
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    });

    // Register session in Redis (evicts oldest if over limit)
    registerSession(user.id, sessionId).catch((err) =>
      console.error('Failed to register session:', err)
    );

    // Set session cookie
    const { name, value, ...options } = setSessionCookie(token);
    const cookieStore = await cookies();
    cookieStore.set(name, value, options);

    // Return success response with user data
    return NextResponse.json(
      {
        success: true,
        message: 'Inicio de sesión exitoso',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          role: user.role,
        },
      },
      {
        status: 200,
        headers: getRateLimitHeaders(
          rateLimit.remaining,
          rateLimit.resetTime,
          rateLimit.maxAttempts
        ),
      }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validación fallida',
          message: 'Datos de entrada inválidos',
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
            error: 'Autenticación fallida',
            message: 'Correo o contraseña incorrectos',
          },
          { status: 401 }
        );
      }

      if (error.message === 'Email not verified') {
        return NextResponse.json(
          {
            error: 'Correo no verificado',
            message: 'Verifica tu correo electrónico antes de iniciar sesión',
          },
          { status: 403 }
        );
      }
    }

    // Handle unexpected errors
    console.error('Login error:', error);
    return NextResponse.json(
      {
        error: 'Error al iniciar sesión',
        message: 'Ocurrió un error inesperado. Por favor intenta nuevamente.',
      },
      { status: 500 }
    );
  }
}
