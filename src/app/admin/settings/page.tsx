import { cookies } from 'next/headers';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsPlansSection } from '@/components/features/admin/SettingsPlansSection';
import { SettingsResourcesSection } from '@/components/features/admin/SettingsResourcesSection';

/**
 * Admin Settings Page
 *
 * Server component that fetches subscription plans and studio resources in parallel,
 * then renders two management sections:
 * - Planes de Suscripción: view/toggle active status
 * - Recursos del Estudio: view availability schedule, toggle active status
 */
export default async function AdminSettingsPage() {
  let plans = null;
  let resources = null;
  let error: string | null = null;

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const headers = {
      cache: 'no-store' as const,
      headers: { Cookie: cookieHeader },
    };

    const [plansRes, resourcesRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/settings/plans`, headers),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/settings/resources`, headers),
    ]);

    if (!plansRes.ok || !resourcesRes.ok) {
      throw new Error('Failed to fetch settings data');
    }

    const [plansData, resourcesData] = await Promise.all([
      plansRes.json(),
      resourcesRes.json(),
    ]);

    plans = plansData.plans;
    resources = resourcesData.resources;
  } catch (err) {
    console.error('Error loading settings:', err);
    error = 'No se pudo cargar la configuración. Por favor, recarga la página.';
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Gestión de planes de suscripción y recursos del estudio
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Subscription Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Planes de Suscripción</CardTitle>
          <CardDescription>
            Administra los planes disponibles para los usuarios. Desactivar un plan impide nuevas
            suscripciones pero no afecta a suscriptores existentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plans ? (
            <SettingsPlansSection initialPlans={plans} />
          ) : !error ? (
            <div className="h-32 bg-muted rounded animate-pulse" />
          ) : null}
        </CardContent>
      </Card>

      {/* Studio Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos del Estudio</CardTitle>
          <CardDescription>
            Administra los recursos disponibles para reservas. Desactivar un recurso impide nuevas
            reservas pero no cancela las existentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resources ? (
            <SettingsResourcesSection initialResources={resources} />
          ) : !error ? (
            <div className="h-32 bg-muted rounded animate-pulse" />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
