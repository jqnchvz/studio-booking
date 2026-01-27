'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCLP, formatChileanDate } from '@/lib/utils/format';
import { AlertCircle, Loader2, ArrowUp, ArrowDown, Info } from 'lucide-react';

interface ChangePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: {
    id: string;
    name: string;
    price: number;
  };
  newPlan: {
    id: string;
    name: string;
    description: string;
    price: number;
    features: string[];
  };
  currentPeriodEnd: string;
  nextBillingDate: string;
  onConfirm: (newPlanId: string) => Promise<void>;
}

export function ChangePlanModal({
  open,
  onOpenChange,
  currentPlan,
  newPlan,
  currentPeriodEnd,
  nextBillingDate,
  onConfirm,
}: ChangePlanModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUpgrade = newPlan.price > currentPlan.price;
  const priceDifference = Math.abs(newPlan.price - currentPlan.price);

  // Calculate pro-rated amount for upgrades (rough estimate for UI)
  const now = new Date();
  const periodEnd = new Date(currentPeriodEnd);
  const daysRemaining = Math.max(
    0,
    Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );
  const daysInMonth = 30; // Approximate
  const proRatedAmount = Math.round((priceDifference * daysRemaining) / daysInMonth);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onConfirm(newPlan.id);
    } catch (err) {
      console.error('Error changing plan:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo cambiar el plan. Por favor, intenta nuevamente.'
      );
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isUpgrade ? (
              <>
                <ArrowUp className="w-5 h-5 text-green-600" />
                Mejorar Plan
              </>
            ) : (
              <>
                <ArrowDown className="w-5 h-5 text-blue-600" />
                Cambiar Plan
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Estás cambiando de <strong>{currentPlan.name}</strong> a{' '}
            <strong>{newPlan.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Plan Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Current Plan */}
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground mb-1">Plan Actual</p>
              <p className="text-lg font-semibold">{currentPlan.name}</p>
              <p className="text-xl font-bold">{formatCLP(currentPlan.price)}/mes</p>
            </div>

            {/* New Plan */}
            <div className="p-4 border-2 rounded-lg border-primary bg-primary/5">
              <p className="text-sm font-medium text-primary mb-1">Nuevo Plan</p>
              <p className="text-lg font-semibold">{newPlan.name}</p>
              <p className="text-xl font-bold">{formatCLP(newPlan.price)}/mes</p>
            </div>
          </div>

          {/* Price Difference & Billing Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">
                {isUpgrade ? 'Cobro inmediato' : 'Cambio programado'}
              </p>
              {isUpgrade ? (
                <ul className="space-y-1 text-sm">
                  <li>
                    • Diferencia de precio: <strong>{formatCLP(priceDifference)}/mes</strong>
                  </li>
                  <li>
                    • Cobro prorrateado ahora:{' '}
                    <strong className="text-green-600">{formatCLP(proRatedAmount)}</strong>
                  </li>
                  <li>• Tu plan cambiará inmediatamente</li>
                  <li>
                    • Próximo cobro completo: {formatChileanDate(new Date(nextBillingDate))}
                  </li>
                </ul>
              ) : (
                <ul className="space-y-1 text-sm">
                  <li>
                    • Ahorro: <strong>{formatCLP(priceDifference)}/mes</strong>
                  </li>
                  <li>
                    • Sin cobro adicional
                  </li>
                  <li>
                    • Cambio efectivo desde:{' '}
                    <strong>{formatChileanDate(new Date(nextBillingDate))}</strong>
                  </li>
                  <li>• Mantendrás tu plan actual hasta entonces</li>
                </ul>
              )}
            </AlertDescription>
          </Alert>

          {/* New Plan Features */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Incluye en {newPlan.name}:</p>
            <ul className="space-y-1.5">
              {newPlan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            variant={isUpgrade ? 'default' : 'secondary'}
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : isUpgrade ? (
              `Mejorar por ${formatCLP(proRatedAmount)}`
            ) : (
              'Confirmar Cambio'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
