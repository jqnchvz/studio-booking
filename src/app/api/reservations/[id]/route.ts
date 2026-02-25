import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { db } from '@/lib/db';

/**
 * GET /api/reservations/[id]
 *
 * Returns full details for a single reservation owned by the authenticated user.
 * Returns 404 if the reservation does not exist or belongs to another user.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para ver esta reserva' },
        { status: 401 }
      );
    }

    const { id } = await params;

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
        userId: true,
        createdAt: true,
        updatedAt: true,
        resource: {
          select: {
            id: true,
            name: true,
            type: true,
            capacity: true,
            description: true,
          },
        },
      },
    });

    if (!reservation || reservation.userId !== user.id) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      reservation: {
        id: reservation.id,
        title: reservation.title,
        description: reservation.description,
        startTime: reservation.startTime.toISOString(),
        endTime: reservation.endTime.toISOString(),
        status: reservation.status,
        attendees: reservation.attendees,
        createdAt: reservation.createdAt.toISOString(),
        updatedAt: reservation.updatedAt.toISOString(),
        resource: reservation.resource,
      },
    });
  } catch (error) {
    console.error('Get reservation error:', error);
    return NextResponse.json(
      { error: 'Error al obtener la reserva' },
      { status: 500 }
    );
  }
}
