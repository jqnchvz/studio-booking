import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Calendar, CreditCard, Plus, ArrowRight } from 'lucide-react';
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

// ─── Main page ───────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Admins and owners have their own panels
  if (user.role === 'admin') redirect('/admin');
  if (user.role === 'owner') redirect('/owner');

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

  // New users without a subscription are sent straight to plan selection
  if (!subscription) redirect('/dashboard/subscribe');

  const firstName = user.name.split(' ')[0];
  const statusConfig = SUBSCRIPTION_STATUS[subscription.status] ?? SUBSCRIPTION_STATUS.cancelled;

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
