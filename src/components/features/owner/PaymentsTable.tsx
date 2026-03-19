'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCLP } from '@/lib/utils/format';

export interface PaymentRow {
  id: string;
  client: { name: string; email: string };
  plan: string;
  amount: number; // CLP
  status: string;
  paidAt: string | null; // ISO
  createdAt: string; // ISO
}

interface PaymentsTableProps {
  payments: PaymentRow[];
}

type FilterTab = 'all' | 'approved' | 'pending' | 'rejected';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  approved: { label: 'Aprobado', className: 'bg-success/15 text-success' },
  pending: { label: 'Pendiente', className: 'bg-warning/15 text-warning' },
  rejected: { label: 'Rechazado', className: 'bg-destructive/10 text-destructive' },
  refunded: { label: 'Reembolsado', className: 'bg-muted text-muted-foreground' },
};

const DATE_FMT = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

function fmt(iso: string | null | undefined): string {
  if (!iso) return '—';
  return DATE_FMT.format(new Date(iso));
}

/** Returns true if the ISO date falls within the current calendar month (Chile TZ). */
function isCurrentMonth(iso: string): boolean {
  const now = new Date();
  const date = new Date(iso);
  const clNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Santiago' }));
  const clDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Santiago' }));
  return clNow.getFullYear() === clDate.getFullYear() && clNow.getMonth() === clDate.getMonth();
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');

  // Monthly approved total — computed from full dataset
  const monthlyTotal = useMemo(
    () =>
      payments
        .filter((p) => p.status === 'approved' && isCurrentMonth(p.createdAt))
        .reduce((sum, p) => sum + p.amount, 0),
    [payments]
  );

  // Per-tab counts
  const counts = useMemo(() => {
    const result = { all: payments.length, approved: 0, pending: 0, rejected: 0 };
    for (const p of payments) {
      if (p.status === 'approved') result.approved++;
      else if (p.status === 'pending') result.pending++;
      else if (p.status === 'rejected' || p.status === 'refunded') result.rejected++;
    }
    return result;
  }, [payments]);

  const FILTER_TABS: { value: FilterTab; label: string }[] = [
    { value: 'all', label: `Todos (${counts.all})` },
    { value: 'approved', label: `Aprobados (${counts.approved})` },
    { value: 'pending', label: `Pendientes (${counts.pending})` },
    { value: 'rejected', label: `Rechazados (${counts.rejected})` },
  ];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return payments.filter((p) => {
      const matchesSearch =
        !q ||
        p.client.name.toLowerCase().includes(q) ||
        p.client.email.toLowerCase().includes(q);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'approved' && p.status === 'approved') ||
        (filter === 'pending' && p.status === 'pending') ||
        (filter === 'rejected' && (p.status === 'rejected' || p.status === 'refunded'));
      return matchesSearch && matchesFilter;
    });
  }, [payments, search, filter]);

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <TrendingUp className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Sin pagos todavía</p>
        <p className="text-xs text-muted-foreground mt-1">
          Los pagos aparecerán aquí cuando tus clientes realicen suscripciones.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Monthly income summary */}
      <div className="rounded-lg border border-border bg-muted/30 px-5 py-4 flex items-center gap-4">
        <TrendingUp className="h-5 w-5 text-success shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">Ingresos aprobados este mes</p>
          <p className="text-2xl font-bold">{formatCLP(monthlyTotal)}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 min-w-0 sm:min-w-48 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-1 border border-border rounded-md p-0.5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'px-3 py-1 text-sm rounded transition-colors whitespace-nowrap',
                filter === tab.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          No se encontraron pagos con esos filtros.
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                <th className="hidden sm:table-cell px-4 py-3 text-left font-medium text-muted-foreground">Concepto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Monto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => {
                const statusCfg = STATUS_CONFIG[p.status] ?? {
                  label: p.status,
                  className: 'bg-muted text-muted-foreground',
                };

                return (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium leading-none">{p.client.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.client.email}</p>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-muted-foreground">{p.plan}</td>
                    <td className="px-4 py-3 font-medium tabular-nums">{formatCLP(p.amount)}</td>
                    <td className="px-4 py-3">
                      <Badge className={cn('text-xs font-normal', statusCfg.className)}>
                        {statusCfg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {fmt(p.paidAt ?? p.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} de {payments.length} pago{payments.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
