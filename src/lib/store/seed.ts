import "server-only";

import { defaultSiteSettings } from "@/data/siteDefaults";
import { wigRecords } from "@/data/wigRecords";
import { Cosplay } from "@/types/cosplay";
import { BuildTask } from "@/types/task";
import { SiteSettings } from "@/types/settings";
import { Wig } from "@/types/wig";
import { COLLECTIONS, getCollection } from "@/lib/mongodb/db";
import { COSPLAYS_FILE, SETTINGS_FILE, TASKS_FILE, WIGS_FILE } from "./paths";
import { fileExists, readJsonFile } from "./jsonFile";
import { defaultEvents } from "@/data/eventDefaults";

const SETTINGS_ID = "site";

function withMongoId<T extends { id: string }>(item: T) {
  return { _id: item.id, ...item };
}

async function seedCollection<T extends { id: string }>(
  collectionName: string,
  jsonPath: string,
  fallback: T[],
): Promise<void> {
  const collection = await getCollection<T & { _id?: string }>(collectionName);
  const count = await collection.countDocuments();
  if (count > 0) return;

  const fromJson = (await fileExists(jsonPath)) ? await readJsonFile<T[]>(jsonPath, fallback) : fallback;

  if (fromJson.length === 0) return;

  const docs = fromJson.map(withMongoId);
  await collection.insertMany(docs as unknown as Parameters<typeof collection.insertMany>[0]);
}

async function seedEvents(): Promise<void> {
  const collection = await getCollection<{ id: string; _id?: string }>(COLLECTIONS.events);
  const count = await collection.countDocuments();
  if (count > 0) return;
  await collection.insertMany(defaultEvents.map(withMongoId));
}

async function seedBuildTasks(): Promise<void> {
  await seedCollection<BuildTask>(COLLECTIONS.tasks, TASKS_FILE, []);
}

async function seedSettings(): Promise<void> {
  const collection = await getCollection<SiteSettings & { _id: string }>(COLLECTIONS.settings);
  const existing = await collection.findOne({ _id: SETTINGS_ID });
  if (existing) return;

  const fromJson = (await fileExists(SETTINGS_FILE))
    ? await readJsonFile<SiteSettings>(SETTINGS_FILE, defaultSiteSettings)
    : defaultSiteSettings;

  await collection.replaceOne(
    { _id: SETTINGS_ID },
    { _id: SETTINGS_ID, ...fromJson } as SiteSettings & { _id: string },
    { upsert: true },
  );
}

let storeSeeded = false;

export async function seedStoreIfNeeded(): Promise<void> {
  if (storeSeeded) return;
  await seedCollection<Cosplay>(COLLECTIONS.cosplays, COSPLAYS_FILE, []);
  await seedCollection<Wig>(COLLECTIONS.wigs, WIGS_FILE, wigRecords);
  await seedEvents();
  await seedBuildTasks();
  await seedSettings();
  storeSeeded = true;
}
