'use client';

import { useState, useEffect } from 'react';
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

interface ActivateSubscriptionModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ActivateSubscriptionModal Component
 *
 * Form to manually activate a subscription for a user.
 * Fetches available plans and allows admin to select plan and start date.
 */
export function ActivateSubscriptionModal({
  userId,
  isOpen,
  onClose,
}: ActivateSubscriptionModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [startDate, setStartDate] = useState('');

  // Fetch available plans when modal opens
  useEffect(() => {
    if (isOpen) {
      fetch('/api/subscription-plans')
        .then((res) => res.json())
        .then((data) => {
          setPlans(data.plans || []);
          if (data.plans && data.plans.length > 0) {
            setSelectedPlanId(data.plans[0].id);
          }
        })
        .catch((err) => console.error('Error fetching plans:', err));

      // Set default start date to today
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setStartDate(`${year}-${month}-${day}`);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'activate',
          planId: selectedPlanId,
          startDate: new Date(startDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to activate subscription');
      }

      // Reload server component data and close modal
      router.refresh();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al activar suscripción');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Activar Suscripción</DialogTitle>
            <DialogDescription>
              Selecciona un plan y fecha de inicio para activar la suscripción manualmente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Plan selector */}
            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <select
                id="plan"
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                disabled={isLoading}
                required
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - ${plan.price.toLocaleString('es-CL')}
                  </option>
                ))}
              </select>
            </div>

            {/* Start date picker */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de Inicio</Label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !selectedPlanId || !startDate}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Activando...
                </>
              ) : (
                'Activar Suscripción'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
