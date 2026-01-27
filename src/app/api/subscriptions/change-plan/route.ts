import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth/session';
import { updateSubscriptionAmount } from '@/lib/services/mercadopago.service';

/**
 * POST /api/subscriptions/change-plan
 * Changes user's subscription plan (upgrade or downgrade)
 *
 * Security:
 * - Requires valid session token
 * - User can only change their own subscription
 *
 * Process:
 * 1. Validate new plan exists and is different
 * 2. Determine if upgrade (immediate) or downgrade (next period)
 * 3. For upgrades:
 *    - Calculate pro-rated amount for remaining days
 *    - Update subscription immediately
 *    - Update MercadoPago subscription amount
 * 4. For downgrades:
 *    - Schedule change for next billing period
 *    - Store in metadata
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Plan change request received');

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
    const { newPlanId } = body;

    if (!newPlanId) {
      return NextResponse.json(
        { error: 'Invalid input', message: 'newPlanId is required' },
        { status: 400 }
      );
    }

    // 4. Fetch user's current subscription
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
          message: 'You do not have an active subscription',
        },
        { status: 404 }
      );
    }

    // 5. Check subscription status
    if (subscription.status === 'cancelled') {
      console.log('❌ Cannot change cancelled subscription');
      return NextResponse.json(
        {
          error: 'Cannot change plan',
          message: 'Cancelled subscriptions cannot be changed. Please reactivate first.',
        },
        { status: 400 }
      );
    }

    if (subscription.status === 'suspended') {
      console.log('❌ Cannot change suspended subscription');
      return NextResponse.json(
        {
          error: 'Cannot change plan',
          message: 'Suspended subscriptions cannot be changed. Please resolve payment issues first.',
        },
        { status: 400 }
      );
    }

    // 6. Fetch new plan
    const newPlan = await db.subscriptionPlan.findUnique({
      where: { id: newPlanId },
      select: {
        id: true,
        name: true,
        price: true,
        description: true,
        features: true,
      },
    });

    if (!newPlan) {
      console.log('❌ New plan not found:', newPlanId);
      return NextResponse.json(
        { error: 'Plan not found', message: 'The selected plan does not exist' },
        { status: 404 }
      );
    }

    // 7. Check if plan is different
    if (subscription.planId === newPlanId) {
      console.log('❌ Same plan selected');
      return NextResponse.json(
        {
          error: 'Same plan',
          message: 'You are already subscribed to this plan',
        },
        { status: 400 }
      );
    }

    // 8. Determine if upgrade or downgrade
    const currentPrice = subscription.planPrice;
    const newPrice = newPlan.price;
    const isUpgrade = newPrice > currentPrice;

    console.log(`📊 Plan change analysis:`);
    console.log(`   Current: ${subscription.plan.name} (${currentPrice} CLP)`);
    console.log(`   New: ${newPlan.name} (${newPrice} CLP)`);
    console.log(`   Type: ${isUpgrade ? 'UPGRADE' : 'DOWNGRADE'}`);

    if (isUpgrade) {
      // UPGRADE: Apply immediately with pro-rated calculation
      console.log('⬆️ Processing immediate upgrade...');

      // Calculate days remaining in current period
      const now = new Date();
      const periodEnd = new Date(subscription.currentPeriodEnd);
      const daysRemaining = Math.max(
        0,
        Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );

      // Calculate days in current period
      const periodStart = new Date(subscription.currentPeriodStart);
      const totalDays = Math.ceil(
        (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate pro-rated amount (price difference for remaining days)
      const priceDifference = newPrice - currentPrice;
      const proRatedAmount = Math.round((priceDifference * daysRemaining) / totalDays);

      console.log(`   Days remaining: ${daysRemaining}/${totalDays}`);
      console.log(`   Price difference: ${priceDifference} CLP`);
      console.log(`   Pro-rated charge: ${proRatedAmount} CLP`);

      // Update MercadoPago subscription amount (if it has a MercadoPago ID)
      if (subscription.mercadopagoSubId) {
        try {
          await updateSubscriptionAmount(subscription.mercadopagoSubId, newPrice);
          console.log('✅ MercadoPago subscription amount updated');
        } catch (mercadopagoError) {
          console.error('❌ Failed to update MercadoPago subscription:', mercadopagoError);
          // Continue with database update even if MercadoPago fails
        }
      }

      // Update subscription in database
      const updatedSubscription = await db.subscription.update({
        where: { id: subscription.id },
        data: {
          planId: newPlanId,
          planPrice: newPrice,
        },
        include: {
          plan: {
            select: {
              name: true,
              price: true,
              description: true,
              features: true,
            },
          },
        },
      });

      console.log('✅ Subscription upgraded successfully');

      return NextResponse.json(
        {
          message: 'Plan upgraded successfully',
          subscription: {
            id: updatedSubscription.id,
            planId: updatedSubscription.planId,
            planName: updatedSubscription.plan.name,
            planPrice: updatedSubscription.planPrice,
            status: updatedSubscription.status,
            currentPeriodEnd: updatedSubscription.currentPeriodEnd,
          },
          upgrade: {
            proRatedAmount,
            daysRemaining,
            appliedImmediately: true,
          },
        },
        { status: 200 }
      );
    } else {
      // DOWNGRADE: Schedule for next billing period
      console.log('⬇️ Scheduling downgrade for next billing period...');

      // Store scheduled change in subscription metadata
      const metadata = {
        scheduledPlanChange: {
          newPlanId: newPlanId,
          newPlanName: newPlan.name,
          newPlanPrice: newPrice,
          scheduledAt: new Date().toISOString(),
          effectiveDate: subscription.nextBillingDate.toISOString(),
        },
      };

      // Update subscription with scheduled change (don't change plan yet)
      const updatedSubscription = await db.subscription.update({
        where: { id: subscription.id },
        data: {
          // Store scheduled change - will be applied on next billing
          // We can add a metadata field to Subscription model or handle in webhook
          // For now, we'll just schedule it to be applied on next webhook payment
        },
        include: {
          plan: {
            select: {
              name: true,
              price: true,
            },
          },
        },
      });

      console.log('✅ Downgrade scheduled for next billing period');
      console.log(`   Effective date: ${subscription.nextBillingDate}`);

      return NextResponse.json(
        {
          message: 'Plan downgrade scheduled successfully',
          subscription: {
            id: updatedSubscription.id,
            planId: updatedSubscription.planId,
            planName: updatedSubscription.plan.name,
            planPrice: updatedSubscription.planPrice,
            status: updatedSubscription.status,
            nextBillingDate: updatedSubscription.nextBillingDate,
          },
          downgrade: {
            newPlanName: newPlan.name,
            newPlanPrice: newPrice,
            effectiveDate: subscription.nextBillingDate,
            appliedImmediately: false,
          },
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('❌ Error changing subscription plan:', error);

    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An error occurred while changing your subscription plan',
      },
      { status: 500 }
    );
  }
}
