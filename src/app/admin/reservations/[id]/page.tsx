import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Calendar, Clock, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatChileanDate, formatChileanTime, formatChileanDateTime } from '@/lib/utils/format';
import type { ReservationDetail } from '@/types/admin';

/**
 * Admin Reservation Detail Page
 *
 * Server component that fetches detailed reservation information and displays:
 * - Reservation title, description, and dates
 * - User information (with link to user detail)
 * - Resource details
 * - Attendee count
 * - Status with badge
 * - Metadata JSON (if present)
 */
export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let reservation: ReservationDetail | null = null;
  let error: string | null = null;

  try {
    // Forward cookies for authentication
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/reservations/${id}`,
      {
        cache: 'no-store',
        headers: { Cookie: cookieHeader },
      }
    );

    if (response.status === 404) {
      notFound();
    }

    if (!response.ok) {
      throw new Error('Failed to fetch reservation');
    }

    const data = await response.json();
    reservation = data.reservation;
  } catch (err) {
    console.error('Error loading reservation:', err);
    error = 'No se pudo cargar la reserva. Por favor, recarga la página.';
  }

  // Three-state rendering: error
  if (error) {
    return (
      <div className="space-y-6">
        <Link href="/admin/reservations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a reservas
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!reservation) return null;

  /**
   * Get badge variant based on reservation status
   */
  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'confirmed':
        return 'default'; // green
      case 'pending':
        return 'secondary'; // yellow
      case 'cancelled':
        return 'destructive'; // red
      case 'completed':
        return 'outline'; // gray
      default:
        return 'secondary';
    }
  };

  /**
   * Get status label in Spanish
   */
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return status;
    }
  };

  const startDate = new Date(reservation.startTime);
  const endDate = new Date(reservation.endTime);
  const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)); // minutes

  // Three-state rendering: success
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/admin/reservations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mt-2">{reservation.title}</h1>
          <p className="text-muted-foreground">ID: {reservation.id}</p>
        </div>
        <Badge variant={getStatusBadgeVariant(reservation.status)} className="text-lg px-4 py-2">
          {getStatusLabel(reservation.status)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Reservation Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Reserva</CardTitle>
            <CardDescription>Detalles de fecha, hora y asistentes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha</p>
                <p className="text-lg font-medium">{formatChileanDate(startDate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Horario</p>
                <p className="text-lg font-medium">
                  {formatChileanTime(startDate)} - {formatChileanTime(endDate)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Duración: {duration} minutos ({Math.floor(duration / 60)}h {duration % 60}m)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Asistentes</p>
                <p className="text-lg font-medium">{reservation.attendees} persona(s)</p>
              </div>
            </div>

            {reservation.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Descripción</p>
                <p className="text-sm">{reservation.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Creada</p>
                <p className="text-sm">{formatChileanDateTime(new Date(reservation.createdAt))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Actualizada</p>
                <p className="text-sm">{formatChileanDateTime(new Date(reservation.updatedAt))}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User and Resource Card */}
        <Card>
          <CardHeader>
            <CardTitle>Usuario y Recurso</CardTitle>
            <CardDescription>Información del cliente y recurso reservado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Usuario</p>
              <Link href={`/admin/users/${reservation.user.id}`} className="text-primary hover:underline">
                <p className="text-lg font-medium">{reservation.user.name}</p>
              </Link>
              <p className="text-sm text-muted-foreground">{reservation.user.email}</p>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Recurso</p>
                  <p className="text-lg font-medium">{reservation.resource.name}</p>
                  {reservation.resource.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {reservation.resource.description}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    Capacidad: {reservation.resource.capacity} persona(s)
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">ID del Recurso</p>
              <code className="text-sm bg-muted px-2 py-1 rounded">{reservation.resource.id}</code>
            </div>
          </CardContent>
        </Card>

        {/* Metadata Card (if present) */}
        {reservation.metadata && Object.keys(reservation.metadata).length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
              <CardDescription>Información adicional de la reserva</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(reservation.metadata, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
