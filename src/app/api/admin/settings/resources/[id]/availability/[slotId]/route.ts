import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';

/**
 * DELETE /api/admin/settings/resources/[id]/availability/[slotId]
 *
 * Removes an availability slot from a resource.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; slotId: string }> }
) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const { id, slotId } = await params;

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
