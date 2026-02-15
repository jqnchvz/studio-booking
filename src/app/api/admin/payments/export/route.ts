import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';

/**
 * GET /api/admin/payments/export
 *
 * Export payments to CSV file with current filters applied.
 * Returns a downloadable CSV file with UTF-8 BOM for Excel compatibility.
 *
 * Query Parameters (same as payment list):
 * - status: 'all' | 'pending' | 'approved' | 'rejected' | 'refunded'
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - userId: string
 * - search: string (user name/email)
 *
 * Note: NO pagination - exports ALL matching payments.
 * Requires admin authentication.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Admin guard
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    // 2. Parse filters (same logic as list API)
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const search = searchParams.get('search') || undefined;

    // 3. Build where clause (same logic as list API)
    const where: any = {
      AND: [
        // Status filter
        status !== 'all' ? { status } : {},

        // Date range filter
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

    // 4. Fetch ALL payments (no pagination for export)
    const payments = await db.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        paidAt: true,
        amount: true,
        penaltyFee: true,
        totalAmount: true,
        status: true,
        mercadopagoId: true,
        user: {
          select: {
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
    });

    // 5. Generate CSV with UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const headers = 'Fecha,Usuario,Email,Plan,Monto Base,Penalización,Total,Estado,MP ID,Pagado\n';

    const rows = payments.map(payment => {
      // Chilean date format: DD/MM/YYYY
      const dateFormatter = new Intl.DateTimeFormat('es-CL', {
        timeZone: 'America/Santiago',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      const createdDate = dateFormatter.format(new Date(payment.createdAt));
      const paidDate = payment.paidAt ? dateFormatter.format(new Date(payment.paidAt)) : '-';

      // Escape CSV fields (wrap in quotes if contains comma)
      const escape = (val: string) => val.includes(',') ? `"${val}"` : val;

      return [
        createdDate,
        escape(payment.user.name),
        escape(payment.user.email),
        escape(payment.subscription.plan.name),
        payment.amount,
        payment.penaltyFee,
        payment.totalAmount,
        payment.status,
        payment.mercadopagoId,
        paidDate,
      ].join(',');
    }).join('\n');

    const csv = BOM + headers + rows;

    // 6. Return as downloadable file
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pagos-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting payments:', error);
    return NextResponse.json(
      { error: 'Error al exportar pagos' },
      { status: 500 }
    );
  }
}
