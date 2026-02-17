import Link from 'next/link';
import { cookies } from 'next/headers';
import { AlertCircle, List, CalendarDays } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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

  /** Shared view-toggle bar rendered in all states */
  const viewToggle = (
    <div className="flex gap-1 border rounded-md p-1 w-fit">
      <Button size="sm" className="flex items-center gap-1.5" disabled>
        <List className="h-4 w-4" />
        Tabla
      </Button>
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="flex items-center gap-1.5"
      >
        <Link href="/admin/reservations/calendar">
          <CalendarDays className="h-4 w-4" />
          Calendario
        </Link>
      </Button>
    </div>
  );

  // Three-state rendering: error
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Reservas</h1>
            <p className="text-muted-foreground">Gestión de reservas del sistema</p>
          </div>
          {viewToggle}
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reservas</h1>
          <p className="text-muted-foreground">
            {data.pagination.total} reservas registradas
          </p>
        </div>
        {viewToggle}
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
