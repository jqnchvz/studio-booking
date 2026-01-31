import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth/session';
import { createSubscriptionPreference } from '@/lib/services/mercadopago.service';

/**
 * POST /api/subscriptions/reactivate
 * Reactivates a cancelled or suspended subscription
 *
 * Security:
 * - Requires valid session token
 * - User can only reactivate their own subscription
 *
 * Process:
 * 1. Verify subscription is cancelled or suspended
 * 2. Optionally accept new planId for plan change during reactivation
 * 3. Create new MercadoPago payment preference
 * 4. Update subscription status to 'pending'
 * 5. Return init_point for checkout
 * 6. On payment success (webhook), subscription will be activated
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Subscription reactivation request received');

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

    // 3. Parse request body (optional newPlanId)
    const body = await request.json().catch(() => ({}));
    const { newPlanId } = body;

    // 4. Fetch user's subscription
    const subscription = await db.subscription.findUnique({
      where: { userId: payload.userId },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });

    if (!subscription) {
      console.log('❌ No subscription found for user:', payload.userId);
      return NextResponse.json(
        {
          error: 'No subscription found',
          message: 'No subscription found to reactivate',
        },
        { status: 404 }
      );
    }

    // 5. Verify subscription can be reactivated
    if (subscription.status !== 'cancelled' && subscription.status !== 'suspended') {
      console.log('❌ Subscription is not cancelled or suspended:', subscription.status);
      return NextResponse.json(
        {
          error: 'Cannot reactivate',
          message: `Cannot reactivate subscription with status: ${subscription.status}`,
        },
        { status: 400 }
      );
    }

    // 6. Determine which plan to use
    let planToUse = subscription.plan;

    if (newPlanId && newPlanId !== subscription.plan.id) {
      // User wants to reactivate with a different plan
      const newPlan = await db.subscriptionPlan.findUnique({
        where: { id: newPlanId },
        select: {
          id: true,
          name: true,
          price: true,
          isActive: true,
        },
      });

      if (!newPlan) {
        return NextResponse.json(
          { error: 'Plan not found', message: 'Selected plan does not exist' },
          { status: 404 }
        );
      }

      if (!newPlan.isActive) {
        return NextResponse.json(
          { error: 'Plan not available', message: 'Selected plan is no longer available' },
          { status: 400 }
        );
      }

      planToUse = newPlan;
      console.log(`📝 Reactivating with new plan: ${newPlan.name}`);
    } else {
      console.log(`📝 Reactivating with current plan: ${planToUse.name}`);
    }

    // 7. Calculate subscription period dates
    const now = new Date();
    const currentPeriodStart = new Date(now);
    const currentPeriodEnd = new Date(now);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // 1 month from now
    const nextBillingDate = new Date(currentPeriodEnd);

    // 8. Update subscription to pending status (before creating MercadoPago preference)
    const updatedSubscription = await db.subscription.update({
      where: { id: subscription.id },
      data: {
        planId: planToUse.id,
        preferenceId: null, // Will be set after MercadoPago call succeeds
        status: 'pending',
        planPrice: planToUse.price,
        nextBillingDate,
        currentPeriodStart,
        currentPeriodEnd,
        mercadopagoSubId: null, // Will be set by webhook when payment succeeds
        cancelledAt: null, // Clear cancellation date
        gracePeriodEnd: null, // Clear grace period
      },
    });

    console.log(`✅ Subscription updated to pending status for reactivation`);

    // 9. Create new MercadoPago payment preference
    const preference = await createSubscriptionPreference(
      planToUse.id,
      payload.userId,
      planToUse.price,
      planToUse.name
    );

    // 10. Update subscription with MercadoPago preference ID
    await db.subscription.update({
      where: { id: updatedSubscription.id },
      data: {
        preferenceId: preference.preferenceId,
      },
    });

    console.log(`✅ MercadoPago preference created for reactivation: ${preference.preferenceId}`);
    console.log(`   Plan: ${planToUse.name}`);
    console.log(`   Price: ${planToUse.price} CLP`);

    // TODO: Send reactivation email (future task)

    // 11. Return success response with init_point URL
    return NextResponse.json(
      {
        success: true,
        message: 'Subscription reactivation initiated',
        data: {
          subscriptionId: updatedSubscription.id,
          initPoint: preference.init_point,
          preferenceId: preference.preferenceId,
          plan: {
            id: planToUse.id,
            name: planToUse.name,
            price: planToUse.price,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error reactivating subscription:', error);

    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An error occurred while reactivating subscription',
      },
      { status: 500 }
    );
  }
}
