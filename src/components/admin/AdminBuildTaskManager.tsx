"use client";

import { useMemo, useState } from "react";
import { Cosplay } from "@/types/cosplay";
import { ConEvent } from "@/types/event";
import {
  BUILD_TASK_STATUS_LABELS,
  BUILD_TASK_TYPE_LABELS,
  BuildTask,
  BuildTaskStatus,
  BuildTaskType,
  getBuildTaskProgress,
  isBuildTaskDone,
} from "@/types/task";
import { groupTasksByCharacter } from "@/data/tasks";
import {
  formatEventDate,
  formatEventDateRange,
  getDaysUntil,
  getEventTiming,
} from "@/data/calendar";
import { IconPlus } from "./icons";
import {
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminField,
  AdminModal,
  AdminPageHeader,
  AdminSearch,
  AdminSelect,
  AdminStatCard,
  AdminTextarea,
  AdminToast,
} from "./ui";

const STATUSES: BuildTaskStatus[] = ["not-started", "started", "not-purchased", "completed", "optional"];
const TYPES: BuildTaskType[] = ["todo", "buy", "check"];

const STATUS_STYLES: Record<BuildTaskStatus, string> = {
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "not-started": "bg-slate-100 text-slate-700 border-slate-200",
  started: "bg-amber-100 text-amber-900 border-amber-200",
  "not-purchased": "bg-rose-100 text-rose-800 border-rose-200",
  optional: "bg-violet-100 text-violet-800 border-violet-200",
};

const TIMING_STYLES = {
  upcoming: "bg-sky-100 text-sky-800",
  active: "bg-emerald-100 text-emerald-800",
  past: "bg-slate-100 text-slate-600",
};

interface Props {
  initialTasks: BuildTask[];
  initialEvents: ConEvent[];
  cosplays: Cosplay[];
}

function emptyTask(eventId: string, character: string, cosplayId?: string): Partial<BuildTask> {
  return {
    label: "",
    character,
    cosplayId,
    eventId,
    type: "todo",
    status: "not-started",
    percent: 0,
  };
}

function eventDateLabel(event: ConEvent): string {
  return formatEventDateRange(event.date, event.endDate);
}

function eventTimingLabel(event: ConEvent): string {
  const timing = getEventTiming(event.date, event.endDate);
  if (timing === "active") return "Happening now";
  if (timing === "past") return "Past";
  const days = getDaysUntil(event.date);
  if (days === 0) return "Starts today";
  if (days === 1) return "Starts tomorrow";
  return `Starts in ${days} days`;
}

