import { cookies } from 'next/headers';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TenantsTable } from '@/components/features/admin/TenantsTable';
import type { TenantListItem } from '@/components/features/admin/TenantsTable';

/**
 * Admin Tenants Page — /admin/tenants
 *
 * Server Component that fetches all organizations and renders
 * the interactive TenantsTable (client component handles filtering).
 */
export default async function AdminTenantsPage() {
  let tenants: TenantListItem[] = [];
  let error: string | null = null;

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/organizations`,
      {
        cache: 'no-store',
        headers: { Cookie: cookieHeader },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch organizations');

    const data = await response.json();
    tenants = data.organizations ?? [];
  } catch (err) {
    console.error('Error loading tenants:', err);
    error = 'No se pudieron cargar las empresas. Por favor, recarga la página.';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Empresas</h1>
        <p className="text-muted-foreground">
          Organizaciones registradas en la plataforma
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <TenantsTable tenants={tenants} />
      )}
    </div>
  );
}
