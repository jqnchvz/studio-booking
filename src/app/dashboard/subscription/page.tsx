'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SubscriptionDetails } from '@/components/features/subscription/SubscriptionDetails';
import { PaymentHistory } from '@/components/features/subscription/PaymentHistory';
import { CancelSubscriptionModal } from '@/components/features/subscription/CancelSubscriptionModal';
import { ChangePlanModal } from '@/components/features/subscription/ChangePlanModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';
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
  metadata: {
    scheduledPlanChange?: {
      newPlanId: string;
      newPlanName: string;
      newPlanPrice: number;
      effectiveDate: string;
    };
    appliedPlanChange?: {
      previousPlanName: string;
      previousPlanPrice: number;
      newPlanName: string;
      newPlanPrice: number;
      effectiveDate: string;
    };
  } | null;
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
  const [changePlanSuccess, setChangePlanSuccess] = useState<string | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);

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

        let currentSubscription = subData.subscription;

        // If subscription is pending, verify status with MercadoPago
        if (currentSubscription.status === 'pending') {
          try {
            const verifyResponse = await fetch('/api/subscriptions/verify-status', {
              method: 'POST',
            });
            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              if (verifyData.subscription?.changed) {
                // Re-fetch to get updated subscription with all relations
                const refreshResponse = await fetch('/api/subscriptions/current');
                if (refreshResponse.ok) {
                  const refreshData = await refreshResponse.json();
                  currentSubscription = refreshData.subscription;
                }
              }
            }
          } catch (verifyErr) {
            console.error('Error verifying subscription status:', verifyErr);
            // Non-critical: continue showing current status
          }
        }

        setSubscription(currentSubscription);

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

      // Handle upgrade vs downgrade
      if (data.upgrade?.appliedImmediately) {
        // Upgrade: update UI immediately with new plan + metadata banner
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
            metadata: {
              appliedPlanChange: {
                previousPlanName: subscription.plan.name,
                previousPlanPrice: subscription.planPrice,
                newPlanName: data.subscription.planName,
                newPlanPrice: data.subscription.planPrice,
                effectiveDate: subscription.nextBillingDate,
              },
            },
          });
        }
        setChangePlanSuccess(`Plan mejorado a ${data.subscription.planName} exitosamente.`);
      } else if (data.downgrade) {
        // Downgrade: update metadata so the blue banner shows immediately
        if (subscription) {
          setSubscription({
            ...subscription,
            metadata: {
              scheduledPlanChange: {
                newPlanId: data.downgrade.newPlanId || '',
                newPlanName: data.downgrade.newPlanName,
                newPlanPrice: data.downgrade.newPlanPrice,
                effectiveDate: data.downgrade.effectiveDate,
              },
            },
          });
        }
        const effectiveDate = new Date(data.downgrade.effectiveDate);
        const formattedDate = effectiveDate.toLocaleDateString('es-CL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        setChangePlanSuccess(
          `Tu cambio al ${data.downgrade.newPlanName} se aplicará el ${formattedDate}, al inicio del próximo ciclo de facturación.`
        );
      } else {
        setChangePlanSuccess('Plan cambiado exitosamente.');
      }

      setShowChangePlanModal(false);

      // Hide success message after 8 seconds (longer for downgrade info)
      setTimeout(() => {
        setChangePlanSuccess(null);
      }, 8000);
    } catch (err) {
      console.error('Error changing plan:', err);
      throw err; // Re-throw to let modal handle the error
    }
  };

  const handleReactivateClick = async (planId?: string) => {
    try {
      setIsReactivating(true);

      const response = await fetch('/api/subscriptions/reactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPlanId: planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reactivate subscription');
      }

      // Redirect to MercadoPago checkout
      if (data.data?.initPoint) {
        window.location.href = data.data.initPoint;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (err) {
      console.error('Error reactivating subscription:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo reactivar la suscripción. Por favor, intenta nuevamente.'
      );
      setIsReactivating(false);
    }
  };

  // Filter out current plan from available plans
  const otherPlans = availablePlans.filter(
    (plan) => subscription && plan.id !== subscription.plan.id
  );

  // Show change plan section only for active subscriptions
  const canChangePlan =
    subscription && (subscription.status === 'active' || subscription.status === 'past_due');

  // Show reactivate section for cancelled/suspended subscriptions
  const canReactivate =
    subscription && (subscription.status === 'cancelled' || subscription.status === 'suspended');

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error === 'no_subscription') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
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
      <div className="mx-auto max-w-4xl px-6 py-16">
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
    <div className="mx-auto max-w-4xl px-6 py-8">
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
              {changePlanSuccess}
            </AlertDescription>
          </Alert>
        )}

        {/* Reactivate Subscription Section - for cancelled/suspended */}
        {canReactivate ? (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Reactivar Suscripción
              </CardTitle>
              <CardDescription>
                {subscription.status === 'cancelled'
                  ? 'Tu suscripción fue cancelada. Puedes reactivarla en cualquier momento.'
                  : 'Tu suscripción está suspendida. Reactívala para continuar disfrutando de nuestros servicios.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan Info */}
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Plan Anterior
                </p>
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{subscription.plan.name}</p>
                  <p className="text-2xl font-bold">{formatCLP(subscription.planPrice)}/mes</p>
                </div>
              </div>

              {/* Reactivate with Same Plan */}
              <div className="space-y-3">
                <Button
                  onClick={() => handleReactivateClick()}
                  disabled={isReactivating}
                  size="lg"
                  className="w-full"
                >
                  {isReactivating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reactivar con {subscription.plan.name}
                    </>
                  )}
                </Button>
                <p className="text-sm text-center text-muted-foreground">
                  o elige un plan diferente
                </p>
              </div>

              {/* Other Plans for Reactivation */}
              {availablePlans.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Otros Planes Disponibles</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {availablePlans
                      .filter((plan) => plan.id !== subscription.plan.id)
                      .map((plan) => (
                        <div
                          key={plan.id}
                          className="p-4 border rounded-lg hover:border-primary transition-colors"
                        >
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold text-lg">{plan.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {plan.description}
                              </p>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold">
                                {formatCLP(plan.price)}
                              </span>
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
                              onClick={() => handleReactivateClick(plan.id)}
                              disabled={isReactivating}
                              variant="outline"
                              className="w-full"
                            >
                              Reactivar con este plan
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Info Alert */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Al reactivar, serás redirigido a MercadoPago para completar el pago. Tu
                  suscripción se activará una vez confirmado el pago.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Subscription Details - for active/past_due */}
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
                              <p className="text-sm text-muted-foreground">
                                {plan.description}
                              </p>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold">
                                {formatCLP(plan.price)}
                              </span>
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
          </>
        )}

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
