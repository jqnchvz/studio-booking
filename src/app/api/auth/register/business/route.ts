import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { businessRegisterSchema } from '@/lib/validations/auth';
import { hashPassword, generateVerificationToken } from '@/lib/services/auth.service';
import {
  checkRateLimit,
  getRateLimitHeaders,
} from '@/lib/middleware/rate-limit';
import { sendEmailWithLogging } from '@/lib/email/send-email';
import { VerifyEmail } from '../../../../../../emails/verify-email';
import { db } from '@/lib/db';

/** Convert a name to a URL-safe slug. */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * POST /api/auth/register/business
 *
 * Register a business owner. Atomically creates:
 *   - User (role: 'owner')
 *   - Organization (status: "pending" — inactive until payment)
 *   - OrganizationSettings (businessType + timezone)
 *
 * Sends a verification email and returns the created user.
 */
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const validatedData = businessRegisterSchema.parse(body);

    // Check for existing email before entering the transaction
    const existing = await db.user.findUnique({
      where: { email: validatedData.email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        {
          error: 'Registration failed',
          message: 'An account with this email already exists',
        },
        {
          status: 409,
          headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetTime),
        }
      );
    }

    const passwordHash = await hashPassword(validatedData.password);

    // Build a unique slug from the business name + random suffix
    const baseSlug = toSlug(validatedData.businessName);
    const suffix = Math.random().toString(36).slice(2, 7);
    let slug = baseSlug ? `${baseSlug}-${suffix}` : suffix;

    // Ensure auto-generated slug isn't reserved
    const { isReservedSubdomain } = await import('@/lib/utils/domain');
    if (isReservedSubdomain(slug)) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
    }

    // Atomically create User + Organization + OrganizationSettings
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          passwordHash,
          role: 'owner',
          emailVerified: false,
        },
      });

      // Generate token using the new user's real ID
      const verificationToken = generateVerificationToken(newUser.id);
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 24);

      await tx.user.update({
        where: { id: newUser.id },
        data: { verificationToken, verificationTokenExpiry: tokenExpiry },
      });

      const org = await tx.organization.create({
        data: {
          name: validatedData.businessName,
          slug,
          status: 'pending',
          ownerId: newUser.id,
        },
      });

      await tx.organizationSettings.create({
        data: {
          organizationId: org.id,
          businessType: validatedData.businessType,
          timezone: 'America/Santiago',
        },
      });

      return { ...newUser, verificationToken };
    });

    // Send verification email (fire-and-forget — don't block the response)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${appUrl}/verify-email?token=${user.verificationToken}`;
    sendEmailWithLogging({
      userId: user.id,
      type: 'verification',
      to: user.email,
      subject: 'Verifica tu correo electrónico - Reservapp',
      template: VerifyEmail({
        verificationUrl,
        email: user.email,
        name: user.name,
      }),
      metadata: { action: 'business-registration' },
    }).catch((err) => console.error('Email queue error:', err));

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
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Invalid input data',
          details: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        {
          error: 'Registration failed',
          message: 'An account with this email already exists',
        },
        { status: 409 }
      );
    }

    console.error('Business registration error:', error);
    return NextResponse.json(
      {
        error: 'Registration failed',
        message: 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}
