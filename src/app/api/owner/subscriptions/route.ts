import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/middleware/owner';
import { db } from '@/lib/db';

/**
 * GET /api/owner/subscriptions
 *
 * Returns all subscriptions to plans belonging to this owner's organization.
 */
export async function GET(request: NextRequest) {
  try {
    const ownerResult = await requireOwner(request);
    if (!ownerResult.success) return ownerResult.response;

    const { organizationId } = ownerResult.user;

    const subscriptions = await db.subscription.findMany({
      where: { plan: { organizationId } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        planPrice: true,
        currentPeriodStart: true,
        nextBillingDate: true,
        cancelledAt: true,
        createdAt: true,
        plan: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(
      subscriptions.map((s) => ({
        id: s.id,
        client: { name: s.user.name, email: s.user.email },
        plan: s.plan.name,
        status: s.status,
        startDate: s.currentPeriodStart,
        nextBillingDate: s.nextBillingDate,
        cancelledAt: s.cancelledAt,
        createdAt: s.createdAt,
      }))
    );
  } catch (error) {
    console.error('Error fetching owner subscriptions:', error);
    return NextResponse.json({ error: 'Error al cargar suscripciones' }, { status: 500 });
  }
}
