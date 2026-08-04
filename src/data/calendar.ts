import { Cosplay } from "@/types/cosplay";
import { ConEvent } from "@/types/event";
import { CalendarEvent, CalendarEventType } from "@/types/calendar";

const typeLabels: Record<CalendarEventType, string> = {
  convention: "Convention",
  photoshoot: "Photoshoot",
  deadline: "Deadline",
  completed: "Completed",
  started: "Started",
  planned: "Planned",
};

export { typeLabels };

export function parseDayKey(date: string): string {
  return date.length >= 10 ? date.slice(0, 10) : `${date}-01`;
}

function parseMonthKey(date: string): string {
  return date.slice(0, 7);
}

function eventEndKey(event: CalendarEvent): string {
  return event.endDate ? parseDayKey(event.endDate) : parseDayKey(event.date);
}

export function eventOccursOnDay(event: CalendarEvent, dateKey: string): boolean {
  const start = parseDayKey(event.date);
  const end = eventEndKey(event);
  return dateKey >= start && dateKey <= end;
}

export function eventOverlapsMonth(event: CalendarEvent, year: number, month: number): boolean {
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const start = parseDayKey(event.date);
  const end = eventEndKey(event);
  return start <= monthEnd && end >= monthStart;
}

/** Each day in [start, end] that falls within the given month (YYYY-MM-DD keys). */
export function eventDayKeysInMonth(event: CalendarEvent, year: number, month: number): string[] {
  if (!eventOverlapsMonth(event, year, month)) return [];

  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const rangeStart = parseDayKey(event.date);
  const rangeEnd = eventEndKey(event);
  const start = rangeStart > monthStart ? rangeStart : monthStart;
  const end = rangeEnd < monthEnd ? rangeEnd : monthEnd;

  const keys: string[] = [];
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const cursor = new Date(sy, sm - 1, sd);
  const stop = new Date(ey, em - 1, ed);

  while (cursor <= stop) {
    keys.push(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`,
    );
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
}

function eventsFromConEvents(conEvents: ConEvent[]): CalendarEvent[] {
  return conEvents.map((event) => ({
    id: `con-${event.id}`,
    title: event.title,
    date: parseDayKey(event.date),
    endDate: event.endDate?.trim() ? parseDayKey(event.endDate) : undefined,
    type: "convention" as const,
    description: event.description,
    location: event.location,
  }));
}

function eventsFromCosplays(cosplays: Cosplay[]): CalendarEvent[] {
  const derived: CalendarEvent[] = [];

  for (const cosplay of cosplays) {
    if (cosplay.completedDate) {
      derived.push({
        id: `${cosplay.id}-completed`,
        title: `${cosplay.character} — Completed`,
        date: parseDayKey(cosplay.completedDate),
        type: "completed",
        cosplayId: cosplay.id,
        description: cosplay.series,
      });
    }

    if (cosplay.startedDate) {
      derived.push({
        id: `${cosplay.id}-started`,
        title: `${cosplay.character} — Started`,
        date: parseDayKey(cosplay.startedDate),
        type: cosplay.status === "planned" ? "planned" : "started",
        cosplayId: cosplay.id,
        description: cosplay.series,
      });
    }

    if (cosplay.deadline) {
      derived.push({
        id: `${cosplay.id}-deadline`,
        title: `${cosplay.character} — Deadline`,
        date: parseDayKey(cosplay.deadline),
        type: "deadline",
        cosplayId: cosplay.id,
        description: cosplay.convention ? `Target: ${cosplay.convention}` : cosplay.series,
      });
    }
  }

  return derived;
}

export function getAllCalendarEvents(
  cosplays: Cosplay[] = [],
  conEvents: ConEvent[] = [],
): CalendarEvent[] {
  return [...eventsFromConEvents(conEvents), ...eventsFromCosplays(cosplays)].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

export function getEventsForMonth(
  year: number,
  month: number,
  cosplays: Cosplay[] = [],
  conEvents: ConEvent[] = [],
): CalendarEvent[] {
  return getAllCalendarEvents(cosplays, conEvents).filter((e) => eventOverlapsMonth(e, year, month));
}

export function getEventsForDay(
  dateKey: string,
  cosplays: Cosplay[] = [],
  conEvents: ConEvent[] = [],
): CalendarEvent[] {
  return getAllCalendarEvents(cosplays, conEvents).filter((e) => eventOccursOnDay(e, dateKey));
}

export function formatEventDate(date: string): string {
  const normalized = parseDayKey(date);
  const [y, m, d] = normalized.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** e.g. "Jan 8–11, 2026" or "Jan 8, 2026" for single-day events */
export function formatEventDateRange(start: string, end?: string | null): string {
  const startKey = parseDayKey(start);
  const endKey = end?.trim() ? parseDayKey(end) : startKey;

  if (endKey <= startKey) {
    return formatEventDate(startKey);
  }

  const [sy, sm, sd] = startKey.split("-").map(Number);
  const [ey, em, ed] = endKey.split("-").map(Number);
  const startDate = new Date(sy, sm - 1, sd);
  const endDate = new Date(ey, em - 1, ed);

  if (sy === ey && sm === em) {
    const month = startDate.toLocaleDateString("en-US", { month: "short" });
    return `${month} ${sd}–${ed}, ${sy}`;
  }

  if (sy === ey) {
    const startFmt = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endFmt = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${startFmt} – ${endFmt}`;
  }

  return `${formatEventDate(startKey)} – ${formatEventDate(endKey)}`;
}

export function formatCalendarEventDates(event: CalendarEvent): string {
  return formatEventDateRange(event.date, event.endDate);
}

export function todayDateKey(from: Date = new Date()): string {
  return `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`;
}

export function getEventTiming(
  start: string,
  end?: string | null,
  from: Date = new Date(),
): "upcoming" | "active" | "past" {
  const today = todayDateKey(from);
  const startKey = parseDayKey(start);
  const endKey = end?.trim() ? parseDayKey(end) : startKey;
  if (today > endKey) return "past";
  if (today >= startKey && today <= endKey) return "active";
  return "upcoming";
}

export function getDaysUntil(date: string, from: Date = new Date()): number {
  const normalized = parseDayKey(date);
  const [y, m, d] = normalized.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.max(0, Math.ceil((target.getTime() - start.getTime()) / 86_400_000));
}

export function getDaysUntilEventEnd(start: string, end?: string | null, from: Date = new Date()): number {
  const endKey = end?.trim() ? parseDayKey(end) : parseDayKey(start);
  return getDaysUntil(endKey, from);
}

export function getNextConvention(
  conEvents: ConEvent[] = [],
  cosplays: Cosplay[] = [],
): CalendarEvent | undefined {
  const todayKey = todayDateKey();
  return getAllCalendarEvents(cosplays, conEvents)
    .filter((e) => e.type === "convention" && eventEndKey(e) >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
}

export function getUpcomingConventions(
  conEvents: ConEvent[] = [],
  limit = 2,
): CalendarEvent[] {
  const todayKey = todayDateKey();
  return eventsFromConEvents(conEvents)
    .filter((e) => eventEndKey(e) >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}
