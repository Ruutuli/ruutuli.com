"use client";

import { useMemo, useState } from "react";
import { Cosplay, CosplayStatus } from "@/types/cosplay";
import { COSPLAY_SORT_OPTIONS, CosplaySortBy, sortCosplays } from "@/lib/cosplay/sort";
import RosterFlipCard from "./RosterFlipCard";
import SectionHeading from "./SectionHeading";

type FilterStatus = "all" | CosplayStatus;

const statusLabels: Record<CosplayStatus, string> = {
  completed: "Completed",
  "in-progress": "In Progress",
  planned: "Planned",
  retired: "Retired",
};

export default function RosterView({ cosplays }: { cosplays: Cosplay[] }) {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<CosplaySortBy>("custom");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matched = cosplays
      .filter((c) => filter === "all" || c.status === filter)
      .filter(
        (c) =>
          !query ||
          c.character.toLowerCase().includes(query) ||
          c.series.toLowerCase().includes(query) ||
          c.tags.some((t) => t.toLowerCase().includes(query)),
      );

    return sortCosplays(matched, sortBy);
  }, [cosplays, filter, search, sortBy]);

  const counts = useMemo(
    () => ({
      all: cosplays.length,
      completed: cosplays.filter((c) => c.status === "completed").length,
      "in-progress": cosplays.filter((c) => c.status === "in-progress").length,
      planned: cosplays.filter((c) => c.status === "planned").length,
      retired: cosplays.filter((c) => c.status === "retired").length,
    }),
    [cosplays],
  );

  return (
    <div className="closet-shell">
      <SectionHeading
        eyebrow="Character Roster"
        title="Cosplayed Characters"
        description="Hover for the cosplay pic. Click to open the build page."
      />

      <div className="mb-10 flex flex-col gap-5">
        <div className="flex flex-wrap gap-3">
          {(["all", "completed", "in-progress", "planned", "retired"] as FilterStatus[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`closet-filter-pill ${
                filter === status ? "closet-filter-pill-active" : "closet-filter-pill-inactive"
              }`}
            >
              {status === "all" ? "All" : statusLabels[status]}{" "}
              <span className="opacity-70">({counts[status]})</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <label className="flex w-full flex-col gap-1.5 sm:max-w-[12rem]">
            <span className="text-xs font-semibold uppercase tracking-wide text-closet-brown-light">
              Sort by
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as CosplaySortBy)}
              className="closet-input w-full !py-2.5"
              aria-label="Sort roster"
            >
              {COSPLAY_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex w-full flex-col gap-1.5 sm:max-w-sm sm:flex-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-closet-brown-light">
              Search
            </span>
            <input
              type="text"
              inputMode="search"
              autoComplete="off"
              spellCheck={false}
              placeholder="Character or series…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="closet-input w-full !py-2.5"
            />
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-closet-brown-light">No characters match your search.</p>
      ) : (
        <div className="animate-stagger-safe grid grid-cols-2 items-stretch gap-5 sm:gap-6 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 xl:gap-7">
          {filtered.map((cosplay) => (
            <div key={cosplay.id} className="h-full">
              <RosterFlipCard cosplay={cosplay} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
