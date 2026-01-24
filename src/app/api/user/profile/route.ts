import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth/session';
import { updateProfileSchema } from '@/lib/validations/auth';
import { sendEmail } from '@/lib/email/send-email';
import VerifyEmail from '../../../../../emails/verify-email';
import { randomBytes } from 'crypto';

/**
 * GET /api/user/profile
 * Returns current user profile from session
 *
 * Security:
 * - Requires valid session token
 * - Returns user data without password
 */
export async function GET(request: NextRequest) {
  try {
    console.log('👤 Profile fetch request received');

    // 1. Get session from cookie
    const sessionCookie = request.cookies.get('session');

    if (!sessionCookie) {
      console.log('❌ No session cookie found');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No session found' },
        { status: 401 }
      );
    }

    // 2. Verify session token
    const payload = verifyToken(sessionCookie.value);

    if (!payload) {
      console.log('❌ Invalid session token');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid session' },
        { status: 401 }
      );
    }

    // 3. Fetch user from database (without password)
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      console.log('❌ User not found:', payload.userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ Profile fetched for user:', user.email);

    // 4. Return user profile
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('❌ Error fetching profile:', error);

    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An error occurred while fetching profile',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * Updates user profile (name and/or email)
 *
 * Security:
 * - Requires valid session token
 * - Validates input with Zod
 * - Email change triggers re-verification
 */
export async function PATCH(request: NextRequest) {
  try {
    console.log('👤 Profile update request received');

    // 1. Get session from cookie
    const sessionCookie = request.cookies.get('session');

    if (!sessionCookie) {
      console.log('❌ No session cookie found');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No session found' },
        { status: 401 }
      );
    }

    // 2. Verify session token
    const payload = verifyToken(sessionCookie.value);

    if (!payload) {
      console.log('❌ Invalid session token');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid session' },
        { status: 401 }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const validationResult = updateProfileSchema.safeParse(body);

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

    const { name, email } = validationResult.data;

    // 4. Get current user
    const currentUser = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!currentUser) {
      console.log('❌ User not found:', payload.userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 5. Check if email is being changed
    const emailChanged = email && email !== currentUser.email;

    let updateData: {
      name?: string;
      email?: string;
      emailVerified?: boolean;
      verificationToken?: string;
      verificationTokenExpiry?: Date;
    } = {};

    if (name) {
      updateData.name = name;
    }

    if (emailChanged) {
      // Check if new email is already taken by another user
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== currentUser.id) {
        console.log('❌ Email already in use:', email);
        return NextResponse.json(
          {
            error: 'Email already exists',
            message: 'This email is already associated with another account',
          },
          { status: 400 }
        );
      }

      // Generate new verification token
      const verificationToken = randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date();
      verificationTokenExpiry.setHours(
        verificationTokenExpiry.getHours() + 24
      ); // 24 hours expiry

      updateData.email = email;
      updateData.emailVerified = false;
      updateData.verificationToken = verificationToken;
      updateData.verificationTokenExpiry = verificationTokenExpiry;

      console.log('📧 Email change detected, generating verification token');
    }

    // 6. Update user in database
    const updatedUser = await db.user.update({
      where: { id: payload.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 7. Send verification email if email changed
    if (emailChanged && updateData.verificationToken && email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const verificationUrl = `${appUrl}/verify-email?token=${updateData.verificationToken}`;

      try {
        const emailResult = await sendEmail({
          to: email,
          subject: 'Verify your new email address - Reservapp',
          template: VerifyEmail({
            verificationUrl,
            email,
            name: updatedUser.name,
          }),
        });

        if (!emailResult.success) {
          // Email send failed - rollback database changes
          console.error('❌ Email send failed, rolling back changes:', emailResult.error);

          await db.user.update({
            where: { id: payload.userId },
            data: {
              email: currentUser.email,
              emailVerified: currentUser.emailVerified,
              verificationToken: null,
              verificationTokenExpiry: null,
            },
          });

          return NextResponse.json(
            {
              error: 'Email send failed',
              message: 'Failed to send verification email. Please try again later.',
            },
            { status: 500 }
          );
        }

        console.log('✅ Verification email sent to new address:', email);
      } catch (emailError) {
        // Email send threw exception - rollback database changes
        console.error('❌ Email send exception, rolling back changes:', emailError);

        await db.user.update({
          where: { id: payload.userId },
          data: {
            email: currentUser.email,
            emailVerified: currentUser.emailVerified,
            verificationToken: null,
            verificationTokenExpiry: null,
          },
        });

        return NextResponse.json(
          {
            error: 'Email send failed',
            message: 'Failed to send verification email. Please try again later.',
          },
          { status: 500 }
        );
      }
    }

    console.log('✅ Profile updated for user:', updatedUser.email);

    // 8. Return updated user profile
    return NextResponse.json(
      {
        user: updatedUser,
        message: emailChanged
          ? 'Profile updated successfully. Please verify your new email address.'
          : 'Profile updated successfully.',
        emailChanged,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error updating profile:', error);

    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An error occurred while updating profile',
      },
      { status: 500 }
    );
  }
}
