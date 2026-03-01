'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface FilterCount {
  all: number;
  upcoming: number;
  past: number;
  cancelled: number;
}

interface ReservationFiltersProps {
  counts?: FilterCount;
}

export function ReservationFilters({ counts }: ReservationFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTimeframe = searchParams.get('timeframe') || 'all';
  const currentStatus = searchParams.get('status') || 'all';

  function handleFilterChange(timeframe: string, status: string = 'all') {
    const params = new URLSearchParams();

    if (timeframe !== 'all') {
      params.set('timeframe', timeframe);
    }

    if (status !== 'all') {
      params.set('status', status);
    }

    // Reset to page 1 when filters change
    params.set('page', '1');

    const queryString = params.toString();
    router.push(`/dashboard/reservations${queryString ? `?${queryString}` : ''}`);
  }

  const filters = [
    {
      id: 'all',
      label: 'Todas',
      timeframe: 'all',
      status: 'all',
      count: counts?.all,
    },
    {
      id: 'upcoming',
      label: 'Próximas',
      timeframe: 'upcoming',
      status: 'all',
      count: counts?.upcoming,
    },
    {
      id: 'past',
      label: 'Pasadas',
      timeframe: 'past',
      status: 'all',
      count: counts?.past,
    },
    {
      id: 'cancelled',
      label: 'Canceladas',
      timeframe: 'all',
      status: 'cancelled',
      count: counts?.cancelled,
    },
  ];

  const activeFilter = filters.find(
    (f) => f.timeframe === currentTimeframe && f.status === currentStatus
  ) || filters[0];

  return (
    <div className="border-b border-border mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {filters.map((filter) => {
          const isActive = filter.id === activeFilter.id;

          return (
            <button
              key={filter.id}
              onClick={() => handleFilterChange(filter.timeframe, filter.status)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition
                ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {filter.label}
              {filter.count !== undefined && (
                <span
                  className={`
                    ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium
                    ${
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted text-foreground'
                    }
                  `}
                >
                  {filter.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
