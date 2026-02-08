'use client';

import { useState } from 'react';
import { differenceInHours } from 'date-fns';

interface Reservation {
  id: string;
  title: string;
  startTime: string;
  resource: {
    name: string;
  };
}

interface CancelReservationModalProps {
  reservation: Reservation;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CancelReservationModal({
  reservation,
  isOpen,
  onClose,
  onSuccess,
}: CancelReservationModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTime = new Date(reservation.startTime);
  const now = new Date();
  const hoursUntilStart = differenceInHours(startTime, now);
  const canCancel = hoursUntilStart >= 24;

  // Calculate cancellation deadline (24 hours before start)
  const deadline = new Date(startTime);
  deadline.setHours(deadline.getHours() - 24);

  const deadlineText = deadline.toLocaleString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  async function handleCancel() {
    if (!confirmed) {
      setError('Debes confirmar que entiendes la política de cancelación');
      return;
    }

    try {
      setCancelling(true);
      setError(null);

      const response = await fetch(`/api/reservations/${reservation.id}/cancel`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cancelar la reserva');
      }

      // Success - notify parent
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCancelling(false);
    }
  }

  function handleClose() {
    setConfirmed(false);
    setError(null);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Cancelar Reserva
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {reservation.title} - {reservation.resource.name}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Policy Information */}
          <div className="mb-6">
            <div
              className={`rounded-lg p-4 ${
                canCancel ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-start">
                <svg
                  className={`w-5 h-5 mt-0.5 mr-3 ${
                    canCancel ? 'text-blue-600' : 'text-red-600'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      canCancel
                        ? 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                        : 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                    }
                  />
                </svg>
                <div className="flex-1">
                  <h4
                    className={`font-medium ${
                      canCancel ? 'text-blue-900' : 'text-red-900'
                    }`}
                  >
                    {canCancel ? 'Política de Cancelación' : 'No se puede cancelar'}
                  </h4>
                  <p
                    className={`text-sm mt-1 ${
                      canCancel ? 'text-blue-700' : 'text-red-700'
                    }`}
                  >
                    {canCancel ? (
                      <>
                        Puedes cancelar gratuitamente hasta 24 horas antes del inicio.
                        <br />
                        <span className="font-medium">
                          Plazo límite: {deadlineText}
                        </span>
                      </>
                    ) : (
                      <>
                        No se puede cancelar con menos de 24 horas de anticipación.
                        <br />
                        <span className="font-medium">
                          El plazo límite era: {deadlineText}
                        </span>
                        <br />
                        <span className="text-xs mt-1 block">
                          Quedan {hoursUntilStart} horas para el inicio de la reserva
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {canCancel && (
            <>
              {/* Confirmation Checkbox */}
              <div className="mb-6">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Entiendo que al cancelar esta reserva, el espacio quedará disponible
                    para otros usuarios y no podré recuperar esta reserva.
                  </span>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                >
                  Mantener Reserva
                </button>
                <button
                  onClick={handleCancel}
                  disabled={!confirmed || cancelling}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {cancelling ? 'Cancelando...' : 'Cancelar Reserva'}
                </button>
              </div>
            </>
          )}

          {!canCancel && (
            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