export default function AdminBuildTaskManager({ initialTasks, initialEvents, cosplays }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [events, setEvents] = useState(initialEvents);
  const [eventId, setEventId] = useState(initialEvents[0]?.id ?? "");
  const [characterFilter, setCharacterFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "done">("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Partial<BuildTask> | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | "new" | null>(null);
  const [eventDraft, setEventDraft] = useState<Partial<ConEvent>>({ title: "", date: "" });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date)),
    [events],
  );

  const eventTasks = useMemo(() => tasks.filter((t) => t.eventId === eventId), [tasks, eventId]);

  const taskCountByEvent = useMemo(() => {
    const map = new Map<string, { total: number; open: number }>();
    for (const t of tasks) {
      const entry = map.get(t.eventId) ?? { total: 0, open: 0 };
      entry.total++;
      if (!isBuildTaskDone(t) && t.status !== "optional") entry.open++;
      map.set(t.eventId, entry);
    }
    return map;
  }, [tasks]);

  const characters = useMemo(() => {
    const set = new Set(eventTasks.map((t) => t.character));
    return Array.from(set).sort();
  }, [eventTasks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return eventTasks.filter((t) => {
      if (characterFilter !== "all" && t.character !== characterFilter) return false;
      if (statusFilter === "open" && isBuildTaskDone(t)) return false;
      if (statusFilter === "done" && !isBuildTaskDone(t)) return false;
      if (!q) return true;
      return (
        t.label.toLowerCase().includes(q) ||
        t.character.toLowerCase().includes(q) ||
        (t.notes ?? "").toLowerCase().includes(q)
      );
    });
  }, [eventTasks, characterFilter, statusFilter, query]);

  const groupedFiltered = useMemo(() => {
    const map = groupTasksByCharacter(filtered);
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const grouped = useMemo(() => groupTasksByCharacter(eventTasks), [eventTasks]);
  const eventProgress = getBuildTaskProgress(eventTasks);
  const openCount = eventTasks.filter((t) => !isBuildTaskDone(t) && t.status !== "optional").length;
  const doneCount = eventTasks.filter((t) => isBuildTaskDone(t)).length;
  const totalCost = eventTasks.reduce((sum, t) => sum + (t.estimatedCost ?? 0), 0);

  const selectedEvent = events.find((e) => e.id === eventId);

  const characterOptions = useMemo(() => {
    const fromCosplays = cosplays.map((c) => ({ value: c.character, label: `${c.character} · ${c.series}` }));
    const fromTasks = characters
      .filter((c) => !fromCosplays.some((o) => o.value === c))
      .map((c) => ({ value: c, label: c }));
    return [...fromCosplays, ...fromTasks, { value: "General", label: "General" }];
  }, [cosplays, characters]);

  async function saveTask() {
    if (!editing?.label || !editing.eventId || !editing.character) return;
    setSaving(true);

    const payload = { ...editing };
    if (payload.status === "completed") payload.percent = 100;
    if (payload.dueDate === "") payload.dueDate = undefined;

    const isNew = !editing.id;
    const res = await fetch("/api/admin/tasks", {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!res.ok) {
      setMessage("Could not save task");
      return;
    }

    const saved = (await res.json()) as BuildTask;
    setTasks((prev) => (isNew ? [...prev, saved] : prev.map((t) => (t.id === saved.id ? saved : t))));
    setEditing(null);
    setMessage(isNew ? "Task added" : "Task updated");
  }

  async function toggleTaskComplete(task: BuildTask) {
    const completed = !isBuildTaskDone(task);
    const res = await fetch("/api/admin/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: task.id,
        status: completed ? "completed" : "not-started",
        percent: completed ? 100 : 0,
      }),
    });
    if (!res.ok) {
      setMessage("Could not update task");
      return;
    }
    const saved = (await res.json()) as BuildTask;
    setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
  }

  async function remove(id: string) {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/admin/tasks?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setMessage("Task deleted");
  }

  async function saveEvent() {
    if (!eventDraft.title || !eventDraft.date) return;
    if (eventDraft.endDate && eventDraft.endDate < eventDraft.date) {
      setMessage("End date must be on or after start date");
      return;
    }
    const isNew = editingEventId === "new";
    const payload = {
      ...eventDraft,
      endDate: eventDraft.endDate?.trim() || undefined,
    };
    const res = await fetch("/api/admin/events", {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isNew ? payload : { ...payload, id: editingEventId }),
    });
    if (!res.ok) {
      setMessage(isNew ? "Could not create event" : "Could not update event");
      return;
    }
    const event = (await res.json()) as ConEvent;
    setEvents((prev) =>
      isNew
        ? [...prev, event].sort((a, b) => a.date.localeCompare(b.date))
        : prev.map((e) => (e.id === event.id ? event : e)).sort((a, b) => a.date.localeCompare(b.date)),
    );
    setEventId(event.id);
    setEditingEventId(null);
    setEventDraft({ title: "", date: "" });
    setMessage(isNew ? `Event "${event.title}" created` : `Event "${event.title}" updated`);
  }

  async function removeEvent(id: string) {
    const event = events.find((e) => e.id === id);
    const taskCount = tasks.filter((t) => t.eventId === id).length;
    const label = event?.title ?? "this event";
    const warning =
      taskCount > 0
        ? `Delete "${label}" and its ${taskCount} task${taskCount === 1 ? "" : "s"}? This cannot be undone.`
        : `Delete "${label}"? This cannot be undone.`;
    if (!confirm(warning)) return;

    const res = await fetch(`/api/admin/events?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      setMessage("Could not delete event");
      return;
    }

    const remaining = events.filter((e) => e.id !== id);
    setEvents(remaining);
    setTasks((prev) => prev.filter((t) => t.eventId !== id));
    if (eventId === id) setEventId(remaining[0]?.id ?? "");
    setMessage(`Event "${label}" deleted`);
  }

  function openNewEventForm() {
    setEventDraft({ title: "", date: "", endDate: "", location: "", description: "" });
    setEditingEventId("new");
  }

  function openEditEventForm(event?: ConEvent) {
    const target = event ?? selectedEvent;
    if (!target) return;
    setEventDraft({ ...target });
    setEditingEventId(target.id);
  }

  function cosplayIdForCharacter(name: string): string | undefined {
    return cosplays.find((c) => c.character.toLowerCase() === name.toLowerCase())?.id;
  }

  function openNewTaskForCharacter(character: string) {
    setEditing(emptyTask(eventId, character, cosplayIdForCharacter(character)));
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Build planner"
        description="Plan convention checklists by event — assign tasks per character and track progress."
        action={
          <AdminButton
            variant="primary"
            onClick={() =>
              setEditing(
                emptyTask(
                  eventId,
                  characterFilter !== "all" ? characterFilter : characters[0] ?? cosplays[0]?.character ?? "General",
                ),
              )
            }
            disabled={!eventId}
          >
            <IconPlus />
            Add task
          </AdminButton>
        }
      />

      {/* Events */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-closet-brown-light">Events & cons</h2>
          <AdminButton variant="ghost" onClick={openNewEventForm} className="text-xs">
            + New event
          </AdminButton>
        </div>

        {sortedEvents.length === 0 ? (
          <AdminCard className="p-6">
            <AdminEmptyState
              title="No events yet"
              description="Create a convention or deadline event to start building checklists."
            />
            <div className="mt-4 text-center">
              <AdminButton variant="primary" onClick={openNewEventForm}>
                Create first event
              </AdminButton>
            </div>
          </AdminCard>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sortedEvents.map((event) => {
              const counts = taskCountByEvent.get(event.id) ?? { total: 0, open: 0 };
              const progress = getBuildTaskProgress(tasks.filter((t) => t.eventId === event.id));
              const timing = getEventTiming(event.date, event.endDate);
              const selected = event.id === eventId;

              return (
                <article
                  key={event.id}
                  className={`rounded-2xl border transition-all ${
                    selected
                      ? "border-closet-rose bg-gradient-to-br from-closet-blush/80 to-white shadow-closet ring-2 ring-closet-rose/30"
                      : "border-closet-pink/50 bg-white hover:border-closet-rose/40 hover:shadow-closet"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setEventId(event.id);
                      setCharacterFilter("all");
                    }}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-sans text-lg font-bold text-closet-brown">{event.title}</p>
                        <p className="mt-0.5 text-sm font-semibold text-closet-rose">{eventDateLabel(event)}</p>
                        {event.location && (
                          <p className="mt-1 text-xs text-closet-brown-light">{event.location}</p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${TIMING_STYLES[timing]}`}
                      >
                        {eventTimingLabel(event)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-closet-blush">
                        <div className="h-full rounded-full bg-closet-rose" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-xs font-bold tabular-nums text-closet-brown">{progress}%</span>
                    </div>

                    <p className="mt-2 text-xs text-closet-brown-light">
                      {counts.open} open · {counts.total} task{counts.total === 1 ? "" : "s"}
                    </p>
                  </button>

                  {selected && (
                    <div className="flex flex-wrap gap-2 border-t border-closet-pink/40 px-4 py-3">
                      <AdminButton variant="ghost" className="text-xs" onClick={() => openEditEventForm(event)}>
                        Edit
                      </AdminButton>
                      <AdminButton variant="danger" className="text-xs" onClick={() => void removeEvent(event.id)}>
                        Delete
                      </AdminButton>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedEvent && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label="Overall progress" value={`${eventProgress}%`} accent="rose" />
            <AdminStatCard label="Open tasks" value={openCount} hint={`${doneCount} completed`} accent="peach" />
            <AdminStatCard label="Characters" value={characters.length} accent="blush" />
            <AdminStatCard
              label="Est. spend"
              value={totalCost > 0 ? `$${totalCost.toFixed(0)}` : "—"}
              hint={selectedEvent.description}
              accent="brown"
            />
          </div>

          {selectedEvent.description && (
            <p className="text-sm text-closet-brown-light">{selectedEvent.description}</p>
          )}

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <AdminSearch value={query} onChange={setQuery} placeholder="Search tasks…" className="max-w-md flex-1" />
            <div className="flex flex-wrap gap-2">
              {(["all", "open", "done"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize ${
                    statusFilter === s ? "bg-closet-rose text-white" : "bg-white ring-1 ring-closet-pink/60"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {characters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCharacterFilter("all")}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  characterFilter === "all" ? "bg-closet-rose text-white" : "bg-closet-blush/50 text-closet-brown"
                }`}
              >
                All characters ({eventTasks.length})
              </button>
              {characters.map((char) => {
                const charTasks = grouped.get(char) ?? [];
                const pct = getBuildTaskProgress(charTasks);
                return (
                  <button
                    key={char}
                    type="button"
                    onClick={() => setCharacterFilter(char)}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      characterFilter === char ? "bg-closet-rose text-white" : "bg-closet-blush/50 text-closet-brown"
                    }`}
                  >
                    {char} ({pct}%)
                  </button>
                );
              })}
            </div>
          )}

          {/* Tasks by character */}
          <AdminCard className="p-4 sm:p-5">
            {filtered.length === 0 ? (
              <AdminEmptyState
                title="No tasks"
                description="Add tasks for this event to track your build checklist."
              />
            ) : (
              <div className="space-y-6">
                {groupedFiltered.map(([character, charTasks]) => {
                  const charProgress = getBuildTaskProgress(charTasks);
                  const charOpen = charTasks.filter((t) => !isBuildTaskDone(t) && t.status !== "optional").length;

                  return (
                    <section key={character} className="rounded-xl border border-closet-pink/50 bg-closet-blush/15">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-closet-pink/40 px-4 py-3">
                        <div>
                          <h3 className="font-sans text-base font-bold text-closet-brown">{character}</h3>
                          <p className="text-xs text-closet-brown-light">
                            {charOpen} open · {charProgress}% done
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white">
                            <div className="h-full rounded-full bg-closet-rose" style={{ width: `${charProgress}%` }} />
                          </div>
                          <AdminButton variant="ghost" className="text-xs" onClick={() => openNewTaskForCharacter(character)}>
                            + Task
                          </AdminButton>
                        </div>
                      </div>

                      <ul className="divide-y divide-closet-pink/30">
                        {charTasks.map((task) => (
                          <li key={task.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                            <label className="flex shrink-0 cursor-pointer items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isBuildTaskDone(task)}
                                onChange={() => void toggleTaskComplete(task)}
                                className="h-4 w-4 rounded border-closet-pink text-closet-rose"
                              />
                              <span className="sr-only">Mark complete</span>
                            </label>

                            <div className="min-w-0 flex-1">
                              {task.link ? (
                                <a
                                  href={task.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`font-semibold hover:text-closet-rose hover:underline ${isBuildTaskDone(task) ? "text-closet-brown-light line-through" : "text-closet-brown"}`}
                                >
                                  {task.label}
                                </a>
                              ) : (
                                <p className={`font-semibold ${isBuildTaskDone(task) ? "text-closet-brown-light line-through" : "text-closet-brown"}`}>
                                  {task.label}
                                </p>
                              )}
                              {task.notes && (
                                <p className="mt-0.5 truncate text-xs text-closet-brown-light">{task.notes}</p>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-closet-brown ring-1 ring-closet-pink/50">
                                {BUILD_TASK_TYPE_LABELS[task.type]}
                              </span>
                              {task.dueDate && (
                                <span className="text-[10px] font-semibold text-closet-brown-light">
                                  Due {formatEventDate(task.dueDate)}
                                </span>
                              )}
                              {task.estimatedCost != null && (
                                <span className="text-[10px] font-semibold text-closet-brown-light">
                                  ${task.estimatedCost.toFixed(0)}
                                </span>
                              )}
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[task.status]}`}
                              >
                                {BUILD_TASK_STATUS_LABELS[task.status]}
                              </span>
                              <AdminButton variant="ghost" className="text-xs text-closet-rose" onClick={() => setEditing({ ...task })}>
                                Edit
                              </AdminButton>
                              <AdminButton variant="danger" className="text-xs" onClick={() => remove(task.id)}>
                                Delete
                              </AdminButton>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}
          </AdminCard>
        </>
      )}

      {editing && (
        <AdminModal
          title={editing.id ? "Edit task" : "New task"}
          onClose={() => setEditing(null)}
          wide
          footer={
            <>
              <AdminButton variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </AdminButton>
              <AdminButton variant="primary" onClick={saveTask} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </AdminButton>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminSelect
              label="Event"
              value={editing.eventId ?? eventId}
              onChange={(v) => setEditing({ ...editing, eventId: v })}
              options={events.map((e) => ({
                value: e.id,
                label: `${e.title} (${eventDateLabel(e)})`,
              }))}
            />
            <AdminSelect
              label="Character"
              value={editing.character ?? ""}
              onChange={(v) =>
                setEditing({ ...editing, character: v, cosplayId: cosplayIdForCharacter(v) })
              }
              options={characterOptions}
            />
            <AdminField
              label="Task"
              value={editing.label ?? ""}
              onChange={(v) => setEditing({ ...editing, label: v })}
              className="sm:col-span-2"
            />
            <AdminSelect
              label="Type"
              value={editing.type ?? "todo"}
              onChange={(v) => setEditing({ ...editing, type: v as BuildTaskType })}
              options={TYPES.map((t) => ({ value: t, label: BUILD_TASK_TYPE_LABELS[t] }))}
            />
            <AdminSelect
              label="Status"
              value={editing.status ?? "not-started"}
              onChange={(v) => {
                const status = v as BuildTaskStatus;
                setEditing({
                  ...editing,
                  status,
                  percent: status === "completed" ? 100 : editing.percent,
                });
              }}
              options={STATUSES.map((s) => ({ value: s, label: BUILD_TASK_STATUS_LABELS[s] }))}
            />
            <AdminField
              label="Due date"
              value={editing.dueDate ?? ""}
              onChange={(v) => setEditing({ ...editing, dueDate: v || undefined })}
              type="date"
            />
            <AdminField
              label="Progress %"
              value={String(editing.percent ?? 0)}
              onChange={(v) => setEditing({ ...editing, percent: Number(v) || 0 })}
              type="number"
            />
            <AdminField
              label="Est. cost (USD)"
              value={editing.estimatedCost != null ? String(editing.estimatedCost) : ""}
              onChange={(v) => setEditing({ ...editing, estimatedCost: v ? Number(v) : undefined })}
              type="number"
            />
            <AdminField
              label="Link"
              value={editing.link ?? ""}
              onChange={(v) => setEditing({ ...editing, link: v })}
              className="sm:col-span-2"
            />
            <AdminTextarea
              label="Notes"
              value={editing.notes ?? ""}
              onChange={(v) => setEditing({ ...editing, notes: v })}
              className="sm:col-span-2"
            />
          </div>
        </AdminModal>
      )}

      {editingEventId && (
        <AdminModal
          title={editingEventId === "new" ? "New event / con" : "Edit event"}
          onClose={() => {
            setEditingEventId(null);
            setEventDraft({ title: "", date: "" });
          }}
          footer={
            <>
              <AdminButton
                variant="secondary"
                onClick={() => {
                  setEditingEventId(null);
                  setEventDraft({ title: "", date: "" });
                }}
              >
                Cancel
              </AdminButton>
              <AdminButton variant="primary" onClick={saveEvent}>
                {editingEventId === "new" ? "Create event" : "Save changes"}
              </AdminButton>
            </>
          }
        >
          <div className="space-y-4">
            <AdminField
              label="Title"
              value={eventDraft.title ?? ""}
              onChange={(v) => setEventDraft({ ...eventDraft, title: v })}
              placeholder="MAGFest 2026"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField
                label="Start date"
                value={eventDraft.date ?? ""}
                onChange={(v) => setEventDraft({ ...eventDraft, date: v })}
                type="date"
              />
              <AdminField
                label="End date"
                value={eventDraft.endDate ?? ""}
                onChange={(v) => setEventDraft({ ...eventDraft, endDate: v })}
                type="date"
              />
            </div>
            <p className="text-xs text-closet-brown-light">
              Leave end date blank for single-day events. For cons, set the last day of the show.
            </p>
            <AdminField
              label="Location"
              value={eventDraft.location ?? ""}
              onChange={(v) => setEventDraft({ ...eventDraft, location: v })}
            />
            <AdminTextarea
              label="Description / builds planned"
              value={eventDraft.description ?? ""}
              onChange={(v) => setEventDraft({ ...eventDraft, description: v })}
            />
          </div>
        </AdminModal>
      )}

      <AdminToast message={message} onDone={() => setMessage("")} />
    </div>
  );
}
