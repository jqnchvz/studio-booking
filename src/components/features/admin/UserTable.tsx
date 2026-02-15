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
import { formatChileanDate } from '@/lib/utils/format';
import type { UserListItem, PaginationMeta } from '@/types/admin';

interface UserTableProps {
  users: UserListItem[];
  pagination: PaginationMeta;
  initialSearch: string;
  initialSubscriptionFilter: string;
  initialAdminFilter: string;
}

/**
 * UserTable Component
 *
 * Interactive table for managing users with:
 * - Debounced search (500ms delay)
 * - Subscription status filter
 * - Admin role filter
 * - Pagination controls
 * - Row click navigation to detail page
 * - CSV export with current filters
 */
export function UserTable({
  users,
  pagination,
  initialSearch,
  initialSubscriptionFilter,
  initialAdminFilter,
}: UserTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch);
  const [subFilter, setSubFilter] = useState(initialSubscriptionFilter);
  const [adminFilter, setAdminFilter] = useState(initialAdminFilter);

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
    router.push(`/admin/users?${params.toString()}`);
  }, [router, searchParams]);

  // Debounced search effect (500ms delay to prevent excessive requests)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({ search });
    }, 500);
    return () => clearTimeout(timer);
  }, [search, updateFilters]);

  /**
   * Navigate to user detail page on row click
   */
  const handleRowClick = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  /**
   * Download CSV export with current filters
   */
  const handleExport = async () => {
    const params = new URLSearchParams(searchParams);
    const response = await fetch(`/api/admin/users/export?${params.toString()}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Navigate to specific page
   */
  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Subscription status filter */}
        <select
          value={subFilter}
          onChange={(e) => {
            setSubFilter(e.target.value);
            updateFilters({ subscriptionStatus: e.target.value });
          }}
          className="border rounded-md px-3 py-2 text-sm bg-background"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
          <option value="none">Sin suscripción</option>
        </select>

        {/* Admin filter */}
        <select
          value={adminFilter}
          onChange={(e) => {
            setAdminFilter(e.target.value);
            updateFilters({ isAdmin: e.target.value });
          }}
          className="border rounded-md px-3 py-2 text-sm bg-background"
        >
          <option value="">Todos los usuarios</option>
          <option value="true">Solo admins</option>
          <option value="false">Solo regulares</option>
        </select>

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
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Suscripción</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  onClick={() => handleRowClick(user.id)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.subscription ? (
                      <Badge
                        variant={user.subscription.status === 'active' ? 'default' : 'secondary'}
                      >
                        {user.subscription.planName}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sin suscripción</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.isAdmin && (
                      <Badge variant="outline">Admin</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatChileanDate(new Date(user.createdAt))}
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
          Mostrando {users.length} de {pagination.total} usuarios
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
