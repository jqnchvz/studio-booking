'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface SuspendSubscriptionModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * SuspendSubscriptionModal Component
 *
 * Form to manually suspend a user's subscription.
 * Requires a reason (10-500 chars) and optional end date.
 */
export function SuspendSubscriptionModal({
  userId,
  isOpen,
  onClose,
}: SuspendSubscriptionModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate reason length
    if (reason.length < 10 || reason.length > 500) {
      alert('El motivo debe tener entre 10 y 500 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suspend',
          reason,
          ...(endDate && { endDate: new Date(endDate).toISOString() }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to suspend subscription');
      }

      // Reload server component data and close modal
      router.refresh();
      onClose();
      setReason('');
      setEndDate('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al suspender suscripción');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Suspender Suscripción</DialogTitle>
            <DialogDescription>
              Indica el motivo de la suspensión y opcionalmente una fecha de finalización.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Reason textarea */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Motivo (10-500 caracteres)
                <span className="text-sm text-muted-foreground ml-2">
                  {reason.length}/500
                </span>
              </Label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                placeholder="Explica el motivo de la suspensión..."
                className="w-full min-h-[100px] border rounded-md px-3 py-2 text-sm bg-background"
                disabled={isLoading}
                required
                minLength={10}
                maxLength={500}
              />
            </div>

            {/* Optional end date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">
                Fecha de Finalización (opcional)
              </Label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Si no se especifica, la suspensión será inmediata
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                setReason('');
                setEndDate('');
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isLoading || reason.length < 10 || reason.length > 500}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suspendiendo...
                </>
              ) : (
                'Suspender Suscripción'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
