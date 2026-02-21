'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCLP } from '@/lib/utils/format';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: unknown;
  isActive: boolean;
  _count: { subscriptions: number };
}

interface SettingsPlansSectionProps {
  initialPlans: Plan[];
}

/**
 * SettingsPlansSection Component
 *
 * Displays all subscription plans with their status and subscriber count.
 * Allows admins to toggle active/inactive state with confirmation.
 */
export function SettingsPlansSection({ initialPlans }: SettingsPlansSectionProps) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggle = async (plan: Plan) => {
    const newActive = !plan.isActive;

    if (!newActive) {
      const confirmed = confirm(
        `¿Estás seguro de que quieres desactivar el plan "${plan.name}"? Los suscriptores activos no se verán afectados, pero no se podrán crear nuevas suscripciones con este plan.`
      );
      if (!confirmed) return;
    }

    setLoading(plan.id);
    try {
      const response = await fetch(`/api/admin/settings/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar plan');
      }

      setPlans(prev =>
        prev.map(p => (p.id === plan.id ? { ...p, isActive: newActive } : p))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(null);
    }
  };

  const getIntervalLabel = (interval: string) => {
    switch (interval) {
      case 'monthly': return 'Mensual';
      case 'yearly': return 'Anual';
      default: return interval;
    }
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plan</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Intervalo</TableHead>
            <TableHead>Suscriptores</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No hay planes configurados
              </TableCell>
            </TableRow>
          ) : (
            plans.map(plan => (
              <TableRow key={plan.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{formatCLP(plan.price)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {getIntervalLabel(plan.interval)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {plan._count.subscriptions}
                </TableCell>
                <TableCell>
                  <Badge variant={plan.isActive ? 'default' : 'outline'}>
                    {plan.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant={plan.isActive ? 'outline' : 'default'}
                    size="sm"
                    disabled={loading !== null}
                    onClick={() => handleToggle(plan)}
                  >
                    {loading === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : plan.isActive ? (
                      'Desactivar'
                    ) : (
                      'Activar'
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
