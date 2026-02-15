import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { manageSubscriptionSchema } from '@/lib/validations/admin';
import { db } from '@/lib/db';

/**
 * POST /api/admin/users/[id]/subscription
 *
 * Manually manage user subscriptions (activate or suspend).
 * Uses discriminated union validation for type-safe action handling.
 *
 * Actions:
 * - activate: Create/update subscription with planId and startDate
 * - suspend: Update subscription status to suspended with reason
 *
 * Requires admin authentication.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Admin guard
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const { id: userId } = await params;

    // 2. Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'JSON inválido' },
        { status: 400 }
      );
    }

    const parsed = manageSubscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 3. Handle action: activate
    if (data.action === 'activate') {
      const { planId, startDate } = data;

      // Check user exists and doesn't have active subscription
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          subscription: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      // Prevent duplicate active subscription
      if (user.subscription?.status === 'active') {
        return NextResponse.json(
          { error: 'El usuario ya tiene una suscripción activa' },
          { status: 400 }
        );
      }

      // Verify plan exists
      const plan = await db.subscriptionPlan.findUnique({
        where: { id: planId },
        select: {
          id: true,
          price: true,
          interval: true,
        },
      });

      if (!plan) {
        return NextResponse.json(
          { error: 'Plan no encontrado' },
          { status: 404 }
        );
      }

      // Calculate period dates based on plan interval
      const start = new Date(startDate);
      const end = new Date(start);
      if (plan.interval === 'monthly') {
        end.setMonth(end.getMonth() + 1);
      } else {
        end.setFullYear(end.getFullYear() + 1);
      }

      // Create or update subscription (upsert handles both cases)
      const subscription = await db.subscription.upsert({
        where: { userId },
        create: {
          userId,
          planId,
          status: 'active',
          planPrice: plan.price,
          currentPeriodStart: start,
          currentPeriodEnd: end,
          nextBillingDate: end,
        },
        update: {
          planId,
          status: 'active',
          planPrice: plan.price,
          currentPeriodStart: start,
          currentPeriodEnd: end,
          nextBillingDate: end,
        },
      });

      return NextResponse.json({ subscription });
    }

    // 4. Handle action: suspend
    if (data.action === 'suspend') {
      const { reason, endDate } = data;

      // Check subscription exists
      const subscription = await db.subscription.findUnique({
        where: { userId },
        select: {
          id: true,
          status: true,
          metadata: true,
        },
      });

      if (!subscription) {
        return NextResponse.json(
          { error: 'El usuario no tiene suscripción' },
          { status: 404 }
        );
      }

      // Update subscription status to suspended
      const updated = await db.subscription.update({
        where: { userId },
        data: {
          status: 'suspended',
          currentPeriodEnd: endDate ? new Date(endDate) : new Date(),
          metadata: {
            // Preserve existing metadata and add suspension details
            ...((subscription.metadata as any) || {}),
            suspensionReason: reason,
            suspendedAt: new Date().toISOString(),
          },
        },
      });

      return NextResponse.json({ subscription: updated });
    }

    // Unreachable due to discriminated union validation, but TypeScript safety
    return NextResponse.json(
      { error: 'Acción inválida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error managing subscription:', error);
    return NextResponse.json(
      { error: 'Error al gestionar suscripción' },
      { status: 500 }
    );
  }
}
