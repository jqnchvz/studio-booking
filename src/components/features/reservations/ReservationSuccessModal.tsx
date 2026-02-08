'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

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

interface ReservationSuccessModalProps {
  reservation: Reservation;
  onClose: () => void;
}

export function ReservationSuccessModal({
  reservation,
  onClose,
}: ReservationSuccessModalProps) {
  const router = useRouter();

  const startTime = new Date(reservation.startTime);
  const endTime = new Date(reservation.endTime);

  function handleViewReservations() {
    router.push('/dashboard/reservations');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          ¡Reserva Confirmada!
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Tu reserva ha sido creada exitosamente
        </p>

        {/* Reservation Details */}
        <div className="space-y-4 mb-6">
          {/* Reservation ID */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">ID de Reserva</p>
            <p className="font-mono text-sm font-medium text-gray-900">
              {reservation.id}
            </p>
          </div>

          {/* Resource */}
          <div>
            <p className="text-sm text-gray-600">Recurso</p>
            <p className="font-medium text-gray-900">{reservation.resource.name}</p>
            <p className="text-sm text-gray-500 capitalize">
              {reservation.resource.type}
            </p>
          </div>

          {/* Title */}
          <div>
            <p className="text-sm text-gray-600">Título</p>
            <p className="font-medium text-gray-900">{reservation.title}</p>
          </div>

          {/* Date and Time */}
          <div>
            <p className="text-sm text-gray-600">Fecha y Hora</p>
            <p className="font-medium text-gray-900">
              {format(startTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
            <p className="text-sm text-gray-700">
              {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
            </p>
          </div>

          {/* Duration */}
          <div>
            <p className="text-sm text-gray-600">Duración</p>
            <p className="font-medium text-gray-900">
              {Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))}{' '}
              minutos
            </p>
          </div>

          {/* Attendees */}
          <div>
            <p className="text-sm text-gray-600">Asistentes</p>
            <p className="font-medium text-gray-900">{reservation.attendees}</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            ✉️ Te hemos enviado un correo de confirmación con todos los detalles de
            tu reserva.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2">
          <button
            onClick={handleViewReservations}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
          >
            Ver Mis Reservas
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
