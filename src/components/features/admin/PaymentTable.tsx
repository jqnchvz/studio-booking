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
import type { PaymentListItem, PaginationMeta } from '@/types/admin';

interface PaymentTableProps {
  payments: PaymentListItem[];
  pagination: PaginationMeta;
  initialSearch: string;
  initialStatus: string;
  initialStartDate: string;
  initialEndDate: string;
}

/**
 * PaymentTable Component
 *
 * Interactive table for monitoring payments with:
 * - Debounced search (500ms delay)
 * - Payment status filter
 * - Date range filters
 * - Pagination controls
 * - Row click navigation to detail page
 * - CSV export with current filters
 */
export function PaymentTable({
  payments,
  pagination,
  initialSearch,
  initialStatus,
  initialStartDate,
  initialEndDate,
}: PaymentTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

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
    router.push(`/admin/payments?${params.toString()}`);
  }, [router, searchParams]);

  // Debounced search effect (500ms delay to prevent excessive requests)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({ search });
    }, 500);
    return () => clearTimeout(timer);
  }, [search, updateFilters]);

  /**
   * Navigate to payment detail page on row click
   */
  const handleRowClick = (paymentId: string) => {
    router.push(`/admin/payments/${paymentId}`);
  };

  /**
   * Download CSV export with current filters
   */
  const handleExport = async () => {
    const params = new URLSearchParams(searchParams);
    const response = await fetch(`/api/admin/payments/export?${params.toString()}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Navigate to specific page
   */
  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    router.push(`/admin/payments?${params.toString()}`);
  };

  /**
   * Get badge variant based on payment status
   */
  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'approved':
        return 'default'; // green
      case 'pending':
        return 'secondary'; // yellow
      case 'rejected':
        return 'destructive'; // red
      case 'refunded':
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
      case 'approved':
        return 'Aprobado';
      case 'pending':
        return 'Pendiente';
      case 'rejected':
        return 'Rechazado';
      case 'refunded':
        return 'Reembolsado';
      default:
        return status;
    }
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
          <option value="approved">Aprobado</option>
          <option value="rejected">Rechazado</option>
          <option value="refunded">Reembolsado</option>
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

        {/* Export button */}
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
              <TableHead>Fecha</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Monto Base</TableHead>
              <TableHead>Penalización</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>MP ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No se encontraron pagos
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow
                  key={payment.id}
                  onClick={() => handleRowClick(payment.id)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="text-sm">
                    {formatChileanDate(new Date(payment.createdAt))}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{payment.user.name}</p>
                      <p className="text-xs text-muted-foreground">{payment.user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{payment.plan.name}</TableCell>
                  <TableCell>{formatCLP(payment.amount)}</TableCell>
                  <TableCell>
                    {payment.penaltyFee > 0 ? (
                      <span className="text-destructive font-medium">
                        {formatCLP(payment.penaltyFee)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{formatCLP(payment.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(payment.status)}>
                      {getStatusLabel(payment.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {payment.mercadopagoId.slice(0, 12)}...
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {payments.length} de {pagination.total} pagos
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
