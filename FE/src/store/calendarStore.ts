// src/store/calendarStore.ts
import { create } from 'zustand';
import { CalendarEvent } from '../types/calendar';
import axios from 'axios';
import Cookies from 'js-cookie';

interface CalendarState {
  events: CalendarEvent[];
  selectedDate: Date;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => Promise<void>;
  setEvents: (events: CalendarEvent[]) => void;
  setSelectedDate: (date: Date) => void;
  fetchAllEvents: (token: string) => Promise<void>;
  fetchGmailEvents: (token: string) => Promise<void>; // New method
}

export const useCalendarStore = create<CalendarState>((set) => ({
  events: [],
  selectedDate: new Date(),
  addEvent: async (event) => {
    try {
      const token = Cookies.get('authToken') || '';
      const response = await axios.post(
        'http://localhost:8080/api/auth/calendar/events',
        {
          summary: event.title,
          description: event.description,
          start: { dateTime: event.startTime },
          end: { dateTime: event.endTime },
          location: event.location,
        },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );

      const newEvent = {
        ...event,
        id: response.data.event.id,
      };
      set((state) => ({ events: [...state.events, newEvent] }));
    } catch (error) {
      throw new Error('Failed to add event to Google Calendar');
    }
  },
  updateEvent: async (id, event) => {
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? { ...e, ...event } : e)),
    }));
  },
  setEvents: (events) => set({ events }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  fetchAllEvents: async (token) => {
    try {
      const response = await axios.get('http://localhost:8080/api/auth/calendar/events', {
        headers: { Authorization: `Bearer ${token}` },
        params: { maxResults: 2500 },
        withCredentials: true,
      });
      const mappedEvents = response.data.events.map((event) => ({
        id: event.id,
        title: event.summary || 'Untitled',
        description: event.description,
        startTime: event.start.dateTime || event.start.date,
        endTime: event.end.dateTime || event.end.date,
        location: event.location,
        priority: 'medium',
        type: 'meeting',
      }));
      set({ events: mappedEvents });
    } catch (error) {
      console.error('Failed to fetch all events:', error);
    }
  },
  fetchGmailEvents: async (token) => {
    try {
      const response = await axios.get('http://localhost:8080/api/auth/gmail/events', {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      const gmailEvents = response.data.events;
      for (const gmailEvent of gmailEvents) {
        await axios.post(
          'http://localhost:8080/api/auth/calendar/events',
          gmailEvent,
          { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
        );
      }
      await fetchAllEvents(token); // Refresh calendar events
    } catch (error) {
      console.error('Failed to fetch Gmail events:', error);
    }
  },
}));