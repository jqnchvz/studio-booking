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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatChileanDate } from '@/lib/utils/format';
import { AlertCircle, Loader2 } from 'lucide-react';

interface CancelSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  currentPeriodEnd: string;
  onConfirm: () => Promise<void>;
}

export function CancelSubscriptionModal({
  open,
  onOpenChange,
  planName,
  currentPeriodEnd,
  onConfirm,
}: CancelSubscriptionModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!confirmed) {
      setError('Debes confirmar que entiendes las consecuencias');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await onConfirm();
      // Don't close modal here - let parent handle success and close
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo cancelar la suscripción. Por favor, intenta nuevamente.'
      );
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setConfirmed(false);
      setError(null);
      onOpenChange(false);
    }
  };

  const accessEndDate = formatChileanDate(new Date(currentPeriodEnd));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            ¿Cancelar Suscripción?
          </DialogTitle>
          <DialogDescription>
            Estás a punto de cancelar tu suscripción <strong>{planName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Consequences Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Qué significa esto:</p>
              <ul className="space-y-1 text-sm">
                <li>• Perderás acceso después del <strong>{accessEndDate}</strong></li>
                <li>• No se procesarán más cobros automáticos</li>
                <li>• No hay reembolsos por el período actual</li>
                <li>• Puedes reactivar tu suscripción en cualquier momento</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => {
                setConfirmed(checked === true);
                if (error) setError(null);
              }}
              disabled={isLoading}
            />
            <label
              htmlFor="confirm"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Entiendo que perderé acceso después del {accessEndDate} y que no recibiré
              reembolsos
            </label>
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
            Mantener Suscripción
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={!confirmed || isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              'Cancelar Suscripción'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
