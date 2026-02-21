import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';

/**
 * GET /api/admin/settings/plans
 *
 * Returns all subscription plans with subscriber count.
 * Requires admin authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const plans = await db.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        interval: true,
        features: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Error al cargar planes' },
      { status: 500 }
    );
  }
}
