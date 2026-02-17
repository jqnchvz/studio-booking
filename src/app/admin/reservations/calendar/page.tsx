import { cookies } from 'next/headers';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReservationCalendar } from '@/components/features/admin/ReservationCalendar';
import { db } from '@/lib/db';
import type { ReservationListItem } from '@/types/admin';

/**
 * Admin Reservations Calendar Page
 *
 * Server component that fetches all reservations for a given month and
 * renders them in a monthly calendar grid via ReservationCalendar.
 *
 * Query params:
 * - month: 'YYYY-MM' (default: current month in Chile timezone)
 * - resourceId: string (optional resource filter)
 */
export default async function AdminReservationsCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const resourceId = params.resourceId || '';

  // Resolve the month to display, defaulting to current Chile month
  const month = params.month || getCurrentChileMonth();
  const [year, monthNum] = month.split('-').map(Number);

  // Date range: full calendar month in UTC (generous bounds cover Chile UTC-3/UTC-4 offset)
  const startDate = new Date(year, monthNum - 1, 1).toISOString();
  const endDate = new Date(year, monthNum, 0, 23, 59, 59).toISOString();

  let reservations: ReservationListItem[] = [];
  let resources: Array<{ id: string; name: string }> = [];
  let error: string | null = null;

  try {
    // Fetch resources directly (no need to go through API)
    resources = await db.resource.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    // Fetch reservations via API (respects admin auth, applies resource filter)
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const queryParams = new URLSearchParams({
      limit: '200', // Fetch all for the month (calendar shows all, no pagination)
      startDate,
      endDate,
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

    const data = await response.json();
    reservations = data.reservations;
  } catch (err) {
    console.error('Error loading calendar reservations:', err);
    error = 'No se pudieron cargar las reservas. Por favor, recarga la página.';
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reservas · Calendario</h1>
          <p className="text-muted-foreground">Vista mensual de reservas</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reservas · Calendario</h1>
        <p className="text-muted-foreground">
          {reservations.length} reservas en el mes
        </p>
      </div>

      <ReservationCalendar
        reservations={reservations}
        resources={resources}
        initialMonth={month}
        initialResourceId={resourceId}
      />
    </div>
  );
}

/**
 * Returns the current month as 'YYYY-MM' using Chile timezone.
 * Called server-side so we use Intl with a fixed locale format.
 */
function getCurrentChileMonth(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date());
}
