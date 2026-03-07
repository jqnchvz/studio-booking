'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReservationRow {
  id: string;
  client: { name: string; email: string };
  resource: string;
  startTime: string; // ISO
  endTime: string; // ISO
  status: string;
  createdAt: string; // ISO
}

interface ReservationsTableProps {
  reservations: ReservationRow[];
}

type FilterTab = 'all' | 'confirmed' | 'pending' | 'cancelled';

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'cancelled', label: 'Canceladas' },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmada', className: 'bg-success/15 text-success' },
  pending: { label: 'Pendiente', className: 'bg-warning/15 text-warning' },
  cancelled: { label: 'Cancelada', className: 'bg-destructive/10 text-destructive' },
  completed: { label: 'Completada', className: 'bg-muted text-muted-foreground' },
};

const DATE_FMT = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const SHORT_DATE_FMT = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

function formatRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const startStr = DATE_FMT.format(start);
  // Only show time for end if same day
  const endTime = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
  }).format(end);
  return `${startStr} – ${endTime}`;
}

function formatCreatedAt(isoDate: string): string {
  return SHORT_DATE_FMT.format(new Date(isoDate));
}

export function ReservationsTable({ reservations }: ReservationsTableProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return reservations.filter((r) => {
      const matchesSearch =
        !q ||
        r.client.name.toLowerCase().includes(q) ||
        r.client.email.toLowerCase().includes(q) ||
        r.resource.toLowerCase().includes(q);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'confirmed' && r.status === 'confirmed') ||
        (filter === 'pending' && r.status === 'pending') ||
        (filter === 'cancelled' && r.status === 'cancelled');

      return matchesSearch && matchesFilter;
    });
  }, [reservations, search, filter]);

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Sin reservas todavía</p>
        <p className="text-xs text-muted-foreground mt-1">
          Las reservas aparecerán aquí cuando tus clientes reserven recursos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, email o recurso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 border border-border rounded-md p-0.5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'px-3 py-1 text-sm rounded transition-colors',
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
          No se encontraron reservas con esos filtros.
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Recurso</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Fecha y hora
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Creada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => {
                const statusCfg = STATUS_CONFIG[r.status] ?? {
                  label: r.status,
                  className: 'bg-muted text-muted-foreground',
                };

                return (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium leading-none">{r.client.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.client.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.resource}</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {formatRange(r.startTime, r.endTime)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn('text-xs font-normal', statusCfg.className)}>
                        {statusCfg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatCreatedAt(r.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} de {reservations.length} reserva
        {reservations.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
