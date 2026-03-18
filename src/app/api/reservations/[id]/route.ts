import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { db } from '@/lib/db';
import { updateReservationSchema } from '@/lib/validations/reservation';
import { checkResourceAvailability } from '@/lib/services/reservation.service';

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

/**
 * PATCH /api/reservations/[id]
 *
 * Partially updates a reservation owned by the authenticated user.
 * If startTime or endTime change, re-runs checkResourceAvailability() inside
 * a transaction to prevent double-booking. Returns 409 if the new slot conflicts.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para modificar esta reserva' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Fetch existing reservation (verify ownership)
    const existing = await db.reservation.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        resourceId: true,
        startTime: true,
        endTime: true,
        status: true,
      },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    if (existing.status === 'cancelled') {
      return NextResponse.json(
        { error: 'No se puede modificar una reserva cancelada' },
        { status: 422 }
      );
    }

    const body = await request.json();
    const parsed = updateReservationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, description, startTime, endTime, attendees } = parsed.data;

    const newStartTime = startTime ?? existing.startTime;
    const newEndTime = endTime ?? existing.endTime;
    const timesChanged =
      startTime !== undefined || endTime !== undefined;

    if (timesChanged) {
      // Re-check availability inside transaction, excluding this reservation
      const updated = await db.$transaction(async (tx) => {
        const availability = await checkResourceAvailability(
          existing.resourceId,
          newStartTime,
          newEndTime,
          tx,
          id
        );

        if (!availability.available) {
          throw Object.assign(new Error(availability.reason ?? 'El recurso no está disponible'), {
            statusCode: 409,
          });
        }

        return tx.reservation.update({
          where: { id },
          data: {
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
            startTime: newStartTime,
            endTime: newEndTime,
            ...(attendees !== undefined && { attendees }),
          },
          select: {
            id: true,
            title: true,
            description: true,
            startTime: true,
            endTime: true,
            status: true,
            attendees: true,
            updatedAt: true,
          },
        });
      });

      return NextResponse.json({ reservation: updated });
    }

    // No time change — simple update outside transaction
    const updated = await db.reservation.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(attendees !== undefined && { attendees }),
      },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        status: true,
        attendees: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ reservation: updated });
  } catch (error) {
    if (error instanceof Error && (error as any).statusCode === 409) {
      return NextResponse.json(
        { error: 'El horario seleccionado no está disponible' },
        { status: 409 }
      );
    }
    console.error('Patch reservation error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la reserva' },
      { status: 500 }
    );
  }
}
