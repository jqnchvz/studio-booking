'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, List, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReservationListItem } from '@/types/admin';

interface ReservationCalendarProps {
  reservations: ReservationListItem[];
  resources: Array<{ id: string; name: string }>;
  initialMonth: string; // 'YYYY-MM'
  initialResourceId: string;
}

/** Days of week header, Monday-first, in Spanish */
const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** Max reservation chips shown per day cell before "+N más" overflow */
const MAX_CHIPS = 3;

/**
 * Extract day-of-month from ISO string using Chile timezone.
 * Critical: a date at 23:00 UTC is the next day in Santiago (UTC-3 in summer).
 */
function getChileDay(isoString: string): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Santiago',
      day: 'numeric',
    }).format(new Date(isoString)),
    10
  );
}

/**
 * Extract HH:MM time from ISO string using Chile timezone.
 */
function getChileTime(isoString: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString));
}

/**
 * Get Tailwind classes for a chip based on reservation status.
 * Colors match the existing Badge variants in ReservationTable.
 */
function getChipClasses(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    case 'completed':
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  }
}

/**
 * Get the first day-of-week (0=Mon … 6=Sun) for day 1 of a month.
 * JS getDay() returns 0=Sun so we convert with (day + 6) % 7.
 */
function getFirstDayOffset(year: number, month: number): number {
  const jsDay = new Date(year, month - 1, 1).getDay();
  return (jsDay + 6) % 7;
}

/** Total days in a given month */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Format 'YYYY-MM' to Spanish month/year label (e.g. "Febrero 2026").
 */
function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CL', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Santiago',
  }).format(new Date(year, month - 1, 1));
}

/**
 * Navigate to the previous or next month, returning a 'YYYY-MM' string.
 */
function shiftMonth(yearMonth: string, delta: number): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Current month in Chile timezone as 'YYYY-MM'.
 */
function currentChileMonth(): string {
  const now = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date());
  // en-CA format is 'YYYY-MM' (ISO-like)
  return now;
}

/**
 * Today's day-of-month in Chile timezone.
 */
function todayChileDay(): { year: number; month: number; day: number } {
  const str = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [year, month, day] = str.split('-').map(Number);
  return { year, month, day };
}

/**
 * ReservationCalendar
 *
 * Client component that renders a monthly CSS Grid calendar.
 * Month navigation and resource filter update the URL (shareable state).
 */
export function ReservationCalendar({
  reservations,
  resources,
  initialMonth,
  initialResourceId,
}: ReservationCalendarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [month, setMonth] = useState(initialMonth);
  const [resourceId, setResourceId] = useState(initialResourceId);

  const today = todayChileDay();
  const [year, monthNum] = month.split('-').map(Number);
  const firstDayOffset = getFirstDayOffset(year, monthNum);
  const daysInMonth = getDaysInMonth(year, monthNum);

  /**
   * Build a Map<day, ReservationListItem[]> for O(1) lookup per cell.
   * Only includes reservations that actually belong to the current month/year in Chile.
   */
  const reservationsByDay = new Map<number, ReservationListItem[]>();
  for (const r of reservations) {
    const d = getChileDay(r.startTime);
    if (!reservationsByDay.has(d)) reservationsByDay.set(d, []);
    reservationsByDay.get(d)!.push(r);
  }

  const updateUrl = useCallback(
    (updates: { month?: string; resourceId?: string }) => {
      const params = new URLSearchParams(searchParams);
      if (updates.month !== undefined) {
        params.set('month', updates.month);
      }
      if (updates.resourceId !== undefined) {
        if (updates.resourceId) {
          params.set('resourceId', updates.resourceId);
        } else {
          params.delete('resourceId');
        }
      }
      router.push(`/admin/reservations/calendar?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handlePrevMonth = () => {
    const next = shiftMonth(month, -1);
    setMonth(next);
    updateUrl({ month: next });
  };

  const handleNextMonth = () => {
    const next = shiftMonth(month, 1);
    setMonth(next);
    updateUrl({ month: next });
  };

  const handleToday = () => {
    const current = currentChileMonth();
    setMonth(current);
    updateUrl({ month: current });
  };

  const handleResourceChange = (id: string) => {
    setResourceId(id);
    updateUrl({ resourceId: id });
  };

  /**
   * Total grid cells: leading empties + days + trailing empties to complete last row.
   */
  const totalCells = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7;

  return (
    <div className="space-y-4">
      {/* Top bar: month nav + resource filter + view toggle */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth} aria-label="Mes anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[160px] text-center capitalize">
            {formatMonthLabel(month)}
          </h2>
          <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Mes siguiente">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Hoy
          </Button>
        </div>

        {/* Resource filter */}
        <select
          value={resourceId}
          onChange={(e) => handleResourceChange(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background min-w-[160px]"
        >
          <option value="">Todos los recursos</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        {/* View toggle — pushed to the right */}
        <div className="ml-auto flex gap-1 border rounded-md p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/reservations')}
            className="flex items-center gap-1.5"
          >
            <List className="h-4 w-4" />
            Tabla
          </Button>
          <Button
            size="sm"
            className="flex items-center gap-1.5"
            disabled
          >
            <CalendarDays className="h-4 w-4" />
            Calendario
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-muted">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells grid */}
        <div className="grid grid-cols-7 border-t">
          {Array.from({ length: totalCells }, (_, i) => {
            const dayNum = i - firstDayOffset + 1;
            const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
            const isToday =
              isCurrentMonth &&
              today.year === year &&
              today.month === monthNum &&
              today.day === dayNum;
            const cellReservations = isCurrentMonth
              ? (reservationsByDay.get(dayNum) ?? [])
              : [];
            const visible = cellReservations.slice(0, MAX_CHIPS);
            const overflow = cellReservations.length - MAX_CHIPS;

            // Weekend: column indices 5 and 6 (Sáb, Dom) — (i % 7) gives col index
            const colIndex = i % 7;
            const isWeekend = colIndex === 5 || colIndex === 6;

            return (
              <div
                key={i}
                className={[
                  'min-h-[110px] p-1.5 border-b border-r text-sm',
                  !isCurrentMonth && 'bg-muted/30',
                  isCurrentMonth && isWeekend && 'bg-muted/10',
                  // Remove right border from last column
                  colIndex === 6 && 'border-r-0',
                ].filter(Boolean).join(' ')}
              >
                {isCurrentMonth && (
                  <>
                    {/* Day number */}
                    <div className="flex justify-end mb-1">
                      <span
                        className={[
                          'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                          isToday
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground',
                        ].join(' ')}
                      >
                        {dayNum}
                      </span>
                    </div>

                    {/* Reservation chips */}
                    <div className="space-y-0.5">
                      {visible.map((r) => (
                        <button
                          key={r.id}
                          onClick={() =>
                            router.push(`/admin/reservations/${r.id}`)
                          }
                          title={`${r.title} · ${r.user.name}`}
                          className={[
                            'w-full text-left text-[11px] px-1.5 py-0.5 rounded truncate',
                            'transition-colors cursor-pointer',
                            getChipClasses(r.status),
                          ].join(' ')}
                        >
                          {r.resource.name} · {getChileTime(r.startTime)}
                        </button>
                      ))}

                      {/* Overflow indicator */}
                      {overflow > 0 && (
                        <p className="text-[11px] text-muted-foreground px-1.5">
                          +{overflow} más
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-200 inline-block" />
          Confirmada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-yellow-200 inline-block" />
          Pendiente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-200 inline-block" />
          Cancelada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gray-200 inline-block" />
          Completada
        </span>
      </div>
    </div>
  );
}
