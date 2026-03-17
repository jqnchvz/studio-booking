import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/middleware/owner';
import { db } from '@/lib/db';
import { createResourceSchema } from '@/lib/validations/owner';

/**
 * GET /api/owner/resources
 *
 * Returns all resources belonging to this owner's organization.
 */
export async function GET(request: NextRequest) {
  try {
    const ownerResult = await requireOwner(request);
    if (!ownerResult.success) return ownerResult.response;

    const { organizationId } = ownerResult.user;

    const resources = await db.resource.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
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

    return NextResponse.json({ resources });
  } catch (error) {
    console.error('Error fetching owner resources:', error);
    return NextResponse.json({ error: 'Error al cargar recursos' }, { status: 500 });
  }
}

// TODO(RES-97): replace with actual limit from org's PlatformSubscription once built
const DEFAULT_MAX_RESOURCES = 10;

/**
 * POST /api/owner/resources
 *
 * Creates a new resource for this owner's organization.
 * Body: { name, type, description?, capacity? }
 */
export async function POST(request: NextRequest) {
  try {
    const ownerResult = await requireOwner(request);
    if (!ownerResult.success) return ownerResult.response;

    const { organizationId } = ownerResult.user;
    const body = await request.json();
    const parsed = createResourceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { name, type, description, capacity, dropInEnabled, dropInPricePerHour } = parsed.data;

    // Enforce resource limit per org plan
    const org = await db.organization.findUnique({
      where: { id: organizationId },
      select: { _count: { select: { resources: { where: { isActive: true } } } } },
    });

    if (org && org._count.resources >= DEFAULT_MAX_RESOURCES) {
      return NextResponse.json(
        {
          error: `Has alcanzado el límite de ${DEFAULT_MAX_RESOURCES} recursos de tu plan. Actualiza tu plan para agregar más.`,
        },
        { status: 403 }
      );
    }

    const resource = await db.resource.create({
      data: {
        name: name.trim(),
        type,
        description: description ? String(description).trim() : null,
        capacity: typeof capacity === 'number' && capacity > 0 ? Math.floor(capacity) : null,
        dropInEnabled: dropInEnabled === true,
        dropInPricePerHour: dropInEnabled && dropInPricePerHour ? Math.floor(Number(dropInPricePerHour)) : null,
        organizationId,
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

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    console.error('Error creating owner resource:', error);
    return NextResponse.json({ error: 'Error al crear recurso' }, { status: 500 });
  }
}
