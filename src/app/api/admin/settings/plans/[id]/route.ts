import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';

/**
 * PATCH /api/admin/settings/plans/[id]
 *
 * Toggles the isActive status of a subscription plan.
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

    const plan = await db.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    const updated = await db.subscriptionPlan.update({
      where: { id },
      data: { isActive: body.isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    return NextResponse.json({ plan: updated });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json(
      { error: 'Error al actualizar plan' },
      { status: 500 }
    );
  }
}
