import "server-only";

import { Collection, Db, Document } from "mongodb";
import getMongoClient from "./client";

let indexesEnsured = false;

export const DB_NAME = process.env.MONGODB_DB_NAME || "ruutuli";

export const COLLECTIONS = {
  cosplays: "cosplays",
  wigs: "wigs",
  tasks: "tasks",
  settings: "settings",
  events: "events",
  galleryItems: "gallery_items",
  galleryExclusions: "gallery_exclusions",
  galleryVocabulary: "gallery_vocabulary",
} as const;

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(DB_NAME);
}

export async function getCollection<T extends Document>(name: string): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}

export async function ensureDbIndexes(): Promise<void> {
  if (indexesEnsured) return;
  indexesEnsured = true;

  const db = await getDb();
  await db.collection(COLLECTIONS.galleryItems).createIndexes([
    { key: { published: 1 } },
    { key: { folderId: 1 } },
    { key: { convention: 1 } },
    { key: { photographer: 1 } },
    { key: { cosplayIds: 1 } },
    { key: { gallerySection: 1, published: 1 } },
    { key: { folderName: 1, name: 1 } },
    { key: { name: 1 } },
  ]);
  await db.collection(COLLECTIONS.cosplays).createIndexes([{ key: { sortOrder: 1, character: 1 } }]);
}
