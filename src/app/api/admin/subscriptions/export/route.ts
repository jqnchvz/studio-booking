import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin';
import { db } from '@/lib/db';

/**
 * GET /api/admin/subscriptions/export
 *
 * Export subscriptions to CSV with current filters applied.
 * Returns a downloadable CSV with UTF-8 BOM for Excel compatibility.
 *
 * Query Parameters (same as list, NO pagination):
 * - search: string
 * - status: string
 * - startDate, endDate: ISO date strings
 *
 * Requires admin authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (!adminResult.success) return adminResult.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const where: any = {
      AND: [
        status && status !== 'all' ? { status } : {},
        search ? {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          },
        } : {},
        startDate && endDate ? {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        } : {},
      ].filter(condition => Object.keys(condition).length > 0),
    };

    const subscriptions = await db.subscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        status: true,
        planPrice: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        plan: { select: { name: true } },
      },
    });

    // Chilean date formatter
    const formatDate = (d: Date) =>
      new Intl.DateTimeFormat('es-CL', {
        timeZone: 'America/Santiago',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);

    const escape = (val: string) => (val.includes(',') ? `"${val}"` : val);

    const BOM = '\uFEFF';
    const headers = 'Fecha,Usuario,Email,Plan,Precio,Estado,Inicio Período,Fin Período\n';

    const rows = subscriptions
      .map(s =>
        [
          formatDate(s.createdAt),
          escape(s.user.name),
          escape(s.user.email),
          escape(s.plan.name),
          s.planPrice,
          s.status,
          formatDate(s.currentPeriodStart),
          formatDate(s.currentPeriodEnd),
        ].join(',')
      )
      .join('\n');

    return new Response(BOM + headers + rows, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="suscripciones-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting subscriptions:', error);
    return NextResponse.json(
      { error: 'Error al exportar suscripciones' },
      { status: 500 }
    );
  }
}
