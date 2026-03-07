import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/middleware/owner';
import { db } from '@/lib/db';

/**
 * DELETE /api/owner/resources/[id]/availability/[slotId]
 *
 * Removes an availability slot from a resource owned by this org.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; slotId: string }> }
) {
  try {
    const ownerResult = await requireOwner(request);
    if (!ownerResult.success) return ownerResult.response;

    const { id, slotId } = await params;
    const { organizationId } = ownerResult.user;

    // Verify resource belongs to this org
    const resource = await db.resource.findUnique({
      where: { id },
      select: { organizationId: true },
    });
    if (!resource || resource.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 });
    }

    const slot = await db.resourceAvailability.findUnique({
      where: { id: slotId },
      select: { id: true, resourceId: true },
    });
    if (!slot || slot.resourceId !== id) {
      return NextResponse.json({ error: 'Horario no encontrado' }, { status: 404 });
    }

    await db.resourceAvailability.delete({ where: { id: slotId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting availability slot:', error);
    return NextResponse.json({ error: 'Error al eliminar horario' }, { status: 500 });
  }
}
