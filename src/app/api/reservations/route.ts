import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createReservationSchema } from '@/lib/validations/reservation';
import {
  checkUserReservationLimit,
  createReservation,
} from '@/lib/services/reservation.service';
import { queueEmail } from '@/lib/queue/email-queue';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

/**
 * GET /api/reservations
 * List user's reservations with filtering and pagination
 *
 * Query Parameters:
 * - status: all | confirmed | cancelled | completed (default: all)
 * - timeframe: all | upcoming | past (default: all)
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 *
 * Returns:
 * - reservations: Array of reservation objects with resource details
 * - total: Total count of reservations matching filters
 * - page: Current page number
 * - pages: Total number of pages
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para ver tus reservas' },
        { status: 401 }
      );
    }

    // Step 2: Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const timeframe = searchParams.get('timeframe') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    // Step 3: Build filter conditions
    const where: Prisma.ReservationWhereInput = {
      userId: user.id,
    };

    // Filter by status
    if (status !== 'all') {
      where.status = status as 'confirmed' | 'cancelled' | 'completed';
    }

    // Filter by timeframe
    const now = new Date();
    if (timeframe === 'upcoming') {
      where.startTime = { gte: now };
    } else if (timeframe === 'past') {
      where.startTime = { lt: now };
    }

    // Step 4: Get total count for pagination
    const total = await db.reservation.count({ where });

    // Step 5: Fetch reservations with pagination
    const reservations = await db.reservation.findMany({
      where,
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            type: true,
            capacity: true,
          },
        },
      },
      orderBy: [
        { startTime: timeframe === 'past' ? 'desc' : 'asc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Step 6: Calculate pagination metadata
    const pages = Math.ceil(total / limit);

    // Step 7: Return paginated response
    return NextResponse.json({
      reservations: reservations.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        startTime: r.startTime.toISOString(),
        endTime: r.endTime.toISOString(),
        status: r.status,
        attendees: r.attendees,
        resource: r.resource,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      pagination: {
        total,
        page,
        limit,
        pages,
      },
    });
  } catch (error) {
    console.error('List reservations error:', error);
    return NextResponse.json(
      { error: 'Error al obtener las reservas. Por favor, intenta nuevamente.' },
      { status: 500 }
    );
  }
}

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
        planId: true,
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

    // Step 3.5: Plan-resource access + monthly quota check
    const accessRecords = await db.planResourceAccess.findMany({
      where: { planId: subscription.planId },
    });

    // No records → plan is unrestricted (backward compatible with existing plans)
    if (accessRecords.length > 0) {
      const record = accessRecords.find(r => r.resourceId === validatedData.resourceId);

      if (!record) {
        return NextResponse.json(
          { error: 'Tu plan no incluye acceso a este recurso' },
          { status: 403 }
        );
      }

      if (record.maxHoursPerMonth !== null) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyReservations = await db.reservation.findMany({
          where: {
            userId: user.id,
            resourceId: validatedData.resourceId,
            status: { in: ['confirmed', 'pending'] },
            startTime: { gte: startOfMonth },
          },
          select: { startTime: true, endTime: true },
        });

        const hoursUsed = monthlyReservations.reduce((acc, r) => {
          return acc + (r.endTime.getTime() - r.startTime.getTime()) / (1000 * 60 * 60);
        }, 0);

        const newHours =
          (new Date(validatedData.endTime).getTime() -
            new Date(validatedData.startTime).getTime()) /
          (1000 * 60 * 60);

        if (hoursUsed + newHours > record.maxHoursPerMonth) {
          return NextResponse.json(
            {
              error: `Has alcanzado el límite mensual de ${record.maxHoursPerMonth} hora(s) para este recurso con tu plan actual`,
            },
            { status: 403 }
          );
        }
      }
    }

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

    // Step 6: Queue confirmation email (fire-and-forget, don't block response)
    queueEmail({
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
    }).catch((error) => {
      // Log email queue errors but don't fail the reservation
      console.error('Failed to queue confirmation email:', error);
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
