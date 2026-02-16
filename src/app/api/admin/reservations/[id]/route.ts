import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';

/**
 * GET /api/admin/reservations/[id]
 *
 * Get detailed reservation information including user and resource details.
 * Requires admin authentication.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Admin guard
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    // 2. Get reservation ID from params
    const { id } = await params;

    // 3. Fetch reservation with full relations
    const reservation = await db.reservation.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        status: true,
        attendees: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        resource: {
          select: {
            id: true,
            name: true,
            description: true,
            capacity: true,
          },
        },
      },
    });

    // 4. Check if reservation exists
    if (!reservation) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // 5. Transform to ReservationDetail format
    const reservationDetail = {
      id: reservation.id,
      title: reservation.title,
      description: reservation.description,
      startTime: reservation.startTime.toISOString(),
      endTime: reservation.endTime.toISOString(),
      status: reservation.status,
      attendees: reservation.attendees,
      metadata: reservation.metadata,
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString(),
      user: reservation.user,
      resource: reservation.resource,
    };

    // 6. Return reservation detail
    return NextResponse.json({ reservation: reservationDetail });
  } catch (error) {
    console.error('Error fetching reservation detail:', error);
    return NextResponse.json(
      { error: 'Error al cargar detalle de la reserva' },
      { status: 500 }
    );
  }
}
