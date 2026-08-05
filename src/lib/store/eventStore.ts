import "server-only";

import { defaultEvents } from "@/data/eventDefaults";
import { ConEvent } from "@/types/event";
import { COLLECTIONS, getCollection } from "@/lib/mongodb/db";

function withMongoId(event: ConEvent) {
  return { _id: event.id, ...event };
}

function fromDoc(doc: ConEvent & { _id?: string }): ConEvent {
  const { _id, ...rest } = doc;
  return rest;
}

export async function getEvents(): Promise<ConEvent[]> {
  const collection = await getCollection<ConEvent & { _id: string }>(COLLECTIONS.events);
  const docs = await collection.find().sort({ date: 1 }).toArray();
  if (docs.length === 0) {
    await seedEvents();
    return defaultEvents;
  }
  return docs.map(fromDoc);
}

export async function getEventById(id: string): Promise<ConEvent | undefined> {
  const events = await getEvents();
  return events.find((e) => e.id === id);
}

async function seedEvents(): Promise<void> {
  const collection = await getCollection<ConEvent & { _id: string }>(COLLECTIONS.events);
  const count = await collection.countDocuments();
  if (count > 0) return;
  await collection.insertMany(defaultEvents.map(withMongoId));
}

export async function createEvent(input: Omit<ConEvent, "id"> & { id?: string }): Promise<ConEvent> {
  const collection = await getCollection<ConEvent & { _id: string }>(COLLECTIONS.events);
  let id =
    input.id?.trim() ||
    input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  if (await collection.findOne({ _id: id })) {
    id = `${id}-${Date.now()}`;
  }
  const event: ConEvent = { ...input, id };
  await collection.insertOne(withMongoId(event));
  return event;
}

export async function updateEvent(id: string, patch: Partial<ConEvent>): Promise<ConEvent | null> {
  const collection = await getCollection<ConEvent & { _id: string }>(COLLECTIONS.events);
  const current = await collection.findOne({ _id: id });
  if (!current) return null;
  const updated = { ...fromDoc(current), ...patch, id };
  await collection.replaceOne({ _id: id }, withMongoId(updated));
  return updated;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const collection = await getCollection<ConEvent & { _id: string }>(COLLECTIONS.events);
  const result = await collection.deleteOne({ _id: id });
  return result.deletedCount === 1;
}
