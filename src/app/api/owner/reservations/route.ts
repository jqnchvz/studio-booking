import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/middleware/owner';
import { db } from '@/lib/db';

/**
 * GET /api/owner/reservations
 *
 * Returns reservations for resources belonging to this owner's organization.
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

    const rows = await db.reservation.findMany({
      where: { resource: { organizationId } },
      orderBy: { startTime: 'desc' },
      take: takeN + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        guestName: true,
        guestEmail: true,
        resource: { select: { name: true } },
      },
    });

    const hasMore = rows.length > takeN;
    const data = hasMore ? rows.slice(0, takeN) : rows;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return NextResponse.json({
      data: data.map((r) => ({
        id: r.id,
        client: { name: r.user?.name ?? r.guestName ?? 'Guest', email: r.user?.email ?? r.guestEmail ?? '' },
        resource: r.resource.name,
        startTime: r.startTime,
        endTime: r.endTime,
        status: r.status,
        createdAt: r.createdAt,
      })),
      nextCursor,
    });
  } catch (error) {
    console.error('Error fetching owner reservations:', error);
    return NextResponse.json({ error: 'Error al cargar las reservas' }, { status: 500 });
  }
}
