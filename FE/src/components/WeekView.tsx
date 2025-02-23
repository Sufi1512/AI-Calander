// src/components/WeekView.tsx
import React from 'react';
import { useCalendarStore } from '../store/calendarStore';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Clock } from 'lucide-react';

function WeekView() {
  const { events, selectedDate } = useCalendarStore();

  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="overflow-auto">
      <div className="flex min-w-full">
        {/* Time column */}
        <div className="w-20 flex-none border-r border-gray-200">
          <div className="h-12 border-b border-gray-200" /> {/* Header spacer */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-12 border-b border-gray-200 text-xs text-gray-500 text-right pr-2"
            >
              {format(new Date().setHours(hour), 'ha')}
            </div>
          ))}
        </div>

        {/* Days */}
        {weekDays.map((day) => (
          <div key={day.toString()} className="flex-1 border-r border-gray-200">
            {/* Day header */}
            <div className="h-12 border-b border-gray-200 text-center">
              <div className="text-sm font-semibold">{format(day, 'EEE')}</div>
              <div className="text-xs text-gray-500">{format(day, 'MMM d')}</div>
            </div>

            {/* Hours */}
            {hours.map((hour) => {
              const currentEvents = events.filter((event) => {
                const eventDate = new Date(event.startTime);
                return (
                  isSameDay(eventDate, day) && eventDate.getHours() === hour
                );
              });

              return (
                <div
                  key={hour}
                  className="h-12 border-b border-gray-200 relative"
                >
                  {currentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="absolute inset-1 rounded-lg bg-indigo-100 border border-indigo-200 p-1 text-xs overflow-hidden"
                      style={{
                        top: '0.25rem',
                        height: 'calc(100% - 0.5rem)',
                      }}
                    >
                      <div className="font-semibold text-indigo-700">
                        {event.title}
                      </div>
                      {event.location && (
                        <div className="text-indigo-500 truncate">
                          {event.location}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default WeekView;