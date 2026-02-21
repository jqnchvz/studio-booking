'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { formatCLP, formatChileanDate } from '@/lib/utils/format';
import type { SubscriptionListItem, PaginationMeta } from '@/types/admin';

interface SubscriptionTableProps {
  subscriptions: SubscriptionListItem[];
  pagination: PaginationMeta;
  initialSearch: string;
  initialStatus: string;
  initialStartDate: string;
  initialEndDate: string;
}

function getStatusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'suspended':
    case 'past_due':
      return 'destructive';
    case 'cancelled':
      return 'outline';
    default:
      return 'secondary';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Activo';
    case 'pending':
      return 'Pendiente';
    case 'suspended':
      return 'Suspendido';
    case 'cancelled':
      return 'Cancelado';
    case 'past_due':
      return 'Vencido';
    default:
      return status;
  }
}

/**
 * SubscriptionTable Component
 *
 * Interactive table for browsing subscriptions with:
 * - Debounced search (500ms) by user name/email
 * - Status filter dropdown
 * - Date range filter (createdAt)
 * - Pagination controls
 * - Row click → subscription detail page
 * - CSV export with current filters
 */
export function SubscriptionTable({
  subscriptions,
  pagination,
  initialSearch,
  initialStatus,
  initialStartDate,
  initialEndDate,
}: SubscriptionTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  const updateFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      params.delete('page');
      router.push(`/admin/subscriptions?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({ search });
    }, 500);
    return () => clearTimeout(timer);
  }, [search, updateFilters]);

  const handleRowClick = (id: string) => {
    router.push(`/admin/subscriptions/${id}`);
  };

  const handleExport = async () => {
    const params = new URLSearchParams(searchParams);
    const response = await fetch(
      `/api/admin/subscriptions/export?${params.toString()}`
    );
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suscripciones-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    router.push(`/admin/subscriptions?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            updateFilters({ status: e.target.value });
          }}
          className="border rounded-md px-3 py-2 text-sm bg-background"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="pending">Pendiente</option>
          <option value="suspended">Suspendido</option>
          <option value="cancelled">Cancelado</option>
          <option value="past_due">Vencido</option>
        </select>

        <Input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            updateFilters({ startDate: e.target.value });
          }}
          className="w-40"
          title="Fecha inicio"
        />

        <Input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            updateFilters({ endDate: e.target.value });
          }}
          className="w-40"
          title="Fecha fin"
        />

        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Período Actual</TableHead>
              <TableHead>Creado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No se encontraron suscripciones
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((sub) => (
                <TableRow
                  key={sub.id}
                  onClick={() => handleRowClick(sub.id)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{sub.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {sub.user.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{sub.planName}</TableCell>
                  <TableCell>{formatCLP(sub.planPrice)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(sub.status)}>
                      {getStatusLabel(sub.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatChileanDate(new Date(sub.currentPeriodStart))} –{' '}
                    {formatChileanDate(new Date(sub.currentPeriodEnd))}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatChileanDate(new Date(sub.createdAt))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {subscriptions.length} de {pagination.total} suscripciones
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
