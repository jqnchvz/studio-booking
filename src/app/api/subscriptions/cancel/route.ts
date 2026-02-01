import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { verifyToken } from '@/lib/auth/session';
import { cancelSubscription as cancelMercadoPagoSubscription } from '@/lib/services/mercadopago.service';

/**
 * POST /api/subscriptions/cancel
 * Cancels user's active subscription
 *
 * Security:
 * - Requires valid session token
 * - User can only cancel their own subscription
 *
 * Process:
 * 1. Verify subscription is active or past_due
 * 2. Cancel subscription in MercadoPago
 * 3. Update database: status='cancelled', cancelledAt=now
 * 4. User retains access until currentPeriodEnd
 */
export async function POST(request: NextRequest) {
  try {
    console.log('❌ Subscription cancellation request received');

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

    // 3. Fetch user's subscription
    const subscription = await db.subscription.findUnique({
      where: { userId: payload.userId },
      include: {
        plan: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!subscription) {
      console.log('❌ No subscription found for user:', payload.userId);
      return NextResponse.json(
        {
          error: 'No subscription found',
          message: 'You do not have an active subscription',
        },
        { status: 404 }
      );
    }

    // 4. Check if subscription is already cancelled
    if (subscription.status === 'cancelled') {
      console.log('❌ Subscription already cancelled:', subscription.id);
      return NextResponse.json(
        {
          error: 'Already cancelled',
          message: 'This subscription is already cancelled',
        },
        { status: 400 }
      );
    }

    // 5. Verify subscription can be cancelled (active or past_due)
    if (subscription.status !== 'active' && subscription.status !== 'past_due') {
      console.log('❌ Subscription cannot be cancelled, status:', subscription.status);
      return NextResponse.json(
        {
          error: 'Cannot cancel',
          message: `Subscription with status '${subscription.status}' cannot be cancelled`,
        },
        { status: 400 }
      );
    }

    // 6. Cancel subscription in MercadoPago (if it has a MercadoPago ID)
    if (subscription.mercadopagoSubId) {
      try {
        await cancelMercadoPagoSubscription(subscription.mercadopagoSubId);
        console.log('✅ Subscription cancelled in MercadoPago');
      } catch (mercadopagoError) {
        console.error('❌ Failed to cancel in MercadoPago:', mercadopagoError);
        // Continue with database update even if MercadoPago fails
        // This prevents user from being stuck unable to cancel
      }
    }

    // 7. Update subscription in database
    const updatedSubscription = await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        metadata: Prisma.DbNull,
      },
      include: {
        plan: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log('✅ Subscription cancelled successfully:', subscription.id);
    console.log('   User retains access until:', subscription.currentPeriodEnd);

    // TODO: Send cancellation confirmation email (future task)

    // 8. Return success response
    return NextResponse.json(
      {
        message: 'Subscription cancelled successfully',
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          cancelledAt: updatedSubscription.cancelledAt,
          currentPeriodEnd: updatedSubscription.currentPeriodEnd,
          planName: updatedSubscription.plan.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);

    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An error occurred while cancelling subscription',
      },
      { status: 500 }
    );
  }
}
