import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';

/**
 * PUT /api/admin/settings/platform-plans/[id]
 *
 * Full update of a platform plan.
 * Body: { name, price, maxResources, maxUsers, features }
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
    const { name, price, maxResources, maxUsers, features } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número >= 0' },
        { status: 400 }
      );
    }

    if (typeof maxResources !== 'number' || !Number.isInteger(maxResources) || maxResources < 1) {
      return NextResponse.json(
        { error: 'El máximo de recursos debe ser un número entero > 0' },
        { status: 400 }
      );
    }

    if (typeof maxUsers !== 'number' || !Number.isInteger(maxUsers) || maxUsers < 1) {
      return NextResponse.json(
        { error: 'El máximo de usuarios debe ser un número entero > 0' },
        { status: 400 }
      );
    }

    const plan = await db.platformPlan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    const updated = await db.platformPlan.update({
      where: { id },
      data: {
        name: name.trim(),
        price: Math.round(price),
        maxResources,
        maxUsers,
        features: Array.isArray(features) ? features : [],
      },
      include: {
        _count: { select: { organizations: true } },
      },
    });

    return NextResponse.json({ plan: updated });
  } catch (error) {
    console.error('Error updating platform plan:', error);
    return NextResponse.json(
      { error: 'Error al actualizar plan de plataforma' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/settings/platform-plans/[id]
 *
 * Toggles the isActive status of a platform plan.
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

    const plan = await db.platformPlan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    const updated = await db.platformPlan.update({
      where: { id },
      data: { isActive: body.isActive },
      include: {
        _count: { select: { organizations: true } },
      },
    });

    return NextResponse.json({ plan: updated });
  } catch (error) {
    console.error('Error updating platform plan:', error);
    return NextResponse.json(
      { error: 'Error al actualizar plan de plataforma' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/settings/platform-plans/[id]
 *
 * Deletes a platform plan. Blocked if organizations are assigned to it.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const { id } = await params;

    const plan = await db.platformPlan.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: { select: { organizations: true } },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    if (plan._count.organizations > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un plan con empresas asignadas' },
        { status: 409 }
      );
    }

    await db.platformPlan.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting platform plan:', error);
    return NextResponse.json(
      { error: 'Error al eliminar plan de plataforma' },
      { status: 500 }
    );
  }
}
