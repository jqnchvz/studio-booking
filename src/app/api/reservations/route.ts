import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createReservationSchema } from '@/lib/validations/reservation';
import {
  checkUserReservationLimit,
  createReservation,
} from '@/lib/services/reservation.service';
import { queueEmail } from '@/lib/queue/email-queue';
import { db } from '@/lib/db';

/**
 * POST /api/reservations
 * Create a new reservation
 *
 * Requirements:
 * - User must be authenticated
 * - User must have active subscription
 * - Resource must be available
 * - No overlapping reservations
 * - Rate limit: 10 reservations per day
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para crear una reserva' },
        { status: 401 }
      );
    }

    // Step 2: Subscription validation
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
      select: {
        status: true,
        gracePeriodEnd: true,
        plan: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Necesitas una suscripción activa para crear reservas' },
        { status: 403 }
      );
    }

    // Check if subscription is active or in grace period
    const isActive = subscription.status === 'active';
    const inGracePeriod =
      subscription.status === 'past_due' &&
      subscription.gracePeriodEnd &&
      subscription.gracePeriodEnd > new Date();

    if (!isActive && !inGracePeriod) {
      return NextResponse.json(
        {
          error: 'Tu suscripción no está activa',
          details: {
            status: subscription.status,
            action: 'Por favor, actualiza tu método de pago',
          },
        },
        { status: 403 }
      );
    }

    // Step 3: Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Cuerpo de solicitud inválido' },
        { status: 400 }
      );
    }

    const parsed = createReservationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Datos de reserva inválidos',
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const validatedData = parsed.data;

    // Step 4: Check user daily reservation limit (database-based)
    const limitCheck = await checkUserReservationLimit(user.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Has alcanzado el límite de reservas diarias',
          details: {
            count: limitCheck.count,
            limit: limitCheck.limit,
          },
        },
        { status: 429 }
      );
    }

    // Step 5: Create reservation (with transaction-based double-booking prevention)
    const reservation = await createReservation(validatedData, user.id);

    // Step 6: Queue confirmation email (async)
    await queueEmail({
      userId: user.id,
      type: 'reservation_confirmed',
      to: user.email,
      subject: 'Reserva confirmada - Reservapp',
      templateName: 'reservation-confirmed',
      templateData: {
        name: user.name,
        reservationId: reservation.id,
        resourceName: reservation.resource.name,
        resourceType: reservation.resource.type,
        title: reservation.title,
        description: reservation.description,
        startTime: reservation.startTime.toISOString(),
        endTime: reservation.endTime.toISOString(),
        attendees: reservation.attendees,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reservations/${reservation.id}`,
      },
    });

    // Step 7: Return success response
    return NextResponse.json(
      {
        reservation: {
          id: reservation.id,
          title: reservation.title,
          description: reservation.description,
          startTime: reservation.startTime.toISOString(),
          endTime: reservation.endTime.toISOString(),
          status: reservation.status,
          attendees: reservation.attendees,
          resource: {
            id: reservation.resource.id,
            name: reservation.resource.name,
            type: reservation.resource.type,
          },
          createdAt: reservation.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create reservation error:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      // Business logic errors from service layer
      if (
        error.message.includes('no está disponible') ||
        error.message.includes('no existe')
      ) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    // Generic server error
    return NextResponse.json(
      { error: 'Error al crear la reserva. Por favor, intenta nuevamente.' },
      { status: 500 }
    );
  }
}
