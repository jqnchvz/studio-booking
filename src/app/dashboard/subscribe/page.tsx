'use client';

import { useEffect, useState } from 'react';
import { PlanCard, type SubscriptionPlan } from '@/components/features/subscription/PlanCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function SubscribePage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch('/api/subscription-plans');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch subscription plans');
        }

        setPlans(data.plans);
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Error al cargar los planes. Por favor, intenta nuevamente.'
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlans();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando planes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Elige tu plan</h1>
        <p className="text-muted-foreground text-lg">
          Selecciona el plan que mejor se adapte a tus necesidades
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto">
        {plans.map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isRecommended={index === 1} // Mark second plan (Pro) as recommended
          />
        ))}
      </div>

      {/* Footer note */}
      <div className="text-center text-sm text-muted-foreground max-w-2xl mx-auto">
        <p>
          Todos los planes incluyen acceso completo al sistema de reservas.
          Puedes cambiar o cancelar tu suscripción en cualquier momento.
        </p>
      </div>
    </div>
  );
}
