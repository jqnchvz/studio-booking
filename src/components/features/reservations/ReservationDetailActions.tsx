'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { differenceInHours } from 'date-fns';
import { CancelReservationModal } from './CancelReservationModal';

interface ReservationDetailActionsProps {
  reservation: {
    id: string;
    title: string;
    startTime: string;
    status: string;
    resource: { name: string };
  };
}

/**
 * ReservationDetailActions
 *
 * Client component that renders the "Cancelar reserva" button on the detail page.
 * Only shown for upcoming confirmed reservations. On successful cancellation,
 * redirects back to the reservations list.
 */
export function ReservationDetailActions({ reservation }: ReservationDetailActionsProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const isUpcoming = new Date(reservation.startTime) > new Date();
  const hoursUntilStart = differenceInHours(new Date(reservation.startTime), new Date());
  const canCancel =
    reservation.status === 'confirmed' && isUpcoming && hoursUntilStart >= 24;

  if (!canCancel) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md border border-red-200 transition"
      >
        Cancelar reserva
      </button>

      <CancelReservationModal
        reservation={{
          id: reservation.id,
          title: reservation.title,
          startTime: reservation.startTime,
          resource: { name: reservation.resource.name },
        }}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => router.push('/dashboard/reservations')}
      />
    </>
  );
}
