import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';

/**
 * GET /api/admin/settings/platform-plans
 *
 * Returns all platform plans with organization subscriber count.
 * Requires admin authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const plans = await db.platformPlan.findMany({
      orderBy: { price: 'asc' },
      include: {
        _count: { select: { organizations: true } },
      },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching platform plans:', error);
    return NextResponse.json(
      { error: 'Error al cargar planes de plataforma' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/platform-plans
 *
 * Creates a new platform plan.
 * Requires admin authentication.
 *
 * Body: { name, price, maxResources, maxUsers, features }
 */
export async function POST(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const body = await request.json();
    const { name, price, maxResources, maxUsers, features } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número >= 0' },
        { status: 400 }
      );
    }

    if (typeof maxResources !== 'number' || !Number.isInteger(maxResources) || maxResources < 1) {
      return NextResponse.json(
        { error: 'El máximo de recursos debe ser un número entero > 0' },
        { status: 400 }
      );
    }

    if (typeof maxUsers !== 'number' || !Number.isInteger(maxUsers) || maxUsers < 1) {
      return NextResponse.json(
        { error: 'El máximo de usuarios debe ser un número entero > 0' },
        { status: 400 }
      );
    }

    const featuresArray = Array.isArray(features) ? features : [];

    const plan = await db.platformPlan.create({
      data: {
        name: name.trim(),
        price: Math.round(price),
        maxResources,
        maxUsers,
        features: featuresArray,
      },
      include: {
        _count: { select: { organizations: true } },
      },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('Error creating platform plan:', error);
    return NextResponse.json(
      { error: 'Error al crear plan de plataforma' },
      { status: 500 }
    );
  }
}
