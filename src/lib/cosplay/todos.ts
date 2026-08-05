import { Cosplay, CosplayTodo } from "@/types/cosplay";
import { BuildTask } from "@/types/task";
import { getTasksForCosplay } from "@/data/tasks";

export function buildTaskToCosplayTodo(task: BuildTask): CosplayTodo {
  return {
    id: task.id,
    label: task.label,
    type: task.type,
    link: task.link,
    estimatedCost: task.estimatedCost,
    status: task.status,
    percent: task.percent,
    notes: task.notes,
    dueDate: task.dueDate,
  };
}

/** Prefer embedded cosplay todos; fall back to legacy build-planner tasks when unset. */
export function resolveCosplayTodos(cosplay: Cosplay, legacyTasks?: BuildTask[]): CosplayTodo[] {
  if (cosplay.todos != null) return cosplay.todos;
  if (!legacyTasks?.length) return [];
  return getTasksForCosplay(legacyTasks, cosplay.id, cosplay.character).map(buildTaskToCosplayTodo);
}

export type CosplayTodoWithContext = CosplayTodo & { cosplayId: string; character: string };

export function getAllCosplayTodos(
  cosplays: Cosplay[],
  legacyTasks?: BuildTask[],
): CosplayTodoWithContext[] {
  return cosplays.flatMap((cosplay) =>
    resolveCosplayTodos(cosplay, legacyTasks).map((todo) => ({
      ...todo,
      cosplayId: cosplay.id,
      character: cosplay.character,
    })),
  );
}

export function countOpenCosplayTodos(cosplays: Cosplay[], legacyTasks?: BuildTask[]): number {
  return getAllCosplayTodos(cosplays, legacyTasks).filter(
    (t) => t.status !== "optional" && t.status !== "completed" && t.percent < 100,
  ).length;
}

/** Open todos for the admin dashboard — prefers in-progress builds with the most open items. */
export function getDashboardCosplayTodos(
  cosplays: Cosplay[],
  legacyTasks?: BuildTask[],
  limit = 6,
): CosplayTodoWithContext[] {
  const active = cosplays.filter((c) => c.status !== "retired" && c.status !== "completed");
  const pool = active.length > 0 ? active : cosplays.filter((c) => c.status !== "retired");

  const withContext = getAllCosplayTodos(pool, legacyTasks);
  const open = withContext.filter((t) => t.status !== "optional" && t.status !== "completed" && t.percent < 100);

  return open.sort((a, b) => {
    const statusOrder = (t: CosplayTodoWithContext) => {
      if (t.status === "not-purchased") return 0;
      if (t.status === "not-started") return 1;
      if (t.status === "started") return 2;
      return 3;
    };
    const diff = statusOrder(a) - statusOrder(b);
    if (diff !== 0) return diff;
    return a.character.localeCompare(b.character) || a.label.localeCompare(b.label);
  }).slice(0, limit);
}

export function groupTodosByCosplay(
  todos: CosplayTodoWithContext[],
): Map<string, { character: string; series: string; items: CosplayTodoWithContext[] }> {
  const map = new Map<string, { character: string; series: string; items: CosplayTodoWithContext[] }>();
  for (const todo of todos) {
    const entry = map.get(todo.cosplayId) ?? {
      character: todo.character,
      series: "",
      items: [],
    };
    entry.items.push(todo);
    map.set(todo.cosplayId, entry);
  }
  return map;
}
