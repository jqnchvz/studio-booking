import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/middleware/owner';
import { db } from '@/lib/db';
import { updateResourceSchema, toggleActiveSchema } from '@/lib/validations/owner';

/** Fetch and verify the resource belongs to this owner's org. */
async function getOwnedResource(id: string, organizationId: string) {
  const resource = await db.resource.findUnique({
    where: { id },
    select: { id: true, name: true, organizationId: true },
  });
  if (!resource) return { error: 'Recurso no encontrado', status: 404 } as const;
  if (resource.organizationId !== organizationId)
    return { error: 'Recurso no encontrado', status: 404 } as const;
  return { resource };
}

/**
 * GET /api/owner/resources/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ownerResult = await requireOwner(request);
    if (!ownerResult.success) return ownerResult.response;

    const { id } = await params;
    const { organizationId } = ownerResult.user;

    const result = await getOwnedResource(id, organizationId);
    if ('error' in result)
      return NextResponse.json({ error: result.error }, { status: result.status });

    const resource = await db.resource.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        capacity: true,
        isActive: true,
        dropInEnabled: true,
        dropInPricePerHour: true,
        createdAt: true,
        availability: {
          orderBy: { dayOfWeek: 'asc' },
          select: { id: true, dayOfWeek: true, startTime: true, endTime: true, isActive: true },
        },
        _count: { select: { reservations: true } },
      },
    });

    return NextResponse.json({ resource });
  } catch (error) {
    console.error('Error fetching owner resource:', error);
    return NextResponse.json({ error: 'Error al cargar recurso' }, { status: 500 });
  }
}

/**
 * PUT /api/owner/resources/[id]
 *
 * Updates resource fields: name, type, description, capacity.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ownerResult = await requireOwner(request);
    if (!ownerResult.success) return ownerResult.response;

    const { id } = await params;
    const { organizationId } = ownerResult.user;

    const check = await getOwnedResource(id, organizationId);
    if ('error' in check)
      return NextResponse.json({ error: check.error }, { status: check.status });

    const body = await request.json();
    const parsed = updateResourceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { name, type, description, capacity, dropInEnabled, dropInPricePerHour } = parsed.data;

    const updated = await db.resource.update({
      where: { id },
      data: {
        name: name.trim(),
        type,
        description: description ? String(description).trim() : null,
        capacity: typeof capacity === 'number' && capacity > 0 ? Math.floor(capacity) : null,
        ...(typeof dropInEnabled === 'boolean' ? { dropInEnabled } : {}),
        ...(dropInPricePerHour !== undefined
          ? { dropInPricePerHour: dropInEnabled ? Math.floor(Number(dropInPricePerHour)) : null }
          : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        capacity: true,
        isActive: true,
        dropInEnabled: true,
        dropInPricePerHour: true,
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
    console.error('Error updating owner resource:', error);
    return NextResponse.json({ error: 'Error al actualizar recurso' }, { status: 500 });
  }
}

/**
 * PATCH /api/owner/resources/[id]
 *
 * Toggles isActive status.
 * Body: { isActive: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ownerResult = await requireOwner(request);
    if (!ownerResult.success) return ownerResult.response;

    const { id } = await params;
    const { organizationId } = ownerResult.user;

    const check = await getOwnedResource(id, organizationId);
    if ('error' in check)
      return NextResponse.json({ error: check.error }, { status: check.status });

    const body = await request.json();
    const parsed = toggleActiveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updated = await db.resource.update({
      where: { id },
      data: { isActive: parsed.data.isActive },
      select: { id: true, name: true, isActive: true },
    });

    return NextResponse.json({ resource: updated });
  } catch (error) {
    console.error('Error toggling owner resource:', error);
    return NextResponse.json({ error: 'Error al actualizar recurso' }, { status: 500 });
  }
}

/**
 * DELETE /api/owner/resources/[id]
 *
 * Deletes a resource. Blocked if future pending/confirmed reservations exist.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ownerResult = await requireOwner(request);
    if (!ownerResult.success) return ownerResult.response;

    const { id } = await params;
    const { organizationId } = ownerResult.user;

    const check = await getOwnedResource(id, organizationId);
    if ('error' in check)
      return NextResponse.json({ error: check.error }, { status: check.status });

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
          error: `No se puede eliminar el recurso "${check.resource.name}" porque tiene ${futureReservations} reserva(s) futura(s) activa(s). Desactívalo en su lugar.`,
        },
        { status: 409 }
      );
    }

    await db.resource.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting owner resource:', error);
    return NextResponse.json({ error: 'Error al eliminar recurso' }, { status: 500 });
  }
}
