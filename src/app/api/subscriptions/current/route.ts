import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth/session';

/**
 * GET /api/subscriptions/current
 * Returns current user's subscription with plan and payment history
 *
 * Security:
 * - Requires valid session token
 * - Returns subscription with plan details and last 12 months of payments
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Subscription fetch request received');

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

    // 3. Fetch subscription with plan and payments (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const subscription = await db.subscription.findUnique({
      where: { userId: payload.userId },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            interval: true,
            features: true,
          },
        },
        payments: {
          where: {
            createdAt: {
              gte: twelveMonthsAgo,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            amount: true,
            penaltyFee: true,
            totalAmount: true,
            status: true,
            dueDate: true,
            paidAt: true,
            createdAt: true,
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

    console.log('✅ Subscription fetched for user:', payload.userId);
    console.log('   Plan:', subscription.plan.name);
    console.log('   Status:', subscription.status);
    console.log('   Payments:', subscription.payments.length);

    // 4. Return subscription with plan and payments
    return NextResponse.json({ subscription }, { status: 200 });
  } catch (error) {
    console.error('❌ Error fetching subscription:', error);

    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An error occurred while fetching subscription',
      },
      { status: 500 }
    );
  }
}
