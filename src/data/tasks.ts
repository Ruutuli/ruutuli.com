import { BuildTask, getOpenBuildTasks, isBuildTaskDone } from "@/types/task";

export type { BuildTask };
export { getOpenBuildTasks, isBuildTaskDone, getBuildTaskProgress } from "@/types/task";

export function getOpenTaskCount(tasks: BuildTask[]): number {
  return getOpenBuildTasks(tasks).length;
}

/** Open build-planner tasks for the home dashboard — prefers the event with the most open tasks. */
export function getDashboardBuildTasks(tasks: BuildTask[], limit = 6): BuildTask[] {
  const withEvent = tasks.filter((t) => t.eventId);
  let pool = withEvent.length > 0 ? withEvent : tasks;

  if (withEvent.length > 0) {
    const eventIds = [...new Set(withEvent.map((t) => t.eventId!))];
    const bestEvent = eventIds.sort((a, b) => {
      const openA = getOpenBuildTasks(withEvent.filter((t) => t.eventId === a)).length;
      const openB = getOpenBuildTasks(withEvent.filter((t) => t.eventId === b)).length;
      return openB - openA;
    })[0];
    if (bestEvent) pool = withEvent.filter((t) => t.eventId === bestEvent);
  }

  const open = getOpenBuildTasks(pool);

  return open.sort((a, b) => {
    const statusOrder = (t: BuildTask) => {
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

export function formatTaskDue(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function filterTasksByEvent(tasks: BuildTask[], eventId: string): BuildTask[] {
  return tasks.filter((t) => t.eventId === eventId);
}

export function filterTasksByCharacter(tasks: BuildTask[], character: string): BuildTask[] {
  return tasks.filter((t) => t.character.toLowerCase() === character.toLowerCase());
}

export function filterTasksByCosplayId(tasks: BuildTask[], cosplayId: string): BuildTask[] {
  return tasks.filter((t) => t.cosplayId === cosplayId);
}

export function getTasksForCosplay(
  tasks: BuildTask[],
  cosplayId: string,
  character: string,
): BuildTask[] {
  const byId = filterTasksByCosplayId(tasks, cosplayId);
  if (byId.length > 0) return byId;
  return filterTasksByCharacter(tasks, character);
}

export function getCosplayBudget(tasks: BuildTask[]): { spent: number; total: number } {
  const buyTasks = tasks.filter((t) => t.type === "buy" && typeof t.estimatedCost === "number");
  const total = buyTasks.reduce((sum, t) => sum + (t.estimatedCost ?? 0), 0);
  const spent = buyTasks
    .filter((t) => isBuildTaskDone(t) || t.status === "started")
    .reduce((sum, t) => sum + (t.estimatedCost ?? 0), 0);
  return { spent, total };
}

export function groupTasksByCharacter(tasks: BuildTask[]): Map<string, BuildTask[]> {
  const map = new Map<string, BuildTask[]>();
  for (const task of tasks) {
    const list = map.get(task.character) ?? [];
    list.push(task);
    map.set(task.character, list);
  }
  return map;
}
