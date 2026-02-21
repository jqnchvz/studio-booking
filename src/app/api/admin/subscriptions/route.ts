import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';
import type { SubscriptionListItem } from '@/types/admin';

/**
 * GET /api/admin/subscriptions
 *
 * List all subscriptions with search, filter, and pagination.
 * Requires admin authentication.
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - search: string (user name OR email, case-insensitive)
 * - status: 'all' | 'active' | 'pending' | 'suspended' | 'cancelled' | 'past_due'
 * - startDate: ISO date string (filter by createdAt >=)
 * - endDate: ISO date string (filter by createdAt <=)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Admin guard
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    // 2. Parse query params (no Zod per CLAUDE.md - only validate request bodies)
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    // 3. Build where clause
    const where: any = {
      AND: [
        status && status !== 'all' ? { status } : {},
        search ? {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          },
        } : {},
        startDate && endDate ? {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        } : {},
      ].filter(condition => Object.keys(condition).length > 0),
    };

    // 4. Parallel queries
    const [subscriptions, total] = await Promise.all([
      db.subscription.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          planPrice: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          plan: { select: { name: true } },
        },
      }),
      db.subscription.count({ where }),
    ]);

    // 5. Transform to SubscriptionListItem format
    const subscriptionList: SubscriptionListItem[] = subscriptions.map(s => ({
      id: s.id,
      status: s.status,
      planName: s.plan.name,
      planPrice: s.planPrice,
      currentPeriodStart: s.currentPeriodStart.toISOString(),
      currentPeriodEnd: s.currentPeriodEnd.toISOString(),
      createdAt: s.createdAt.toISOString(),
      user: s.user,
    }));

    return NextResponse.json({
      subscriptions: subscriptionList,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Error al cargar suscripciones' },
      { status: 500 }
    );
  }
}
