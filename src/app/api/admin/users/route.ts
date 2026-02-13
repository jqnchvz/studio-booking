import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';
import type { UserListItem } from '@/types/admin';

/**
 * GET /api/admin/users
 *
 * List all users with search, filter, and pagination capabilities.
 * Requires admin authentication.
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - search: string (search by name OR email, case-insensitive)
 * - subscriptionStatus: 'active' | 'inactive' | 'none'
 * - isAdmin: 'true' | 'false'
 * - sortBy: 'createdAt' | 'name' | 'email' (default: 'createdAt')
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Admin guard (follow promote API pattern)
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    // 2. Parse query params (no Zod validation per CLAUDE.md - only validate request bodies)
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || undefined;
    const subscriptionStatus = searchParams.get('subscriptionStatus') || undefined;
    const isAdminFilter = searchParams.get('isAdmin') || undefined;
    const sortBy = (searchParams.get('sortBy') || 'createdAt') as 'createdAt' | 'name' | 'email';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // 3. Build Prisma where clause
    const where: any = {
      AND: [
        // Search: name OR email contains (case-insensitive)
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        } : {},

        // Admin filter
        isAdminFilter !== undefined ? { isAdmin: isAdminFilter === 'true' } : {},

        // Subscription status filter
        subscriptionStatus === 'active' ? { subscription: { status: 'active' } } :
        subscriptionStatus === 'inactive' ? {
          subscription: { status: { in: ['cancelled', 'suspended', 'past_due', 'pending'] } }
        } :
        subscriptionStatus === 'none' ? { subscription: null } : {},
      ].filter(condition => Object.keys(condition).length > 0), // Remove empty objects
    };

    // 4. Execute parallel queries for performance
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          emailVerified: true,
          createdAt: true,
          subscription: {
            select: {
              status: true,
              plan: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    // 5. Transform to UserListItem format
    const userList: UserListItem[] = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      subscription: user.subscription ? {
        status: user.subscription.status,
        planName: user.subscription.plan.name,
        planId: user.subscription.plan.id,
      } : null,
    }));

    // 6. Return paginated response
    return NextResponse.json({
      users: userList,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error al cargar usuarios' },
      { status: 500 }
    );
  }
}
