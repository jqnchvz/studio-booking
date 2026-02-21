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

interface SettingsResourcesSectionProps {
  initialResources: Resource[];
}

/** Day abbreviations in Spanish, indexed by dayOfWeek (0=Sunday) */
const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/**
 * Formats an availability schedule into a compact string.
 * Groups consecutive days with identical hours: "Lun-Vie 09:00-18:00, Sáb 10:00-14:00"
 */
function formatAvailability(slots: AvailabilitySlot[]): string {
  const active = slots.filter(s => s.isActive);
  if (active.length === 0) return 'Sin horarios';

  // Group slots by time range
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

    // Build compressed day ranges (e.g., [1,2,3,4,5] → "Lun-Vie")
    const dayGroups: string[] = [];
    let i = 0;
    while (i < days.length) {
      let j = i;
      while (j + 1 < days.length && days[j + 1] === days[j] + 1) j++;
      if (j > i) {
        dayGroups.push(`${DAY_LABELS[days[i]]}-${DAY_LABELS[days[j]]}`);
      } else {
        dayGroups.push(DAY_LABELS[days[i]]);
      }
      i = j + 1;
    }

    parts.push(`${dayGroups.join(', ')} ${start}-${end}`);
  }

  return parts.join(' • ');
}

const TYPE_LABELS: Record<string, string> = {
  room: 'Sala',
  equipment: 'Equipo',
  service: 'Servicio',
};

/**
 * SettingsResourcesSection Component
 *
 * Displays all studio resources with their availability schedule.
 * Allows admins to toggle active/inactive state with confirmation.
 */
export function SettingsResourcesSection({ initialResources }: SettingsResourcesSectionProps) {
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggle = async (resource: Resource) => {
    const newActive = !resource.isActive;

    if (!newActive) {
      const confirmed = confirm(
        `¿Estás seguro de que quieres desactivar el recurso "${resource.name}"? No se podrán crear nuevas reservas para este recurso.`
      );
      if (!confirmed) return;
    }

    setLoading(resource.id);
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
      setLoading(null);
    }
  };

  return (
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
                <TableCell className="text-right">
                  <Button
                    variant={resource.isActive ? 'outline' : 'default'}
                    size="sm"
                    disabled={loading !== null}
                    onClick={() => handleToggle(resource)}
                  >
                    {loading === resource.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : resource.isActive ? (
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
