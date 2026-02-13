import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';

/**
 * GET /api/admin/users/export
 *
 * Export users to CSV file with current filters applied.
 * Returns a downloadable CSV file with UTF-8 BOM for Excel compatibility.
 *
 * Query Parameters (same as user list):
 * - search: string (search by name OR email)
 * - subscriptionStatus: 'active' | 'inactive' | 'none'
 * - isAdmin: 'true' | 'false'
 *
 * Note: NO pagination - exports ALL matching users.
 * Requires admin authentication.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Admin guard
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    // 2. Parse filters (same logic as list API)
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const subscriptionStatus = searchParams.get('subscriptionStatus') || undefined;
    const isAdminFilter = searchParams.get('isAdmin') || undefined;

    // 3. Build where clause (same logic as list API)
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
      ].filter(condition => Object.keys(condition).length > 0),
    };

    // 4. Fetch ALL users (no pagination for export)
    const users = await db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        subscription: {
          select: {
            status: true,
            plan: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // 5. Generate CSV with UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const headers = 'Nombre,Email,Estado Suscripción,Plan,Admin,Fecha Registro\n';

    const rows = users.map(user => {
      const subStatus = user.subscription?.status || 'Sin suscripción';
      const planName = user.subscription?.plan.name || '-';
      const adminStatus = user.isAdmin ? 'Sí' : 'No';

      // Chilean date format: DD/MM/YYYY
      const dateStr = new Intl.DateTimeFormat('es-CL', {
        timeZone: 'America/Santiago',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(user.createdAt));

      // Escape CSV fields (wrap in quotes if contains comma)
      const escape = (val: string) => val.includes(',') ? `"${val}"` : val;

      return [
        escape(user.name),
        escape(user.email),
        escape(subStatus),
        escape(planName),
        adminStatus,
        dateStr,
      ].join(',');
    }).join('\n');

    const csv = BOM + headers + rows;

    // 6. Return as downloadable file
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="usuarios-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting users:', error);
    return NextResponse.json(
      { error: 'Error al exportar usuarios' },
      { status: 500 }
    );
  }
}
