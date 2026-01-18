import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createSubscriptionPreferenceSchema } from '@/lib/validations/subscription';
import { getCurrentUser } from '@/lib/auth/get-user';
import { db } from '@/lib/db';
import { createSubscriptionPreference } from '@/lib/services/mercadopago.service';

/**
 * POST /api/subscriptions/create-preference
 * Create MercadoPago subscription preference for authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Please log in to create a subscription',
        },
        { status: 401 }
      );
    }

    // 2. Check if user email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: 'Email not verified',
          message: 'Please verify your email before subscribing',
        },
        { status: 403 }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const validatedData = createSubscriptionPreferenceSchema.parse(body);

    // 4. Check if user already has an active subscription
    const existingSubscription = await db.subscription.findUnique({
      where: { userId: user.id },
    });

    if (existingSubscription && existingSubscription.status === 'active') {
      return NextResponse.json(
        {
          error: 'Subscription already exists',
          message: 'You already have an active subscription',
        },
        { status: 409 }
      );
    }

    // 5. Fetch subscription plan
    const plan = await db.subscriptionPlan.findUnique({
      where: { id: validatedData.planId },
    });

    if (!plan) {
      return NextResponse.json(
        {
          error: 'Plan not found',
          message: 'The selected subscription plan does not exist',
        },
        { status: 404 }
      );
    }

    if (!plan.isActive) {
      return NextResponse.json(
        {
          error: 'Plan not available',
          message: 'The selected subscription plan is no longer available',
        },
        { status: 400 }
      );
    }

    // 6. Calculate subscription period dates
    const now = new Date();
    const currentPeriodStart = new Date(now);
    const currentPeriodEnd = new Date(now);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // 1 month from now
    const nextBillingDate = new Date(currentPeriodEnd);

    // 7. Create MercadoPago preference
    const preference = await createSubscriptionPreference(
      plan.id,
      user.id,
      plan.price,
      plan.name
    );

    // 8. Create or update subscription record in database
    let subscription;

    if (existingSubscription) {
      // Update existing subscription
      subscription = await db.subscription.update({
        where: { userId: user.id },
        data: {
          planId: plan.id,
          preferenceId: preference.preferenceId,
          status: 'pending',
          planPrice: plan.price,
          nextBillingDate,
          currentPeriodStart,
          currentPeriodEnd,
          mercadopagoSubId: null, // Will be set by webhook when payment succeeds
          cancelledAt: null,
          gracePeriodEnd: null,
        },
      });
    } else {
      // Create new subscription
      subscription = await db.subscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          preferenceId: preference.preferenceId,
          status: 'pending',
          planPrice: plan.price,
          nextBillingDate,
          currentPeriodStart,
          currentPeriodEnd,
        },
      });
    }

    // 9. Return success response with init_point URL
    return NextResponse.json(
      {
        success: true,
        message: 'Subscription preference created successfully',
        data: {
          subscriptionId: subscription.id,
          initPoint: preference.init_point,
          preferenceId: preference.preferenceId,
        },
      },
      { status: 201 }
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

    // Handle MercadoPago errors
    if (error instanceof Error && error.message.includes('MercadoPago')) {
      console.error('MercadoPago error:', error);
      return NextResponse.json(
        {
          error: 'Payment service error',
          message:
            'Unable to create payment preference. Please try again later.',
        },
        { status: 503 }
      );
    }

    // Handle unexpected errors
    console.error('Create subscription preference error:', error);
    return NextResponse.json(
      {
        error: 'Subscription creation failed',
        message: 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}
