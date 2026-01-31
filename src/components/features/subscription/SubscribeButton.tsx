'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface SubscribeButtonProps {
  planId: string;
  planName: string;
}

export function SubscribeButton({ planId, planName }: SubscribeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call API to create MercadoPago preference
      const response = await fetch('/api/subscriptions/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create subscription');
      }

      // Redirect to MercadoPago checkout
      if (data.data?.initPoint) {
        window.location.href = data.data.initPoint;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Subscribe error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Error al procesar la suscripción. Por favor, intenta nuevamente.'
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      <Button
        onClick={handleSubscribe}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Procesando...
          </>
        ) : (
          `Suscribirse a ${planName}`
        )}
      </Button>

      {error && (
        <Alert variant="destructive">
          <p className="text-sm">{error}</p>
        </Alert>
      )}
    </div>
  );
}
