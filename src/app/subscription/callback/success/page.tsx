'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { formatCLP, formatChileanDate } from '@/lib/utils/format';

interface Subscription {
  plan: {
    name: string;
    price: number;
  };
  nextBillingDate: string;
  status: string;
}

export default function SuccessPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/subscriptions/current');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch subscription');
        }

        setSubscription(data.subscription);
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudo cargar la información de la suscripción'
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();

    // Auto-redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Card className="border-green-200 shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl">¡Pago Exitoso!</CardTitle>
          <CardDescription className="text-base">
            Tu suscripción ha sido activada correctamente
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : subscription ? (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-lg">Detalles de tu suscripción:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-medium">{subscription.plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto pagado:</span>
                  <span className="font-medium">{formatCLP(subscription.plan.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Próximo cobro:</span>
                  <span className="font-medium">
                    {formatChileanDate(new Date(subscription.nextBillingDate))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado:</span>
                  <span className="font-medium capitalize">{subscription.status}</span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full"
              size="lg"
            >
              Ir al Dashboard
            </Button>
            <Button
              onClick={() => router.push('/dashboard/subscription')}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Ver Mi Suscripción
            </Button>
          </div>

          <p className="text-sm text-center text-muted-foreground">
            Serás redirigido automáticamente en 5 segundos...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
