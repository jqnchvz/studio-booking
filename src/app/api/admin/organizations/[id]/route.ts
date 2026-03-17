import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';
import { decrypt, maskCredential } from '@/lib/utils/encryption';

const PatchSchema = z.object({
  status: z.enum(['active', 'suspended']),
});

/**
 * GET /api/admin/organizations/[id]
 *
 * Full organization detail including settings (MP keys masked) and counts.
 * Requires admin authentication.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const { id } = await params;

    const [org, activeSubscriptions, totalReservations, recentReservations] =
      await Promise.all([
        db.organization.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            owner: {
              select: { id: true, name: true, email: true, emailVerified: true },
            },
            settings: {
              select: {
                businessType: true,
                phone: true,
                address: true,
                logoUrl: true,
                timezone: true,
                mpAccessToken: true,
                mpPublicKey: true,
                mpWebhookSecret: true,
              },
            },
            _count: {
              select: { users: true, resources: true, plans: true },
            },
          },
        }),
        db.subscription.count({
          where: { plan: { organizationId: id }, status: 'active' },
        }),
        db.reservation.count({
          where: { resource: { organizationId: id } },
        }),
        db.reservation.findMany({
          where: { resource: { organizationId: id } },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            startTime: true,
            endTime: true,
            createdAt: true,
            resource: { select: { name: true } },
            user: { select: { name: true, email: true } },
            guestName: true,
            guestEmail: true,
          },
        }),
      ]);

    if (!org) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        status: org.status,
        createdAt: org.createdAt.toISOString(),
        updatedAt: org.updatedAt.toISOString(),
        owner: org.owner,
        settings: org.settings
          ? {
              businessType: org.settings.businessType,
              phone: org.settings.phone,
              address: org.settings.address,
              logoUrl: org.settings.logoUrl,
              timezone: org.settings.timezone,
              // Decrypt then mask — full values never leave the server
              mpAccessToken: maskCredential(decrypt(org.settings.mpAccessToken ?? '')),
              mpPublicKey: maskCredential(decrypt(org.settings.mpPublicKey ?? '')),
              mpWebhookSecret: org.settings.mpWebhookSecret ? '••••••••' : null,
            }
          : null,
        stats: {
          memberCount: org._count.users,
          resourceCount: org._count.resources,
          planCount: org._count.plans,
          activeSubscriptions,
          totalReservations,
        },
        recentActivity: recentReservations.map((r) => ({
          id: r.id,
          type: 'reservation' as const,
          status: r.status,
          startTime: r.startTime.toISOString(),
          endTime: r.endTime.toISOString(),
          createdAt: r.createdAt.toISOString(),
          resourceName: r.resource.name,
          userName: r.user?.name ?? r.guestName ?? 'Guest',
          userEmail: r.user?.email ?? r.guestEmail ?? '',
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching organization detail:', error);
    return NextResponse.json(
      { error: 'Error al cargar organización' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/organizations/[id]
 *
 * Update organization status (activate or suspend).
 * Body: { "status": "active" | "suspended" }
 *
 * Requires admin authentication.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const { id } = await params;

    const body = await request.json();
    const result = PatchSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Estado inválido. Use: active, suspended', details: result.error.issues },
        { status: 400 }
      );
    }

    const existing = await db.organization.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    const updated = await db.organization.update({
      where: { id },
      data: { status: result.data.status },
      select: { id: true, name: true, status: true },
    });

    return NextResponse.json({ organization: updated });
  } catch (error) {
    console.error('Error updating organization status:', error);
    return NextResponse.json(
      { error: 'Error al actualizar organización' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/organizations/[id]
 *
 * Soft-delete an organization by setting status to "deleted".
 * Does not cascade delete data.
 *
 * Requires admin authentication.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const { id } = await params;

    const existing = await db.organization.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 404 }
      );
    }

    if (existing.status === 'deleted') {
      return NextResponse.json(
        { error: 'Organización ya fue eliminada' },
        { status: 409 }
      );
    }

    await db.organization.update({
      where: { id },
      data: { status: 'deleted' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { error: 'Error al eliminar organización' },
      { status: 500 }
    );
  }
}
