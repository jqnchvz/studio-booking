import { cookies } from 'next/headers';
import { PaymentsTable, type PaymentRow } from '@/components/features/owner/PaymentsTable';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default async function OwnerPaymentsPage() {
  let payments: PaymentRow[] = [];
  let error: string | null = null;

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/owner/payments`,
      {
        cache: 'no-store',
        headers: { Cookie: cookieHeader },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch payments');
    payments = await response.json();
  } catch (err) {
    console.error('Error loading payments:', err);
    error = 'No se pudo cargar el historial de pagos. Por favor, recarga la página.';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pagos</h1>
        <p className="text-muted-foreground">
          Historial de pagos recibidos por tu organización
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PaymentsTable payments={payments} />
    </div>
  );
}
