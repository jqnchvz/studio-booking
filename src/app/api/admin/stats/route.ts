import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';
import type { AdminStats, ActivityEvent } from '@/types/admin';

/**
 * GET /api/admin/stats
 *
 * Returns comprehensive dashboard statistics for admin users
 *
 * Response includes:
 * - Key metrics (subscriptions, MRR, success rates, upcoming reservations, failed payments)
 * - Revenue by month (last 12 months)
 * - Recent activity feed (last 20 events from multiple sources)
 *
 * Requirements:
 * - User must be authenticated as admin
 * - All dates calculated in Chile timezone (America/Santiago)
 * - Parallel query execution for performance
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Admin authentication guard
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) {
      return adminResult.response;
    }

    // Step 2: Calculate date ranges in Chile timezone
    const now = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' })
    );

    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Step 3: Execute parallel queries for performance
    const queryPromise = Promise.all([
      // Query 1: Count active subscriptions
      db.subscription.count({
        where: { status: 'active' },
      }),

      // Query 2: Get all active subscriptions for MRR calculation
      db.subscription.findMany({
        where: { status: 'active' },
        select: { planPrice: true },
      }),

      // Query 3: Get payments from last 30 days
      db.payment.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { status: true },
      }),

      // Query 4: Count upcoming reservations (next 7 days)
      db.reservation.count({
        where: {
          startTime: { gte: now, lte: sevenDaysFromNow },
          status: { in: ['confirmed', 'pending'] },
        },
      }),

      // Query 5: Revenue by month (last 12 months) using raw SQL for grouping
      db.$queryRaw<Array<{ month: Date; revenue: number; payments: number }>>`
        SELECT
          DATE_TRUNC('month', "paidAt") as month,
          SUM("totalAmount")::integer as revenue,
          COUNT(*)::integer as payments
        FROM "Payment"
        WHERE "status" = 'approved'
          AND "paidAt" >= ${twelveMonthsAgo}
          AND "paidAt" IS NOT NULL
        GROUP BY DATE_TRUNC('month', "paidAt")
        ORDER BY month DESC
        LIMIT 12
      `,

      // Query 6: Recent events from multiple sources
      db.$transaction([
        // Recent subscriptions (active only)
        db.subscription.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          where: { status: 'active' },
          select: {
            id: true,
            createdAt: true,
            status: true,
            user: {
              select: { name: true },
            },
            plan: {
              select: { name: true },
            },
          },
        }),

        // Recent approved payments
        db.payment.findMany({
          take: 5,
          orderBy: { updatedAt: 'desc' },
          where: { status: 'approved' },
          select: {
            id: true,
            updatedAt: true,
            totalAmount: true,
            user: {
              select: { name: true },
            },
          },
        }),

        // Recent reservations
        db.reservation.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            createdAt: true,
            status: true,
            user: {
              select: { name: true },
            },
            resource: {
              select: { name: true },
            },
          },
        }),

        // Recent user registrations
        db.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        }),
      ]),
    ]);

    // Add timeout protection (10 seconds max)
    const queryWithTimeout = Promise.race([
      queryPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), 10000)
      ),
    ]);

    const [
      activeSubscriptionCount,
      activeSubscriptions,
      paymentsLast30Days,
      upcomingReservationsCount,
      revenueData,
      [recentSubscriptions, recentPayments, recentReservations, recentUsers],
    ] = await queryWithTimeout;

    // Step 4: Calculate derived metrics

    // MRR = Sum of all active subscription prices
    const mrr = activeSubscriptions.reduce(
      (sum, sub) => sum + sub.planPrice,
      0
    );

    // Payment success rate (last 30 days)
    const totalPayments = paymentsLast30Days.length;
    const successfulPayments = paymentsLast30Days.filter(
      (p) => p.status === 'approved'
    ).length;
    const successRate =
      totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

    // Failed payments count
    const failedPayments = paymentsLast30Days.filter(
      (p) => p.status === 'rejected'
    ).length;

    // Step 5: Format revenue data with Spanish month names
    const formattedRevenue = revenueData.map((row) => ({
      month: new Intl.DateTimeFormat('es-CL', {
        timeZone: 'America/Santiago',
        month: 'short',
        year: 'numeric',
      }).format(new Date(row.month)),
      revenue: row.revenue,
      payments: row.payments,
    }));

    // Step 6: Transform activity events with Spanish labels
    const recentActivity: ActivityEvent[] = [];

    // Add subscription events
    recentSubscriptions.forEach((sub) => {
      recentActivity.push({
        id: sub.id,
        type: 'subscription',
        action: `Nueva suscripción al plan ${sub.plan.name}`,
        timestamp: sub.createdAt.toISOString(),
        metadata: {
          userName: sub.user.name,
          planName: sub.plan.name,
        },
      });
    });

    // Add payment events
    recentPayments.forEach((payment) => {
      recentActivity.push({
        id: payment.id,
        type: 'payment',
        action: 'Pago aprobado',
        timestamp: payment.updatedAt.toISOString(),
        metadata: {
          userName: payment.user.name,
          amount: payment.totalAmount,
        },
      });
    });

    // Add reservation events
    recentReservations.forEach((res) => {
      recentActivity.push({
        id: res.id,
        type: 'reservation',
        action: `Nueva reserva en ${res.resource.name}`,
        timestamp: res.createdAt.toISOString(),
        metadata: {
          userName: res.user.name,
          resourceName: res.resource.name,
        },
      });
    });

    // Add user registration events
    recentUsers.forEach((user) => {
      recentActivity.push({
        id: user.id,
        type: 'user',
        action: 'Nuevo usuario registrado',
        timestamp: user.createdAt.toISOString(),
        metadata: {
          userName: user.name,
        },
      });
    });

    // Sort by timestamp (newest first) and limit to 20
    const sortedActivity = recentActivity
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 20);

    // Step 7: Build response
    const stats: AdminStats = {
      metrics: {
        activeSubscriptions: activeSubscriptionCount,
        monthlyRecurringRevenue: mrr,
        paymentSuccessRate: Number(successRate.toFixed(1)),
        upcomingReservations: upcomingReservationsCount,
        failedPayments,
      },
      revenueByMonth: formattedRevenue,
      recentActivity: sortedActivity,
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Admin stats error:', error);

    // Handle timeout specifically
    if (error instanceof Error && error.message === 'Query timeout') {
      return NextResponse.json(
        {
          error:
            'La consulta tardó demasiado. Por favor, intenta nuevamente.',
        },
        { status: 504 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { error: 'Error al cargar estadísticas del dashboard' },
      { status: 500 }
    );
  }
}
