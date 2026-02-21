'use client';

import { useState } from 'react';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCLP } from '@/lib/utils/format';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: unknown;
  isActive: boolean;
  gracePeriodDays: number;
  penaltyBaseRate: number;
  penaltyDailyRate: number;
  penaltyMaxRate: number;
  _count: { subscriptions: number };
}

interface PlanFormState {
  name: string;
  description: string;
  price: string;
  interval: 'monthly' | 'yearly';
  featuresText: string;
  gracePeriodDays: string;
  penaltyBaseRate: string;
  penaltyDailyRate: string;
  penaltyMaxRate: string;
}

interface SettingsPlansSectionProps {
  initialPlans: Plan[];
}

const DEFAULT_FORM: PlanFormState = {
  name: '',
  description: '',
  price: '',
  interval: 'monthly',
  featuresText: '',
  gracePeriodDays: '2',
  penaltyBaseRate: '5',
  penaltyDailyRate: '0.5',
  penaltyMaxRate: '50',
};

function planToForm(plan: Plan): PlanFormState {
  const features = Array.isArray(plan.features) ? (plan.features as string[]) : [];
  return {
    name: plan.name,
    description: plan.description,
    price: String(plan.price),
    interval: plan.interval as 'monthly' | 'yearly',
    featuresText: features.join('\n'),
    gracePeriodDays: String(plan.gracePeriodDays),
    // Display rates as percentages: 0.05 → "5", 0.005 → "0.5", 0.5 → "50"
    penaltyBaseRate: String(Math.round(plan.penaltyBaseRate * 1000) / 10),
    penaltyDailyRate: String(Math.round(plan.penaltyDailyRate * 1000) / 10),
    penaltyMaxRate: String(Math.round(plan.penaltyMaxRate * 1000) / 10),
  };
}

/**
 * SettingsPlansSection Component
 *
 * Displays all subscription plans with their status and subscriber count.
 * Allows admins to create, edit, delete, and toggle active/inactive state.
 */
