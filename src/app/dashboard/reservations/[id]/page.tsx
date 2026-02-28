import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { ReservationDetailActions } from '@/components/features/reservations/ReservationDetailActions';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  confirmed: { label: 'Confirmada', variant: 'default' },
  pending:   { label: 'Pendiente',  variant: 'secondary' },
  cancelled: { label: 'Cancelada',  variant: 'destructive' },
  completed: { label: 'Completada', variant: 'outline' },
};

const TYPE_LABELS: Record<string, string> = {
  room:      'Sala',
  equipment: 'Equipo',
  service:   'Servicio',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Santiago',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Santiago',
  });
}

function formatDuration(startIso: string, endIso: string) {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) notFound();

  const reservation = await db.reservation.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      startTime: true,
      endTime: true,
      status: true,
      attendees: true,
      userId: true,
      createdAt: true,
      resource: {
        select: {
          name: true,
          type: true,
          capacity: true,
          description: true,
        },
      },
    },
  });

  if (!reservation || reservation.userId !== user.id) notFound();

  const statusConfig = STATUS_CONFIG[reservation.status] ?? STATUS_CONFIG.pending;
  const startIso = reservation.startTime.toISOString();
  const endIso = reservation.endTime.toISOString();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/dashboard/reservations"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Mis Reservas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{reservation.title}</h1>
          <p className="text-muted-foreground mt-1">
            {reservation.resource.name}
            {' · '}
            {TYPE_LABELS[reservation.resource.type] ?? reservation.resource.type}
          </p>
        </div>
        <Badge variant={statusConfig.variant} className="shrink-0 mt-1">
          {statusConfig.label}
        </Badge>
      </div>

      {/* Details card */}
      <div className="border rounded-lg divide-y">
        {/* Date & time */}
        <div className="px-5 py-4 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Fecha y hora
          </p>
          <p className="font-medium capitalize">{formatDate(startIso)}</p>
          <p className="text-sm text-muted-foreground">
            {formatTime(startIso)} – {formatTime(endIso)}
            <span className="ml-2 text-muted-foreground/70">
              ({formatDuration(startIso, endIso)})
            </span>
          </p>
        </div>

        {/* Resource */}
        <div className="px-5 py-4 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Recurso
          </p>
          <p className="font-medium">{reservation.resource.name}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
            <span>{TYPE_LABELS[reservation.resource.type] ?? reservation.resource.type}</span>
            {reservation.resource.capacity && (
              <span>Capacidad: {reservation.resource.capacity} personas</span>
            )}
          </div>
          {reservation.resource.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {reservation.resource.description}
            </p>
          )}
        </div>

        {/* Attendees */}
        <div className="px-5 py-4 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Asistentes
          </p>
          <p className="font-medium">
            {reservation.attendees} {reservation.attendees === 1 ? 'persona' : 'personas'}
          </p>
        </div>

        {/* Description */}
        {reservation.description && (
          <div className="px-5 py-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Descripción
            </p>
            <p className="text-sm">{reservation.description}</p>
          </div>
        )}

        {/* Created at */}
        <div className="px-5 py-4 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Creada el
          </p>
          <p className="text-sm text-muted-foreground">
            {new Date(reservation.createdAt).toLocaleString('es-CL', {
              dateStyle: 'long',
              timeStyle: 'short',
              timeZone: 'America/Santiago',
            })}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-6">
        <Link
          href="/dashboard/reservations/new"
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition"
        >
          Nueva reserva
        </Link>

        <ReservationDetailActions
          reservation={{
            id: reservation.id,
            title: reservation.title,
            startTime: startIso,
            status: reservation.status,
            resource: { name: reservation.resource.name },
          }}
        />
      </div>
    </div>
  );
}
