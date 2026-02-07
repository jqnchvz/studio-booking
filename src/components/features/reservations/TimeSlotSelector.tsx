'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchAvailability();
  }, [resourceId, date, duration]);

  async function fetchAvailability() {
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
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">{error}</p>
        <button
          onClick={fetchAvailability}
          className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
          No hay horarios disponibles para esta fecha con la duración seleccionada.
        </p>
      </div>
    );
  }

  const availableSlots = slots.filter((slot) => slot.available);

  if (availableSlots.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
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
                  ? 'bg-blue-600 text-white border-blue-600'
                  : slot.available
                  ? 'bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              }`}
            >
              {timeStr}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-white border border-gray-300 mr-2"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200 mr-2"></div>
            <span>No disponible</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-blue-600 mr-2"></div>
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
