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
