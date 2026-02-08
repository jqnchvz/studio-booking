'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ReservationCard } from '@/components/features/reservations/ReservationCard';
import { ReservationFilters } from '@/components/features/reservations/ReservationFilters';

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

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function ReservationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<{
    all: number;
    upcoming: number;
    past: number;
    cancelled: number;
  } | null>(null);

  const timeframe = searchParams.get('timeframe') || 'all';
  const status = searchParams.get('status') || 'all';
  const page = searchParams.get('page') || '1';

  useEffect(() => {
    async function fetchReservations() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (timeframe !== 'all') params.set('timeframe', timeframe);
        if (status !== 'all') params.set('status', status);
        params.set('page', page);

        const response = await fetch(`/api/reservations?${params.toString()}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al cargar las reservas');
        }

        const data = await response.json();
        setReservations(data.reservations);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    fetchReservations();
  }, [timeframe, status, page]);

  // Fetch counts for filter tabs
  useEffect(() => {
    async function fetchCounts() {
      try {
        const [allRes, upcomingRes, pastRes, cancelledRes] = await Promise.all([
          fetch('/api/reservations?limit=1').then((r) => r.json()),
          fetch('/api/reservations?timeframe=upcoming&limit=1').then((r) => r.json()),
          fetch('/api/reservations?timeframe=past&limit=1').then((r) => r.json()),
          fetch('/api/reservations?status=cancelled&limit=1').then((r) => r.json()),
        ]);

        setCounts({
          all: allRes.pagination?.total || 0,
          upcoming: upcomingRes.pagination?.total || 0,
          past: pastRes.pagination?.total || 0,
          cancelled: cancelledRes.pagination?.total || 0,
        });
      } catch (err) {
        console.error('Failed to fetch counts:', err);
      }
    }

    fetchCounts();
  }, []);

  function handleCancel(reservationId: string) {
    // TODO: Implement cancellation modal in RES-73
    alert('Funcionalidad de cancelación próximamente (RES-73)');
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/dashboard/reservations?${params.toString()}`);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Reservas</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona tus reservas de espacios
          </p>
        </div>
        <Link
          href="/dashboard/reservations/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Nueva Reserva
        </Link>
      </div>

      {/* Filters */}
      <ReservationFilters counts={counts || undefined} />

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && reservations.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No hay reservas
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {timeframe === 'upcoming'
              ? 'No tienes reservas próximas.'
              : timeframe === 'past'
              ? 'No tienes reservas pasadas.'
              : status === 'cancelled'
              ? 'No tienes reservas canceladas.'
              : 'Comienza creando tu primera reserva.'}
          </p>
          {timeframe === 'all' && status === 'all' && (
            <div className="mt-6">
              <Link
                href="/dashboard/reservations/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Crear Primera Reserva
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Reservations Grid */}
      {!loading && !error && reservations.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {reservations.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                onCancel={handleCancel}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando{' '}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{' '}
                    a{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    de <span className="font-medium">{pagination.total}</span> reservas
                  </p>
                </div>
                <div>
                  <nav
                    className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Anterior</span>
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                      (pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            pageNum === pagination.page
                              ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    )}

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Siguiente</span>
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
