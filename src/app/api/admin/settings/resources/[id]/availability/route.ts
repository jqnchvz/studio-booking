import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';

/**
 * POST /api/admin/settings/resources/[id]/availability
 *
 * Adds a new availability slot to a resource.
 * Body: { dayOfWeek: number (0-6), startTime: string (HH:MM), endTime: string (HH:MM) }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const { id } = await params;
    const body = await request.json();
    const { dayOfWeek, startTime, endTime } = body;

    if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { error: 'El día de la semana debe ser un número entre 0 y 6' },
        { status: 400 }
      );
    }

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: 'Los horarios deben estar en formato HH:MM' },
        { status: 400 }
      );
    }
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'La hora de inicio debe ser anterior a la hora de fin' },
        { status: 400 }
      );
    }

    const resource = await db.resource.findUnique({ where: { id } });
    if (!resource) {
      return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 });
    }

    const slot = await db.resourceAvailability.create({
      data: { resourceId: id, dayOfWeek, startTime, endTime },
      select: { id: true, dayOfWeek: true, startTime: true, endTime: true, isActive: true },
    });

    return NextResponse.json({ slot }, { status: 201 });
  } catch (error) {
    console.error('Error adding availability slot:', error);
    return NextResponse.json({ error: 'Error al agregar horario' }, { status: 500 });
  }
}
