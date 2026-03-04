import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';

/**
 * GET /api/admin/organizations
 *
 * List all organizations with owner info and member/resource counts.
 * Requires admin authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const organizations = await db.organization.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        owner: {
          select: { name: true, email: true },
        },
        _count: {
          select: { users: true, resources: true },
        },
      },
    });

    return NextResponse.json({
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        status: org.status,
        createdAt: org.createdAt.toISOString(),
        owner: org.owner,
        stats: {
          memberCount: org._count.users,
          resourceCount: org._count.resources,
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Error al cargar organizaciones' },
      { status: 500 }
    );
  }
}
