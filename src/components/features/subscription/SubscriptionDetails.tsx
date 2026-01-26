'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCLP, formatChileanDate } from '@/lib/utils/format';
import { Calendar, CreditCard, AlertCircle } from 'lucide-react';

interface SubscriptionDetailsProps {
  subscription: {
    id: string;
    status: string;
    planPrice: number;
    nextBillingDate: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    gracePeriodEnd: string | null;
    cancelledAt: string | null;
    plan: {
      name: string;
      description: string;
      interval: string;
      features: string[];
    };
  };
  onCancelClick?: () => void;
}

const STATUS_CONFIG = {
  active: {
    label: 'Activa',
    variant: 'default' as const,
    description: 'Tu suscripción está activa y al día',
  },
  past_due: {
    label: 'Vencida',
    variant: 'destructive' as const,
    description: 'Pago pendiente - Actualiza tu método de pago',
  },
  suspended: {
    label: 'Suspendida',
    variant: 'destructive' as const,
    description: 'Suscripción suspendida por falta de pago',
  },
  cancelled: {
    label: 'Cancelada',
    variant: 'secondary' as const,
    description: 'Suscripción cancelada - Acceso hasta el final del período',
  },
  pending: {
    label: 'Pendiente',
    variant: 'outline' as const,
    description: 'Pago en proceso de verificación',
  },
};

export function SubscriptionDetails({
  subscription,
  onCancelClick,
}: SubscriptionDetailsProps) {
  const statusConfig =
    STATUS_CONFIG[subscription.status as keyof typeof STATUS_CONFIG] ||
    STATUS_CONFIG.pending;

  const showCancelButton =
    subscription.status === 'active' && !subscription.cancelledAt;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{subscription.plan.name}</CardTitle>
            <CardDescription>{subscription.plan.description}</CardDescription>
          </div>
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Description */}
        {(subscription.status === 'past_due' ||
          subscription.status === 'suspended') && (
          <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{statusConfig.description}</p>
          </div>
        )}

        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">
              {formatCLP(subscription.planPrice)}
            </span>
            <span className="text-muted-foreground">
              /{subscription.plan.interval === 'monthly' ? 'mes' : 'año'}
            </span>
          </div>
        </div>

        {/* Billing Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Calendar className="w-5 h-5 text-primary shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Próximo cobro</p>
              <p className="text-sm text-muted-foreground">
                {formatChileanDate(new Date(subscription.nextBillingDate))}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <CreditCard className="w-5 h-5 text-primary shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Período actual</p>
              <p className="text-sm text-muted-foreground">
                {formatChileanDate(new Date(subscription.currentPeriodStart))} -{' '}
                {formatChileanDate(new Date(subscription.currentPeriodEnd))}
              </p>
            </div>
          </div>

          {subscription.cancelledAt && (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Cancelación programada
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Tu acceso continuará hasta el{' '}
                  {formatChileanDate(new Date(subscription.currentPeriodEnd))}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="space-y-3 pt-4 border-t">
          <p className="text-sm font-medium">Incluye:</p>
          <ul className="space-y-2">
            {subscription.plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-primary">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cancel Button */}
        {showCancelButton && onCancelClick && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={onCancelClick}
            >
              Cancelar Suscripción
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
