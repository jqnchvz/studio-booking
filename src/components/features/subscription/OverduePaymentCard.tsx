'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CreditCard, Loader2 } from 'lucide-react';
import { formatCLP } from '@/lib/utils/format';

interface OverduePayment {
  id: string;
  amount: number;
  penaltyFee: number;
  totalAmount: number;
  dueDate: string;
}

interface OverduePaymentCardProps {
  payment: OverduePayment;
  gracePeriodEnd: string | null;
}

export function OverduePaymentCard({ payment, gracePeriodEnd }: OverduePaymentCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayNow = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/subscriptions/pay-overdue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId: payment.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al procesar el pago');
      }

      // Redirect to MercadoPago checkout
      if (data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        throw new Error('No se recibio la URL de pago');
      }
    } catch (err) {
      console.error('Error initiating payment:', err);
      setError(err instanceof Error ? err.message : 'Error al iniciar el pago');
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="border-2 border-destructive">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">Pago Vencido</CardTitle>
        </div>
        <CardDescription>
          Tu pago esta vencido desde el {formatDate(payment.dueDate)}. Por favor, realiza el pago
          para continuar usando el servicio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Breakdown */}
        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monto base</span>
            <span>{formatCLP(payment.amount)}</span>
          </div>
          {payment.penaltyFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-destructive">Recargo por mora</span>
              <span className="text-destructive">+{formatCLP(payment.penaltyFee)}</span>
            </div>
          )}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span>Total a pagar</span>
              <span className="text-lg">{formatCLP(payment.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Grace Period Warning */}
        {gracePeriodEnd && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Tienes hasta el {formatDateTime(gracePeriodEnd)} para realizar el pago.
              Despues de esa fecha, tu cuenta sera suspendida.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Pay Button */}
        <Button
          onClick={handlePayNow}
          disabled={isLoading}
          size="lg"
          className="w-full"
          variant="destructive"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pagar Ahora - {formatCLP(payment.totalAmount)}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Seras redirigido a MercadoPago para completar el pago de forma segura.
        </p>
      </CardContent>
    </Card>
  );
}
