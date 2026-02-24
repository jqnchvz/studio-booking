'use client';

import { useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, X } from 'lucide-react';
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

interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface Resource {
  id: string;
  name: string;
  description: string | null;
  type: string;
  capacity: number | null;
  isActive: boolean;
  availability: AvailabilitySlot[];
  _count: { reservations: number };
}

/** Slot during editing — id may be 'temp-N' for newly added, real id for existing */
interface SlotDraft {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface SettingsResourcesSectionProps {
  initialResources: Resource[];
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_FULL_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const TYPE_LABELS: Record<string, string> = {
  room: 'Sala',
  equipment: 'Equipo',
  service: 'Servicio',
};

/**
 * Formats an availability schedule into a compact string.
 * Groups consecutive days with identical hours: "Lun-Vie 09:00-18:00"
 */
function formatAvailability(slots: AvailabilitySlot[]): string {
  const active = slots.filter(s => s.isActive);
  if (active.length === 0) return 'Sin horarios';

  const byTime = new Map<string, number[]>();
  for (const slot of active) {
    const key = `${slot.startTime}-${slot.endTime}`;
    if (!byTime.has(key)) byTime.set(key, []);
    byTime.get(key)!.push(slot.dayOfWeek);
  }

  const parts: string[] = [];
  for (const [timeRange, days] of byTime) {
    days.sort((a, b) => a - b);
    const [start, end] = timeRange.split('-');
    const dayGroups: string[] = [];
    let i = 0;
    while (i < days.length) {
      let j = i;
      while (j + 1 < days.length && days[j + 1] === days[j] + 1) j++;
      dayGroups.push(j > i ? `${DAY_LABELS[days[i]]}-${DAY_LABELS[days[j]]}` : DAY_LABELS[days[i]]);
      i = j + 1;
    }
    parts.push(`${dayGroups.join(', ')} ${start}-${end}`);
  }

  return parts.join(' • ');
}

/**
 * SettingsResourcesSection Component
 *
 * Displays all studio resources. Allows admins to create, edit, delete,
 * toggle active/inactive, and manage availability schedules.
 */
export function SettingsResourcesSection({ initialResources }: SettingsResourcesSectionProps) {
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Resource fields form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'room' | 'equipment' | 'service'>('room');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');

  // Availability slot editor state
  const [slots, setSlots] = useState<SlotDraft[]>([]);
  const [removedSlotIds, setRemovedSlotIds] = useState<Set<string>>(new Set());
  const [newSlotDay, setNewSlotDay] = useState('1');
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('18:00');
  const [slotError, setSlotError] = useState('');

  const openCreate = () => {
    setEditingResource(null);
    setName('');
    setType('room');
    setDescription('');
    setCapacity('');
    setSlots([]);
    setRemovedSlotIds(new Set());
    setNewSlotDay('1');
    setNewSlotStart('09:00');
    setNewSlotEnd('18:00');
    setSlotError('');
    setModalOpen(true);
  };

  const openEdit = (resource: Resource) => {
    setEditingResource(resource);
    setName(resource.name);
    setType(resource.type as 'room' | 'equipment' | 'service');
    setDescription(resource.description ?? '');
    setCapacity(resource.capacity != null ? String(resource.capacity) : '');
    setSlots(resource.availability.map(s => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
    })));
    setRemovedSlotIds(new Set());
    setNewSlotDay('1');
    setNewSlotStart('09:00');
    setNewSlotEnd('18:00');
    setSlotError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingResource(null);
  };

  const handleAddSlot = () => {
    setSlotError('');
    if (newSlotStart >= newSlotEnd) {
      setSlotError('La hora de inicio debe ser anterior a la hora de fin');
      return;
    }
    setSlots(prev => [
      ...prev,
      { id: `temp-${Date.now()}`, dayOfWeek: parseInt(newSlotDay), startTime: newSlotStart, endTime: newSlotEnd },
    ]);
  };

