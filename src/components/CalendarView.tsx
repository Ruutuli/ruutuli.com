"use client";

import { useMemo, useState } from "react";
import {
  eventDayKeysInMonth,
  formatCalendarEventDates,
  getEventsForDay,
  getEventsForMonth,
  typeLabels,
} from "@/data/calendar";
import { CalendarEventType } from "@/types/calendar";
import { Cosplay } from "@/types/cosplay";
import { ConEvent } from "@/types/event";
import SectionHeading from "./SectionHeading";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const typeStyles: Record<CalendarEventType, string> = {
  convention: "bg-violet-500/20 text-violet-800 border-violet-400/40",
  photoshoot: "bg-closet-blush text-closet-brown border-closet-pink/40",
  deadline: "bg-amber-500/20 text-amber-800 border-amber-400/40",
  completed: "bg-emerald-500/20 text-emerald-800 border-emerald-400/40",
  started: "bg-sky-500/20 text-sky-800 border-sky-400/40",
  planned: "bg-closet-rose/15 text-closet-mauve border-closet-rose/30",
};

const dotStyles: Record<CalendarEventType, string> = {
  convention: "bg-violet-500",
  photoshoot: "bg-closet-rose",
  deadline: "bg-amber-500",
  completed: "bg-emerald-500",
  started: "bg-sky-500",
  planned: "bg-closet-rose",
};

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface CalendarViewProps {
  events: ConEvent[];
  cosplays: Cosplay[];
}

export default function CalendarView({ events, cosplays }: CalendarViewProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(
    toDateKey(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const monthEvents = useMemo(
    () => getEventsForMonth(viewYear, viewMonth, cosplays, events),
    [viewYear, viewMonth, cosplays, events],
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventType[]>();
    for (const event of monthEvents) {
      for (const day of eventDayKeysInMonth(event, viewYear, viewMonth)) {
        const existing = map.get(day) ?? [];
        if (!existing.includes(event.type)) existing.push(event.type);
        map.set(day, existing);
      }
    }
    return map;
  }, [monthEvents, viewYear, viewMonth]);

  const selectedEvents = selectedDay
    ? getEventsForDay(selectedDay, cosplays, events)
    : [];

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
    setSelectedDay(null);
  }

  function goToToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDay(toDateKey(today.getFullYear(), today.getMonth(), today.getDate()));
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="closet-shell">
        <SectionHeading
          eyebrow="Schedule"
          title="Cosplay Calendar"
          description="Cons, shoots, deadlines — whatever's coming up."
        />

        <div className="grid animate-fade-up gap-8 xl:grid-cols-[1fr_360px]">
          <div className="closet-panel-outer p-5 transition-shadow duration-300 hover:shadow-closet-lg sm:p-6 lg:p-8">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <h3 className="font-sans text-2xl font-bold text-closet-brown sm:text-3xl">{monthLabel}</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="closet-btn-outline px-3 py-1.5 text-sm"
                  aria-label="Previous month"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={goToToday}
                  className="closet-btn-outline px-3 py-1.5 text-sm"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="closet-btn-outline px-3 py-1.5 text-sm"
                  aria-label="Next month"
                >
                  →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-closet-brown-light"
                >
                  {day}
                </div>
              ))}

              {cells.map((day, i) => {
                if (day === null) {
                  return <div key={`empty-${i}`} className="aspect-square" />;
                }

                const dateKey = toDateKey(viewYear, viewMonth, day);
                const isToday =
                  day === today.getDate() &&
                  viewMonth === today.getMonth() &&
                  viewYear === today.getFullYear();
                const isSelected = selectedDay === dateKey;
                const dayTypes = eventsByDay.get(dateKey) ?? [];

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDay(dateKey)}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-all duration-200 ${
                      isSelected
                        ? "scale-105 bg-closet-pink font-semibold text-white shadow-md"
                        : isToday
                          ? "closet-card font-semibold text-closet-brown ring-2 ring-closet-pink/50 animate-pulse-soft"
                          : "text-closet-brown hover:scale-105 hover:bg-closet-blush/20"
                    }`}
                  >
                    {day}
                    {dayTypes.length > 0 && (
                      <span className="absolute bottom-1.5 flex gap-0.5">
                        {dayTypes.slice(0, 3).map((type) => (
                          <span
                            key={type}
                            className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white/90" : dotStyles[type]}`}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-closet-brown/10 pt-4">
              {(Object.keys(typeLabels) as CalendarEventType[]).map((type) => (
                <span
                  key={type}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${typeStyles[type]}`}
                >
                  <span className={`h-2 w-2 rounded-full ${dotStyles[type]}`} />
                  {typeLabels[type]}
                </span>
              ))}
            </div>
          </div>

          <aside className="closet-panel-outer animate-fade-up p-6 [animation-delay:150ms] lg:p-7">
            <h3 className="font-sans text-xl font-bold text-closet-brown sm:text-2xl">
              {selectedDay
                ? new Date(selectedDay + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : "Select a day"}
            </h3>

            {selectedEvents.length === 0 ? (
              <p className="mt-4 text-sm text-closet-brown-light">No events on this day.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {selectedEvents.map((event) => (
                  <li
                    key={event.id}
                    className="closet-card animate-scale-in p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-closet"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-medium text-closet-brown">{event.title}</p>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeStyles[event.type]}`}
                      >
                        {typeLabels[event.type]}
                      </span>
                    </div>
                    {event.description && (
                      <p className="mt-1 text-sm text-closet-brown-light">{event.description}</p>
                    )}
                    {event.location && (
                      <p className="mt-1 text-xs text-closet-brown-light/70">📍 {event.location}</p>
                    )}
                    <p className="mt-2 text-xs text-closet-brown-light/60">
                      {formatCalendarEventDates(event)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
    </div>
  );
}
