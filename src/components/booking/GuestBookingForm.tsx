'use client';

import { useState } from 'react';
import { AvailabilityCalendar } from '@/components/features/reservations/AvailabilityCalendar';
import { TimeSlotSelector } from '@/components/features/reservations/TimeSlotSelector';

interface DropInResource {
  id: string;
  name: string;
  type: string;
  capacity: number | null;
  dropInPricePerHour: number | null;
  availability: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}

interface GuestBookingFormProps {
  orgSlug: string;
  resources: DropInResource[];
}

const DURATION_OPTIONS = [
  { value: 60, label: '1 hora' },
  { value: 120, label: '2 horas' },
  { value: 180, label: '3 horas' },
  { value: 240, label: '4 horas' },
];

function formatCLP(amount: number): string {
  return `$${amount.toLocaleString('es-CL')}`;
}

export function GuestBookingForm({ orgSlug, resources }: GuestBookingFormProps) {
  const [selectedResource, setSelectedResource] = useState<DropInResource | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(60);

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pricePerHour = selectedResource?.dropInPricePerHour ?? 0;
  const totalPrice = pricePerHour * (duration / 60);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail);
  const canSubmit =
    selectedResource &&
    selectedDate &&
    selectedTime &&
    guestName.trim() &&
    emailValid &&
    !submitting;

  function handleResourceSelect(resource: DropInResource) {
    setSelectedResource(resource);
    setSelectedDate(null);
    setSelectedTime(null);
  }

  function handleDateSelect(date: Date | null) {
    setSelectedDate(date);
    setSelectedTime(null);
  }

  function handleDurationChange(newDuration: number) {
    setDuration(newDuration);
    setSelectedTime(null);
  }

  async function handleCheckout() {
    if (!canSubmit || !selectedTime) return;

    try {
      setSubmitting(true);
      setError(null);

      const startTime = new Date(selectedTime);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);

      const response = await fetch(`/api/book/${orgSlug}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: selectedResource.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          guestPhone: guestPhone.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al procesar la reserva');
      }

      const { initPoint } = await response.json();
      window.location.href = initPoint;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Step 1: Resource Selection */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          1. Elige un espacio
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          {resources.map((resource) => (
            <button
              key={resource.id}
              type="button"
              onClick={() => handleResourceSelect(resource)}
              className={[
                'text-left p-4 rounded-lg border-2 transition',
                selectedResource?.id === resource.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
              ].join(' ')}
            >
              <p className="font-medium text-foreground">{resource.name}</p>
              <p className="text-sm text-muted-foreground capitalize">{resource.type}</p>
              {resource.dropInPricePerHour != null && (
                <p className="mt-1 text-sm font-semibold text-primary">
                  {formatCLP(resource.dropInPricePerHour)} / hora
                </p>
              )}
              {resource.capacity && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Capacidad: {resource.capacity}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Duration + Date + Time */}
      {selectedResource && (
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            2. Fecha y hora
          </h2>

          <div className="space-y-6">
            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Duración
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleDurationChange(option.value)}
                    className={[
                      'px-4 py-2 rounded-md border transition text-sm',
                      duration === option.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-foreground border-border hover:border-primary',
                    ].join(' ')}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Fecha
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
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hora de inicio
                </label>
                <TimeSlotSelector
                  resourceId={selectedResource.id}
                  date={selectedDate}
                  duration={duration}
                  selectedTime={selectedTime}
                  onTimeSelect={setSelectedTime}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Guest Info */}
      {selectedResource && selectedDate && selectedTime && (
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            3. Tus datos
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="guestName" className="block text-sm font-medium text-foreground mb-1">
                Nombre completo *
              </label>
              <input
                id="guestName"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="block w-full px-4 py-2 text-foreground border border-border rounded-md focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                placeholder="Juan Pérez"
              />
            </div>

            <div>
              <label htmlFor="guestEmail" className="block text-sm font-medium text-foreground mb-1">
                Email *
              </label>
              <input
                id="guestEmail"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="block w-full px-4 py-2 text-foreground border border-border rounded-md focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                placeholder="juan@ejemplo.com"
              />
              {guestEmail && !emailValid && (
                <p className="mt-1 text-sm text-destructive">Email inválido</p>
              )}
            </div>

            <div>
              <label htmlFor="guestPhone" className="block text-sm font-medium text-foreground mb-1">
                Teléfono (opcional)
              </label>
              <input
                id="guestPhone"
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="block w-full px-4 py-2 text-foreground border border-border rounded-md focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                placeholder="+56 9 1234 5678"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-1">
                Notas (opcional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="block w-full px-4 py-2 text-foreground border border-border rounded-md focus:ring-ring focus:border-ring placeholder:text-muted-foreground"
                placeholder="Información adicional para el dueño del espacio..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Price Summary + Checkout */}
      {selectedResource && selectedDate && selectedTime && (
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Total a pagar</p>
              <p className="text-2xl font-bold text-foreground">{formatCLP(totalPrice)}</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{selectedResource.name}</p>
              <p>{DURATION_OPTIONS.find((d) => d.value === duration)?.label} · {formatCLP(pricePerHour)}/hora</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={!canSubmit}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition font-medium disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
          >
            {submitting ? 'Procesando...' : `Ir a pagar ${formatCLP(totalPrice)}`}
          </button>
        </div>
      )}
    </div>
  );
}
