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
