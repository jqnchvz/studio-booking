import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';

/**
 * PATCH /api/admin/settings/plans/[id]
 *
 * Toggles the isActive status of a subscription plan.
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
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    const updated = await db.subscriptionPlan.update({
      where: { id },
      data: { isActive: body.isActive },
      select: { id: true, name: true, isActive: true },
    });

    return NextResponse.json({ plan: updated });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Error al actualizar plan' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/settings/plans/[id]
 *
 * Full update of a subscription plan including penalty configuration.
 * Body: { name, description, price, interval, features, gracePeriodDays,
 *         penaltyBaseRate, penaltyDailyRate, penaltyMaxRate }
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
    const { name, description, price, interval, features,
            gracePeriodDays, penaltyBaseRate, penaltyDailyRate, penaltyMaxRate } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }
    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'La descripción es requerida' }, { status: 400 });
    }
    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ error: 'El precio debe ser un número positivo' }, { status: 400 });
    }
    if (!['monthly', 'yearly'].includes(interval)) {
      return NextResponse.json({ error: 'El intervalo debe ser monthly o yearly' }, { status: 400 });
    }

    const plan = await db.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    const updated = await db.subscriptionPlan.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description.trim(),
        price: Math.round(price),
        interval,
        features: Array.isArray(features) ? features : [],
        gracePeriodDays: typeof gracePeriodDays === 'number' ? Math.max(0, gracePeriodDays) : plan.gracePeriodDays,
        penaltyBaseRate: typeof penaltyBaseRate === 'number' ? penaltyBaseRate : plan.penaltyBaseRate,
        penaltyDailyRate: typeof penaltyDailyRate === 'number' ? penaltyDailyRate : plan.penaltyDailyRate,
        penaltyMaxRate: typeof penaltyMaxRate === 'number' ? penaltyMaxRate : plan.penaltyMaxRate,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        interval: true,
        features: true,
        isActive: true,
        gracePeriodDays: true,
        penaltyBaseRate: true,
        penaltyDailyRate: true,
        penaltyMaxRate: true,
        createdAt: true,
        _count: { select: { subscriptions: true } },
      },
    });

    return NextResponse.json({ plan: updated });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Error al actualizar plan' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/settings/plans/[id]
 *
 * Deletes a subscription plan. Blocked if any active subscriptions exist.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const { id } = await params;

    const plan = await db.subscriptionPlan.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: { select: { subscriptions: true } },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    if (plan._count.subscriptions > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar el plan "${plan.name}" porque tiene ${plan._count.subscriptions} suscripción(es) activa(s). Desactívalo en su lugar.`,
        },
        { status: 409 }
      );
    }

    await db.subscriptionPlan.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Error al eliminar plan' }, { status: 500 });
  }
}
