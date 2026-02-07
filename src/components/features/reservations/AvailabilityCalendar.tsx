'use client';

import { DayPicker } from 'react-day-picker';
import { addDays, startOfToday } from 'date-fns';
import 'react-day-picker/dist/style.css';

interface Resource {
  id: string;
  name: string;
  availability: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}

interface AvailabilityCalendarProps {
  resource: Resource;
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
}

export function AvailabilityCalendar({
  resource,
  selectedDate,
  onDateSelect,
}: AvailabilityCalendarProps) {
  const today = startOfToday();
  const maxDate = addDays(today, 14); // 14 days in advance

  // Get available days of the week from resource availability
  const availableDaysOfWeek = resource.availability.map((avail) => avail.dayOfWeek);

  // Disable dates that are:
  // 1. In the past
  // 2. More than 14 days in the future
  // 3. Not in the resource's availability schedule
  function isDateDisabled(date: Date): boolean {
    // IMPORTANT: Use Chile timezone to match the API's day-of-week calculation
    // The API uses Chile timezone when checking ResourceAvailability.dayOfWeek
    const dayOfWeek = new Date(
      date.toLocaleString('en-US', { timeZone: 'America/Santiago' })
    ).getDay();

    // Check if date is in the past
    if (date < today) {
      return true;
    }

    // Check if date is more than 14 days in the future
    if (date > maxDate) {
      return true;
    }

    // Check if day of week is available
    if (!availableDaysOfWeek.includes(dayOfWeek)) {
      return true;
    }

    return false;
  }

  return (
    <div className="flex flex-col items-center">
      <style jsx global>{`
        .rdp {
          --rdp-accent-color: #2563eb;
        }
        .rdp-day:not(.rdp-day_disabled) {
          color: #1f2937 !important;
          font-weight: 500;
        }
        .rdp-day:not(.rdp-day_disabled):hover {
          background-color: #dbeafe !important;
          color: #1e40af !important;
        }
        .rdp-day_disabled {
          color: #d1d5db !important;
          opacity: 0.5;
        }
        .rdp-day_selected {
          background-color: #2563eb !important;
          color: white !important;
          font-weight: 600;
        }
        .rdp-day_today:not(.rdp-day_disabled) {
          font-weight: 700;
          border: 2px solid #2563eb;
        }
      `}</style>
      <DayPicker
        mode="single"
        selected={selectedDate || undefined}
        onSelect={(date) => onDateSelect(date || null)}
        disabled={isDateDisabled}
        fromDate={today}
        toDate={maxDate}
        className="border border-gray-200 rounded-lg p-4 bg-white"
      />
      <div className="mt-4 text-sm text-gray-600 space-y-1">
        <p className="flex items-center">
          <span className="w-6 h-6 rounded bg-white border border-gray-300 mr-2"></span>
          Disponible
        </p>
        <p className="flex items-center">
          <span className="w-6 h-6 rounded bg-gray-100 text-gray-400 border border-gray-200 mr-2"></span>
          No disponible
        </p>
        <p className="flex items-center">
          <span className="w-6 h-6 rounded bg-blue-600 mr-2"></span>
          Seleccionado
        </p>
      </div>
    </div>
  );
}
