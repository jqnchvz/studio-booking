'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubscriptionStatusActionsProps {
  subscriptionId: string;
  currentStatus: string;
}

/**
 * SubscriptionStatusActions Component
 *
 * Inline action buttons for admin subscription status overrides.
 * Calls PATCH /api/admin/subscriptions/[id] and refreshes the page.
 *
 * Shows contextual actions based on current status:
 * - active → Suspend, Cancel
 * - suspended → Activate, Cancel
 * - cancelled/other → Activate
 */
export function SubscriptionStatusActions({
  subscriptionId,
  currentStatus,
}: SubscriptionStatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (newStatus: string) => {
    setLoading(newStatus);
    try {
      const response = await fetch(
        `/api/admin/subscriptions/${subscriptionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar suscripción');
      }

      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {currentStatus !== 'active' && (
        <Button
          onClick={() => handleAction('active')}
          disabled={loading !== null}
        >
          {loading === 'active' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Activar
        </Button>
      )}

      {currentStatus === 'active' && (
        <Button
          variant="outline"
          onClick={() => handleAction('suspended')}
          disabled={loading !== null}
        >
          {loading === 'suspended' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Suspender
        </Button>
      )}

      {currentStatus !== 'cancelled' && (
        <Button
          variant="destructive"
          onClick={() => {
            if (
              confirm(
                '¿Estás seguro de que quieres cancelar esta suscripción? Esta acción no se puede deshacer fácilmente.'
              )
            ) {
              handleAction('cancelled');
            }
          }}
          disabled={loading !== null}
        >
          {loading === 'cancelled' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Cancelar
        </Button>
      )}
    </div>
  );
}
