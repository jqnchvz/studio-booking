import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';

/**
 * GET /api/admin/settings/plans
 *
 * Returns all subscription plans with subscriber count and penalty config.
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
        gracePeriodDays: true,
        penaltyBaseRate: true,
        penaltyDailyRate: true,
        penaltyMaxRate: true,
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

/**
 * POST /api/admin/settings/plans
 *
 * Creates a new subscription plan.
 * Requires admin authentication.
 *
 * Body: { name, description, price, interval, features, gracePeriodDays,
 *         penaltyBaseRate, penaltyDailyRate, penaltyMaxRate }
 */
export async function POST(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const body = await request.json();
    const { name, description, price, interval, features,
            gracePeriodDays, penaltyBaseRate, penaltyDailyRate, penaltyMaxRate } = body;

    // Basic validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }
    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'La descripción es requerida' }, { status: 400 });
    }
    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ error: 'El precio debe ser un número positivo' }, { status: 400 });
    }
    if (!['monthly', 'yearly'].includes(interval)) {
      return NextResponse.json({ error: 'El intervalo debe ser monthly o yearly' }, { status: 400 });
    }

    const featuresArray = Array.isArray(features) ? features : [];

    const plan = await db.subscriptionPlan.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        price: Math.round(price),
        interval,
        features: featuresArray,
        gracePeriodDays: typeof gracePeriodDays === 'number' ? Math.max(0, gracePeriodDays) : 2,
        penaltyBaseRate: typeof penaltyBaseRate === 'number' ? penaltyBaseRate : 0.05,
        penaltyDailyRate: typeof penaltyDailyRate === 'number' ? penaltyDailyRate : 0.005,
        penaltyMaxRate: typeof penaltyMaxRate === 'number' ? penaltyMaxRate : 0.5,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        interval: true,
        features: true,
        isActive: true,
        gracePeriodDays: true,
        penaltyBaseRate: true,
        penaltyDailyRate: true,
        penaltyMaxRate: true,
        createdAt: true,
        _count: { select: { subscriptions: true } },
      },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { error: 'Error al crear plan' },
      { status: 500 }
    );
  }
}
