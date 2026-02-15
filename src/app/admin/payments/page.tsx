import { cookies } from 'next/headers';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PaymentTable } from '@/components/features/admin/PaymentTable';
import type { PaymentListResponse } from '@/types/admin';

/**
 * Admin Payments List Page
 *
 * Server component that fetches paginated payment data and passes to PaymentTable.
 * Supports search, filtering, and pagination via URL query params.
 *
 * Query params:
 * - page: number
 * - search: string (user name/email)
 * - status: 'all' | 'pending' | 'approved' | 'rejected' | 'refunded'
 * - startDate: ISO date string
 * - endDate: ISO date string
 */
export default async function AdminPaymentsPage({
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

  let data: PaymentListResponse | null = null;
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
      ...(status && status !== 'all' && { status }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/payments?${queryParams}`,
      {
        cache: 'no-store',
        headers: { Cookie: cookieHeader },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch payments');
    }

    data = await response.json();
  } catch (err) {
    console.error('Error loading payments:', err);
    error = 'No se pudieron cargar los pagos. Por favor, recarga la página.';
  }

  // Three-state rendering: error
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pagos</h1>
          <p className="text-muted-foreground">Historial de pagos del sistema</p>
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
        <h1 className="text-3xl font-bold">Pagos</h1>
        <p className="text-muted-foreground">
          {data.pagination.total} pagos registrados
        </p>
      </div>

      <PaymentTable
        payments={data.payments}
        pagination={data.pagination}
        initialSearch={search}
        initialStatus={status}
        initialStartDate={startDate}
        initialEndDate={endDate}
      />
    </div>
  );
}
