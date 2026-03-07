import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/middleware/owner';
import { db } from '@/lib/db';

/**
 * GET /api/owner/clients
 *
 * Returns all end-users (clients) who have or had a subscription to any plan
 * owned by this organization, with their subscription status and reservation count.
 */
export async function GET(request: NextRequest) {
  try {
    const ownerResult = await requireOwner(request);
    if (!ownerResult.success) return ownerResult.response;

    const { organizationId } = ownerResult.user;

    const subscriptions = await db.subscription.findMany({
      where: { plan: { organizationId } },
      select: {
        status: true,
        createdAt: true,
        plan: { select: { name: true } },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            _count: {
              select: {
                reservations: { where: { resource: { organizationId } } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      subscriptions.map((s) => ({
        id: s.user.id,
        name: s.user.name,
        email: s.user.email,
        plan: s.plan.name,
        status: s.status,
        reservationCount: s.user._count.reservations,
        memberSince: s.user.createdAt,
      }))
    );
  } catch (error) {
    console.error('Error fetching owner clients:', error);
    return NextResponse.json({ error: 'Error al cargar los clientes' }, { status: 500 });
  }
}
