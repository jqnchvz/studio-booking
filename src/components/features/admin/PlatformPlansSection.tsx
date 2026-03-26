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

interface PlatformPlan {
  id: string;
  name: string;
  price: number;
  maxResources: number;
  maxUsers: number;
  features: unknown;
  isActive: boolean;
  _count: { organizations: number };
}

interface FormState {
  name: string;
  price: string;
  maxResources: string;
  maxUsers: string;
  featuresText: string;
}

interface PlatformPlansSectionProps {
  initialPlans: PlatformPlan[];
}

const DEFAULT_FORM: FormState = {
  name: '',
  price: '',
  maxResources: '',
  maxUsers: '',
  featuresText: '',
};

function planToForm(plan: PlatformPlan): FormState {
  const features = Array.isArray(plan.features) ? (plan.features as string[]) : [];
  return {
    name: plan.name,
    price: String(plan.price),
    maxResources: String(plan.maxResources),
    maxUsers: String(plan.maxUsers),
    featuresText: features.join('\n'),
  };
}

export function PlatformPlansSection({ initialPlans }: PlatformPlansSectionProps) {
  const [plans, setPlans] = useState<PlatformPlan[]>(initialPlans);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlatformPlan | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saveLoading, setSaveLoading] = useState(false);

  const openCreate = () => {
    setEditingPlan(null);
    setForm(DEFAULT_FORM);
    setModalOpen(true);
  };

  const openEdit = (plan: PlatformPlan) => {
    setEditingPlan(plan);
    setForm(planToForm(plan));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPlan(null);
    setForm(DEFAULT_FORM);
  };

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const price = Number(form.price);
    if (!form.name.trim()) {
      alert('El nombre es requerido');
      return;
    }
    if (isNaN(price) || price < 0) {
      alert('El precio debe ser un número >= 0');
      return;
    }
    const maxResources = parseInt(form.maxResources);
    if (isNaN(maxResources) || maxResources < 1) {
      alert('El máximo de recursos debe ser un número > 0');
      return;
    }
    const maxUsers = parseInt(form.maxUsers);
    if (isNaN(maxUsers) || maxUsers < 1) {
      alert('El máximo de usuarios debe ser un número > 0');
      return;
    }

    const features = form.featuresText
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const body = {
      name: form.name.trim(),
      price: Math.round(price),
      maxResources,
      maxUsers,
      features,
    };

    setSaveLoading(true);
    try {
      const url = editingPlan
        ? `/api/admin/settings/platform-plans/${editingPlan.id}`
        : '/api/admin/settings/platform-plans';
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
      const savedPlan: PlatformPlan = data.plan;

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

  const handleDelete = async (plan: PlatformPlan) => {
    const confirmed = confirm(
      `¿Estás seguro de que quieres eliminar el plan "${plan.name}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeleteLoading(plan.id);
    try {
      const response = await fetch(`/api/admin/settings/platform-plans/${plan.id}`, {
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

  const handleToggle = async (plan: PlatformPlan) => {
    const newActive = !plan.isActive;

    if (!newActive) {
      const confirmed = confirm(
        `¿Estás seguro de que quieres desactivar el plan "${plan.name}"? Las empresas existentes no se verán afectadas, pero no se podrán asignar nuevas empresas a este plan.`
      );
      if (!confirmed) return;
    }

    setToggleLoading(plan.id);
    try {
      const response = await fetch(`/api/admin/settings/platform-plans/${plan.id}`, {
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
                <TableHead>Nombre</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Max Recursos</TableHead>
                <TableHead>Max Usuarios</TableHead>
                <TableHead>Empresas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No hay planes configurados
                  </TableCell>
                </TableRow>
              ) : (
                plans.map(plan => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>
                      {plan.price === 0 ? (
                        <span className="text-muted-foreground">Gratis</span>
                      ) : (
                        formatCLP(plan.price)
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {plan.maxResources}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {plan.maxUsers}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {plan._count.organizations}
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
                        {plan._count.organizations === 0 && (
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
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg p-0 gap-0 flex flex-col max-h-[85vh] overflow-hidden">
          <form onSubmit={handleSave} className="flex flex-col h-full min-h-0">
            <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
              <DialogTitle>
                {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
              </DialogTitle>
              <DialogDescription>
                {editingPlan
                  ? 'Modifica los datos del plan de plataforma.'
                  : 'Completa los datos para crear un nuevo plan de plataforma.'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto min-h-0 space-y-4 px-6 py-2 pr-5">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Nombre del plan</Label>
                <Input
                  id="plan-name"
                  value={form.name}
                  onChange={e => handleFieldChange('name', e.target.value)}
                  placeholder="Ej: Plan Pro"
                  disabled={saveLoading}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-price">Precio mensual (CLP)</Label>
                  <Input
                    id="plan-price"
                    type="number"
                    min="0"
                    step="1"
                    value={form.price}
                    onChange={e => handleFieldChange('price', e.target.value)}
                    placeholder="0 = Gratis"
                    disabled={saveLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan-max-resources">Máximo de recursos</Label>
                  <Input
                    id="plan-max-resources"
                    type="number"
                    min="1"
                    step="1"
                    value={form.maxResources}
                    onChange={e => handleFieldChange('maxResources', e.target.value)}
                    placeholder="Ej: 5"
                    disabled={saveLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-max-users">Máximo de usuarios</Label>
                <Input
                  id="plan-max-users"
                  type="number"
                  min="1"
                  step="1"
                  value={form.maxUsers}
                  onChange={e => handleFieldChange('maxUsers', e.target.value)}
                  placeholder="Ej: 50"
                  disabled={saveLoading}
                  required
                />
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
                  placeholder={'Hasta 5 recursos\nSoporte prioritario\nEstadísticas avanzadas'}
                  className="w-full min-h-[80px] border rounded-md px-3 py-2 text-sm bg-background resize-y"
                  disabled={saveLoading}
                />
              </div>
            </div>

            <DialogFooter className="px-6 py-4 shrink-0 border-t">
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
