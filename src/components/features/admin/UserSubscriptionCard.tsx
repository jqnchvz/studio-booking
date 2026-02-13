'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCLP, formatChileanDate } from '@/lib/utils/format';
import { ActivateSubscriptionModal } from './ActivateSubscriptionModal';
import { SuspendSubscriptionModal } from './SuspendSubscriptionModal';
import type { UserDetail } from '@/types/admin';

interface UserSubscriptionCardProps {
  userId: string;
  subscription: UserDetail['subscription'];
}

/**
 * UserSubscriptionCard Component
 *
 * Displays current subscription details and provides actions:
 * - Activate subscription (if no active subscription)
 * - Suspend subscription (if active subscription exists)
 *
 * Opens modal forms for each action.
 */
export function UserSubscriptionCard({ userId, subscription }: UserSubscriptionCardProps) {
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);

  // No subscription case
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Suscripción</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Este usuario no tiene suscripción activa.
          </p>
          <Button onClick={() => setShowActivateModal(true)}>
            Activar Suscripción Manualmente
          </Button>

          <ActivateSubscriptionModal
            userId={userId}
            isOpen={showActivateModal}
            onClose={() => setShowActivateModal(false)}
          />
        </CardContent>
      </Card>
    );
  }

  // Has subscription case
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Suscripción</CardTitle>
        <Badge
          variant={subscription.status === 'active' ? 'default' : 'secondary'}
        >
          {subscription.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subscription details grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="font-medium">{subscription.planName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Precio</p>
            <p className="font-medium">{formatCLP(subscription.planPrice)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Período actual</p>
            <p className="font-medium text-sm">
              {formatChileanDate(new Date(subscription.currentPeriodStart))} -{' '}
              {formatChileanDate(new Date(subscription.currentPeriodEnd))}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Próxima facturación</p>
            <p className="font-medium">
              {formatChileanDate(new Date(subscription.nextBillingDate))}
            </p>
          </div>
        </div>

        {/* Actions */}
        {subscription.status === 'active' && (
          <Button
            variant="destructive"
            onClick={() => setShowSuspendModal(true)}
          >
            Suspender Suscripción
          </Button>
        )}

        {subscription.status !== 'active' && (
          <Button onClick={() => setShowActivateModal(true)}>
            Reactivar Suscripción
          </Button>
        )}

        {/* Modals */}
        <ActivateSubscriptionModal
          userId={userId}
          isOpen={showActivateModal}
          onClose={() => setShowActivateModal(false)}
        />
        <SuspendSubscriptionModal
          userId={userId}
          isOpen={showSuspendModal}
          onClose={() => setShowSuspendModal(false)}
        />
      </CardContent>
    </Card>
  );
}
