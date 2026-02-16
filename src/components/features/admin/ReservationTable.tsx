'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatChileanDate, formatChileanTime } from '@/lib/utils/format';
import type { ReservationListItem, PaginationMeta } from '@/types/admin';

interface ReservationTableProps {
  reservations: ReservationListItem[];
  pagination: PaginationMeta;
  initialSearch: string;
  initialStatus: string;
  initialStartDate: string;
  initialEndDate: string;
  initialResourceId: string;
  resources: Array<{ id: string; name: string }>;
}

/**
 * ReservationTable Component
 *
 * Interactive table for managing reservations with:
 * - Debounced search (500ms delay)
 * - Reservation status filter
 * - Date range filters
 * - Resource filter
 * - Pagination controls
 * - Row click navigation to detail page
 */
export function ReservationTable({
  reservations,
  pagination,
  initialSearch,
  initialStatus,
  initialStartDate,
  initialEndDate,
  initialResourceId,
  resources,
}: ReservationTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [resourceId, setResourceId] = useState(initialResourceId);

  /**
   * Update URL with new filter values
   * Resets to page 1 when filters change
   */
  const updateFilters = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    params.delete('page'); // Reset to page 1 on filter change
    router.push(`/admin/reservations?${params.toString()}`);
  }, [router, searchParams]);

  // Debounced search effect (500ms delay to prevent excessive requests)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({ search });
    }, 500);
    return () => clearTimeout(timer);
  }, [search, updateFilters]);

  /**
   * Navigate to reservation detail page on row click
   */
  const handleRowClick = (reservationId: string) => {
    router.push(`/admin/reservations/${reservationId}`);
  };

  /**
   * Navigate to specific page
   */
  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    router.push(`/admin/reservations?${params.toString()}`);
  };

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

  /**
   * Format date and time for display
   */
  const formatDateTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const date = formatChileanDate(start);
    const timeStart = formatChileanTime(start);
    const timeEnd = formatChileanTime(end);
    return { date, time: `${timeStart} - ${timeEnd}` };
  };

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex gap-4 flex-wrap">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuario o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            updateFilters({ status: e.target.value });
          }}
          className="border rounded-md px-3 py-2 text-sm bg-background"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmada</option>
          <option value="cancelled">Cancelada</option>
          <option value="completed">Completada</option>
        </select>

        {/* Resource filter */}
        <select
          value={resourceId}
          onChange={(e) => {
            setResourceId(e.target.value);
            updateFilters({ resourceId: e.target.value });
          }}
          className="border rounded-md px-3 py-2 text-sm bg-background min-w-[150px]"
        >
          <option value="">Todos los recursos</option>
          {resources.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.name}
            </option>
          ))}
        </select>

        {/* Start date filter */}
        <Input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            updateFilters({ startDate: e.target.value });
          }}
          placeholder="Fecha inicio"
          className="w-auto"
        />

        {/* End date filter */}
        <Input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            updateFilters({ endDate: e.target.value });
          }}
          placeholder="Fecha fin"
          className="w-auto"
        />
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Recurso</TableHead>
              <TableHead>Asistentes</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No se encontraron reservas
                </TableCell>
              </TableRow>
            ) : (
              reservations.map((reservation) => {
                const { date, time } = formatDateTime(reservation.startTime, reservation.endTime);
                return (
                  <TableRow
                    key={reservation.id}
                    onClick={() => handleRowClick(reservation.id)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{date}</p>
                        <p className="text-xs text-muted-foreground">{time}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{reservation.title}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reservation.user.name}</p>
                        <p className="text-xs text-muted-foreground">{reservation.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{reservation.resource.name}</TableCell>
                    <TableCell>{reservation.attendees}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(reservation.status)}>
                        {getStatusLabel(reservation.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {reservations.length} de {pagination.total} reservas
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => goToPage(pagination.page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="flex items-center px-3 text-sm">
            Página {pagination.page} de {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.pages}
            onClick={() => goToPage(pagination.page + 1)}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
