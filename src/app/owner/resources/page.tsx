import { cookies } from 'next/headers';
import { ResourcesSection } from '@/components/features/owner/ResourcesSection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default async function OwnerResourcesPage() {
  let resources = [];
  let error: string | null = null;

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/owner/resources`,
      {
        cache: 'no-store',
        headers: { Cookie: cookieHeader },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch resources');
    const data = await response.json();
    resources = data.resources;
  } catch (err) {
    console.error('Error loading resources:', err);
    error = 'No se pudo cargar la lista de recursos. Por favor, recarga la página.';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Recursos</h1>
        <p className="text-muted-foreground">
          Administra los espacios y equipos que tus clientes pueden reservar
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ResourcesSection initialResources={resources} />
    </div>
  );
}
