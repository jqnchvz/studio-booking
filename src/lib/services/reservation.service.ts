import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import type { CreateReservationInput } from '@/lib/validations/reservation';

/**
 * Rate limit configuration for reservations
 */
const RESERVATION_RATE_LIMIT = {
  maxReservationsPerDay: 10,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Availability check result
 */
export interface AvailabilityCheckResult {
  available: boolean;
  reason?: string;
  conflictingReservation?: {
    id: string;
    startTime: Date;
    endTime: Date;
  };
}

/**
 * Check if a resource is available for the requested time slot.
 * Uses pessimistic locking to prevent race conditions.
 *
 * Algorithm:
 * 1. Verify resource exists and is active
 * 2. Check day-of-week availability (ResourceAvailability table)
 * 3. Check time-of-day falls within available hours
 * 4. Check for overlapping reservations (with row-level locking)
 *
 * @param resourceId - Resource to check
 * @param startTime - Requested start time
 * @param endTime - Requested end time
 * @param transaction - Optional Prisma transaction client
 */
export async function checkResourceAvailability(
  resourceId: string,
  startTime: Date,
  endTime: Date,
  transaction?: Prisma.TransactionClient
): Promise<AvailabilityCheckResult> {
  const client = transaction || db;

  // Step 1: Verify resource exists and is active
  const resource = await client.resource.findUnique({
    where: { id: resourceId },
    select: {
      id: true,
      name: true,
      isActive: true,
      capacity: true,
      availability: {
        where: { isActive: true },
        select: {
          dayOfWeek: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  });

  if (!resource) {
    return {
      available: false,
      reason: 'El recurso no existe',
    };
  }

  if (!resource.isActive) {
    return {
      available: false,
      reason: 'El recurso no está disponible actualmente',
    };
  }

  // Step 2: Check day-of-week availability
  // Extract day of week (0 = Sunday, 6 = Saturday) in Chile timezone
  const dayOfWeek = new Date(
    startTime.toLocaleString('en-US', { timeZone: 'America/Santiago' })
  ).getDay();

  const dayAvailability = resource.availability.filter((a) => a.dayOfWeek === dayOfWeek);

  if (dayAvailability.length === 0) {
    return {
      available: false,
      reason: 'El recurso no está disponible este día de la semana',
    };
  }

  // Step 3: Check time-of-day falls within available hours
  // Convert times to "HH:MM" format in Chile timezone
  const startTimeStr = startTime.toLocaleTimeString('en-US', {
    timeZone: 'America/Santiago',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  const endTimeStr = endTime.toLocaleTimeString('en-US', {
    timeZone: 'America/Santiago',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  const isWithinAvailableHours = dayAvailability.some((slot) => {
    return startTimeStr >= slot.startTime && endTimeStr <= slot.endTime;
  });

  if (!isWithinAvailableHours) {
    return {
      available: false,
      reason: `El recurso solo está disponible entre ${dayAvailability[0].startTime} y ${dayAvailability[0].endTime}`,
    };
  }

  // Step 4: Check for overlapping reservations (CRITICAL: prevents double-booking)
  // Use FOR UPDATE SKIP LOCKED for pessimistic locking (Postgres feature)
  const overlappingReservations = await client.$queryRaw<
    Array<{ id: string; startTime: Date; endTime: Date }>
  >`
    SELECT id, "startTime", "endTime"
    FROM reservations
    WHERE "resourceId" = ${resourceId}
      AND status IN ('pending', 'confirmed')
      AND (
        ("startTime" <= ${startTime} AND "endTime" > ${startTime})
        OR ("startTime" < ${endTime} AND "endTime" >= ${endTime})
        OR ("startTime" >= ${startTime} AND "endTime" <= ${endTime})
      )
    FOR UPDATE SKIP LOCKED
  `;

  if (overlappingReservations.length > 0) {
    return {
      available: false,
      reason: 'El recurso ya está reservado para este horario',
      conflictingReservation: overlappingReservations[0],
    };
  }

  return { available: true };
}

/**
 * Check if user has exceeded daily reservation limit.
 *
 * @param userId - User ID to check
 * @returns Object with allowed status, current count, and limit
 */
export async function checkUserReservationLimit(userId: string): Promise<{
  allowed: boolean;
  count: number;
  limit: number;
}> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - RESERVATION_RATE_LIMIT.windowMs);

  const count = await db.reservation.count({
    where: {
      userId,
      createdAt: {
        gte: oneDayAgo,
      },
    },
  });

  return {
    allowed: count < RESERVATION_RATE_LIMIT.maxReservationsPerDay,
    count,
    limit: RESERVATION_RATE_LIMIT.maxReservationsPerDay,
  };
}

/**
 * Create a new reservation with double-booking prevention.
 * Uses database transaction for atomicity.
 *
 * @param data - Reservation data
 * @param userId - User creating the reservation
 * @returns Created reservation with resource and user details
 */
export async function createReservation(data: CreateReservationInput, userId: string) {
  return await db.$transaction(async (tx) => {
    // Re-check availability within transaction (CRITICAL for race condition prevention)
    const availabilityCheck = await checkResourceAvailability(
      data.resourceId,
      data.startTime,
      data.endTime,
      tx
    );

    if (!availabilityCheck.available) {
      throw new Error(availabilityCheck.reason || 'El recurso no está disponible');
    }

    // Create reservation
    const reservation = await tx.reservation.create({
      data: {
        userId,
        resourceId: data.resourceId,
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        attendees: data.attendees,
        status: 'confirmed',
        metadata: {
          createdFrom: 'api',
        },
      },
      include: {
        resource: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return reservation;
  });
}
