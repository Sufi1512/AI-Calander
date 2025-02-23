import React, { useMemo, useState } from 'react';
import { useCalendarStore } from '../store/calendarStore';
import { BarChart, Clock, Users, Calendar } from 'lucide-react';
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
  addDays,
  parseISO,
  isAfter,
} from 'date-fns';

type TimePeriod = 'day' | 'week' | 'month' | 'year';

export default function AnalyticsDashboard() {
  const events = useCalendarStore((state) => state.events);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');

  const getFilteredEvents = (period: TimePeriod) => {
    const now = new Date();
    return events.filter((event) => {
      try {
        const eventDate = parseISO(event.startTime);
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
      } catch (error) {
        console.error('Error parsing event startTime:', event.startTime, error);
        return false; // Skip invalid events
      }
    });
  };

  const filteredEvents = useMemo(() => getFilteredEvents(timePeriod), [events, timePeriod]);

  const analytics = useMemo(() => {
    return {
      totalMeetings: filteredEvents.filter((e) => e.type === 'meeting').length,
      meetingHours: filteredEvents
        .filter((e) => e.type === 'meeting')
        .reduce((acc, event) => {
          try {
            const duration = new Date(event.endTime).getTime() - new Date(event.startTime).getTime();
            return acc + (isNaN(duration) ? 0 : duration / (1000 * 60 * 60));
          } catch (error) {
            console.error('Error calculating duration:', event, error);
            return acc;
          }
        }, 0),
      activeTasks: filteredEvents.filter((e) => e.type === 'task').length,
      totalEvents: filteredEvents.length,
    };
  }, [filteredEvents]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((event) => {
        try {
          return isAfter(parseISO(event.startTime), now);
        } catch (error) {
          console.error('Error parsing upcoming event startTime:', event.startTime, error);
          return false;
        }
      })
      .sort((a, b) => {
        try {
          return parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime();
        } catch (error) {
          console.error('Error sorting events:', a, b, error);
          return 0;
        }
      })
      .slice(0, 5);
  }, [events]);

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
        return daysInMonth.map((date) => format(date, 'd MMM'));
      case 'year':
        return Array.from({ length: 12 }, (_, i) => format(new Date(now.getFullYear(), i, 1), 'MMM'));
      default:
        return [];
    }
  };

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

  const periodEvents = useMemo(() => {
    return periodLabels.map((label) => {
      try {
        const date = parseISO(label);
        return filteredEvents.filter((e) =>
          isWithinInterval(parseISO(e.startTime), {
            start: startOfDay(date),
            end: endOfDay(date),
          })
        ).length;
      } catch (error) {
        console.error('Error parsing period label:', label, error);
        return 0;
      }
    });
  }, [filteredEvents, periodLabels]);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  const cardHover = {
    rest: { scale: 1, boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)' },
    hover: { scale: 1.03, boxShadow: '0px 10px 15px rgba(0, 0, 0, 0.15)', transition: { duration: 0.2 } },
  };

  const gradientBackground = 'bg-gradient-to-br from-indigo-600 to-purple-600';

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="p-8 bg-gray-100 rounded-xl shadow-lg"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <motion.h2
          variants={fadeIn}
          className="text-3xl font-extrabold text-gray-900 tracking-tight"
        >
          Analytics Dashboard
        </motion.h2>
        <motion.select
          variants={fadeIn}
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-md text-sm font-medium focus:ring-2 focus:ring-indigo-400 focus:outline-none hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </motion.select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { icon: <Users className="h-8 w-8 text-white" />, label: 'Total Meetings', value: analytics.totalMeetings },
          { icon: <Clock className="h-8 w-8 text-white" />, label: 'Meeting Hours', value: `${analytics.meetingHours.toFixed(1)}h` },
          { icon: <Calendar className="h-8 w-8 text-white" />, label: 'Active Tasks', value: analytics.activeTasks },
          { icon: <BarChart className="h-8 w-8 text-white" />, label: 'Total Events', value: analytics.totalEvents },
        ].map((item, index) => (
          <motion.div
            key={index}
            variants={fadeIn}
            whileHover="hover"
            initial="rest"
            animate="rest"
            className={`${gradientBackground} rounded-xl shadow-lg p-6 text-white overflow-hidden relative`}
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-full">{item.icon}</div>
              <div>
                <p className="text-sm font-medium opacity-90">{item.label}</p>
                <p className="text-3xl font-bold tracking-tight">{item.value}</p>
              </div>
            </div>
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-white opacity-10 rounded-full" />
          </motion.div>
        ))}
      </div>

      {/* Upcoming Events */}
      <motion.div
        variants={fadeIn}
        className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Events</h3>
        {upcomingEvents.length > 0 ? (
          <ul className="space-y-4">
            {upcomingEvents.map((event) => (
              <motion.li
                key={event.id}
                variants={fadeIn}
                whileHover={{ scale: 1.02, backgroundColor: '#f9fafb' }}
                className="flex justify-between items-center p-3 rounded-lg transition-colors duration-200"
              >
                <div>
                  <p className="text-base font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-600">
                    {format(parseISO(event.startTime), 'MMM d, yyyy h:mm a')} -{' '}
                    {format(parseISO(event.endTime), 'h:mm a')}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    event.type === 'meeting'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {event.type}
                </span>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">No upcoming events scheduled.</p>
        )}
      </motion.div>
    </motion.div>
  );
}