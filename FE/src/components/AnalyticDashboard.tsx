import React, { useMemo, useState } from 'react';
import { useCalendarStore } from '../store/calendarStore';
import { BarChart, Clock, Users, Calendar } from 'lucide-react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { motion } from 'framer-motion';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  startOfDay, 
  endOfDay, 
  startOfYear, 
  endOfYear, 
  isWithinInterval,
  addDays, // Added missing import
  parseISO // Added for safer date parsing
} from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// Time period options
type TimePeriod = 'day' | 'week' | 'month' | 'year';

export default function AnalyticsDashboard() {
  const events = useCalendarStore((state) => state.events);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');

  // Filter events based on time period
  const getFilteredEvents = (period: TimePeriod) => {
    const now = new Date();
    return events.filter((event) => {
      const eventDate = parseISO(event.startTime); // Safely parse ISO string
      switch (period) {
        case 'day':
          return isWithinInterval(eventDate, { start: startOfDay(now), end: endOfDay(now) });
        case 'week':
          return isWithinInterval(eventDate, { start: startOfWeek(now), end: endOfWeek(now) });
        case 'month':
          return isWithinInterval(eventDate, { start: startOfMonth(now), end: endOfMonth(now) });
        case 'year':
          return isWithinInterval(eventDate, { start: startOfYear(now), end: endOfYear(now) });
        default:
          return false;
      }
    });
  };

  const filteredEvents = useMemo(() => getFilteredEvents(timePeriod), [events, timePeriod]); // Memoize filtered events

  // Calculate analytics for filtered events
  const analytics = useMemo(() => {
    return {
      totalMeetings: filteredEvents.filter((e) => e.type === 'meeting').length,
      meetingHours: filteredEvents
        .filter((e) => e.type === 'meeting')
        .reduce((acc, event) => {
          const duration = new Date(event.endTime).getTime() - new Date(event.startTime).getTime();
          return acc + duration / (1000 * 60 * 60);
        }, 0),
      activeTasks: filteredEvents.filter((e) => e.type === 'task').length,
      totalEvents: filteredEvents.length
    };
  }, [filteredEvents]);

  // Get period labels based on selected time period
  const getPeriodLabels = (period: TimePeriod): string[] => {
    const now = new Date();
    switch (period) {
      case 'day':
        return ['Today'];
      case 'week':
        const weekStart = startOfWeek(now);
        return Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'EEE, MMM d'));
      case 'month':
        const monthStart = startOfMonth(now);
        const daysInMonth = getDaysInMonth(monthStart);
        return daysInMonth.map(date => format(date, 'd MMM'));
      case 'year':
        return Array.from({ length: 12 }, (_, i) => format(new Date(now.getFullYear(), i, 1), 'MMM'));
      default:
        return [];
    }
  };

  // Helper function to get array of dates in a month
  const getDaysInMonth = (date: Date): Date[] => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days: Date[] = [];
    let current = start;
    
    while (current <= end) {
      days.push(current);
      current = addDays(current, 1);
    }
    
    return days;
  };

  const periodLabels = useMemo(() => getPeriodLabels(timePeriod), [timePeriod]);

  // Calculate period events
  const periodEvents = useMemo(() => {
    return periodLabels.map((label) => {
      const date = parseISO(label);
      if (timePeriod === 'day') {
        return filteredEvents.filter((e) => 
          isWithinInterval(parseISO(e.startTime), { 
            start: startOfDay(date), 
            end: endOfDay(date) 
          })
        ).length;
      } else if (timePeriod === 'week') {
        return filteredEvents.filter((e) => 
          isWithinInterval(parseISO(e.startTime), { 
            start: startOfWeek(date), 
            end: endOfWeek(date) 
          })
        ).length;
      } else if (timePeriod === 'month') {
        return filteredEvents.filter((e) => 
          isWithinInterval(parseISO(e.startTime), { 
            start: startOfMonth(date), 
            end: endOfMonth(date) 
          })
        ).length;
      } else {
        return filteredEvents.filter((e) => 
          parseISO(e.startTime).getMonth() === date.getMonth()
        ).length;
      }
    });
  }, [filteredEvents, periodLabels, timePeriod]);

  // Event type distribution
  const { typeLabels, typeData } = useMemo(() => {
    const types = filteredEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      typeLabels: Object.keys(types),
      typeData: Object.values(types)
    };
  }, [filteredEvents]);

  // Chart data
  const barData = useMemo(() => ({
    labels: periodLabels,
    datasets: [
      {
        label: 'Events',
        data: periodEvents,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  }), [periodLabels, periodEvents]);

  const pieData = useMemo(() => ({
    labels: typeLabels,
    datasets: [
      {
        data: typeData,
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }), [typeLabels, typeData]);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  const cardHover = {
    rest: { scale: 1 },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="p-4"
    >
      <div className="flex justify-between items-center mb-4">
        <motion.h2
          variants={fadeIn}
          className="text-xl font-semibold text-gray-900"
        >
          Analytics Dashboard
        </motion.h2>
        <motion.select
          variants={fadeIn}
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
          className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white hover:bg-gray-50 transition-colors duration-200"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </motion.select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <motion.div variants={fadeIn} className="flex flex-col gap-3">
          <motion.div
            variants={fadeIn}
            whileHover={cardHover}
            className="bg-white overflow-hidden shadow rounded-lg p-3 hover:shadow-md transition-all duration-300 w-full"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-4 w-4 text-gray-400" />
              </div>
              <div className="ml-2 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Total Meetings</dt>
                  <dd className="flex items-baseline">
                    <div className="text-base font-semibold text-gray-900">{analytics.totalMeetings}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </motion.div>
          <motion.div
            variants={fadeIn}
            whileHover={cardHover}
            className="bg-white overflow-hidden shadow rounded-lg p-3 hover:shadow-md transition-all duration-300 w-full"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-4 w-4 text-gray-400" />
              </div>
              <div className="ml-2 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Meeting Hours</dt>
                  <dd className="flex items-baseline">
                    <div className="text-base font-semibold text-gray-900">{analytics.meetingHours.toFixed(1)}h</div>
                  </dd>
                </dl>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div variants={fadeIn} className="flex flex-col gap-3">
          <motion.div
            variants={fadeIn}
            whileHover={cardHover}
            className="bg-white overflow-hidden shadow rounded-lg p-3 hover:shadow-md transition-all duration-300 w-full"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <div className="ml-2 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Active Tasks</dt>
                  <dd className="flex items-baseline">
                    <div className="text-base font-semibold text-gray-900">{analytics.activeTasks}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </motion.div>
          <motion.div
            variants={fadeIn}
            whileHover={cardHover}
            className="bg-white overflow-hidden shadow rounded-lg p-3 hover:shadow-md transition-all duration-300 w-full"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart className="h-4 w-4 text-gray-400" />
              </div>
              <div className="ml-2 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Total Events</dt>
                  <dd className="flex items-baseline">
                    <div className="text-base font-semibold text-gray-900">{analytics.totalEvents}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>


      
    </motion.div>
  );
}