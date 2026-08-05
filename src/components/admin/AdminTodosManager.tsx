"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Cosplay,
  CosplayTodo,
  getOpenCosplayTodos,
  isCosplayTodoDone,
} from "@/types/cosplay";
import {
  BUILD_TASK_STATUS_LABELS,
  BUILD_TASK_TYPE_LABELS,
  BuildTask,
  BuildTaskStatus,
  BuildTaskType,
} from "@/types/task";
import { formatEventDate } from "@/data/calendar";
import { CosplayTodoWithContext, getAllCosplayTodos, groupTodosByCosplay, resolveCosplayTodos } from "@/lib/cosplay/todos";
import AdminCosplaySearchField from "./AdminCosplaySearchField";
import { IconPlus } from "./icons";
import {
  AdminButton,
  AdminEmptyState,
  AdminField,
  AdminModal,
  AdminPageHeader,
  AdminSearch,
  AdminSelect,
  AdminTextarea,
  AdminToast,
} from "./ui";

const TYPES: BuildTaskType[] = ["todo", "buy", "check"];
const STATUSES: BuildTaskStatus[] = ["not-started", "started", "not-purchased", "completed", "optional"];

const TYPE_STYLES: Record<BuildTaskType, string> = {
  todo: "bg-sky-100 text-sky-800",
  buy: "bg-amber-100 text-amber-900",
  check: "bg-violet-100 text-violet-800",
};

type StatusFilter = "open" | "done" | "all";

type EditingTodo = CosplayTodo & { cosplayId: string };

function emptyTodo(cosplayId: string): EditingTodo {
  return {
    id: `todo-${Date.now()}`,
    cosplayId,
    label: "",
    type: "todo",
    status: "not-started",
    percent: 0,
  };
}

async function persistTodos(cosplayId: string, todos: CosplayTodo[]): Promise<Cosplay | null> {
  const res = await fetch("/api/admin/cosplays", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: cosplayId, todos }),
  });
  if (!res.ok) return null;
  return (await res.json()) as Cosplay;
}

