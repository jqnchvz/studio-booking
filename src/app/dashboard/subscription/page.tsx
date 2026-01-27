'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SubscriptionDetails } from '@/components/features/subscription/SubscriptionDetails';
import { PaymentHistory } from '@/components/features/subscription/PaymentHistory';
import { CancelSubscriptionModal } from '@/components/features/subscription/CancelSubscriptionModal';
import { ChangePlanModal } from '@/components/features/subscription/ChangePlanModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatCLP } from '@/lib/utils/format';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
}

interface Subscription {
  id: string;
  status: string;
  planPrice: number;
  nextBillingDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  gracePeriodEnd: string | null;
  cancelledAt: string | null;
  plan: Plan;
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
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState<Plan | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [changePlanSuccess, setChangePlanSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch subscription
        const subResponse = await fetch('/api/subscriptions/current');
        const subData = await subResponse.json();

        if (!subResponse.ok) {
          if (subResponse.status === 404) {
            setError('no_subscription');
            return;
          }
          throw new Error(subData.error || 'Failed to fetch subscription');
        }

        setSubscription(subData.subscription);

        // Fetch available plans
        const plansResponse = await fetch('/api/subscription-plans');
        if (plansResponse.ok) {
          const plansData = await plansResponse.json();
          setAvailablePlans(plansData.plans || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudo cargar la información de tu suscripción'
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
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

  const handleChangePlanClick = (plan: Plan) => {
    setSelectedNewPlan(plan);
    setShowChangePlanModal(true);
  };

  const handleConfirmChangePlan = async (newPlanId: string) => {
    try {
      const response = await fetch('/api/subscriptions/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPlanId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change plan');
      }

      // Update subscription state with new plan
      if (subscription && data.subscription) {
        setSubscription({
          ...subscription,
          planPrice: data.subscription.planPrice,
          plan: {
            ...subscription.plan,
            id: data.subscription.planId,
            name: data.subscription.planName,
            price: data.subscription.planPrice,
          },
        });
      }

      // Show success message
      setChangePlanSuccess(true);
      setShowChangePlanModal(false);

      // Hide success message after 5 seconds
      setTimeout(() => {
        setChangePlanSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error changing plan:', err);
      throw err; // Re-throw to let modal handle the error
    }
  };

  // Filter out current plan from available plans
  const otherPlans = availablePlans.filter(
    (plan) => subscription && plan.id !== subscription.plan.id
  );

  // Show change plan section only for active subscriptions
  const canChangePlan =
    subscription && (subscription.status === 'active' || subscription.status === 'past_due');

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

        {/* Success Messages */}
        {cancelSuccess && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              Suscripción cancelada exitosamente. Tu acceso continuará hasta el final
              del período actual.
            </AlertDescription>
          </Alert>
        )}

        {changePlanSuccess && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              Plan cambiado exitosamente.
            </AlertDescription>
          </Alert>
        )}

        {/* Subscription Details */}
        <SubscriptionDetails
          subscription={subscription}
          onCancelClick={handleCancelClick}
        />

        {/* Change Plan Section */}
        {canChangePlan && otherPlans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Plan</CardTitle>
              <CardDescription>
                Cambia a un plan diferente según tus necesidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {otherPlans.map((plan) => {
                  const isUpgrade = plan.price > subscription.planPrice;
                  return (
                    <div
                      key={plan.id}
                      className="p-4 border rounded-lg hover:border-primary transition-colors"
                    >
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg">{plan.name}</h3>
                          <p className="text-sm text-muted-foreground">{plan.description}</p>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold">{formatCLP(plan.price)}</span>
                          <span className="text-muted-foreground">/mes</span>
                        </div>
                        <ul className="space-y-1 text-sm">
                          {plan.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-primary">✓</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                          {plan.features.length > 3 && (
                            <li className="text-muted-foreground">
                              +{plan.features.length - 3} más...
                            </li>
                          )}
                        </ul>
                        <Button
                          onClick={() => handleChangePlanClick(plan)}
                          variant={isUpgrade ? 'default' : 'outline'}
                          className="w-full"
                        >
                          {isUpgrade ? 'Mejorar' : 'Cambiar'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Change Plan Modal */}
        {selectedNewPlan && (
          <ChangePlanModal
            open={showChangePlanModal}
            onOpenChange={setShowChangePlanModal}
            currentPlan={subscription.plan}
            newPlan={selectedNewPlan}
            currentPeriodEnd={subscription.currentPeriodEnd}
            nextBillingDate={subscription.nextBillingDate}
            onConfirm={handleConfirmChangePlan}
          />
        )}
      </div>
    </div>
  );
}
