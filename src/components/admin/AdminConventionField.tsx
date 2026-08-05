"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ConEvent } from "@/types/event";
import { formatEventDateRange } from "@/data/calendar";
import { AdminField } from "./ui";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function conventionLabelForEvent(event: ConEvent): string {
  const year = event.date.slice(0, 4);
  return `${event.title} ${year}`;
}

function conventionsMatch(a: string, b: string): boolean {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (!x || !y) return false;
  if (x === y) return true;
  return x.includes(y) || y.includes(x);
}

export default function AdminConventionField({
  value,
  onChange,
  events,
  extraOptions = [],
}: {
  value: string;
  onChange: (v: string) => void;
  events: ConEvent[];
  extraOptions?: string[];
}) {
  const sorted = useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date)),
    [events],
  );

  const today = todayKey();
  const upcoming = sorted.filter((e) => e.date.slice(0, 10) >= today);
  const past = sorted.filter((e) => e.date.slice(0, 10) < today);

  const customOnly =
    !!value.trim() &&
    !sorted.some((e) => conventionsMatch(value, conventionLabelForEvent(e))) &&
    !extraOptions.some((o) => conventionsMatch(value, o));

  return (
    <section className="rounded-2xl border-2 border-violet-300/60 bg-gradient-to-br from-violet-50/80 to-white p-4 sm:p-5">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">Convention plan</p>
        <h3 className="font-sans text-lg font-bold text-closet-brown">Where are you wearing this?</h3>
        <p className="mt-1 text-xs text-closet-brown-light">
          Pick an upcoming con from your calendar, or type a custom name. Shows on the build page and in your roster overview.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange("")}
          className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
            !value.trim()
              ? "border-closet-brown/30 bg-closet-brown/10 text-closet-brown"
              : "border-closet-pink/50 bg-white text-closet-brown-light hover:border-closet-pink"
          }`}
        >
          Not planned yet
        </button>
      </div>

      {upcoming.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-closet-brown-light">Upcoming conventions</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {upcoming.map((event) => {
              const label = conventionLabelForEvent(event);
              const selected = conventionsMatch(value, label);
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onChange(label)}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    selected
                      ? "border-violet-500 bg-violet-100/80 ring-2 ring-violet-400/40"
                      : "border-closet-pink/50 bg-white hover:border-violet-300 hover:bg-violet-50/50"
                  }`}
                >
                  <p className="text-sm font-bold text-closet-brown">
                    {selected ? "✓ " : ""}
                    {label}
                  </p>
                  <p className="mt-0.5 text-xs text-closet-brown-light">
                    {formatEventDateRange(event.date, event.endDate)}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {upcoming.length === 0 && sorted.length > 0 && (
        <p className="mb-4 text-sm text-closet-brown-light">
          No upcoming conventions on your calendar — pick a past one below or add a new event.
        </p>
      )}

      {past.length > 0 && (
        <details className="mb-4 group">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-closet-brown-light hover:text-closet-brown">
            Past conventions ({past.length})
          </summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {past.map((event) => {
              const label = conventionLabelForEvent(event);
              const selected = conventionsMatch(value, label);
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onChange(label)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    selected
                      ? "border-violet-500 bg-violet-100 text-violet-900"
                      : "border-closet-pink/50 bg-white text-closet-brown-light hover:border-violet-300"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </details>
      )}

      <AdminField
        label="Or type a convention name"
        value={value}
        onChange={onChange}
        placeholder="e.g. Katsucon 2027"
        list="cosplay-convention-suggestions"
      />
      <datalist id="cosplay-convention-suggestions">
        {[...new Set([...sorted.map(conventionLabelForEvent), ...extraOptions])].map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {customOnly && (
        <p className="mt-2 text-xs text-closet-brown-light">
          Using custom name: <strong className="text-closet-brown">{value}</strong>
        </p>
      )}

      <p className="mt-3 text-xs text-closet-brown-light">
        Need to add a new con?{" "}
        <Link href="/admin/events" className="font-semibold text-closet-rose hover:underline">
          Manage events & conventions →
        </Link>
      </p>
    </section>
  );
}
