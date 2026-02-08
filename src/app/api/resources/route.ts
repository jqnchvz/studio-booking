import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/resources
 * Fetch all active resources with their availability schedules
 *
 * Used by: Reservation booking form to show available resources
 */
export async function GET() {
  try {
    const resources = await db.resource.findMany({
      where: { isActive: true },
      include: {
        availability: {
          where: { isActive: true },
          orderBy: { dayOfWeek: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ resources }, { status: 200 });
  } catch (error) {
    console.error('Fetch resources error:', error);
    return NextResponse.json(
      { error: 'Error al obtener recursos' },
      { status: 500 }
    );
  }
}
