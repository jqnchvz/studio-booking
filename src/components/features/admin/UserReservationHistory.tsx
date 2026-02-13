'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatChileanDate } from '@/lib/utils/format';
import type { UserDetail } from '@/types/admin';

interface UserReservationHistoryProps {
  reservations: UserDetail['reservations'];
}

/**
 * UserReservationHistory Component
 *
 * Displays user's reservation history in a table.
 * Shows last 50 reservations with status badges.
 */
export function UserReservationHistory({ reservations }: UserReservationHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Reservas</CardTitle>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay reservas registradas
          </p>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell className="text-sm">
                      {formatChileanDate(new Date(reservation.startTime))}
                      {' '}
                      {new Date(reservation.startTime).toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Santiago',
                      })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {reservation.resourceName}
                    </TableCell>
                    <TableCell className="text-sm">
                      {reservation.title}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          reservation.status === 'confirmed'
                            ? 'default'
                            : reservation.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {reservation.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {reservations.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Mostrando las últimas {reservations.length} reservas
          </p>
        )}
      </CardContent>
    </Card>
  );
}
