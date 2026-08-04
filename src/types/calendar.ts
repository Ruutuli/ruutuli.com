export type CalendarEventType =
  | "convention"
  | "photoshoot"
  | "deadline"
  | "completed"
  | "started"
  | "planned";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  /** Last day for multi-day events (YYYY-MM-DD). Same as date when omitted. */
  endDate?: string;
  type: CalendarEventType;
  cosplayId?: string;
  description?: string;
  location?: string;
}
