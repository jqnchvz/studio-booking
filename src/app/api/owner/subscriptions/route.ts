import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/middleware/owner';
import { db } from '@/lib/db';

/**
 * GET /api/owner/subscriptions
 *
 * Returns subscriptions to plans belonging to this owner's organization.
 *
 * Query Parameters:
 * - cursor: last item id for cursor-based pagination
 * - take: page size (default: 50, max: 200)
 */
export async function GET(request: NextRequest) {
  try {
    const ownerResult = await requireOwner(request);
    if (!ownerResult.success) return ownerResult.response;

    const { organizationId } = ownerResult.user;

    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor') || undefined;
    const takeN = Math.min(parseInt(url.searchParams.get('take') || '50'), 200);

    const rows = await db.subscription.findMany({
      where: { plan: { organizationId } },
      orderBy: { createdAt: 'desc' },
      take: takeN + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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

    const hasMore = rows.length > takeN;
    const data = hasMore ? rows.slice(0, takeN) : rows;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return NextResponse.json({
      data: data.map((s) => ({
        id: s.id,
        client: { name: s.user.name, email: s.user.email },
        plan: s.plan.name,
        status: s.status,
        startDate: s.currentPeriodStart,
        nextBillingDate: s.nextBillingDate,
        cancelledAt: s.cancelledAt,
        createdAt: s.createdAt,
      })),
      nextCursor,
    });
  } catch (error) {
    console.error('Error fetching owner subscriptions:', error);
    return NextResponse.json({ error: 'Error al cargar suscripciones' }, { status: 500 });
  }
}
