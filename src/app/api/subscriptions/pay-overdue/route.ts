import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth/session';
import { createOverduePaymentPreference } from '@/lib/services/mercadopago.service';

/**
 * POST /api/subscriptions/pay-overdue
 * Creates a MercadoPago payment preference for an overdue payment with penalties
 *
 * Request body:
 * - paymentId: string - The ID of the overdue payment to pay
 *
 * Returns:
 * - initPoint: string - MercadoPago checkout URL
 *
 * Security:
 * - Requires valid session token
 * - Only allows payment of user's own overdue payments
 */
export async function POST(request: NextRequest) {
  try {
    console.log('💳 Overdue payment request received');

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

    // 3. Parse request body
    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Bad request', message: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // 4. Fetch the payment and verify ownership
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        subscription: {
          include: {
            plan: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      console.log('❌ Payment not found:', paymentId);
      return NextResponse.json(
        { error: 'Not found', message: 'Payment not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (payment.userId !== payload.userId) {
      console.log('❌ User does not own this payment');
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to pay this' },
        { status: 403 }
      );
    }

    // 5. Verify payment is pending and has penalty or is overdue
    if (payment.status !== 'pending') {
      console.log('❌ Payment is not pending:', payment.status);
      return NextResponse.json(
        { error: 'Bad request', message: 'This payment is not pending' },
        { status: 400 }
      );
    }

    // 6. Create MercadoPago preference for the total amount (base + penalty)
    const preference = await createOverduePaymentPreference(
      payment.id,
      payload.userId,
      payment.totalAmount,
      payment.subscription.plan.name
    );

    console.log('✅ Overdue payment preference created');
    console.log('   Payment ID:', payment.id);
    console.log('   Total Amount:', payment.totalAmount);
    console.log('   Init Point:', preference.init_point);

    // 7. Return the checkout URL
    return NextResponse.json(
      {
        initPoint: preference.init_point,
        payment: {
          id: payment.id,
          amount: payment.amount,
          penaltyFee: payment.penaltyFee,
          totalAmount: payment.totalAmount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error creating overdue payment preference:', error);

    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An error occurred while creating payment',
      },
      { status: 500 }
    );
  }
}
