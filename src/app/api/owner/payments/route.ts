import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/middleware/owner';
import { db } from '@/lib/db';

/**
 * GET /api/owner/payments
 *
 * Returns all payments for subscriptions whose plan belongs to this owner's org.
 * Join path: Payment → Subscription → SubscriptionPlan → Organization
 */
export async function GET(request: NextRequest) {
  try {
    const ownerResult = await requireOwner(request);
    if (!ownerResult.success) return ownerResult.response;

    const { organizationId } = ownerResult.user;

    const payments = await db.payment.findMany({
      where: { subscription: { plan: { organizationId } } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        totalAmount: true,
        status: true,
        paidAt: true,
        createdAt: true,
        subscription: {
          select: {
            plan: { select: { name: true } },
          },
        },
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(
      payments.map((p) => ({
        id: p.id,
        client: { name: p.user.name, email: p.user.email },
        plan: p.subscription.plan.name,
        amount: p.totalAmount,
        status: p.status,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      }))
    );
  } catch (error) {
    console.error('Error fetching owner payments:', error);
    return NextResponse.json({ error: 'Error al cargar pagos' }, { status: 500 });
  }
}
