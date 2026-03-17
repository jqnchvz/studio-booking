import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/middleware/owner';
import { db } from '@/lib/db';
import { createPlanSchema } from '@/lib/validations/owner';

/**
 * GET /api/owner/plans
 *
 * Returns all subscription plans belonging to this owner's organization.
 */
export async function GET(request: NextRequest) {
  try {
    const ownerResult = await requireOwner(request);
    if (!ownerResult.success) return ownerResult.response;

    const { organizationId } = ownerResult.user;

    const plans = await db.subscriptionPlan.findMany({
      where: { organizationId },
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
        _count: { select: { subscriptions: true } },
      },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching owner plans:', error);
    return NextResponse.json({ error: 'Error al cargar planes' }, { status: 500 });
  }
}

/**
 * POST /api/owner/plans
 *
 * Creates a new subscription plan for this owner's organization.
 * Body: { name, description, price, interval, features? }
 */
export async function POST(request: NextRequest) {
  try {
    const ownerResult = await requireOwner(request);
    if (!ownerResult.success) return ownerResult.response;

    const { organizationId } = ownerResult.user;
    const body = await request.json();
    const parsed = createPlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { name, description, price, interval, features } = parsed.data;

    const plan = await db.subscriptionPlan.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        price: Math.round(price),
        interval,
        features: Array.isArray(features) ? features : [],
        organizationId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        interval: true,
        features: true,
        isActive: true,
        createdAt: true,
        _count: { select: { subscriptions: true } },
      },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('Error creating owner plan:', error);
    return NextResponse.json({ error: 'Error al crear plan' }, { status: 500 });
  }
}
