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

  // Debug logging
  console.log('Resource:', resource.name);
  console.log('Availability schedules:', resource.availability.length);
  console.log('Available days of week:', availableDaysOfWeek);

  // Disable dates that are:
  // 1. In the past
  // 2. More than 14 days in the future
  // 3. Not in the resource's availability schedule
  function isDateDisabled(date: Date): boolean {
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];

    // Check if date is in the past
    if (date < today) {
      console.log(`${dateStr} - DISABLED (in past)`);
      return true;
    }

    // Check if date is more than 14 days in the future
    if (date > maxDate) {
      console.log(`${dateStr} - DISABLED (beyond 14 days)`);
      return true;
    }

    // Check if day of week is available
    if (!availableDaysOfWeek.includes(dayOfWeek)) {
      console.log(`${dateStr} - DISABLED (day ${dayOfWeek} not in schedule)`);
      return true;
    }

    console.log(`${dateStr} - ENABLED (day ${dayOfWeek})`);
    return false;
  }

  return (
    <div className="flex justify-center">
      <DayPicker
        mode="single"
        selected={selectedDate || undefined}
        onSelect={(date) => onDateSelect(date || null)}
        disabled={isDateDisabled}
        fromDate={today}
        toDate={maxDate}
        modifiersClassNames={{
          selected: 'bg-blue-600 text-white hover:bg-blue-700',
          today: 'font-bold text-blue-600',
        }}
        className="border border-gray-200 rounded-lg p-4"
      />
    </div>
  );
}
