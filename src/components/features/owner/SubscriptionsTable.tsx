'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SubscriptionRow {
  id: string;
  client: { name: string; email: string };
  plan: string;
  status: string;
  startDate: string; // ISO
  nextBillingDate: string; // ISO
  cancelledAt: string | null; // ISO
  createdAt: string; // ISO
}

interface SubscriptionsTableProps {
  subscriptions: SubscriptionRow[];
}

type FilterTab = 'all' | 'active' | 'cancelled' | 'expired';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: 'Activa', className: 'bg-success/15 text-success' },
  pending: { label: 'Pendiente', className: 'bg-warning/15 text-warning' },
  cancelled: { label: 'Cancelada', className: 'bg-destructive/10 text-destructive' },
  suspended: { label: 'Suspendida', className: 'bg-destructive/10 text-destructive' },
  past_due: { label: 'Vencida', className: 'bg-warning/15 text-warning' },
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

/** Maps a subscription status to the tab it belongs to. */
function statusToTab(status: string): FilterTab {
  if (status === 'active' || status === 'pending') return 'active';
  if (status === 'cancelled' || status === 'suspended') return 'cancelled';
  if (status === 'past_due') return 'expired';
  return 'all';
}

export function SubscriptionsTable({ subscriptions }: SubscriptionsTableProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');

  // Compute per-tab counts from full dataset (no extra API call needed)
  const counts = useMemo(() => {
    const result = { all: subscriptions.length, active: 0, cancelled: 0, expired: 0 };
    for (const s of subscriptions) {
      const tab = statusToTab(s.status);
      if (tab !== 'all') result[tab]++;
    }
    return result;
  }, [subscriptions]);

  const FILTER_TABS: { value: FilterTab; label: string }[] = [
    { value: 'all', label: `Todas (${counts.all})` },
    { value: 'active', label: `Activas (${counts.active})` },
    { value: 'cancelled', label: `Canceladas (${counts.cancelled})` },
    { value: 'expired', label: `Expiradas (${counts.expired})` },
  ];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return subscriptions.filter((s) => {
      const matchesSearch =
        !q ||
        s.client.name.toLowerCase().includes(q) ||
        s.client.email.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || statusToTab(s.status) === filter;
      return matchesSearch && matchesFilter;
    });
  }, [subscriptions, search, filter]);

  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Sin suscriptores todavía</p>
        <p className="text-xs text-muted-foreground mt-1">
          Las suscripciones aparecerán aquí cuando tus clientes se suscriban a un plan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

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
          No se encontraron suscripciones con esos filtros.
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Inicio</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Próximo cobro
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => {
                const statusCfg = STATUS_CONFIG[s.status] ?? {
                  label: s.status,
                  className: 'bg-muted text-muted-foreground',
                };

                const showNextBilling = s.status === 'active' || s.status === 'pending';

                return (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium leading-none">{s.client.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.client.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.plan}</td>
                    <td className="px-4 py-3">
                      <Badge className={cn('text-xs font-normal', statusCfg.className)}>
                        {statusCfg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmt(s.startDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {showNextBilling ? fmt(s.nextBillingDate) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} de {subscriptions.length} suscripción
        {subscriptions.length !== 1 ? 'es' : ''}
      </p>
    </div>
  );
}
