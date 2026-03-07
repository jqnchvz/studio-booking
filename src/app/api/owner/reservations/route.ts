import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/middleware/owner';
import { db } from '@/lib/db';

/**
 * GET /api/owner/reservations
 *
 * Returns all reservations for resources belonging to this owner's organization.
 */
export async function GET(request: NextRequest) {
  try {
    const ownerResult = await requireOwner(request);
    if (!ownerResult.success) return ownerResult.response;

    const { organizationId } = ownerResult.user;

    const reservations = await db.reservation.findMany({
      where: { resource: { organizationId } },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        resource: { select: { name: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    return NextResponse.json(
      reservations.map((r) => ({
        id: r.id,
        client: { name: r.user.name, email: r.user.email },
        resource: r.resource.name,
        startTime: r.startTime,
        endTime: r.endTime,
        status: r.status,
        createdAt: r.createdAt,
      }))
    );
  } catch (error) {
    console.error('Error fetching owner reservations:', error);
    return NextResponse.json({ error: 'Error al cargar las reservas' }, { status: 500 });
  }
}
