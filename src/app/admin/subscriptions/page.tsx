import { cookies } from 'next/headers';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SubscriptionTable } from '@/components/features/admin/SubscriptionTable';
import type { SubscriptionListResponse } from '@/types/admin';

/**
 * Admin Subscriptions List Page
 *
 * Server component that fetches paginated subscription data and passes
 * it to the SubscriptionTable client component.
 *
 * Query params:
 * - page: number
 * - search: string (user name/email)
 * - status: 'active' | 'pending' | 'suspended' | 'cancelled' | 'past_due'
 * - startDate, endDate: ISO date strings
 */
export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const page = params.page || '1';
  const search = params.search || '';
  const status = params.status || '';
  const startDate = params.startDate || '';
  const endDate = params.endDate || '';

  let data: SubscriptionListResponse | null = null;
  let error: string | null = null;

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const queryParams = new URLSearchParams({
      page,
      ...(search && { search }),
      ...(status && { status }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/subscriptions?${queryParams}`,
      {
        cache: 'no-store',
        headers: { Cookie: cookieHeader },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch subscriptions');

    data = await response.json();
  } catch (err) {
    console.error('Error loading subscriptions:', err);
    error =
      'No se pudieron cargar las suscripciones. Por favor, recarga la página.';
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suscripciones</h1>
          <p className="text-muted-foreground">
            Gestión de suscripciones del sistema
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Suscripciones</h1>
        <p className="text-muted-foreground">
          {data.pagination.total} suscripciones registradas
        </p>
      </div>

      <SubscriptionTable
        subscriptions={data.subscriptions}
        pagination={data.pagination}
        initialSearch={search}
        initialStatus={status}
        initialStartDate={startDate}
        initialEndDate={endDate}
      />
    </div>
  );
}