  const handleRemoveSlot = (slotId: string) => {
    setSlots(prev => prev.filter(s => s.id !== slotId));
    if (!slotId.startsWith('temp-')) {
      setRemovedSlotIds(prev => new Set([...prev, slotId]));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { alert('El nombre es requerido'); return; }

    setSaveLoading(true);
    try {
      const resourceBody = {
        name: name.trim(),
        type,
        description: description.trim() || null,
        capacity: capacity ? Number(capacity) : null,
      };

      let resourceId: string;

      if (editingResource) {
        // Update resource fields
        const res = await fetch(`/api/admin/settings/resources/${editingResource.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resourceBody),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Error al guardar');
        resourceId = editingResource.id;
      } else {
        // Create new resource
        const res = await fetch('/api/admin/settings/resources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(resourceBody),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Error al crear');
        const data = await res.json();
        resourceId = data.resource.id;
      }

      // Delete removed slots (edit mode only)
      for (const slotId of removedSlotIds) {
        await fetch(`/api/admin/settings/resources/${resourceId}/availability/${slotId}`, {
          method: 'DELETE',
        });
      }

      // Add new slots (those with temp IDs)
      for (const slot of slots) {
        if (slot.id.startsWith('temp-')) {
          await fetch(`/api/admin/settings/resources/${resourceId}/availability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
            }),
          });
        }
      }

      // Re-fetch updated resource list to sync state
      const listRes = await fetch('/api/admin/settings/resources');
      if (listRes.ok) {
        const listData = await listRes.json();
        setResources(listData.resources);
      }

      closeModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (resource: Resource) => {
    const confirmed = confirm(
      `¿Estás seguro de que quieres eliminar el recurso "${resource.name}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeleteLoading(resource.id);
    try {
      const response = await fetch(`/api/admin/settings/resources/${resource.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar recurso');
      }

      setResources(prev => prev.filter(r => r.id !== resource.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleToggle = async (resource: Resource) => {
    const newActive = !resource.isActive;

    if (!newActive) {
      const confirmed = confirm(
        `¿Estás seguro de que quieres desactivar el recurso "${resource.name}"? No se podrán crear nuevas reservas para este recurso.`
      );
      if (!confirmed) return;
    }

    setToggleLoading(resource.id);
    try {
      const response = await fetch(`/api/admin/settings/resources/${resource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar recurso');
      }

      setResources(prev =>
        prev.map(r => (r.id === resource.id ? { ...r, isActive: newActive } : r))
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
            Nuevo Recurso
          </Button>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recurso</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Capacidad</TableHead>
                <TableHead>Horarios</TableHead>
                <TableHead>Reservas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No hay recursos configurados
                  </TableCell>
                </TableRow>
              ) : (
                resources.map(resource => (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{resource.name}</p>
                        {resource.description && (
                          <p className="text-xs text-muted-foreground">{resource.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {TYPE_LABELS[resource.type] ?? resource.type}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {resource.capacity ?? '-'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-48">
                      {formatAvailability(resource.availability)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {resource._count.reservations}
                    </TableCell>
                    <TableCell>
                      <Badge variant={resource.isActive ? 'default' : 'outline'}>
                        {resource.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isAnyLoading}
                          onClick={() => openEdit(resource)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant={resource.isActive ? 'outline' : 'default'}
                          size="sm"
                          disabled={isAnyLoading}
                          onClick={() => handleToggle(resource)}
                        >
                          {toggleLoading === resource.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : resource.isActive ? (
                            'Desactivar'
                          ) : (
                            'Activar'
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isAnyLoading}
                          onClick={() => handleDelete(resource)}
                          className="text-destructive hover:text-destructive"
                        >
                          {deleteLoading === resource.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="sr-only">Eliminar</span>
                        </Button>
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
        <DialogContent className="max-w-lg p-0 gap-0 flex flex-col max-h-[85vh] overflow-hidden">
          <form onSubmit={handleSave} className="flex flex-col h-full min-h-0">
            <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
              <DialogTitle>
                {editingResource ? 'Editar Recurso' : 'Nuevo Recurso'}
              </DialogTitle>
              <DialogDescription>
                {editingResource
                  ? 'Modifica los datos del recurso del estudio.'
                  : 'Completa los datos para crear un nuevo recurso.'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto min-h-0 space-y-4 px-6 py-2 pr-5">
              {/* Resource fields */}
              <div className="space-y-2">
                <Label htmlFor="res-name">Nombre</Label>
                <Input
                  id="res-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Sala A"
                  disabled={saveLoading}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="res-type">Tipo</Label>
                  <select
                    id="res-type"
                    value={type}
                    onChange={e => setType(e.target.value as 'room' | 'equipment' | 'service')}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background h-10"
                    disabled={saveLoading}
                  >
                    <option value="room">Sala</option>
                    <option value="equipment">Equipo</option>
                    <option value="service">Servicio</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="res-capacity">
                    Capacidad
                    <span className="text-xs text-muted-foreground ml-1">(opcional)</span>
                  </Label>
                  <Input
                    id="res-capacity"
                    type="number"
                    min="1"
                    step="1"
                    value={capacity}
                    onChange={e => setCapacity(e.target.value)}
                    placeholder="Ej: 10"
                    disabled={saveLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="res-description">
                  Descripción
                  <span className="text-xs text-muted-foreground ml-1">(opcional)</span>
                </Label>
                <textarea
                  id="res-description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ej: Sala de grabación principal con equipamiento completo"
                  className="w-full min-h-[60px] border rounded-md px-3 py-2 text-sm bg-background resize-y"
                  disabled={saveLoading}
                />
              </div>

              {/* Availability schedule editor */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium">Horarios de disponibilidad</p>

                {/* Existing / pending slots */}
                {slots.length > 0 ? (
                  <div className="space-y-1">
                    {slots.map(slot => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                      >
                        <span>
                          <span className="font-medium">{DAY_FULL_LABELS[slot.dayOfWeek]}</span>
                          <span className="text-muted-foreground ml-2">
                            {slot.startTime} – {slot.endTime}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSlot(slot.id)}
                          disabled={saveLoading}
                          className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                          aria-label="Eliminar horario"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Sin horarios configurados</p>
                )}

                {/* Add new slot */}
                <div className="rounded-md border border-dashed p-3 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Agregar horario</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="slot-day" className="text-xs">Día</Label>
                      <select
                        id="slot-day"
                        value={newSlotDay}
                        onChange={e => setNewSlotDay(e.target.value)}
                        className="w-full border rounded-md px-2 py-1.5 text-sm bg-background"
                        disabled={saveLoading}
                      >
                        {DAY_FULL_LABELS.map((label, i) => (
                          <option key={i} value={i}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="slot-start" className="text-xs">Inicio</Label>
                      <input
                        id="slot-start"
                        type="time"
                        value={newSlotStart}
                        onChange={e => setNewSlotStart(e.target.value)}
                        className="w-full border rounded-md px-2 py-1.5 text-sm bg-background"
                        disabled={saveLoading}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="slot-end" className="text-xs">Fin</Label>
                      <input
                        id="slot-end"
                        type="time"
                        value={newSlotEnd}
                        onChange={e => setNewSlotEnd(e.target.value)}
                        className="w-full border rounded-md px-2 py-1.5 text-sm bg-background"
                        disabled={saveLoading}
                      />
                    </div>
                  </div>
                  {slotError && (
                    <p className="text-xs text-destructive">{slotError}</p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSlot}
                    disabled={saveLoading}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 shrink-0 border-t">
              <Button type="button" variant="outline" onClick={closeModal} disabled={saveLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveLoading}>
                {saveLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : editingResource ? (
                  'Guardar cambios'
                ) : (
                  'Crear recurso'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
