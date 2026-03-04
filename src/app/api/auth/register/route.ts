import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { registerSchema } from '@/lib/validations/auth';
import { createUser } from '@/lib/services/auth.service';
import {
  checkRateLimit,
  getRateLimitHeaders,
} from '@/lib/middleware/rate-limit';
import { sendEmailWithLogging } from '@/lib/email/send-email';
import { VerifyEmail } from '../../../../../emails/verify-email';

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
          error: 'Demasiados intentos de registro',
          message: 'Por favor intenta nuevamente más tarde',
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

    // Send verification email
    if (user.verificationToken) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const verificationUrl = `${appUrl}/verify-email?token=${user.verificationToken}`;

      const emailResult = await sendEmailWithLogging({
        userId: user.id,
        type: 'verification',
        to: user.email,
        subject: 'Verifica tu correo electrónico - Reservapp',
        template: VerifyEmail({
          verificationUrl,
          email: user.email,
          name: user.name,
        }),
        metadata: {
          action: 'registration',
        },
      });

      if (!emailResult.success) {
        console.error('❌ Failed to send verification email:', emailResult.error);
        // Continue with registration even if email fails - user can request resend
      } else {
        console.log('📧 Verification email sent to:', user.email);
      }
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Registro exitoso. Por favor verifica tu correo electrónico.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
        },
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

    // Handle duplicate user error
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        {
          error: 'Error al registrar',
          message: 'Ya existe una cuenta con este correo electrónico',
        },
        { status: 409 }
      );
    }

    // Handle unexpected errors
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        error: 'Error al registrar',
        message: 'Ocurrió un error inesperado. Por favor intenta nuevamente.',
      },
      { status: 500 }
    );
  }
}
