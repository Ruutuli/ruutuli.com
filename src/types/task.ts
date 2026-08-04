export type BuildTaskType = "todo" | "buy" | "check";

export type BuildTaskStatus =
  | "completed"
  | "not-started"
  | "started"
  | "not-purchased"
  | "optional";

/** Cosplay build checklist item — tied to a character and convention/event. */
export interface BuildTask {
  id: string;
  label: string;
  character: string;
  cosplayId?: string;
  eventId: string;
  type: BuildTaskType;
  link?: string;
  estimatedCost?: number;
  status: BuildTaskStatus;
  percent: number;
  notes?: string;
  dueDate?: string;
}

/** @deprecated alias */
export type QuickTask = BuildTask;

export function isBuildTaskDone(task: BuildTask): boolean {
  return task.status === "completed" || task.percent >= 100;
}

export function getOpenBuildTasks(tasks: BuildTask[]): BuildTask[] {
  return tasks.filter((t) => !isBuildTaskDone(t) && t.status !== "optional");
}

export function getBuildTaskProgress(tasks: BuildTask[]): number {
  if (tasks.length === 0) return 0;
  const total = tasks.reduce((sum, t) => sum + Math.min(100, Math.max(0, t.percent)), 0);
  return Math.round(total / tasks.length);
}

export const BUILD_TASK_TYPE_LABELS: Record<BuildTaskType, string> = {
  todo: "To-Do",
  buy: "To-Buy",
  check: "Check",
};

export const BUILD_TASK_STATUS_LABELS: Record<BuildTaskStatus, string> = {
  completed: "Completed",
  "not-started": "Not started",
  started: "Started",
  "not-purchased": "Not purchased",
  optional: "Optional",
};
