import "server-only";

import { BuildTask } from "@/types/task";
import { COLLECTIONS, getCollection } from "@/lib/mongodb/db";
import { seedStoreIfNeeded } from "./seed";

function fromDoc(doc: BuildTask & { _id?: string; done?: boolean }): BuildTask {
  const { _id, done, ...rest } = doc;
  if (!rest.eventId) {
    return normalizeLegacyTask(rest, done);
  }
  return rest;
}

function normalizeLegacyTask(task: Partial<BuildTask>, done?: boolean): BuildTask {
  return {
    id: task.id!,
    label: task.label ?? "Task",
    character: task.character ?? "General",
    cosplayId: task.cosplayId,
    eventId: task.eventId ?? "magfest-2026",
    type: task.type ?? "todo",
    link: task.link,
    estimatedCost: task.estimatedCost,
    status: task.status ?? (done || task.percent === 100 ? "completed" : "not-started"),
    percent: task.percent ?? (done ? 100 : 0),
    notes: task.notes,
    dueDate: task.dueDate,
  };
}

function toDoc(task: BuildTask) {
  return { _id: task.id, ...task };
}

export async function getTasks(): Promise<BuildTask[]> {
  await seedStoreIfNeeded();
  const collection = await getCollection<BuildTask & { _id: string }>(COLLECTIONS.tasks);
  const docs = await collection.find().toArray();
  return docs.map(fromDoc);
}

export async function getTasksByEvent(eventId: string): Promise<BuildTask[]> {
  const tasks = await getTasks();
  return tasks.filter((t) => t.eventId === eventId);
}

export async function saveTasks(tasks: BuildTask[]): Promise<BuildTask[]> {
  const collection = await getCollection(COLLECTIONS.tasks);
  const ids = tasks.map((t) => t.id);

  if (ids.length > 0) {
    await collection.deleteMany({ _id: { $nin: ids } });
    await collection.bulkWrite(
      tasks.map((task) => ({
        replaceOne: { filter: { _id: task.id }, replacement: toDoc(task), upsert: true },
      })),
    );
  } else {
    await collection.deleteMany({});
  }

  return tasks;
}

export async function updateTask(id: string, patch: Partial<BuildTask>): Promise<BuildTask | null> {
  const collection = await getCollection<BuildTask & { _id: string }>(COLLECTIONS.tasks);
  const current = await collection.findOne({ _id: id });
  if (!current) return null;
  const updated = { ...fromDoc(current), ...patch, id };
  await collection.replaceOne({ _id: id }, toDoc(updated));
  return updated;
}

export async function createTask(input: Omit<BuildTask, "id"> & { id?: string }): Promise<BuildTask> {
  const collection = await getCollection(COLLECTIONS.tasks);
  const id = input.id?.trim() || `task-${Date.now()}`;
  const task: BuildTask = { ...input, id };
  await collection.insertOne(toDoc(task));
  return task;
}

export async function deleteTask(id: string): Promise<boolean> {
  const collection = await getCollection(COLLECTIONS.tasks);
  const result = await collection.deleteOne({ _id: id });
  return result.deletedCount === 1;
}

export async function deleteTasksByEventId(eventId: string): Promise<number> {
  const collection = await getCollection(COLLECTIONS.tasks);
  const result = await collection.deleteMany({ eventId });
  return result.deletedCount;
}
