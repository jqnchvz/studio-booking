'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface TimeSlotSelectorProps {
  resourceId: string;
  date: Date;
  duration: number;
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
}

export function TimeSlotSelector({
  resourceId,
  date,
  duration,
  selectedTime,
  onTimeSelect,
}: TimeSlotSelectorProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const response = await fetch(
        `/api/resources/${resourceId}/availability?date=${dateStr}&duration=${duration}`
      );

      if (!response.ok) {
        throw new Error('Error al cargar disponibilidad');
      }

      const data = await response.json();
      setSlots(data.slots || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [resourceId, date, duration]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <p className="text-destructive text-sm">{error}</p>
        <button
          onClick={fetchAvailability}
          className="mt-2 text-sm text-destructive hover:text-destructive/80 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
        <p className="text-warning text-sm">
          No hay horarios disponibles para esta fecha con la duración seleccionada.
        </p>
      </div>
    );
  }

  const availableSlots = slots.filter((slot) => slot.available);

  if (availableSlots.length === 0) {
    return (
      <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
        <p className="text-warning text-sm">
          Todos los horarios están reservados para esta fecha. Intenta con otra fecha o
          duración.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {slots.map((slot) => {
          const slotTime = new Date(slot.startTime);
          const timeStr = format(slotTime, 'HH:mm');
          const isSelected = selectedTime === slot.startTime;

          return (
            <button
              key={slot.startTime}
              type="button"
              onClick={() => slot.available && onTimeSelect(slot.startTime)}
              disabled={!slot.available}
              className={`px-4 py-3 rounded-md border text-sm font-medium transition ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : slot.available
                  ? 'bg-card text-foreground border-border hover:border-primary hover:bg-primary/10'
                  : 'bg-muted text-muted-foreground border-border cursor-not-allowed'
              }`}
            >
              {timeStr}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-card border border-border mr-2"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-muted border border-border mr-2"></div>
            <span>No disponible</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-primary mr-2"></div>
            <span>Seleccionado</span>
          </div>
        </div>
        <div>
          <span className="font-medium">{availableSlots.length}</span> horarios
          disponibles
        </div>
      </div>
    </div>
  );
}
