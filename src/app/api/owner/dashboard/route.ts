import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/middleware/owner';
import { db } from '@/lib/db';

/**
 * GET /api/owner/dashboard
 *
 * Returns org-scoped metrics for the owner's dashboard:
 * - activeSubscriptions: active subscriptions to org's plans
 * - upcomingReservations: reservations in the next 7 days on org's resources
 * - totalClients: distinct users who have subscribed to any org plan
 * - mpConfigured: whether MP credentials are set
 * - onboarding: checklist state (mpConfigured, hasResources, hasPlans)
 */
export async function GET(request: NextRequest) {
  try {
    const ownerResult = await requireOwner(request);
    if (!ownerResult.success) return ownerResult.response;

    const { organizationId } = ownerResult.user;

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      activeSubscriptions,
      upcomingReservations,
      totalClients,
      orgWithSettings,
    ] = await Promise.all([
      db.subscription.count({
        where: { plan: { organizationId }, status: 'active' },
      }),
      db.reservation.count({
        where: {
          resource: { organizationId },
          status: { in: ['confirmed', 'pending'] },
          startTime: { gte: now, lte: in7Days },
        },
      }),
      db.subscription.count({
        where: { plan: { organizationId } },
      }),
      db.organization.findUnique({
        where: { id: organizationId },
        select: {
          settings: { select: { mpAccessToken: true } },
          _count: { select: { resources: true, plans: true } },
        },
      }),
    ]);

    const mpConfigured = !!orgWithSettings?.settings?.mpAccessToken;
    const hasResources = (orgWithSettings?._count.resources ?? 0) > 0;
    const hasPlans = (orgWithSettings?._count.plans ?? 0) > 0;

    return NextResponse.json({
      metrics: {
        activeSubscriptions,
        upcomingReservations,
        totalClients,
        mpConfigured,
      },
      onboarding: {
        complete: mpConfigured && hasResources && hasPlans,
        steps: {
          mpConfigured,
          hasResources,
          hasPlans,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching owner dashboard:', error);
    return NextResponse.json(
      { error: 'Error al cargar el dashboard' },
      { status: 500 }
    );
  }
}
