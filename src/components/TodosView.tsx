"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Cosplay,
  formatCosplayBuildSubtitle,
  getOpenCosplayTodos,
  isCosplayTodoDone,
} from "@/types/cosplay";
import {
  BUILD_TASK_STATUS_LABELS,
  BUILD_TASK_TYPE_LABELS,
  BuildTask,
  BuildTaskType,
} from "@/types/task";
import { formatEventDate } from "@/data/calendar";
import {
  formatTodoCost,
  getAllCosplayTodos,
  groupTodosByCosplay,
  resolveCosplayTodoDisplay,
  todoLinkHostname,
} from "@/lib/cosplay/todos";
import SectionHeading from "./SectionHeading";

type StatusFilter = "open" | "done" | "all";

const TYPES: BuildTaskType[] = ["todo", "buy", "check"];

function CheckIcon({ done }: { done: boolean }) {
  if (done) {
    return (
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
        aria-hidden
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="mt-0.5 flex h-5 w-5 shrink-0 rounded-full border-2 border-closet-pink/70 bg-white"
      aria-hidden
    />
  );
}

function ExternalLinkIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

export default function TodosView({
  cosplays,
  legacyTasks = [],
}: {
  cosplays: Cosplay[];
  legacyTasks?: BuildTask[];
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [cosplayFilter, setCosplayFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const activeCosplays = useMemo(
    () => cosplays.filter((c) => c.status !== "retired"),
    [cosplays],
  );

  const allTodos = useMemo(
    () =>
      getAllCosplayTodos(activeCosplays, legacyTasks).map((todo) => {
        const cosplay = activeCosplays.find((c) => c.id === todo.cosplayId);
        return { ...todo, series: cosplay?.series ?? "", outfit: cosplay?.outfit ?? "" };
      }),
    [activeCosplays, legacyTasks],
  );

  const openCount = useMemo(
    () => allTodos.filter((t) => !isCosplayTodoDone(t) && t.status !== "optional").length,
    [allTodos],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allTodos.filter((todo) => {
      if (cosplayFilter !== "all" && todo.cosplayId !== cosplayFilter) return false;
      if (typeFilter !== "all" && todo.type !== typeFilter) return false;
      const done = isCosplayTodoDone(todo);
      if (statusFilter === "open" && (done || todo.status === "optional")) return false;
      if (statusFilter === "done" && !done) return false;
      if (!q) return true;
      return (
        todo.label.toLowerCase().includes(q) ||
        todo.character.toLowerCase().includes(q) ||
        (todo.notes ?? "").toLowerCase().includes(q)
      );
    });
  }, [allTodos, cosplayFilter, typeFilter, statusFilter, query]);

  const grouped = useMemo(() => {
    const map = groupTodosByCosplay(filtered);
    for (const [id, entry] of map) {
      const cosplay = activeCosplays.find((c) => c.id === id);
      entry.series = cosplay?.series ?? "";
      entry.outfit = cosplay?.outfit ?? "";
    }
    return [...map.entries()].sort(([, a], [, b]) => a.character.localeCompare(b.character));
  }, [filtered, activeCosplays]);

  return (
    <div className="closet-shell">
      <SectionHeading
        eyebrow="Build checklist"
        title="To-Do List"
        description="Everything still on the sewing table — filtered by build, type, and what’s left to do."
      />

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-closet-pink/60 bg-white px-3 py-1 text-xs font-bold text-closet-brown">
          {openCount} open
        </span>
        <span className="rounded-full border border-closet-pink/60 bg-white px-3 py-1 text-xs font-bold text-closet-brown">
          {allTodos.length} total
        </span>
      </div>

      <div className="mb-10 flex flex-col gap-5">
        <div className="flex flex-wrap gap-3">
          {(
            [
              { value: "open", label: "Open" },
              { value: "done", label: "Done" },
              { value: "all", label: "All" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`closet-filter-pill ${
                statusFilter === opt.value ? "closet-filter-pill-active" : "closet-filter-pill-inactive"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            { value: "all", label: "All types" },
            ...TYPES.map((t) => ({ value: t, label: BUILD_TASK_TYPE_LABELS[t] })),
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTypeFilter(opt.value)}
              className={`closet-filter-pill ${
                typeFilter === opt.value ? "closet-filter-pill-active" : "closet-filter-pill-inactive"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
          {activeCosplays.length > 1 && (
            <label className="flex w-full flex-col gap-1.5 sm:max-w-[16rem]">
              <span className="text-xs font-semibold uppercase tracking-wide text-closet-brown-light">
                Build
              </span>
              <select
                value={cosplayFilter}
                onChange={(e) => setCosplayFilter(e.target.value)}
                className="closet-input w-full !py-2.5"
                aria-label="Filter by build"
              >
                <option value="all">All builds</option>
                {activeCosplays.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.character}
                    {c.outfit?.trim() && c.outfit.trim() !== "Default" ? ` · ${c.outfit}` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex w-full flex-col gap-1.5 sm:max-w-sm sm:flex-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-closet-brown-light">
              Search
            </span>
            <input
              type="text"
              inputMode="search"
              autoComplete="off"
              spellCheck={false}
              placeholder="Task or character…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="closet-input w-full !py-2.5"
            />
          </label>
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="text-center text-closet-brown-light">
          {allTodos.length === 0 ? "Nothing on the to-do list yet." : "No tasks match your filters."}
        </p>
      ) : (
        <div className="animate-fade-up space-y-5">
          {grouped.map(([cosplayId, { character, series, outfit, items }]) => {
            const cosplayOpen = getOpenCosplayTodos(items).length;
            const subtitle = formatCosplayBuildSubtitle({ series, outfit });
            return (
              <section key={cosplayId} className="closet-panel-outer overflow-hidden">
                <div className="closet-panel-header !items-center">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/roster/${cosplayId}`}
                      className="block truncate font-sans text-lg font-bold text-closet-brown hover:text-closet-rose"
                    >
                      {character}
                    </Link>
                    <p className="truncate text-xs text-closet-brown-light">{subtitle}</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-closet-brown-light">
                    {cosplayOpen} open
                  </span>
                </div>

                <ul className="divide-y divide-closet-pink/30">
                  {items.map((todo) => {
                    const done = isCosplayTodoDone(todo);
                    const { label, link, cost } = resolveCosplayTodoDisplay(todo);
                    const linkLabel = link ? (todoLinkHostname(link) ?? link) : null;
                    return (
                      <li
                        key={`${cosplayId}-${todo.id}`}
                        className={`flex items-start gap-3 px-4 py-3.5 sm:px-5 ${done ? "opacity-55" : ""}`}
                      >
                        <CheckIcon done={done} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-3">
                            <span
                              className={`text-sm font-semibold text-closet-brown ${done ? "line-through" : ""}`}
                            >
                              {label}
                            </span>
                            {cost != null ? (
                              <span className="shrink-0 text-sm font-bold text-closet-brown">
                                {formatTodoCost(cost)}
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-closet-blush/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-closet-brown">
                              {BUILD_TASK_TYPE_LABELS[todo.type]}
                            </span>
                            {link ? (
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex max-w-full items-center gap-1 text-xs font-semibold text-closet-rose hover:underline"
                              >
                                <ExternalLinkIcon />
                                <span className="truncate">{linkLabel}</span>
                              </a>
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-xs text-closet-brown-light">
                            {BUILD_TASK_STATUS_LABELS[todo.status]}
                            {todo.dueDate ? ` · Due ${formatEventDate(todo.dueDate)}` : ""}
                            {todo.notes ? ` · ${todo.notes}` : ""}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
