'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createReservationSchema } from '@/lib/validations/reservation';
import type { CreateReservationInput } from '@/lib/validations/reservation';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { TimeSlotSelector } from './TimeSlotSelector';

interface Resource {
  id: string;
  name: string;
  type: string;
  capacity: number | null;
  availability: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}

interface Reservation {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  attendees: number;
  status: string;
  resource: {
    id: string;
    name: string;
    type: string;
  };
  createdAt: string;
}

interface BookingFormProps {
  resources: Resource[];
  onSuccess: (reservation: Reservation) => void;
}

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1.5 horas' },
  { value: 120, label: '2 horas' },
  { value: 150, label: '2.5 horas' },
  { value: 180, label: '3 horas' },
  { value: 210, label: '3.5 horas' },
  { value: 240, label: '4 horas' },
];

export function BookingForm({ resources, onSuccess }: BookingFormProps) {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(60);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(createReservationSchema),
    defaultValues: {
      attendees: 1,
    },
  });

  const title = watch('title');
  const description = watch('description');
  const attendees = watch('attendees');

  async function onSubmit(data: CreateReservationInput) {
    if (!selectedResource || !selectedDate || !selectedTime) {
      setError('Por favor, completa todos los campos requeridos');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la reserva');
      }

      const { reservation } = await response.json();
      onSuccess(reservation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSubmitting(false);
    }
  }

  function handleResourceChange(resourceId: string) {
    const resource = resources.find((r) => r.id === resourceId);
    setSelectedResource(resource || null);
    setSelectedDate(null);
    setSelectedTime(null);
    setValue('resourceId', resourceId);
  }

  function handleDateSelect(date: Date | null) {
    setSelectedDate(date);
    setSelectedTime(null);
  }

  function handleTimeSelect(time: string) {
    setSelectedTime(time);

    // Calculate start and end times
    const startTime = new Date(time);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + duration);

    setValue('startTime', startTime);
    setValue('endTime', endTime);
  }

  function handleDurationChange(newDuration: number) {
    setDuration(newDuration);
    setSelectedTime(null); // Reset time selection when duration changes

    // If there's a selected time, update end time
    if (selectedTime) {
      const startTime = new Date(selectedTime);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + newDuration);
      setValue('endTime', endTime);
    }
  }

  const canSubmit =
    selectedResource &&
    selectedDate &&
    selectedTime &&
    title &&
    attendees &&
    !submitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Step 1: Resource Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          1. Selecciona un Recurso
        </h2>

        <div>
          <label
            htmlFor="resource"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Recurso *
          </label>
          <select
            id="resource"
            value={selectedResource?.id || ''}
            onChange={(e) => handleResourceChange(e.target.value)}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecciona un recurso</option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name} ({resource.type})
                {resource.capacity && ` - Capacidad: ${resource.capacity}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Step 2: Date and Time Selection */}
      {selectedResource && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            2. Selecciona Fecha y Hora
          </h2>

          <div className="space-y-6">
            {/* Duration Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleDurationChange(option.value)}
                    className={`px-4 py-2 rounded-md border transition ${
                      duration === option.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha *
              </label>
              <AvailabilityCalendar
                resource={selectedResource}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de inicio *
                </label>
                <TimeSlotSelector
                  resourceId={selectedResource.id}
                  date={selectedDate}
                  duration={duration}
                  selectedTime={selectedTime}
                  onTimeSelect={handleTimeSelect}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Reservation Details */}
      {selectedResource && selectedDate && selectedTime && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            3. Detalles de la Reserva
          </h2>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Título *
              </label>
              <input
                id="title"
                type="text"
                {...register('title')}
                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Reunión de equipo"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Descripción (opcional)
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Agrega detalles sobre la reserva..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Attendees */}
            <div>
              <label
                htmlFor="attendees"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Número de asistentes *
              </label>
              <input
                id="attendees"
                type="number"
                {...register('attendees', { valueAsNumber: true })}
                min="1"
                max={selectedResource.capacity || 100}
                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.attendees && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.attendees.message}
                </p>
              )}
              {selectedResource.capacity && (
                <p className="mt-1 text-sm text-gray-500">
                  Capacidad máxima: {selectedResource.capacity}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {submitting ? 'Creando reserva...' : 'Crear Reserva'}
        </button>
      </div>
    </form>
  );
}
