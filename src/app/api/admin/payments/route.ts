import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';
import type { PaymentListItem } from '@/types/admin';

/**
 * GET /api/admin/payments
 *
 * List all payments with search, filter, and pagination capabilities.
 * Requires admin authentication.
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - status: 'all' | 'pending' | 'approved' | 'rejected' | 'refunded' (default: 'all')
 * - startDate: ISO date string (filter by createdAt >= startDate)
 * - endDate: ISO date string (filter by createdAt <= endDate)
 * - userId: string (filter by specific user)
 * - search: string (search by user name OR email, case-insensitive)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Admin guard
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    // 2. Parse query params (manual parsing, NO Zod per CLAUDE.md)
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status') || 'all';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const search = searchParams.get('search') || undefined;

    // 3. Build Prisma where clause
    const where: any = {
      AND: [
        // Status filter
        status !== 'all' ? { status } : {},

        // Date range filter (use createdAt, not paidAt which can be null)
        startDate && endDate ? {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        } : {},

        // User filter
        userId ? { userId } : {},

        // Search: user name OR email
        search ? {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          },
        } : {},
      ].filter(condition => Object.keys(condition).length > 0),
    };

    // 4. Execute parallel queries for performance
    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          mercadopagoId: true,
          amount: true,
          penaltyFee: true,
          totalAmount: true,
          status: true,
          dueDate: true,
          paidAt: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
      }),
      db.payment.count({ where }),
    ]);

    // 5. Transform to PaymentListItem format
    const paymentList: PaymentListItem[] = payments.map(payment => ({
      id: payment.id,
      mercadopagoId: payment.mercadopagoId,
      amount: payment.amount,
      penaltyFee: payment.penaltyFee,
      totalAmount: payment.totalAmount,
      status: payment.status,
      dueDate: payment.dueDate.toISOString(),
      paidAt: payment.paidAt?.toISOString() || null,
      createdAt: payment.createdAt.toISOString(),
      user: payment.user,
      plan: {
        name: payment.subscription.plan.name,
      },
    }));

    // 6. Return paginated response
    return NextResponse.json({
      payments: paymentList,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Error al cargar pagos' },
      { status: 500 }
    );
  }
}
