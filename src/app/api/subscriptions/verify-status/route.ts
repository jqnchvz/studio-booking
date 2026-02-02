import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { getPreApprovalStatus } from '@/lib/services/mercadopago.service';

/**
 * POST /api/subscriptions/verify-status
 * Verify and sync subscription status with MercadoPago
 *
 * This endpoint polls MercadoPago for the current preapproval status
 * and updates the local database accordingly. It acts as a fallback
 * when webhooks can't be received (e.g., local development).
 *
 * MercadoPago preapproval statuses:
 *   - "pending"     → User hasn't completed checkout yet
 *   - "authorized"  → Payment authorized, subscription active
 *   - "paused"      → Subscription paused by user/seller
 *   - "cancelled"   → Subscription cancelled
 */
export async function POST() {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Find user's subscription
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
      include: { plan: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // 3. Check if we have a preferenceId to query
    if (!subscription.preferenceId) {
      return NextResponse.json(
        {
          error: 'No MercadoPago preference linked',
          subscription: {
            id: subscription.id,
            status: subscription.status,
          },
        },
        { status: 400 }
      );
    }

    // 4. Query MercadoPago for current preapproval status
    const preApproval = await getPreApprovalStatus(subscription.preferenceId);

    // 5. TODO(human): Map MercadoPago preapproval status to local subscription status
    // and decide what database fields to update
    let newStatus: string = subscription.status;
    let updateData: Record<string, unknown> = {};

    // Map MercadoPago preapproval status → local subscription status
    // Consider: What should happen for each MercadoPago status?
    //   - "authorized" → activate the subscription (set dates, clear cancellation)
    //   - "paused"     → what local status maps to this?
    //   - "cancelled"  → should we update or leave as-is?
    //   - "pending"    → no change needed
    if (preApproval.status === 'authorized') {
      const now = new Date();
      const currentPeriodEnd = new Date(now);
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

      newStatus = 'active';
      updateData = {
        status: 'active',
        mercadopagoSubId: preApproval.id,
        currentPeriodStart: now,
        currentPeriodEnd: currentPeriodEnd,
        nextBillingDate: currentPeriodEnd,
        gracePeriodEnd: null,
        cancelledAt: null,
        metadata: Prisma.DbNull,
      };
    } else if (preApproval.status === 'paused') {
      newStatus = 'suspended';
      updateData = { status: 'suspended' };
    } else if (preApproval.status === 'cancelled') {
      newStatus = 'cancelled';
      updateData = {
        status: 'cancelled',
        cancelledAt: subscription.cancelledAt || new Date(),
      };
    }

    // 6. Update database if status changed
    if (newStatus !== subscription.status && Object.keys(updateData).length > 0) {
      await db.subscription.update({
        where: { id: subscription.id },
        data: updateData,
      });

      console.log(`✅ Subscription status synced: ${subscription.status} → ${newStatus}`);
    }

    // 7. Return current status
    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: newStatus,
        previousStatus: subscription.status,
        changed: newStatus !== subscription.status,
      },
      mercadopago: {
        preapprovalId: preApproval.id,
        status: preApproval.status,
      },
    });
  } catch (error) {
    console.error('Error verifying subscription status:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify subscription status',
        message:
          error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
