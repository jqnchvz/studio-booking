'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Building2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';

export interface TenantListItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  owner: { name: string; email: string };
  stats: { memberCount: number; resourceCount: number };
}

interface TenantsTableProps {
  tenants: TenantListItem[];
}

type StatusFilter = 'all' | 'active' | 'pending' | 'suspended';

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'active', label: 'Activas' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'suspended', label: 'Suspendidas' },
];

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <Badge className="bg-success/15 text-success border-0">Activa</Badge>;
    case 'pending':
      return <Badge variant="secondary">Pendiente</Badge>;
    case 'suspended':
      return <Badge className="bg-warning/15 text-warning border-0">Suspendida</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function relativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'hoy';
  if (diffDays === 1) return 'ayer';
  if (diffDays < 30) return `hace ${diffDays} días`;
  if (diffDays < 365) return `hace ${Math.floor(diffDays / 30)} meses`;
  return `hace ${Math.floor(diffDays / 365)} años`;
}

export function TenantsTable({ tenants }: TenantsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Client-side filter
  const filtered = tenants.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.owner.name.toLowerCase().includes(q) ||
      t.owner.email.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  async function toggleStatus(tenant: TenantListItem) {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    setTogglingId(tenant.id);
    try {
      const res = await fetch(`/api/admin/organizations/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative min-w-0 sm:min-w-48 sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.key === 'all'
              ? tenants.length
              : tenants.filter((t) => t.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                statusFilter === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              <span className="ml-2 text-xs text-muted-foreground">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">
            {search || statusFilter !== 'all'
              ? 'No se encontraron empresas con esos filtros'
              : 'No hay empresas registradas aún'}
          </p>
          {(search || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => { setSearch(''); setStatusFilter('all'); }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Propietario</TableHead>
                <TableHead className="hidden sm:table-cell">Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Usuarios</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-medium text-foreground">{tenant.name}</p>
                      <Badge variant="outline" className="text-xs font-mono">
                        {tenant.slug}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-sm">{tenant.owner.name}</p>
                      <p className="text-xs text-muted-foreground">{tenant.owner.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-sm text-muted-foreground">—</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={tenant.status} />
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {tenant.stats.memberCount}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {relativeDate(tenant.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/tenants/${tenant.id}`}>Ver detalles</Link>
                      </Button>
                      {(tenant.status === 'active' || tenant.status === 'suspended') && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={togglingId === tenant.id}
                          onClick={() => toggleStatus(tenant)}
                          className={cn(
                            tenant.status === 'active'
                              ? 'text-warning hover:text-warning border-warning/30 hover:bg-warning/10'
                              : 'text-success hover:text-success border-success/30 hover:bg-success/10'
                          )}
                        >
                          {tenant.status === 'active' ? 'Suspender' : 'Activar'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} de {tenants.length} empresa{tenants.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
