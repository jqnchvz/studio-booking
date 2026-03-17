import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/middleware/owner';
import { db } from '@/lib/db';
import { updatePlanSchema, toggleActiveSchema } from '@/lib/validations/owner';

/** Fetch and verify the plan belongs to this owner's org. */
async function getOwnedPlan(id: string, organizationId: string) {
  const plan = await db.subscriptionPlan.findUnique({
    where: { id },
    select: { id: true, name: true, organizationId: true, _count: { select: { subscriptions: true } } },
  });
  if (!plan) return { error: 'Plan no encontrado', status: 404 } as const;
  if (plan.organizationId !== organizationId) return { error: 'Plan no encontrado', status: 404 } as const;
  return { plan };
}

/**
 * PUT /api/owner/plans/[id]
 *
 * Updates plan fields: name, description, price, interval, features.
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

    const check = await getOwnedPlan(id, organizationId);
    if ('error' in check) return NextResponse.json({ error: check.error }, { status: check.status });

    const body = await request.json();
    const parsed = updatePlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { name, description, price, interval, features } = parsed.data;

    const updated = await db.subscriptionPlan.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description.trim(),
        price: Math.round(price),
        interval,
        features: Array.isArray(features) ? features : [],
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        interval: true,
        features: true,
        isActive: true,
        createdAt: true,
        _count: { select: { subscriptions: true } },
      },
    });

    return NextResponse.json({ plan: updated });
  } catch (error) {
    console.error('Error updating owner plan:', error);
    return NextResponse.json({ error: 'Error al actualizar plan' }, { status: 500 });
  }
}

/**
 * PATCH /api/owner/plans/[id]
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

    const check = await getOwnedPlan(id, organizationId);
    if ('error' in check) return NextResponse.json({ error: check.error }, { status: check.status });

    const body = await request.json();
    const parsed = toggleActiveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updated = await db.subscriptionPlan.update({
      where: { id },
      data: { isActive: parsed.data.isActive },
      select: { id: true, name: true, isActive: true },
    });

    return NextResponse.json({ plan: updated });
  } catch (error) {
    console.error('Error toggling owner plan:', error);
    return NextResponse.json({ error: 'Error al actualizar plan' }, { status: 500 });
  }
}

/**
 * DELETE /api/owner/plans/[id]
 *
 * Deletes a plan. Blocked if any subscriptions exist.
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

    const check = await getOwnedPlan(id, organizationId);
    if ('error' in check) return NextResponse.json({ error: check.error }, { status: check.status });

    if (check.plan._count.subscriptions > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar el plan "${check.plan.name}" porque tiene ${check.plan._count.subscriptions} suscripción(es). Desactívalo en su lugar.`,
        },
        { status: 409 }
      );
    }

    await db.subscriptionPlan.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting owner plan:', error);
    return NextResponse.json({ error: 'Error al eliminar plan' }, { status: 500 });
  }
}
