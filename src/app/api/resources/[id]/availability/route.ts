import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

/**
 * GET /api/resources/[id]/availability
 * Check available time slots for a resource on a specific date
 *
 * Query Parameters:
 * - date: ISO date string (required)
 * - duration: duration in minutes (optional, default 60)
 *
 * Returns array of available time slots with their start/end times
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const durationParam = searchParams.get('duration');

    // Validate required parameters
    if (!dateParam) {
      return NextResponse.json(
        { error: 'Parámetro "date" es requerido' },
        { status: 400 }
      );
    }

    const resourceId = params.id;
    const duration = durationParam ? parseInt(durationParam, 10) : 60; // Default 60 minutes

    // Parse date in Chile timezone
    const requestedDate = new Date(dateParam);
    if (isNaN(requestedDate.getTime())) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido' },
        { status: 400 }
      );
    }

    // Get day of week in Chile timezone (0 = Sunday, 6 = Saturday)
    const dayOfWeek = new Date(
      requestedDate.toLocaleString('en-US', { timeZone: 'America/Santiago' })
    ).getDay();

    // Fetch resource with availability schedule
    const resource = await db.resource.findUnique({
      where: { id: resourceId, isActive: true },
      include: {
        availability: {
          where: {
            dayOfWeek,
            isActive: true,
          },
        },
      },
    });

    if (!resource) {
      return NextResponse.json(
        { error: 'Recurso no encontrado o no está activo' },
        { status: 404 }
      );
    }

    if (resource.availability.length === 0) {
      return NextResponse.json(
        {
          slots: [],
          message: 'El recurso no está disponible en este día',
        },
        { status: 200 }
      );
    }

    // Generate time slots based on availability schedule
    const availabilitySlots: Array<{
      startTime: string;
      endTime: string;
      available: boolean;
    }> = [];

    for (const schedule of resource.availability) {
      const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
      const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

      // Generate 30-minute slots within the availability window
      let currentHour = startHour;
      let currentMinute = startMinute;

      while (
        currentHour < endHour ||
        (currentHour === endHour && currentMinute < endMinute)
      ) {
        const slotStart = new Date(requestedDate);
        slotStart.setHours(currentHour, currentMinute, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + duration);

        // Check if slot end time exceeds availability end time
        const slotEndHour = slotEnd.getHours();
        const slotEndMinute = slotEnd.getMinutes();

        if (
          slotEndHour > endHour ||
          (slotEndHour === endHour && slotEndMinute > endMinute)
        ) {
          break; // This slot doesn't fit in the availability window
        }

        // Check for conflicts with existing reservations
        const conflicts = await db.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM "Reservation"
          WHERE "resourceId" = ${resourceId}
            AND status IN ('pending', 'confirmed')
            AND (
              ("startTime" <= ${slotStart} AND "endTime" > ${slotStart})
              OR ("startTime" < ${slotEnd} AND "endTime" >= ${slotEnd})
              OR ("startTime" >= ${slotStart} AND "endTime" <= ${slotEnd})
            )
        `;

        availabilitySlots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          available: conflicts.length === 0,
        });

        // Move to next 30-minute slot
        currentMinute += 30;
        if (currentMinute >= 60) {
          currentHour += 1;
          currentMinute = 0;
        }
      }
    }

    return NextResponse.json({ slots: availabilitySlots }, { status: 200 });
  } catch (error) {
    console.error('Check availability error:', error);
    return NextResponse.json(
      { error: 'Error al verificar disponibilidad' },
      { status: 500 }
    );
  }
}
