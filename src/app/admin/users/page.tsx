import { cookies } from 'next/headers';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserTable } from '@/components/features/admin/UserTable';
import type { UserListResponse } from '@/types/admin';

/**
 * Admin Users List Page
 *
 * Server component that fetches paginated user data and passes to UserTable.
 * Supports search, filtering, and pagination via URL query params.
 *
 * Query params:
 * - page: number
 * - search: string
 * - subscriptionStatus: 'active' | 'inactive' | 'none'
 * - isAdmin: 'true' | 'false'
 */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const page = params.page || '1';
  const search = params.search || '';
  const subscriptionStatus = params.subscriptionStatus || '';
  const isAdmin = params.isAdmin || '';

  let data: UserListResponse | null = null;
  let error: string | null = null;

  try {
    // Forward cookies for authentication
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const queryParams = new URLSearchParams({
      page,
      ...(search && { search }),
      ...(subscriptionStatus && { subscriptionStatus }),
      ...(isAdmin && { isAdmin }),
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/users?${queryParams}`,
      {
        cache: 'no-store',
        headers: { Cookie: cookieHeader },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    data = await response.json();
  } catch (err) {
    console.error('Error loading users:', err);
    error = 'No se pudieron cargar los usuarios. Por favor, recarga la página.';
  }

  // Three-state rendering: error
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administrar usuarios del sistema</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) return null;

  // Three-state rendering: success
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          {data.pagination.total} usuarios registrados
        </p>
      </div>

      <UserTable
        users={data.users}
        pagination={data.pagination}
        initialSearch={search}
        initialSubscriptionFilter={subscriptionStatus}
        initialAdminFilter={isAdmin}
      />
    </div>
  );
}
