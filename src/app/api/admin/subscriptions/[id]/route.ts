import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';
import type { SubscriptionDetail } from '@/types/admin';

/**
 * GET /api/admin/subscriptions/[id]
 *
 * Get detailed subscription information including:
 * - Full subscription details and billing info
 * - Associated user
 * - Last 20 payments
 *
 * Requires admin authentication.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const { id } = await params;

    const subscription = await db.subscription.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        planPrice: true,
        nextBillingDate: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelledAt: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, email: true } },
        plan: { select: { name: true } },
        payments: {
          select: {
            id: true,
            totalAmount: true,
            penaltyFee: true,
            status: true,
            paidAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      );
    }

    const detail: SubscriptionDetail = {
      id: subscription.id,
      status: subscription.status,
      planName: subscription.plan.name,
      planPrice: subscription.planPrice,
      nextBillingDate: subscription.nextBillingDate.toISOString(),
      currentPeriodStart: subscription.currentPeriodStart.toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      cancelledAt: subscription.cancelledAt?.toISOString() || null,
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
      user: subscription.user,
      payments: subscription.payments.map(p => ({
        id: p.id,
        totalAmount: p.totalAmount,
        penaltyFee: p.penaltyFee,
        status: p.status,
        paidAt: p.paidAt?.toISOString() || null,
        createdAt: p.createdAt.toISOString(),
        planName: subscription.plan.name,
      })),
    };

    return NextResponse.json({ subscription: detail });
  } catch (error) {
    console.error('Error fetching subscription detail:', error);
    return NextResponse.json(
      { error: 'Error al cargar suscripción' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/subscriptions/[id]
 *
 * Manually override subscription status.
 * Body: { status: 'active' | 'suspended' | 'cancelled' }
 *
 * Requires admin authentication.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['active', 'suspended', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Estado inválido. Use: active, suspended, cancelled' },
        { status: 400 }
      );
    }

    const existing = await db.subscription.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      );
    }

    const updated = await db.subscription.update({
      where: { id },
      data: {
        status,
        ...(status === 'cancelled' && { cancelledAt: new Date() }),
      },
      select: { id: true, status: true },
    });

    return NextResponse.json({ subscription: updated });
  } catch (error) {
    console.error('Error updating subscription status:', error);
    return NextResponse.json(
      { error: 'Error al actualizar suscripción' },
      { status: 500 }
    );
  }
}