export function SettingsPlansSection({ initialPlans }: SettingsPlansSectionProps) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanFormState>(DEFAULT_FORM);
  const [saveLoading, setSaveLoading] = useState(false);

  const openCreate = () => {
    setEditingPlan(null);
    setForm(DEFAULT_FORM);
    setModalOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm(planToForm(plan));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPlan(null);
    setForm(DEFAULT_FORM);
  };

  const handleFieldChange = (field: keyof PlanFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const price = Number(form.price);
    if (!form.name.trim()) {
      alert('El nombre es requerido');
      return;
    }
    if (!form.description.trim()) {
      alert('La descripción es requerida');
      return;
    }
    if (isNaN(price) || price <= 0) {
      alert('El precio debe ser un número positivo');
      return;
    }

    const features = form.featuresText
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    // Convert percentage display values back to decimals
    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      interval: form.interval,
      features,
      gracePeriodDays: Math.max(0, parseInt(form.gracePeriodDays) || 0),
      penaltyBaseRate: parseFloat(form.penaltyBaseRate) / 100,
      penaltyDailyRate: parseFloat(form.penaltyDailyRate) / 100,
      penaltyMaxRate: parseFloat(form.penaltyMaxRate) / 100,
    };

    setSaveLoading(true);
    try {
      const url = editingPlan
        ? `/api/admin/settings/plans/${editingPlan.id}`
        : '/api/admin/settings/plans';
      const method = editingPlan ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar plan');
      }

      const data = await response.json();
      const savedPlan: Plan = data.plan;

      if (editingPlan) {
        setPlans(prev => prev.map(p => (p.id === savedPlan.id ? savedPlan : p)));
      } else {
        setPlans(prev => [...prev, savedPlan]);
      }

      closeModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (plan: Plan) => {
    const confirmed = confirm(
      `¿Estás seguro de que quieres eliminar el plan "${plan.name}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeleteLoading(plan.id);
    try {
      const response = await fetch(`/api/admin/settings/plans/${plan.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar plan');
      }

      setPlans(prev => prev.filter(p => p.id !== plan.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleToggle = async (plan: Plan) => {
    const newActive = !plan.isActive;

    if (!newActive) {
      const confirmed = confirm(
        `¿Estás seguro de que quieres desactivar el plan "${plan.name}"? Los suscriptores activos no se verán afectados, pero no se podrán crear nuevas suscripciones con este plan.`
      );
      if (!confirmed) return;
    }

    setToggleLoading(plan.id);
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
      setToggleLoading(null);
    }
  };

  const getIntervalLabel = (interval: string) => {
    switch (interval) {
      case 'monthly': return 'Mensual';
      case 'yearly': return 'Anual';
      default: return interval;
    }
  };

  const isAnyLoading = toggleLoading !== null || deleteLoading !== null;

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Plan
          </Button>
        </div>

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
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isAnyLoading}
                          onClick={() => openEdit(plan)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant={plan.isActive ? 'outline' : 'default'}
                          size="sm"
                          disabled={isAnyLoading}
                          onClick={() => handleToggle(plan)}
                        >
                          {toggleLoading === plan.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : plan.isActive ? (
                            'Desactivar'
                          ) : (
                            'Activar'
                          )}
                        </Button>
                        {plan._count.subscriptions === 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isAnyLoading}
                            onClick={() => handleDelete(plan)}
                            className="text-destructive hover:text-destructive"
                          >
                            {deleteLoading === plan.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={closeModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
              </DialogTitle>
              <DialogDescription>
                {editingPlan
                  ? 'Modifica los datos del plan de suscripción.'
                  : 'Completa los datos para crear un nuevo plan de suscripción.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Plan info */}
              <div className="space-y-2">
                <Label htmlFor="plan-name">Nombre</Label>
                <Input
                  id="plan-name"
                  value={form.name}
                  onChange={e => handleFieldChange('name', e.target.value)}
                  placeholder="Ej: Plan Pro"
                  disabled={saveLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-description">Descripción</Label>
                <Input
                  id="plan-description"
                  value={form.description}
                  onChange={e => handleFieldChange('description', e.target.value)}
                  placeholder="Ej: Acceso completo al estudio"
                  disabled={saveLoading}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-price">Precio (CLP)</Label>
                  <Input
                    id="plan-price"
                    type="number"
                    min="1"
                    step="1"
                    value={form.price}
                    onChange={e => handleFieldChange('price', e.target.value)}
                    placeholder="Ej: 29990"
                    disabled={saveLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan-interval">Intervalo</Label>
                  <select
                    id="plan-interval"
                    value={form.interval}
                    onChange={e => handleFieldChange('interval', e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background h-10"
                    disabled={saveLoading}
                  >
                    <option value="monthly">Mensual</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-features">
                  Características
                  <span className="text-xs text-muted-foreground ml-2">(una por línea)</span>
                </Label>
                <textarea
                  id="plan-features"
                  value={form.featuresText}
                  onChange={e => handleFieldChange('featuresText', e.target.value)}
                  placeholder={'Acceso ilimitado\nGrabación HD\nMezcla incluida'}
                  className="w-full min-h-[80px] border rounded-md px-3 py-2 text-sm bg-background resize-y"
                  disabled={saveLoading}
                />
              </div>

              {/* Penalty configuration */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium">Configuración de penalizaciones</p>

                <div className="space-y-2">
                  <Label htmlFor="plan-grace">Período de gracia (días)</Label>
                  <Input
                    id="plan-grace"
                    type="number"
                    min="0"
                    step="1"
                    value={form.gracePeriodDays}
                    onChange={e => handleFieldChange('gracePeriodDays', e.target.value)}
                    placeholder="2"
                    disabled={saveLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Días de gracia antes de aplicar penalización
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="plan-penalty-base">Base (%)</Label>
                    <Input
                      id="plan-penalty-base"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={form.penaltyBaseRate}
                      onChange={e => handleFieldChange('penaltyBaseRate', e.target.value)}
                      placeholder="5"
                      disabled={saveLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plan-penalty-daily">Diaria (%)</Label>
                    <Input
                      id="plan-penalty-daily"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={form.penaltyDailyRate}
                      onChange={e => handleFieldChange('penaltyDailyRate', e.target.value)}
                      placeholder="0.5"
                      disabled={saveLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plan-penalty-max">Máxima (%)</Label>
                    <Input
                      id="plan-penalty-max"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={form.penaltyMaxRate}
                      onChange={e => handleFieldChange('penaltyMaxRate', e.target.value)}
                      placeholder="50"
                      disabled={saveLoading}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Penalización = Base % + (días de retraso × Diaria %), con un máximo de Máxima %
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={saveLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saveLoading}>
                {saveLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : editingPlan ? (
                  'Guardar cambios'
                ) : (
                  'Crear plan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
