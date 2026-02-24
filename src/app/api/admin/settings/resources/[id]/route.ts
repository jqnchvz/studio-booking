import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';

/**
 * PATCH /api/admin/settings/resources/[id]
 *
 * Toggles the isActive status of a studio resource.
 * Requires admin authentication.
 *
 * Body: { isActive: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const { id } = await params;
    const body = await request.json();

    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'El campo isActive debe ser un booleano' },
        { status: 400 }
      );
    }

    const resource = await db.resource.findUnique({ where: { id } });
    if (!resource) {
      return NextResponse.json(
        { error: 'Recurso no encontrado' },
        { status: 404 }
      );
    }

    const updated = await db.resource.update({
      where: { id },
      data: { isActive: body.isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    return NextResponse.json({ resource: updated });
  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json(
      { error: 'Error al actualizar recurso' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/resources/[id]
 *
 * Full update of a resource's fields (name, type, description, capacity).
 * Availability slots are managed separately via the /availability sub-route.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const { id } = await params;
    const body = await request.json();
    const { name, type, description, capacity } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }
    if (!['room', 'equipment', 'service'].includes(type)) {
      return NextResponse.json(
        { error: 'El tipo debe ser room, equipment o service' },
        { status: 400 }
      );
    }

    const resource = await db.resource.findUnique({ where: { id } });
    if (!resource) {
      return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 });
    }

    const updated = await db.resource.update({
      where: { id },
      data: {
        name: name.trim(),
        type,
        description: description ? String(description).trim() : null,
        capacity: typeof capacity === 'number' && capacity > 0 ? Math.floor(capacity) : null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        capacity: true,
        isActive: true,
        createdAt: true,
        availability: {
          orderBy: { dayOfWeek: 'asc' },
          select: { id: true, dayOfWeek: true, startTime: true, endTime: true, isActive: true },
        },
        _count: { select: { reservations: true } },
      },
    });

    return NextResponse.json({ resource: updated });
  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json({ error: 'Error al actualizar recurso' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/settings/resources/[id]
 *
 * Deletes a resource. Blocked if any future pending/confirmed reservations exist.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const { id } = await params;

    const resource = await db.resource.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 });
    }

    const futureReservations = await db.reservation.count({
      where: {
        resourceId: id,
        status: { in: ['pending', 'confirmed'] },
        startTime: { gt: new Date() },
      },
    });

    if (futureReservations > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar el recurso "${resource.name}" porque tiene ${futureReservations} reserva(s) futura(s) activa(s). Desactívalo en su lugar.`,
        },
        { status: 409 }
      );
    }

    await db.resource.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return NextResponse.json({ error: 'Error al eliminar recurso' }, { status: 500 });
  }
}
