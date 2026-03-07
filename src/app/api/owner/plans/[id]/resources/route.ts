import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/middleware/owner';
import { db } from '@/lib/db';

/**
 * GET /api/owner/plans/[id]/resources
 *
 * Returns all active resources for this org, annotated with access config for this plan.
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

    const plan = await db.subscriptionPlan.findUnique({
      where: { id },
      select: { id: true, organizationId: true },
    });
    if (!plan || plan.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    const [resources, accessRecords] = await Promise.all([
      db.resource.findMany({
        where: { organizationId, isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, type: true },
      }),
      db.planResourceAccess.findMany({
        where: { planId: id },
        select: { resourceId: true, maxHoursPerMonth: true },
      }),
    ]);

    const accessMap = new Map(accessRecords.map((r) => [r.resourceId, r]));

    return NextResponse.json({
      resources: resources.map((r) => ({
        ...r,
        access: accessMap.has(r.id)
          ? { enabled: true, maxHoursPerMonth: accessMap.get(r.id)!.maxHoursPerMonth }
          : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching plan resources:', error);
    return NextResponse.json({ error: 'Error al cargar acceso a recursos' }, { status: 500 });
  }
}

/**
 * PUT /api/owner/plans/[id]/resources
 *
 * Replaces all resource access records for this plan.
 * Body: { resources: Array<{ resourceId: string; maxHoursPerMonth: number | null }> }
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

    const plan = await db.subscriptionPlan.findUnique({
      where: { id },
      select: { id: true, organizationId: true },
    });
    if (!plan || plan.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    if (!Array.isArray(body.resources)) {
      return NextResponse.json({ error: 'El campo resources debe ser un array' }, { status: 400 });
    }

    const resources: { resourceId: string; maxHoursPerMonth: number | null }[] = body.resources;

    // Verify all supplied resources belong to this org
    if (resources.length > 0) {
      const resourceIds = resources.map((r) => r.resourceId);
      const ownedCount = await db.resource.count({
        where: { id: { in: resourceIds }, organizationId },
      });
      if (ownedCount !== resourceIds.length) {
        return NextResponse.json(
          { error: 'Uno o más recursos no pertenecen a tu organización' },
          { status: 403 }
        );
      }
    }

    await db.$transaction([
      db.planResourceAccess.deleteMany({ where: { planId: id } }),
      ...(resources.length > 0
        ? [
            db.planResourceAccess.createMany({
              data: resources.map((r) => ({
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
    return NextResponse.json({ error: 'Error al actualizar acceso a recursos' }, { status: 500 });
  }
}
