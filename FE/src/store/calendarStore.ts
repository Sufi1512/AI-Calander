import { create } from "zustand";
import { CalendarEvent } from "../types/calendar";
import axios from "axios";
import Cookies from "js-cookie";

interface CalendarState {
  events: CalendarEvent[];
  selectedDate: Date;
  addEvent: (event: Omit<CalendarEvent, "id">) => Promise<void>;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  setEvents: (events: CalendarEvent[]) => void;
  setSelectedDate: (date: Date) => void;
  fetchAllEvents: (token: string) => Promise<void>;
  fetchGmailEvents: (token: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  events: [],
  selectedDate: new Date(),
  addEvent: async (event) => {
    try {
      const token = Cookies.get("authToken") || "";
      const defaultTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await axios.post(
        "http://localhost:8080/api/auth/calendar/events",
        {
          summary: event.title,
          description: event.description,
          start: {
            dateTime: event.startTime,
            timeZone: event.timeZone || defaultTimeZone,
          },
          end: {
            dateTime: event.endTime,
            timeZone: event.timeZone || defaultTimeZone,
          },
          location: event.location,
        },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );

      const newEvent: CalendarEvent = {
        ...event,
        id: response.data.event.id,
        timeZone: event.timeZone || defaultTimeZone,
        priority: event.priority || "medium",
        type: event.type || "meeting",
      };
      set((state) => ({ events: [...state.events, newEvent] }));
    } catch (error) {
      console.error("Failed to add event to Google Calendar:", error.response?.data || error.message);
      throw new Error("Failed to add event to Google Calendar");
    }
  },
  updateEvent: async (id, event) => {
    try {
      const token = Cookies.get("authToken") || "";
      const response = await axios.put(
        `http://localhost:8080/api/auth/calendar/events/${id}`,
        {
          summary: event.title,
          description: event.description,
          start: event.startTime ? { dateTime: event.startTime, timeZone: event.timeZone } : undefined,
          end: event.endTime ? { dateTime: event.endTime, timeZone: event.timeZone } : undefined,
          location: event.location,
        },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );

      set((state) => ({
        events: state.events.map((e) =>
          e.id === id ? { ...e, ...event, ...response.data.event } : e
        ),
      }));
    } catch (error) {
      console.error("Failed to update event:", error.response?.data || error.message);
      throw new Error("Failed to update event");
    }
  },
  deleteEvent: async (id) => {
    try {
      const token = Cookies.get("authToken") || "";
      await axios.delete(`http://localhost:8080/api/auth/calendar/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete event from Google Calendar:", error.response?.data || error.message);
      throw error;
    }
  },
  setEvents: (events) => set({ events }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  fetchAllEvents: async (token) => {
    try {
      const response = await axios.get("http://localhost:8080/api/auth/calendar/events", {
        headers: { Authorization: `Bearer ${token}` },
        params: { maxResults: 2500 },
        withCredentials: true,
      });
      const mappedEvents: CalendarEvent[] = response.data.events.map((event: any) => ({
        id: event.id,
        title: event.summary || "Untitled",
        description: event.description,
        startTime: event.start.dateTime || event.start.date,
        endTime: event.end.dateTime || event.end.date,
        location: event.location,
        priority: "medium",
        type: "meeting",
        timeZone: event.start.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      }));
      set({ events: mappedEvents });
    } catch (error) {
      console.error("Failed to fetch all events:", error.response?.data || error.message);
    }
  },
  fetchGmailEvents: async (token) => {
    try {
      const response = await axios.get("http://localhost:8080/api/auth/gmail/events", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      const fetchAllEvents = useCalendarStore.getState().fetchAllEvents;
      await fetchAllEvents(token); // Refresh events after adding Gmail events
    } catch (error) {
      console.error("Failed to fetch Gmail events:", error.response?.data || error.message);
    }
  },
}));