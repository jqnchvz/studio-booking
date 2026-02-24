import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';

/**
 * GET /api/admin/settings/resources
 *
 * Returns all resources with their availability schedule.
 * Requires admin authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const resources = await db.resource.findMany({
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
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            isActive: true,
          },
        },
        _count: {
          select: { reservations: true },
        },
      },
    });

    return NextResponse.json({ resources });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Error al cargar recursos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/resources
 *
 * Creates a new studio resource.
 * Body: { name, type, description?, capacity? }
 */
export async function POST(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const body = await request.json();
    const { name, type, description, capacity } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }
    if (!['room', 'equipment', 'service'].includes(type)) {
      return NextResponse.json(
        { error: 'El tipo debe ser room, equipment o service' },
        { status: 400 }
      );
    }

    const resource = await db.resource.create({
      data: {
        name: name.trim(),
        type,
        description: description ? String(description).trim() : null,
        capacity: typeof capacity === 'number' && capacity > 0 ? Math.floor(capacity) : null,
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
    console.error('Error creating resource:', error);
    return NextResponse.json({ error: 'Error al crear recurso' }, { status: 500 });
  }
}
