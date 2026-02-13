import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';
import type { UserDetail } from '@/types/admin';

/**
 * GET /api/admin/users/[id]
 *
 * Get detailed information about a specific user including:
 * - Full profile information
 * - Current subscription details
 * - Last 50 payments
 * - Last 50 reservations
 *
 * Requires admin authentication.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Admin guard
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const { id } = await params;

    // 2. Fetch user with all relations
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        emailVerified: true,
        createdAt: true,
        subscription: {
          select: {
            id: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            nextBillingDate: true,
            planPrice: true,
            plan: {
              select: {
                name: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            paidAt: true,
            createdAt: true,
            subscription: {
              select: {
                plan: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50, // Limit to last 50 payments for performance
        },
        reservations: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            status: true,
            createdAt: true,
            resource: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50, // Limit to last 50 reservations for performance
        },
      },
    });

    // 3. Handle not found
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // 4. Transform to UserDetail format (ISO 8601 dates)
    const userDetail: UserDetail = {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      subscription: user.subscription ? {
        id: user.subscription.id,
        status: user.subscription.status,
        planName: user.subscription.plan.name,
        planPrice: user.subscription.planPrice,
        currentPeriodStart: user.subscription.currentPeriodStart.toISOString(),
        currentPeriodEnd: user.subscription.currentPeriodEnd.toISOString(),
        nextBillingDate: user.subscription.nextBillingDate.toISOString(),
      } : null,
      payments: user.payments.map(p => ({
        id: p.id,
        totalAmount: p.totalAmount,
        status: p.status,
        paidAt: p.paidAt?.toISOString() || null,
        createdAt: p.createdAt.toISOString(),
        planName: p.subscription.plan.name,
      })),
      reservations: user.reservations.map(r => ({
        id: r.id,
        title: r.title,
        resourceName: r.resource.name,
        startTime: r.startTime.toISOString(),
        endTime: r.endTime.toISOString(),
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
    };

    return NextResponse.json({ user: userDetail });
  } catch (error) {
    console.error('Error fetching user detail:', error);
    return NextResponse.json(
      { error: 'Error al cargar detalles del usuario' },
      { status: 500 }
    );
  }
}
