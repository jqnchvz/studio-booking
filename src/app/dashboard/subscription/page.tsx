'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SubscriptionDetails } from '@/components/features/subscription/SubscriptionDetails';
import { PaymentHistory } from '@/components/features/subscription/PaymentHistory';
import { CancelSubscriptionModal } from '@/components/features/subscription/CancelSubscriptionModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Subscription {
  id: string;
  status: string;
  planPrice: number;
  nextBillingDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  gracePeriodEnd: string | null;
  cancelledAt: string | null;
  plan: {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: string;
    features: string[];
  };
  payments: Array<{
    id: string;
    amount: number;
    penaltyFee: number;
    totalAmount: number;
    status: string;
    dueDate: string;
    paidAt: string | null;
    createdAt: string;
  }>;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/subscriptions/current');
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            // No subscription found - redirect to subscribe page
            setError('no_subscription');
            return;
          }
          throw new Error(data.error || 'Failed to fetch subscription');
        }

        setSubscription(data.subscription);
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudo cargar la información de tu suscripción'
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel subscription');
      }

      // Update subscription state with cancelled status
      if (subscription) {
        setSubscription({
          ...subscription,
          status: 'cancelled',
          cancelledAt: data.subscription.cancelledAt,
        });
      }

      // Show success message
      setCancelSuccess(true);
      setShowCancelModal(false);

      // Hide success message after 5 seconds
      setTimeout(() => {
        setCancelSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      throw err; // Re-throw to let modal handle the error
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-16">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error === 'no_subscription') {
    return (
      <div className="container max-w-4xl py-16">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes una suscripción activa.{' '}
            <Link
              href="/dashboard/subscribe"
              className="font-medium underline underline-offset-4"
            >
              Suscríbete ahora
            </Link>{' '}
            para acceder a todas las funcionalidades.
          </AlertDescription>
        </Alert>
        <div className="mt-6 flex justify-center">
          <Button asChild>
            <Link href="/dashboard/subscribe">Ver Planes</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl py-16">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-6 flex justify-center">
          <Button onClick={() => router.refresh()} variant="outline">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Suscripción</h1>
          <p className="text-muted-foreground">
            Administra tu suscripción y revisa tu historial de pagos
          </p>
        </div>

        {/* Success Message */}
        {cancelSuccess && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              Suscripción cancelada exitosamente. Tu acceso continuará hasta el final
              del período actual.
            </AlertDescription>
          </Alert>
        )}

        {/* Subscription Details */}
        <SubscriptionDetails
          subscription={subscription}
          onCancelClick={handleCancelClick}
        />

        {/* Payment History */}
        <PaymentHistory payments={subscription.payments} />

        {/* Cancel Subscription Modal */}
        <CancelSubscriptionModal
          open={showCancelModal}
          onOpenChange={setShowCancelModal}
          planName={subscription.plan.name}
          currentPeriodEnd={subscription.currentPeriodEnd}
          onConfirm={handleConfirmCancel}
        />
      </div>
    </div>
  );
}
