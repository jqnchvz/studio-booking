import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/middleware/owner';
import { db } from '@/lib/db';

const VALID_TYPES = ['room', 'court', 'equipment', 'other'];

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
    const { name, type, description, capacity } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'El tipo debe ser room, court, equipment u other' },
        { status: 400 }
      );
    }

    const resource = await db.resource.create({
      data: {
        name: name.trim(),
        type,
        description: description ? String(description).trim() : null,
        capacity: typeof capacity === 'number' && capacity > 0 ? Math.floor(capacity) : null,
        organizationId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        capacity: true,
        isActive: true,
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
