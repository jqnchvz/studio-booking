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
  { params }: { params: Promise<{ id: string }> }
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

    const { id: resourceId } = await params;
    const duration = durationParam ? parseInt(durationParam, 10) : 60; // Default 60 minutes

    // Parse date components from YYYY-MM-DD format
    // Important: We use these components to create dates in local (Chile) timezone
    // to avoid UTC midnight issues that shift dates across timezone boundaries
    const [year, month, day] = dateParam.split('-').map(Number);

    if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido' },
        { status: 400 }
      );
    }

    // Create date at noon to avoid any timezone boundary issues
    // Using local constructor (new Date(y,m,d,h,m,s)) creates date in system's local timezone
    const requestedDate = new Date(year, month - 1, day, 12, 0, 0);

    // Get day of week (0 = Sunday, 6 = Saturday) in local timezone
    // Since server runs in Chile timezone, this gives us Chile day-of-week
    const dayOfWeek = requestedDate.getDay();

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
        // Create slot times in Chile timezone using the year/month/day from the requested date
        const slotStart = new Date(year, month - 1, day, currentHour, currentMinute, 0, 0);

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
          SELECT id FROM reservations
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