export default function AdminTodosManager({
  initialCosplays,
  legacyTasks = [],
}: {
  initialCosplays: Cosplay[];
  legacyTasks?: BuildTask[];
}) {
  const [cosplays, setCosplays] = useState(() =>
    initialCosplays.map((c) => ({
      ...c,
      todos: resolveCosplayTodos(c, legacyTasks),
    })),
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [cosplayFilter, setCosplayFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<EditingTodo | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const cosplaysRef = useRef(cosplays);
  const saveChain = useRef(Promise.resolve(true));

  useEffect(() => {
    cosplaysRef.current = cosplays;
  }, [cosplays]);

  const activeCosplays = useMemo(
    () => cosplays.filter((c) => c.status !== "retired"),
    [cosplays],
  );

  const allTodos = useMemo(
    () =>
      getAllCosplayTodos(
        activeCosplays,
        legacyTasks,
      ).map((todo) => {
        const cosplay = activeCosplays.find((c) => c.id === todo.cosplayId);
        return { ...todo, series: cosplay?.series ?? "" };
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
    }
    return [...map.entries()].sort(([, a], [, b]) => a.character.localeCompare(b.character));
  }, [filtered, activeCosplays]);

  function getCosplayTodos(cosplayId: string): CosplayTodo[] {
    return cosplaysRef.current.find((c) => c.id === cosplayId)?.todos ?? [];
  }

  function updateLocalTodos(cosplayId: string, todos: CosplayTodo[]) {
    setCosplays((prev) => {
      const next = prev.map((c) => (c.id === cosplayId ? { ...c, todos } : c));
      cosplaysRef.current = next;
      return next;
    });
  }

  function saveTodos(cosplayId: string, todos: CosplayTodo[], successMsg?: string): Promise<boolean> {
    updateLocalTodos(cosplayId, todos);
    const job = saveChain.current.then(async () => {
      setSaving(true);
      const latest = cosplaysRef.current.find((c) => c.id === cosplayId)?.todos ?? todos;
      const saved = await persistTodos(cosplayId, latest);
      setSaving(false);
      if (!saved) {
        setMessage("Could not save — try again");
        return false;
      }
      setCosplays((prev) => {
        const next = prev.map((c) =>
          c.id === cosplayId ? { ...c, todos: saved.todos ?? latest } : c,
        );
        cosplaysRef.current = next;
        return next;
      });
      if (successMsg) setMessage(successMsg);
      return true;
    });
    saveChain.current = job.catch(() => false);
    return job;
  }

  async function toggleDone(todo: CosplayTodoWithContext) {
    const todos = getCosplayTodos(todo.cosplayId);
    const done = !isCosplayTodoDone(todo);
    const next = todos.map((t) =>
      t.id === todo.id
        ? { ...t, status: done ? ("completed" as const) : ("not-started" as const), percent: done ? 100 : 0 }
        : t,
    );
    await saveTodos(todo.cosplayId, next);
  }

  async function removeTodo(todo: CosplayTodoWithContext) {
    if (!confirm("Delete this item?")) return;
    const next = getCosplayTodos(todo.cosplayId).filter((t) => t.id !== todo.id);
    await saveTodos(todo.cosplayId, next, "Item deleted");
  }

  async function saveEditing() {
    if (!editing?.label.trim() || !editing.cosplayId) return;
    const status: BuildTaskStatus =
      editing.status === "completed" ? "completed" : editing.status;
    const saved: CosplayTodo = {
      id: editing.id,
      label: editing.label.trim(),
      type: editing.type,
      link: editing.link,
      estimatedCost: editing.estimatedCost,
      status,
      percent: status === "completed" ? 100 : editing.percent,
      notes: editing.notes,
      dueDate: editing.dueDate?.trim() || undefined,
    };
    const todos = getCosplayTodos(editing.cosplayId);
    const exists = todos.some((t) => t.id === saved.id);
    const next = exists ? todos.map((t) => (t.id === saved.id ? saved : t)) : [...todos, saved];
    const ok = await saveTodos(editing.cosplayId, next, exists ? "Item updated" : "Item added");
    if (ok) setEditing(null);
  }

  const cosplayOptions = [
    { value: "all", label: "All builds" },
    ...activeCosplays.map((c) => ({
      value: c.id,
      label: `${c.character} · ${c.series}`,
    })),
  ];

  return (
    <div className="space-y-4 pb-28 sm:space-y-6 sm:pb-8">
      <AdminPageHeader
        title="To-Do List"
        description="All your build tasks in one place — check off, edit, and add from your phone."
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-closet-pink/60 bg-white px-3 py-1 text-xs font-bold text-closet-brown">
          {openCount} open
        </span>
        <span className="rounded-full border border-closet-pink/60 bg-white px-3 py-1 text-xs font-bold text-closet-brown">
          {allTodos.length} total
        </span>
        {saving && (
          <span className="text-xs font-semibold text-closet-brown-light">Saving…</span>
        )}
      </div>

      <AdminSearch value={query} onChange={setQuery} placeholder="Search tasks or characters…" />

      {/* Status filters — large tap targets */}
      <div className="flex gap-2 overflow-x-auto pb-1">
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
            className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition ${
              statusFilter === opt.value
                ? "bg-closet-rose text-white shadow-sm"
                : "bg-white text-closet-brown ring-1 ring-closet-pink/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Type filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { value: "all", label: "All types" },
          ...TYPES.map((t) => ({ value: t, label: BUILD_TASK_TYPE_LABELS[t] })),
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTypeFilter(opt.value)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition ${
              typeFilter === opt.value
                ? "bg-closet-brown text-white"
                : "bg-closet-blush/50 text-closet-brown"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {activeCosplays.length > 1 && (
        <AdminSelect
          label="Filter by build"
          value={cosplayFilter}
          onChange={setCosplayFilter}
          options={cosplayOptions}
        />
      )}

      {grouped.length === 0 ? (
        <AdminEmptyState
          title={allTodos.length === 0 ? "No to-dos yet" : "Nothing matches"}
          description={
            allTodos.length === 0
              ? "Add your first item, or open a build in Roster → To-Do List."
              : "Try a different filter or search."
          }
        />
      ) : (
        <div className="space-y-5">
          {grouped.map(([cosplayId, { character, series, items }]) => {
            const cosplayOpen = getOpenCosplayTodos(items).length;
            return (
              <section
                key={cosplayId}
                className="overflow-hidden rounded-2xl border border-closet-pink/50 bg-white shadow-closet"
              >
                <div className="flex items-center justify-between gap-3 border-b border-closet-pink/40 bg-closet-blush/25 px-4 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/cosplays/${cosplayId}/edit`}
                      className="block truncate font-sans text-base font-bold text-closet-brown hover:text-closet-rose"
                    >
                      {character}
                    </Link>
                    <p className="truncate text-xs text-closet-brown-light">{series}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-bold text-closet-brown-light">
                      {cosplayOpen} open
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditing(emptyTodo(cosplayId))}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-closet-rose text-white shadow-sm"
                      aria-label={`Add to-do for ${character}`}
                    >
                      <IconPlus />
                    </button>
                  </div>
                </div>

                <ul className="divide-y divide-closet-pink/30">
                  {items.map((todo) => {
                    const done = isCosplayTodoDone(todo);
                    return (
                      <li key={`${cosplayId}-${todo.id}`} className="flex items-start gap-3 px-4 py-4">
                        <button
                          type="button"
                          onClick={() => void toggleDone(todo)}
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                            done
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-closet-pink bg-white active:bg-closet-blush"
                          }`}
                          aria-label={done ? "Mark incomplete" : "Mark complete"}
                        >
                          {done && (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditing({ ...todo, cosplayId })}
                          className="min-w-0 flex-1 text-left active:opacity-70"
                        >
                          <span
                            className={`block text-sm font-semibold leading-snug ${
                              done ? "text-closet-brown-light line-through" : "text-closet-brown"
                            }`}
                          >
                            {todo.label}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${TYPE_STYLES[todo.type]}`}>
                              {BUILD_TASK_TYPE_LABELS[todo.type]}
                            </span>
                            {todo.dueDate && (
                              <span className="text-[10px] font-semibold text-closet-brown-light">
                                Due {formatEventDate(todo.dueDate)}
                              </span>
                            )}
                            {typeof todo.estimatedCost === "number" && (
                              <span className="text-[10px] font-semibold text-closet-brown-light">
                                ${todo.estimatedCost}
                              </span>
                            )}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => void removeTodo(todo)}
                          className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-red-500 active:bg-red-50"
                        >
                          Del
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {/* Mobile sticky add */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-closet-pink/50 bg-white/95 p-4 backdrop-blur-sm sm:hidden">
        <AdminButton
          variant="primary"
          className="w-full !py-3.5 !text-base"
          onClick={() => {
            const cosplayId =
              cosplayFilter !== "all"
                ? cosplayFilter
                : activeCosplays.find((c) => c.status === "in-progress")?.id ?? activeCosplays[0]?.id;
            if (cosplayId) setEditing(emptyTodo(cosplayId));
          }}
          disabled={activeCosplays.length === 0}
        >
          <IconPlus />
          Add to-do
        </AdminButton>
      </div>

      {/* Desktop add */}
      <div className="hidden sm:block">
        <AdminButton
          variant="primary"
          onClick={() => {
            const cosplayId =
              cosplayFilter !== "all"
                ? cosplayFilter
                : activeCosplays[0]?.id;
            if (cosplayId) setEditing(emptyTodo(cosplayId));
          }}
          disabled={activeCosplays.length === 0}
        >
          <IconPlus />
          Add to-do
        </AdminButton>
      </div>

      {editing && (
        <AdminModal
          title={getCosplayTodos(editing.cosplayId).some((t) => t.id === editing.id) ? "Edit item" : "New item"}
          onClose={() => setEditing(null)}
          wide
          footer={
            <>
              <AdminButton variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </AdminButton>
              <AdminButton
                variant="primary"
                onClick={() => void saveEditing()}
                disabled={saving || !editing.label.trim() || !editing.cosplayId}
              >
                {saving ? "Saving…" : "Save"}
              </AdminButton>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminCosplaySearchField
              cosplays={activeCosplays}
              valueId={editing.cosplayId}
              onChange={(cosplayId) => setEditing({ ...editing, cosplayId })}
              className="sm:col-span-2"
            />
            <AdminField
              label="Item"
              value={editing.label}
              onChange={(v) => setEditing({ ...editing, label: v })}
              className="sm:col-span-2"
            />
            <AdminSelect
              label="Type"
              value={editing.type}
              onChange={(v) => setEditing({ ...editing, type: v as BuildTaskType })}
              options={TYPES.map((t) => ({ value: t, label: BUILD_TASK_TYPE_LABELS[t] }))}
            />
            <AdminSelect
              label="Status"
              value={editing.status}
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
              label="Est. cost (USD)"
              value={editing.estimatedCost != null ? String(editing.estimatedCost) : ""}
              onChange={(v) => setEditing({ ...editing, estimatedCost: v ? Number(v) : undefined })}
              type="number"
            />
            <AdminField
              label="Link"
              value={editing.link ?? ""}
              onChange={(v) => setEditing({ ...editing, link: v || undefined })}
              className="sm:col-span-2"
            />
            <AdminTextarea
              label="Notes"
              value={editing.notes ?? ""}
              onChange={(v) => setEditing({ ...editing, notes: v || undefined })}
              className="sm:col-span-2"
            />
          </div>
        </AdminModal>
      )}

      <AdminToast message={message} onDone={() => setMessage("")} />
    </div>
  );
}
