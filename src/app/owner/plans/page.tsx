import { cookies } from 'next/headers';
import { PlansSection } from '@/components/features/owner/PlansSection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default async function OwnerPlansPage() {
  let plans = [];
  let error: string | null = null;

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/owner/plans`, {
      cache: 'no-store',
      headers: { Cookie: cookieHeader },
    });

    if (!response.ok) throw new Error('Failed to fetch plans');
    const data = await response.json();
    plans = data.plans;
  } catch (err) {
    console.error('Error loading plans:', err);
    error = 'No se pudo cargar la lista de planes. Por favor, recarga la página.';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Planes</h1>
        <p className="text-muted-foreground">
          Administra los planes de suscripción que ofreces a tus clientes
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PlansSection initialPlans={plans} />
    </div>
  );
}
