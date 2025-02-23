// src/types/calendar.ts
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  location?: string;
  priority: 'low' | 'medium' | 'high';
  type: 'meeting' | 'task' | 'reminder' | 'other';
}