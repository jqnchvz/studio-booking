import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { db } from '@/lib/db';
import { differenceInHours } from 'date-fns';
import { queueEmail } from '@/lib/queue/email-queue';

/**
 * PATCH /api/reservations/[id]/cancel
 * Cancel a reservation
 *
 * Cancellation Policy:
 * - Free cancellation up to 24 hours before start time
 * - Cannot cancel within 24 hours of start time
 * - Can only cancel 'confirmed' reservations
 *
 * Requirements:
 * - User must be authenticated
 * - User must own the reservation
 * - Reservation must be 'confirmed'
 * - Must be at least 24 hours before start time
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Step 1: Authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para cancelar una reserva' },
        { status: 401 }
      );
    }

    // Step 2: Get reservation with resource details
    const reservation = await db.reservation.findUnique({
      where: { id: params.id },
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Step 3: Verify ownership
    if (reservation.userId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para cancelar esta reserva' },
        { status: 403 }
      );
    }

    // Step 4: Check if already cancelled
    if (reservation.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Esta reserva ya está cancelada' },
        { status: 400 }
      );
    }

    // Step 5: Check if reservation can be cancelled (must be 'confirmed')
    if (reservation.status !== 'confirmed') {
      return NextResponse.json(
        {
          error: 'Solo se pueden cancelar reservas confirmadas',
          details: { currentStatus: reservation.status },
        },
        { status: 400 }
      );
    }

    // Step 6: Enforce 24-hour cancellation policy
    const now = new Date();
    const hoursUntilStart = differenceInHours(reservation.startTime, now);

    if (hoursUntilStart < 24) {
      const deadline = new Date(reservation.startTime);
      deadline.setHours(deadline.getHours() - 24);

      return NextResponse.json(
        {
          error: 'No se puede cancelar con menos de 24 horas de anticipación',
          details: {
            cancellationDeadline: deadline.toISOString(),
            hoursRemaining: hoursUntilStart,
            policy: 'Se requieren al menos 24 horas de anticipación para cancelar',
          },
        },
        { status: 400 }
      );
    }

    // Step 7: Cancel the reservation
    const cancelledReservation = await db.reservation.update({
      where: { id: params.id },
      data: {
        status: 'cancelled',
        updatedAt: new Date(),
      },
    });

    // Step 8: Queue cancellation email (fire-and-forget)
    queueEmail({
      userId: user.id,
      type: 'reservation_cancelled',
      to: user.email,
      subject: 'Reserva cancelada - Reservapp',
      templateName: 'reservation-cancelled',
      templateData: {
        name: user.name,
        reservationId: reservation.id,
        resourceName: reservation.resource.name,
        resourceType: reservation.resource.type,
        title: reservation.title,
        description: reservation.description,
        startTime: reservation.startTime.toISOString(),
        endTime: reservation.endTime.toISOString(),
        cancelledAt: new Date().toISOString(),
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reservations`,
      },
    }).catch((error) => {
      // Log email queue errors but don't fail the cancellation
      console.error('Failed to queue cancellation email:', error);
    });

    // Step 9: Return success response
    return NextResponse.json({
      success: true,
      message: 'Reserva cancelada exitosamente',
      reservation: {
        id: cancelledReservation.id,
        status: cancelledReservation.status,
        updatedAt: cancelledReservation.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Cancel reservation error:', error);

    // Generic server error
    return NextResponse.json(
      { error: 'Error al cancelar la reserva. Por favor, intenta nuevamente.' },
      { status: 500 }
    );
  }
}
