import { cookies } from 'next/headers';
import {
  SubscriptionsTable,
  type SubscriptionRow,
} from '@/components/features/owner/SubscriptionsTable';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';

export default async function OwnerSubscriptionsPage() {
  let subscriptions: SubscriptionRow[] = [];
  let truncated = false;
  let error: string | null = null;

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/owner/subscriptions?take=200`,
      {
        cache: 'no-store',
        headers: { Cookie: cookieHeader },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch subscriptions');
    const json = await response.json();
    subscriptions = json.data;
    truncated = json.nextCursor !== null;
  } catch (err) {
    console.error('Error loading subscriptions:', err);
    error = 'No se pudo cargar la lista de suscripciones. Por favor, recarga la página.';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Suscripciones</h1>
        <p className="text-muted-foreground">
          Clientes suscritos a los planes de tu organización
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {truncated && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>Mostrando los últimos 200 registros.</AlertDescription>
        </Alert>
      )}

      <SubscriptionsTable subscriptions={subscriptions} />
    </div>
  );
}
