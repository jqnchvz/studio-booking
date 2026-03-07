import { cookies } from 'next/headers';
import { ClientsTable, type ClientRow } from '@/components/features/owner/ClientsTable';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default async function OwnerClientsPage() {
  let clients: ClientRow[] = [];
  let error: string | null = null;

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/owner/clients`,
      {
        cache: 'no-store',
        headers: { Cookie: cookieHeader },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch clients');
    clients = await response.json();
  } catch (err) {
    console.error('Error loading clients:', err);
    error = 'No se pudo cargar la lista de clientes. Por favor, recarga la página.';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">
          Usuarios suscritos a los planes de tu organización
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ClientsTable clients={clients} />
    </div>
  );
}
