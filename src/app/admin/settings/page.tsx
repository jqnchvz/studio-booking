import { cookies } from 'next/headers';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlatformSettingsSection } from '@/components/features/admin/PlatformSettingsSection';
import { PlatformPlansSection } from '@/components/features/admin/PlatformPlansSection';

/**
 * Admin Settings Page
 *
 * Server component that fetches platform settings and platform plans in parallel,
 * then renders two management sections:
 * - Configuración General: singleton platform settings form
 * - Planes de Plataforma: CRUD table for platform plans
 */
export default async function AdminSettingsPage() {
  let settings = null;
  let plans = null;
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

    const [settingsRes, plansRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/settings/platform`, headers),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/settings/platform-plans`, headers),
    ]);

    if (!settingsRes.ok || !plansRes.ok) {
      throw new Error('Failed to fetch settings data');
    }

    const [settingsData, plansData] = await Promise.all([
      settingsRes.json(),
      plansRes.json(),
    ]);

    settings = settingsData.settings;
    plans = plansData.plans;
  } catch (err) {
    console.error('Error loading settings:', err);
    error = 'No se pudo cargar la configuración. Por favor, recarga la página.';
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Configuración general de la plataforma y planes para dueños de negocio
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Platform Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración General</CardTitle>
          <CardDescription>
            Ajustes generales de la plataforma que afectan a todas las empresas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings ? (
            <PlatformSettingsSection initialSettings={settings} />
          ) : !error ? (
            <div className="h-32 bg-muted rounded animate-pulse" />
          ) : null}
        </CardContent>
      </Card>

      {/* Platform Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Planes de Plataforma</CardTitle>
          <CardDescription>
            Administra los planes disponibles para dueños de negocio. Desactivar un plan
            impide nuevas suscripciones pero no afecta a empresas existentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plans ? (
            <PlatformPlansSection initialPlans={plans} />
          ) : !error ? (
            <div className="h-32 bg-muted rounded animate-pulse" />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
