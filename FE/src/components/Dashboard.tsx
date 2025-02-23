import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCalendarStore } from '../store/calendarStore';
import Navbar from './Navbar';
import WeekView from './WeekView';
import EventForm from './EventForm';
import AnalyticsDashboard from './AnalyticDashboard';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import parse from 'html-react-parser'; // Import html-react-parser

const localizer = momentLocalizer(moment);

const dashboardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
};

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

function Dashboard() {
  const { user } = useAuthStore();
  const { events } = useCalendarStore();
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  if (!user) {
    return <div className="p-8 text-gray-500">Please log in to see your dashboard.</div>;
  }

  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: new Date(event.startTime),
    end: new Date(event.endTime),
    desc: event.description,
    location: event.location,
    type: event.type || 'event',
  }));

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const closeModal = () => {
    setSelectedEvent(null);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={dashboardVariants}
      className="bg-gray-100 min-h-screen font-sans"
    >
      <Navbar />
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          variants={dashboardVariants}
          className="flex justify-between items-center mb-8"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome, {user.name}!
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEventFormOpen(true)}
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-md hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200"
          >
            New Event
          </motion.button>
        </motion.div>

        {/* Analytics Dashboard */}
        <motion.div variants={dashboardVariants} className="mb-8">
          <AnalyticsDashboard />
        </motion.div>

        {/* Full Calendar View */}
        <motion.div
          variants={dashboardVariants}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Google Calendar</h3>
          <div className="rounded-lg overflow-hidden">
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500 }}
              onSelectEvent={handleEventClick}
              className="custom-calendar"
              eventPropGetter={(event) => ({
                style: {
                  backgroundColor: event.type === 'meeting' ? '#e0e7ff' : '#d1fae5',
                  color: '#1f2937',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px',
                  fontWeight: '500',
                },
              })}
            />
          </div>
        </motion.div>

        {/* Week View */}
        <motion.div variants={dashboardVariants} className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Weekly Calendar</h3>
          <WeekView />
        </motion.div>

        {/* Event Form Modal */}
        {isEventFormOpen && <EventForm onClose={() => setIsEventFormOpen(false)} />}

        {/* Calendar Event Modal */}
        <AnimatePresence>
          {selectedEvent && (
            <>
              <motion.div
                variants={backdropVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={closeModal}
              />
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 flex items-center justify-center z-50 p-6"
              >
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
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
                        {format(selectedEvent.start, 'MMMM d, yyyy h:mm a')} -{' '}
                        {format(selectedEvent.end, 'h:mm a')}
                      </p>
                    </div>
                    {selectedEvent.location && (
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="text-base text-gray-900">{selectedEvent.location}</p>
                      </div>
                    )}
                    {selectedEvent.desc && (
                      <div>
                        <p className="text-sm text-gray-500">Description</p>
                        <div className="text-base text-gray-900 prose">
                          {parse(selectedEvent.desc)}
                        </div>
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
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors duration-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default Dashboard;