import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';

/**
 * GET /api/admin/settings/plans/[id]/resources
 *
 * Returns all active resources annotated with the access record (if any) for this plan.
 * Used by the admin UI to display the current resource access configuration.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const { id } = await params;

    const plan = await db.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    const [resources, accessRecords] = await Promise.all([
      db.resource.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, type: true },
      }),
      db.planResourceAccess.findMany({
        where: { planId: id },
        select: { resourceId: true, maxHoursPerMonth: true },
      }),
    ]);

    const accessMap = new Map(accessRecords.map(r => [r.resourceId, r]));

    return NextResponse.json({
      resources: resources.map(r => ({
        ...r,
        access: accessMap.has(r.id)
          ? { enabled: true, maxHoursPerMonth: accessMap.get(r.id)!.maxHoursPerMonth }
          : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching plan resources:', error);
    return NextResponse.json(
      { error: 'Error al cargar acceso a recursos' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/plans/[id]/resources
 *
 * Replaces all access records for this plan in a single transaction.
 * Body: { resources: Array<{ resourceId: string; maxHoursPerMonth: number | null }> }
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

    const plan = await db.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    if (!Array.isArray(body.resources)) {
      return NextResponse.json(
        { error: 'El campo resources debe ser un array' },
        { status: 400 }
      );
    }

    const resources: { resourceId: string; maxHoursPerMonth: number | null }[] =
      body.resources;

    // Delete all existing records for this plan and re-insert in a transaction
    await db.$transaction([
      db.planResourceAccess.deleteMany({ where: { planId: id } }),
      ...(resources.length > 0
        ? [
            db.planResourceAccess.createMany({
              data: resources.map(r => ({
                planId: id,
                resourceId: r.resourceId,
                maxHoursPerMonth: r.maxHoursPerMonth ?? null,
              })),
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ accessCount: resources.length });
  } catch (error) {
    console.error('Error updating plan resources:', error);
    return NextResponse.json(
      { error: 'Error al actualizar acceso a recursos' },
      { status: 500 }
    );
  }
}
