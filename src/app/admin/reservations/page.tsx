import { cookies } from 'next/headers';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReservationTable } from '@/components/features/admin/ReservationTable';
import { db } from '@/lib/db';
import type { ReservationListResponse } from '@/types/admin';

/**
 * Admin Reservations List Page
 *
 * Server component that fetches paginated reservation data and passes to ReservationTable.
 * Supports search, filtering, and pagination via URL query params.
 *
 * Query params:
 * - page: number
 * - search: string (user name/email)
 * - status: 'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - resourceId: string
 */
export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const page = params.page || '1';
  const search = params.search || '';
  const status = params.status || 'all';
  const startDate = params.startDate || '';
  const endDate = params.endDate || '';
  const resourceId = params.resourceId || '';

  let data: ReservationListResponse | null = null;
  let resources: Array<{ id: string; name: string }> = [];
  let error: string | null = null;

  try {
    // Fetch active resources for filter dropdown
    resources = await db.resource.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    // Forward cookies for authentication
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const queryParams = new URLSearchParams({
      page,
      ...(search && { search }),
      ...(status && status !== 'all' && { status }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(resourceId && { resourceId }),
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/reservations?${queryParams}`,
      {
        cache: 'no-store',
        headers: { Cookie: cookieHeader },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch reservations');
    }

    data = await response.json();
  } catch (err) {
    console.error('Error loading reservations:', err);
    error = 'No se pudieron cargar las reservas. Por favor, recarga la página.';
  }

  // Three-state rendering: error
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reservas</h1>
          <p className="text-muted-foreground">Gestión de reservas del sistema</p>
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
        <h1 className="text-3xl font-bold">Reservas</h1>
        <p className="text-muted-foreground">
          {data.pagination.total} reservas registradas
        </p>
      </div>

      <ReservationTable
        reservations={data.reservations}
        pagination={data.pagination}
        initialSearch={search}
        initialStatus={status}
        initialStartDate={startDate}
        initialEndDate={endDate}
        initialResourceId={resourceId}
        resources={resources}
      />
    </div>
  );
}
