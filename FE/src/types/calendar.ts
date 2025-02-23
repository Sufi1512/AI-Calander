export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  priority: "low" | "medium" | "high";
  type: "meeting" | "event" | "task";
  timeZone: string;
}