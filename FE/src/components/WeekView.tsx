// src/components/WeekView.tsx
import React, { useState } from 'react';
import { useCalendarStore } from '../store/calendarStore';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function WeekView() {
  const { events, selectedDate } = useCalendarStore();
  const [selectedEvent, setSelectedEvent] = useState(null);

  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Animation variants for the WeekView
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  const eventHover = {
    rest: { scale: 1, boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' },
    hover: { scale: 1.02, boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.15)', transition: { duration: 0.2 } },
  };

  // Animation variants for the modal
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  // Handle event click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  // Close modal
  const closeModal = () => {
    setSelectedEvent(null);
  };

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="overflow-auto bg-gray-50 rounded-xl shadow-lg p-4"
      >
        <div className="flex min-w-full">
          {/* Time Column */}
          <div className="w-20 flex-none border-r border-gray-200 bg-white">
            <div className="h-16 border-b border-gray-200 flex items-center justify-center">
              <Clock className="h-5 w-5 text-indigo-500" />
            </div>
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-16 border-b border-gray-200 text-sm text-gray-600 text-right pr-3 flex items-center justify-end"
              >
                {format(new Date().setHours(hour), 'ha')}
              </div>
            ))}
          </div>

          {/* Days */}
          {weekDays.map((day) => (
            <div key={day.toString()} className="flex-1 border-r border-gray-200 last:border-r-0">
              {/* Day Header */}
              <div className="h-16 border-b border-gray-200 text-center bg-white">
                <div className="text-base font-semibold text-gray-900">{format(day, 'EEE')}</div>
                <div className="text-sm text-gray-500">{format(day, 'MMM d')}</div>
              </div>

              {/* Hours */}
              {hours.map((hour) => {
                const currentEvents = events.filter((event) => {
                  const eventDate = new Date(event.startTime);
                  return isSameDay(eventDate, day) && eventDate.getHours() === hour;
                });

                return (
                  <div
                    key={hour}
                    className="h-16 border-b border-gray-200 relative bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    {currentEvents.map((event) => (
                      <motion.div
                        key={event.id}
                        variants={eventHover}
                        initial="rest"
                        whileHover="hover"
                        onClick={() => handleEventClick(event)}
                        className={`absolute inset-2 rounded-lg p-2 text-sm overflow-hidden shadow-md cursor-pointer ${
                          event.type === 'meeting'
                            ? 'bg-indigo-100 border-indigo-200'
                            : 'bg-emerald-100 border-emerald-200'
                        }`}
                        style={{
                          top: '0.5rem',
                          height: 'calc(100% - 1rem)',
                        }}
                      >
                        <div className="font-semibold text-gray-900 truncate">{event.title}</div>
                        {event.location && (
                          <div className="text-xs text-gray-600 truncate">{event.location}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(event.startTime), 'h:mm a')} -{' '}
                          {format(new Date(event.endTime), 'h:mm a')}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            {/* Backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={closeModal}
            />

            {/* Modal Content */}
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{selectedEvent.title}</h3>
                  <button
                    onClick={closeModal}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="text-base text-gray-900">
                      {format(new Date(selectedEvent.startTime), 'MMMM d, yyyy h:mm a')} -{' '}
                      {format(new Date(selectedEvent.endTime), 'h:mm a')}
                    </p>
                  </div>

                  {selectedEvent.location && (
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="text-base text-gray-900">{selectedEvent.location}</p>
                    </div>
                  )}

                  {selectedEvent.description && (
                    <div>
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="text-base text-gray-900">{selectedEvent.description}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedEvent.type === 'meeting'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {selectedEvent.type}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default WeekView;