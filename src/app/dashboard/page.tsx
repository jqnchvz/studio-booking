import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Calendar,
  CreditCard,
  Plus,
  ArrowRight,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Receipt,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { db } from '@/lib/db';

// ─── Shared helpers ─────────────────────────────────────────────────────────

const SUBSCRIPTION_STATUS: Record<string, { label: string; className: string }> = {
  active:    { label: 'Activa',     className: 'bg-success/15 text-success' },
  pending:   { label: 'Pendiente',  className: 'bg-warning/15 text-warning' },
  suspended: { label: 'Suspendida', className: 'bg-warning/15 text-warning' },
  past_due:  { label: 'Vencida',    className: 'bg-destructive/15 text-destructive' },
  cancelled: { label: 'Cancelada',  className: 'bg-muted text-muted-foreground' },
};

function formatDate(date: Date) {
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Santiago',
  });
}

function formatReservationTime(date: Date) {
  return {
    date: date.toLocaleDateString('es-CL', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Santiago',
    }),
    time: date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Santiago',
    }),
  };
}

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatActivityTimestamp(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Santiago',
  });
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // ── Admin view ──────────────────────────────────────────────────────────

  if (user.isAdmin) {
    const now = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' })
    );
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      activeSubscriptionCount,
      activeSubscriptions,
      paymentsLast30Days,
      upcomingReservationsCount,
      recentSubscriptions,
      recentPayments,
      recentReservations,
      recentUsers,
    ] = await Promise.all([
      db.subscription.count({ where: { status: 'active' } }),
      db.subscription.findMany({
        where: { status: 'active' },
        select: { planPrice: true },
      }),
      db.payment.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { status: true },
      }),
      db.reservation.count({
        where: {
          startTime: { gte: now, lte: sevenDaysFromNow },
          status: { in: ['confirmed', 'pending'] },
        },
      }),
      db.subscription.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        where: { status: 'active' },
        select: {
          id: true,
          createdAt: true,
          user: { select: { name: true } },
          plan: { select: { name: true } },
        },
      }),
      db.payment.findMany({
        take: 3,
        orderBy: { updatedAt: 'desc' },
        where: { status: 'approved' },
        select: {
          id: true,
          updatedAt: true,
          totalAmount: true,
          user: { select: { name: true } },
        },
      }),
      db.reservation.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          user: { select: { name: true } },
          resource: { select: { name: true } },
        },
      }),
      db.user.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, createdAt: true },
      }),
    ]);

    const mrr = activeSubscriptions.reduce((sum, s) => sum + s.planPrice, 0);
    const totalPayments = paymentsLast30Days.length;
    const successfulPayments = paymentsLast30Days.filter(
      (p) => p.status === 'approved'
    ).length;
    const successRate =
      totalPayments > 0
        ? Number(((successfulPayments / totalPayments) * 100).toFixed(1))
        : 0;
    const failedPayments = paymentsLast30Days.filter(
      (p) => p.status === 'rejected'
    ).length;

    type ActivityItem = {
      id: string;
      action: string;
      userName: string;
      timestamp: string;
    };

    const activity: ActivityItem[] = [
      ...recentSubscriptions.map((s) => ({
        id: s.id,
        action: `Nueva suscripción al plan ${s.plan.name}`,
        userName: s.user.name,
        timestamp: s.createdAt.toISOString(),
      })),
      ...recentPayments.map((p) => ({
        id: p.id,
        action: `Pago aprobado — ${formatCLP(p.totalAmount)}`,
        userName: p.user.name,
        timestamp: p.updatedAt.toISOString(),
      })),
      ...recentReservations.map((r) => ({
        id: r.id,
        action: `Nueva reserva en ${r.resource.name}`,
        userName: r.user.name,
        timestamp: r.createdAt.toISOString(),
      })),
      ...recentUsers.map((u) => ({
        id: u.id,
        action: 'Nuevo usuario registrado',
        userName: u.name,
        timestamp: u.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    const metrics = [
      {
        label: 'Suscripciones activas',
        value: activeSubscriptionCount.toString(),
        icon: Users,
        iconClass: 'text-primary',
      },
      {
        label: 'MRR',
        value: formatCLP(mrr),
        icon: TrendingUp,
        iconClass: 'text-success',
      },
      {
        label: 'Tasa de éxito (30d)',
        value: `${successRate}%`,
        icon: CheckCircle,
        iconClass: 'text-success',
      },
      {
        label: 'Reservas próximas (7d)',
        value: upcomingReservationsCount.toString(),
        icon: Calendar,
        iconClass: 'text-primary',
      },
      {
        label: 'Pagos fallidos (30d)',
        value: failedPayments.toString(),
        icon: AlertCircle,
        iconClass: failedPayments > 0 ? 'text-destructive' : 'text-muted-foreground',
      },
    ];

    const adminActions = [
      { href: '/admin/users', icon: Users, label: 'Usuarios' },
      { href: '/admin/reservations', icon: Calendar, label: 'Reservas' },
      { href: '/admin/payments', icon: CreditCard, label: 'Pagos' },
      { href: '/admin/subscriptions', icon: Receipt, label: 'Suscripciones' },
    ];

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Panel de administración
          </h1>
          <p className="mt-1 text-muted-foreground">
            Resumen de la plataforma en tiempo real
          </p>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="border border-border rounded-lg p-4 bg-card"
            >
              <m.icon className={`h-5 w-5 mb-2 ${m.iconClass}`} />
              <p className="text-2xl font-bold text-foreground leading-tight">
                {m.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent activity */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <h2 className="font-semibold text-foreground mb-4">
              Actividad reciente
            </h2>
            {activity.length > 0 ? (
              <ul className="space-y-3">
                {activity.map((event) => (
                  <li key={`${event.id}-${event.timestamp}`} className="flex gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">
                        {event.action}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {event.userName} · {formatActivityTimestamp(event.timestamp)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay actividad reciente.
              </p>
            )}
          </div>

          {/* Admin quick actions */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <h2 className="font-semibold text-foreground mb-4">
              Gestión
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {adminActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 px-4 py-3 border border-border rounded-lg hover:bg-muted/50 transition"
                >
                  <action.icon className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-foreground">
                    {action.label}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── User view ───────────────────────────────────────────────────────────

  const [subscription, upcomingReservations] = await Promise.all([
    db.subscription.findFirst({
      where: { userId: user.id, status: { not: 'cancelled' } },
      include: { plan: true },
    }),
    db.reservation.findMany({
      where: {
        userId: user.id,
        status: { in: ['confirmed', 'pending'] },
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: 'asc' },
      take: 3,
      include: { resource: { select: { name: true } } },
    }),
  ]);

  const firstName = user.name.split(' ')[0];
  const statusConfig = subscription
    ? (SUBSCRIPTION_STATUS[subscription.status] ?? SUBSCRIPTION_STATUS.cancelled)
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Bienvenido, {firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Aquí tienes un resumen de tu cuenta
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Subscription card */}
        <div className="border border-border rounded-lg p-6 bg-card">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Mi Suscripción</h2>
          </div>

          {subscription && statusConfig ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Plan
                </p>
                <p className="mt-0.5 font-medium text-foreground">{subscription.plan.name}</p>
              </div>
              <div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}`}
                >
                  {statusConfig.label}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Próximo cobro
                </p>
                <p className="mt-0.5 text-sm text-foreground">
                  {formatDate(subscription.nextBillingDate)}
                </p>
              </div>
              <Link
                href="/dashboard/subscription"
                className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Ver detalles <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No tienes una suscripción activa.
              </p>
              <Link
                href="/dashboard/subscription"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition"
              >
                Suscribirse
              </Link>
            </div>
          )}
        </div>

        {/* Upcoming reservations card */}
        <div className="border border-border rounded-lg p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Próximas Reservas</h2>
            </div>
            <Link
              href="/dashboard/reservations"
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Ver todas
            </Link>
          </div>

          {upcomingReservations.length > 0 ? (
            <ul className="divide-y divide-border -mx-6 px-6">
              {upcomingReservations.map((reservation) => {
                const { date, time } = formatReservationTime(reservation.startTime);
                return (
                  <li key={reservation.id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      href={`/dashboard/reservations/${reservation.id}`}
                      className="group block"
                    >
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {reservation.resource.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {date} · {time}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No tienes reservas próximas.
              </p>
              <Link
                href="/dashboard/reservations/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Nueva Reserva
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/dashboard/reservations/new"
            className="flex items-center gap-3 px-4 py-3 border border-border rounded-lg bg-card hover:bg-muted/50 transition"
          >
            <Plus className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Nueva Reserva</span>
          </Link>
          <Link
            href="/dashboard/reservations"
            className="flex items-center gap-3 px-4 py-3 border border-border rounded-lg bg-card hover:bg-muted/50 transition"
          >
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Ver mis reservas</span>
          </Link>
          <Link
            href="/dashboard/subscription"
            className="flex items-center gap-3 px-4 py-3 border border-border rounded-lg bg-card hover:bg-muted/50 transition"
          >
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Gestionar suscripción</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
