import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/middleware/owner';
import { db } from '@/lib/db';

/**
 * GET /api/owner/payments
 *
 * Returns payments for subscriptions whose plan belongs to this owner's org.
 * Join path: Payment → Subscription → SubscriptionPlan → Organization
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

    const rows = await db.payment.findMany({
      where: { subscription: { plan: { organizationId } } },
      orderBy: { createdAt: 'desc' },
      take: takeN + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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

    const hasMore = rows.length > takeN;
    const data = hasMore ? rows.slice(0, takeN) : rows;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return NextResponse.json({
      data: data.map((p) => ({
        id: p.id,
        client: { name: p.user.name, email: p.user.email },
        plan: p.subscription.plan.name,
        amount: p.totalAmount,
        status: p.status,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      })),
      nextCursor,
    });
  } catch (error) {
    console.error('Error fetching owner payments:', error);
    return NextResponse.json({ error: 'Error al cargar pagos' }, { status: 500 });
  }
}
