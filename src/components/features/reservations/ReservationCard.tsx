'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CancelReservationModal } from './CancelReservationModal';

interface Resource {
  id: string;
  name: string;
  type: string;
  capacity: number | null;
}

interface Reservation {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'pending';
  attendees: number;
  resource: Resource;
  createdAt: string;
  updatedAt: string;
}

interface ReservationCardProps {
  reservation: Reservation;
  onCancelSuccess?: () => void;
}

export function ReservationCard({ reservation, onCancelSuccess }: ReservationCardProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const startTime = new Date(reservation.startTime);
  const endTime = new Date(reservation.endTime);
  const now = new Date();
  const isUpcoming = startTime > now;
  const isPast = endTime < now;
  const canCancel = reservation.status === 'confirmed' && isUpcoming;

  // Calculate duration in hours and minutes
  const durationMs = endTime.getTime() - startTime.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  // Format date and time
  const dateText = startTime.toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeText = `${startTime.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${endTime.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  // Status badge styling
  const statusConfig = {
    confirmed: {
      bg: 'bg-success/15',
      text: 'text-success',
      label: 'Confirmada',
    },
    cancelled: {
      bg: 'bg-destructive/15',
      text: 'text-destructive',
      label: 'Cancelada',
    },
    completed: {
      bg: 'bg-muted',
      text: 'text-muted-foreground',
      label: 'Completada',
    },
    pending: {
      bg: 'bg-warning/15',
      text: 'text-warning',
      label: 'Pendiente',
    },
  };

  const status = statusConfig[reservation.status] || statusConfig.pending;

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition p-6">
      {/* Header: Resource and Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">
            {reservation.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {reservation.resource.name} • {reservation.resource.type}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
        >
          {status.label}
        </span>
      </div>

      {/* Description (if exists) */}
      {reservation.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {reservation.description}
        </p>
      )}

      {/* Date and Time */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-foreground">
          <svg
            className="w-4 h-4 mr-2 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="capitalize">{dateText}</span>
        </div>

        <div className="flex items-center text-sm text-foreground">
          <svg
            className="w-4 h-4 mr-2 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{timeText}</span>
          <span className="ml-2 text-muted-foreground">({durationText})</span>
        </div>

        <div className="flex items-center text-sm text-foreground">
          <svg
            className="w-4 h-4 mr-2 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span>{reservation.attendees} asistente{reservation.attendees !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Timestamp */}
      {isUpcoming && (
        <p className="text-xs text-muted-foreground mb-4">
          Comienza {formatDistanceToNow(startTime, { addSuffix: true, locale: es })}
        </p>
      )}

      {isPast && (
        <p className="text-xs text-muted-foreground mb-4">
          Terminó {formatDistanceToNow(endTime, { addSuffix: true, locale: es })}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-border">
        <Link
          href={`/dashboard/reservations/${reservation.id}`}
          className="flex-1 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md border border-primary/30 transition text-center"
        >
          Ver Detalles
        </Link>

        {canCancel && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="flex-1 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md border border-destructive/30 transition"
          >
            Cancelar
          </button>
        )}
      </div>

      {/* Cancel Modal */}
      <CancelReservationModal
        reservation={{
          id: reservation.id,
          title: reservation.title,
          startTime: reservation.startTime,
          resource: {
            name: reservation.resource.name,
          },
        }}
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onSuccess={() => {
          setShowCancelModal(false);
          onCancelSuccess?.();
        }}
      />
    </div>
  );
}
