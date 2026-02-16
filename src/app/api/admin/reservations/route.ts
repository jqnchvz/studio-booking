import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';
import type { ReservationListItem } from '@/types/admin';

/**
 * GET /api/admin/reservations
 *
 * List all reservations with search, filter, and pagination capabilities.
 * Requires admin authentication.
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - status: 'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed' (default: 'all')
 * - startDate: ISO date string (filter by reservation startTime >= startDate)
 * - endDate: ISO date string (filter by reservation startTime <= endDate)
 * - resourceId: string (filter by specific resource)
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
    const resourceId = searchParams.get('resourceId') || undefined;
    const search = searchParams.get('search') || undefined;

    // 3. Build Prisma where clause
    const where: any = {
      AND: [
        // Status filter
        status !== 'all' ? { status } : {},

        // Date range filter (filter by reservation start time)
        startDate && endDate ? {
          startTime: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        } : {},

        // Resource filter
        resourceId ? { resourceId } : {},

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
    const [reservations, total] = await Promise.all([
      db.reservation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startTime: 'desc' },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          status: true,
          attendees: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          resource: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      db.reservation.count({ where }),
    ]);

    // 5. Transform to ReservationListItem format
    const reservationList: ReservationListItem[] = reservations.map(reservation => ({
      id: reservation.id,
      title: reservation.title,
      startTime: reservation.startTime.toISOString(),
      endTime: reservation.endTime.toISOString(),
      status: reservation.status,
      attendees: reservation.attendees,
      createdAt: reservation.createdAt.toISOString(),
      user: reservation.user,
      resource: reservation.resource,
    }));

    // 6. Return paginated response
    return NextResponse.json({
      reservations: reservationList,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { error: 'Error al cargar reservas' },
      { status: 500 }
    );
  }
}
