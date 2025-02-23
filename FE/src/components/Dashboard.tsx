// // src/components/Dashboard.tsx
// import React, { useState } from 'react';
// import { useAuthStore } from '../store/authStore';
// import { useCalendarStore } from '../store/calendarStore';
// import Navbar from './Navbar';
// import WeekView from './WeekView';
// import EventForm from './EventForm';
// import AnalyticsDashboard from './AnalyticDashborad'; // New import
// import { Calendar, momentLocalizer } from 'react-big-calendar';
// import moment from 'moment';
// import 'react-big-calendar/lib/css/react-big-calendar.css';

// const localizer = momentLocalizer(moment);

// function Dashboard() {
//   const { user } = useAuthStore();
//   const { events } = useCalendarStore();
//   const [isEventFormOpen, setIsEventFormOpen] = useState(false);

//   if (!user) {
//     return <div>Please log in to see your dashboard.</div>;
//   }

//   // Format events for react-big-calendar
//   const calendarEvents = events.map((event) => ({
//     id: event.id,
//     title: event.title,
//     start: new Date(event.startTime),
//     end: new Date(event.endTime),
//     desc: event.description,
//     location: event.location,
//   }));

//   return (
//     <div>
//       <Navbar />
//       <div className="p-6 max-w-7xl mx-auto">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-semibold text-gray-900">
//             Welcome, {user.name}!
//           </h2>
//           <button
//             onClick={() => setIsEventFormOpen(true)}
//             className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
//           >
//             New Event
//           </button>
//         </div>

//         {/* Analytics Dashboard */}
//         <AnalyticsDashboard />

//         {/* Full Calendar View */}
//         <div className="bg-white shadow rounded-lg p-6 mb-8">
//           <h3 className="text-lg font-medium text-gray-900 mb-4">Your Google Calendar</h3>
//           <Calendar
//             localizer={localizer}
//             events={calendarEvents}
//             startAccessor="start"
//             endAccessor="end"
//             style={{ height: 500 }}
//             onSelectEvent={(event) => alert(`${event.title}\n${event.desc || ''}\nLocation: ${event.location || 'N/A'}`)}
//           />
//         </div>

//         {/* Week View */}
//         <div className="bg-white shadow rounded-lg p-6">
//           <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Calendar</h3>
//           <WeekView />
//         </div>

//         {/* Event Form Modal */}
//         {isEventFormOpen && <EventForm onClose={() => setIsEventFormOpen(false)} />}
//       </div>
//     </div>
//   );
// }

// export default Dashboard;

// src/components/Dashboard.tsx
import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCalendarStore } from '../store/calendarStore';
import Navbar from './Navbar';
import WeekView from './WeekView';
import EventForm from './EventForm';
import AnalyticsDashboard from './AnalyticDashboard'; // Updated import
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion } from 'framer-motion';

const localizer = momentLocalizer(moment);

// Animation variants for Dashboard
const dashboardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
};

function Dashboard() {
  const { user } = useAuthStore();
  const { events } = useCalendarStore();
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);

  if (!user) {
    return <div>Please log in to see your dashboard.</div>;
  }

  // Format events for react-big-calendar
  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: new Date(event.startTime),
    end: new Date(event.endTime),
    desc: event.description,
    location: event.location,
  }));

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={dashboardVariants}
    >
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto">
        <motion.div variants={dashboardVariants} className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Welcome, {user.name}!
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEventFormOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-transform duration-200"
          >
            New Event
          </motion.button>
        </motion.div>

        {/* Analytics Dashboard */}
        <AnalyticsDashboard />

        {/* Full Calendar View */}
        <motion.div variants={dashboardVariants} className="bg-white shadow rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Google Calendar</h3>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            onSelectEvent={(event) => alert(`${event.title}\n${event.desc || ''}\nLocation: ${event.location || 'N/A'}`)}
          />
        </motion.div>

        {/* Week View */}
        <motion.div variants={dashboardVariants} className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Calendar</h3>
          <WeekView />
        </motion.div>

        {/* Event Form Modal */}
        {isEventFormOpen && <EventForm onClose={() => setIsEventFormOpen(false)} />}
      </div>
    </motion.div>
  );
}

export default Dashboard;