'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookingForm } from '@/components/features/reservations/BookingForm';
import { ReservationSuccessModal } from '@/components/features/reservations/ReservationSuccessModal';

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

export default function NewReservationPage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successReservation, setSuccessReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    fetchResources();
  }, []);

  async function fetchResources() {
    try {
      setLoading(true);
      const response = await fetch('/api/resources');

      if (!response.ok) {
        throw new Error('Error al cargar recursos');
      }

      const data = await response.json();
      setResources(data.resources);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  function handleSuccess(reservation: Reservation) {
    setSuccessReservation(reservation);
  }

  function handleCloseSuccessModal() {
    setSuccessReservation(null);
    router.push('/dashboard/reservations');
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando recursos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">Error al cargar recursos</p>
          <p className="text-red-600 mt-2">{error}</p>
          <button
            onClick={fetchResources}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium">No hay recursos disponibles</p>
          <p className="text-yellow-600 mt-2">
            Por favor, contacta al administrador para configurar recursos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nueva Reserva</h1>
          <p className="mt-2 text-gray-600">
            Selecciona un recurso, fecha y horario para crear tu reserva.
          </p>
        </div>

        <BookingForm resources={resources} onSuccess={handleSuccess} />

        {successReservation && (
          <ReservationSuccessModal
            reservation={successReservation}
            onClose={handleCloseSuccessModal}
          />
        )}
      </div>
    </div>
  );
}
