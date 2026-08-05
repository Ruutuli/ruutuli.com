"use client";

import { useMemo, useState } from "react";
import {
  CosplayTodo,
  getCosplayTodoProgress,
  getOpenCosplayTodos,
  isCosplayTodoDone,
} from "@/types/cosplay";
import {
  BUILD_TASK_STATUS_LABELS,
  BUILD_TASK_TYPE_LABELS,
  BuildTaskStatus,
  BuildTaskType,
} from "@/types/task";
import { formatEventDate } from "@/data/calendar";
import { IconPlus } from "./icons";
import {
  AdminButton,
  AdminEmptyState,
  AdminField,
  AdminModal,
  AdminSelect,
  AdminTextarea,
} from "./ui";

const TYPES: BuildTaskType[] = ["todo", "buy", "check"];
const STATUSES: BuildTaskStatus[] = ["not-started", "started", "not-purchased", "completed", "optional"];

const STATUS_STYLES: Record<BuildTaskStatus, string> = {
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "not-started": "bg-slate-100 text-slate-700 border-slate-200",
  started: "bg-amber-100 text-amber-900 border-amber-200",
  "not-purchased": "bg-rose-100 text-rose-800 border-rose-200",
  optional: "bg-violet-100 text-violet-800 border-violet-200",
};

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  ...TYPES.map((t) => ({ value: t, label: BUILD_TASK_TYPE_LABELS[t] })),
];

function emptyTodo(): CosplayTodo {
  return {
    id: `todo-${Date.now()}`,
    label: "",
    type: "todo",
    status: "not-started",
    percent: 0,
  };
}

export default function AdminCosplayTodosEditor({
  todos,
  onChange,
  autoSave = false,
}: {
  todos: CosplayTodo[];
  onChange: (todos: CosplayTodo[]) => void;
  /** When true, shows that changes save automatically */
  autoSave?: boolean;
}) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editing, setEditing] = useState<CosplayTodo | null>(null);

  const filtered = useMemo(() => {
    if (typeFilter === "all") return todos;
    return todos.filter((t) => t.type === typeFilter);
  }, [todos, typeFilter]);

  const progress = getCosplayTodoProgress(todos);
  const openCount = getOpenCosplayTodos(todos).length;

  function toggleDone(todo: CosplayTodo) {
    const done = !isCosplayTodoDone(todo);
    onChange(
      todos.map((t) =>
        t.id === todo.id
          ? { ...t, status: done ? "completed" : "not-started", percent: done ? 100 : 0 }
          : t,
      ),
    );
  }

  function saveEditing() {
    if (!editing?.label.trim()) return;
    const status: BuildTaskStatus =
      editing.status === "completed" ? "completed" : editing.status;
    const saved: CosplayTodo = {
      ...editing,
      label: editing.label.trim(),
      dueDate: editing.dueDate?.trim() || undefined,
      status,
      percent: status === "completed" ? 100 : editing.percent,
    };
    const exists = todos.some((t) => t.id === saved.id);
    onChange(exists ? todos.map((t) => (t.id === saved.id ? saved : t)) : [...todos, saved]);
    setEditing(null);
  }

  function remove(id: string) {
    if (!confirm("Delete this item?")) return;
    onChange(todos.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-sans text-lg font-bold text-closet-brown">Build to-do list</h3>
          <p className="mt-1 text-sm text-closet-brown-light">
            Track what to make, buy, or check off for this cosplay.
            {autoSave ? " Changes save automatically." : " Remember to save the build when you are done."}
          </p>
        </div>
        <AdminButton variant="primary" onClick={() => setEditing(emptyTodo())}>
          <IconPlus />
          Add item
        </AdminButton>
      </div>

      {todos.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-2 flex-1 min-w-[120px] overflow-hidden rounded-full bg-closet-blush">
            <div className="h-full rounded-full bg-closet-rose transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs font-bold text-closet-brown">
            {progress}% · {openCount} open
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {TYPE_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTypeFilter(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
              typeFilter === opt.value
                ? "bg-closet-rose text-white"
                : "bg-closet-blush/50 text-closet-brown hover:bg-closet-blush"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <AdminEmptyState
          title={todos.length === 0 ? "No to-dos yet" : "No items in this filter"}
          description="Add things to make, buy, or check before your next con."
        />
      ) : (
        <ul className="divide-y divide-closet-pink/40 rounded-xl border border-closet-pink/50 bg-white">
          {filtered.map((todo) => (
            <li key={todo.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
              <label className="flex shrink-0 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={isCosplayTodoDone(todo)}
                  onChange={() => toggleDone(todo)}
                  className="h-4 w-4 rounded border-closet-pink text-closet-rose"
                />
                <span className="sr-only">Mark complete</span>
              </label>

              <div className="min-w-0 flex-1">
                {todo.link ? (
                  <a
                    href={todo.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`font-semibold hover:text-closet-rose hover:underline ${
                      isCosplayTodoDone(todo) ? "text-closet-brown-light line-through" : "text-closet-brown"
                    }`}
                  >
                    {todo.label}
                  </a>
                ) : (
                  <p
                    className={`font-semibold ${
                      isCosplayTodoDone(todo) ? "text-closet-brown-light line-through" : "text-closet-brown"
                    }`}
                  >
                    {todo.label}
                  </p>
                )}
                {todo.notes && (
                  <p className="mt-0.5 truncate text-xs text-closet-brown-light">{todo.notes}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className="rounded-md bg-closet-blush/40 px-2 py-0.5 text-[10px] font-bold text-closet-brown ring-1 ring-closet-pink/50">
                  {BUILD_TASK_TYPE_LABELS[todo.type]}
                </span>
                {todo.dueDate && (
                  <span className="text-[10px] font-semibold text-closet-brown-light">
                    Due {formatEventDate(todo.dueDate)}
                  </span>
                )}
                {todo.estimatedCost != null && (
                  <span className="text-[10px] font-semibold text-closet-brown-light">
                    ${todo.estimatedCost.toFixed(0)}
                  </span>
                )}
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[todo.status]}`}
                >
                  {BUILD_TASK_STATUS_LABELS[todo.status]}
                </span>
                <AdminButton variant="ghost" className="text-xs text-closet-rose" onClick={() => setEditing({ ...todo })}>
                  Edit
                </AdminButton>
                <AdminButton variant="danger" className="text-xs" onClick={() => remove(todo.id)}>
                  Delete
                </AdminButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <AdminModal
          title={todos.some((t) => t.id === editing.id) ? "Edit item" : "New item"}
          onClose={() => setEditing(null)}
          wide
          footer={
            <>
              <AdminButton variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </AdminButton>
              <AdminButton variant="primary" onClick={saveEditing} disabled={!editing.label.trim()}>
                Save
              </AdminButton>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
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
    </div>
  );
}
