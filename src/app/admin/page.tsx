import { cookies } from 'next/headers';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MetricCard } from '@/components/features/admin/MetricCard';
import { RevenueChart } from '@/components/features/admin/RevenueChart';
import { ActivityFeed } from '@/components/features/admin/ActivityFeed';
import { formatCLP } from '@/lib/utils/format';
import type { AdminStats } from '@/types/admin';

/**
 * Admin Dashboard Overview Page
 *
 * Displays key business metrics, revenue trends, and recent activity.
 *
 * Features:
 * - Server-side data fetching for better performance
 * - Five key metrics in responsive grid
 * - Revenue line chart (last 12 months)
 * - Activity feed (last 20 events)
 * - Three-state rendering: loading → error → content
 *
 * Metrics:
 * 1. Active Subscriptions - Count of active subscriptions
 * 2. MRR - Monthly Recurring Revenue in CLP
 * 3. Payment Success Rate - Percentage of approved payments (last 30 days)
 * 4. Upcoming Reservations - Confirmed/pending reservations (next 7 days)
 * 5. Failed Payments - Rejected payments (last 30 days)
 */
export default async function AdminDashboardPage() {
  let stats: AdminStats | null = null;
  let error: string | null = null;

  try {
    // Fetch stats from API with fresh data (no caching)
    const cookieStore = await cookies();

    // Format cookies correctly for Cookie header
    const cookieHeader = cookieStore.getAll()
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/stats`, {
      cache: 'no-store',
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }

    stats = await response.json();
  } catch (err) {
    console.error('Error loading admin stats:', err);
    error = 'No se pudieron cargar las estadísticas. Por favor, recarga la página.';
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Resumen general del sistema</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // No data (should not happen, but handle gracefully)
  if (!stats) {
    return null;
  }

  // Success state - render dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general del sistema</p>
      </div>

      {/* Metrics Grid - 3 columns on desktop, 2 on tablet, 1 on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Suscripciones Activas"
          value={stats.metrics.activeSubscriptions}
          icon="users"
          description="Total de suscripciones activas"
        />

        <MetricCard
          title="MRR"
          value={formatCLP(stats.metrics.monthlyRecurringRevenue)}
          icon="dollarSign"
          description="Ingresos mensuales recurrentes"
        />

        <MetricCard
          title="Tasa de Éxito"
          value={`${stats.metrics.paymentSuccessRate}%`}
          icon="trendingUp"
          description="Últimos 30 días"
        />

        <MetricCard
          title="Reservas Próximas"
          value={stats.metrics.upcomingReservations}
          icon="calendar"
          description="Próximos 7 días"
        />

        <MetricCard
          title="Pagos Fallidos"
          value={stats.metrics.failedPayments}
          icon="alertCircle"
          description="Últimos 30 días"
        />
      </div>

      {/* Revenue Chart - Full width */}
      <RevenueChart data={stats.revenueByMonth} />

      {/* Activity Feed - Full width */}
      <ActivityFeed events={stats.recentActivity} />
    </div>
  );
}
