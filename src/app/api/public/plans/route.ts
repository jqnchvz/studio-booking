import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/public/plans
 *
 * Public (unauthenticated) endpoint.
 * Returns active platform-level subscription plans (organizationId IS NULL).
 * Used by the landing page pricing section.
 */
export async function GET() {
  try {
    const plans = await db.subscriptionPlan.findMany({
      where: { isActive: true, organizationId: null },
      orderBy: { price: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        interval: true,
        features: true,
      },
    });

    return NextResponse.json(plans, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (error) {
    console.error('Error fetching public plans:', error);
    return NextResponse.json({ error: 'Error al cargar planes' }, { status: 500 });
  }
}
