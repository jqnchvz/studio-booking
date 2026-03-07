'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ClientRow {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  reservationCount: number;
  memberSince: string; // ISO date string
}

interface ClientsTableProps {
  clients: ClientRow[];
}

type FilterTab = 'all' | 'active' | 'inactive';

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: 'Activo', className: 'bg-success/15 text-success' },
  cancelled: { label: 'Cancelado', className: 'bg-destructive/10 text-destructive' },
  suspended: { label: 'Suspendido', className: 'bg-destructive/10 text-destructive' },
  past_due: { label: 'Vencido', className: 'bg-warning/15 text-warning' },
  pending: { label: 'Pendiente', className: 'bg-muted text-muted-foreground' },
};

function formatMemberSince(isoDate: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(isoDate));
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return clients.filter((c) => {
      const matchesSearch =
        !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && c.status === 'active') ||
        (filter === 'inactive' && c.status !== 'active');

      return matchesSearch && matchesFilter;
    });
  }, [clients, search, filter]);

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Sin clientes todavía</p>
        <p className="text-xs text-muted-foreground mt-1">
          Los clientes aparecerán aquí cuando se suscriban a uno de tus planes.
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
            placeholder="Buscar por nombre o email..."
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
          No se encontraron clientes con esos filtros.
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Reservas</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Miembro desde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((client) => {
                const statusCfg = STATUS_CONFIG[client.status] ?? {
                  label: client.status,
                  className: 'bg-muted text-muted-foreground',
                };

                return (
                  <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium leading-none">{client.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{client.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{client.plan}</td>
                    <td className="px-4 py-3">
                      <Badge className={cn('text-xs font-normal', statusCfg.className)}>
                        {statusCfg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {client.reservationCount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatMemberSince(client.memberSince)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} de {clients.length} cliente{clients.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
