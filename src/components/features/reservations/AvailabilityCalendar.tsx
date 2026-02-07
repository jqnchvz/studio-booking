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
    const dayOfWeek = date.getDay();

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
      <DayPicker
        mode="single"
        selected={selectedDate || undefined}
        onSelect={(date) => onDateSelect(date || null)}
        disabled={isDateDisabled}
        fromDate={today}
        toDate={maxDate}
        modifiersClassNames={{
          selected: 'bg-blue-600 text-white hover:bg-blue-700',
          today: 'font-bold border-2 border-blue-600',
        }}
        className="border border-gray-200 rounded-lg p-4 bg-white"
        styles={{
          day_button: {
            cursor: 'pointer',
          },
        }}
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
