import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/middleware/owner';
import { db } from '@/lib/db';

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
    const { name, description, price, interval, features } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }
    if (!description || typeof description !== 'string' || description.trim() === '') {
      return NextResponse.json({ error: 'La descripción es requerida' }, { status: 400 });
    }
    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json({ error: 'El precio debe ser un número positivo' }, { status: 400 });
    }
    if (!['monthly', 'yearly'].includes(interval)) {
      return NextResponse.json(
        { error: 'El intervalo debe ser monthly o yearly' },
        { status: 400 }
      );
    }

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
