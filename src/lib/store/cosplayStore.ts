import "server-only";

import { Cosplay, syncCosplayProgressFromParts } from "@/types/cosplay";
import { COLLECTIONS, ensureDbIndexes, getCollection } from "@/lib/mongodb/db";
import { seedStoreIfNeeded } from "./seed";
import { slugifyId } from "./slug";

function fromDoc(doc: Cosplay & { _id?: string }): Cosplay {
  const { _id, ...rest } = doc;
  return rest;
}

function toDoc(cosplay: Cosplay) {
  return { _id: cosplay.id, ...cosplay };
}

const ADMIN_LIST_PROJECTION = {
  _id: 1,
  title: 1,
  character: 1,
  series: 1,
  status: 1,
  characterArt: 1,
  image: 1,
  accent: 1,
  tags: 1,
  outfit: 1,
  sortOrder: 1,
  spotlight: 1,
  featured: 1,
  parts: 1,
  progress: 1,
  convention: 1,
  completedDate: 1,
  startedDate: 1,
  deadline: 1,
} as const;

function asAdminListCosplay(doc: Cosplay & { _id?: string }): Cosplay {
  return {
    ...fromDoc(doc),
    description: "",
    gallery: [],
    sources: [],
  };
}

/** Lighter cosplay payload for admin tables and pickers — skips gallery URLs, sources, descriptions. */
export async function getCosplaysForAdminList(): Promise<Cosplay[]> {
  await seedStoreIfNeeded();
  await ensureDbIndexes();
  const collection = await getCollection<Cosplay & { _id: string }>(COLLECTIONS.cosplays);
  const docs = await collection
    .find({}, { projection: ADMIN_LIST_PROJECTION })
    .sort({ sortOrder: 1, character: 1 })
    .toArray();
  return docs.map(asAdminListCosplay);
}

export async function getCosplays(): Promise<Cosplay[]> {
  await seedStoreIfNeeded();
  const collection = await getCollection<Cosplay & { _id: string }>(COLLECTIONS.cosplays);
  const docs = await collection.find().sort({ sortOrder: 1, character: 1 }).toArray();
  return docs.map(fromDoc);
}

export async function saveCosplays(cosplays: Cosplay[]): Promise<Cosplay[]> {
  const collection = await getCollection(COLLECTIONS.cosplays);
  const ids = cosplays.map((c) => c.id);

  if (ids.length > 0) {
    await collection.deleteMany({ _id: { $nin: ids } });
    await collection.bulkWrite(
      cosplays.map((cosplay) => ({
        replaceOne: { filter: { _id: cosplay.id }, replacement: toDoc(cosplay), upsert: true },
      })),
    );
  } else {
    await collection.deleteMany({});
  }

  return cosplays;
}

export async function getCosplayById(id: string): Promise<Cosplay | undefined> {
  await seedStoreIfNeeded();
  const collection = await getCollection<Cosplay & { _id: string }>(COLLECTIONS.cosplays);
  const doc = await collection.findOne({ _id: id });
  return doc ? fromDoc(doc) : undefined;
}

export async function createCosplay(input: Omit<Cosplay, "id"> & { id?: string }): Promise<Cosplay> {
  const collection = await getCollection(COLLECTIONS.cosplays);
  let id = input.id?.trim() || slugifyId(input.series, input.character, input.outfit ?? "default");
  const existing = await collection.findOne({ _id: id });
  if (existing) {
    id = `${id}-${Date.now()}`;
  }
  const cosplay: Cosplay = { ...input, id } as Cosplay;
  const withParts = cosplay.parts?.length ? syncCosplayProgressFromParts(cosplay) : cosplay;
  await collection.insertOne(toDoc(withParts));
  return withParts;
}

export async function updateCosplay(id: string, patch: Partial<Cosplay>): Promise<Cosplay | null> {
  const collection = await getCollection<Cosplay & { _id: string }>(COLLECTIONS.cosplays);

  const hasFullDocument =
    patch.id === id &&
    typeof patch.character === "string" &&
    typeof patch.series === "string";

  let updated: Cosplay;
  if (hasFullDocument) {
    updated = { ...(patch as Cosplay), id };
  } else {
    const current = await collection.findOne({ _id: id });
    if (!current) return null;
    updated = { ...fromDoc(current), ...patch, id };
  }

  const synced = updated.parts?.length ? syncCosplayProgressFromParts(updated) : updated;
  const result = await collection.findOneAndReplace(
    { _id: id },
    toDoc(synced),
    { returnDocument: "after" },
  );
  return result ? fromDoc(result) : null;
}

export async function deleteCosplay(id: string): Promise<boolean> {
  const collection = await getCollection(COLLECTIONS.cosplays);
  const result = await collection.deleteOne({ _id: id });
  return result.deletedCount === 1;
}

export async function reorderCosplays(orderedIds: string[]): Promise<Cosplay[]> {
  const collection = await getCollection<Cosplay & { _id: string }>(COLLECTIONS.cosplays);
  if (orderedIds.length === 0) return getCosplaysForAdminList();

  await collection.bulkWrite(
    orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { sortOrder: index } },
      },
    })),
  );

  return getCosplaysForAdminList();
}

export async function nextCosplaySortOrder(): Promise<number> {
  const collection = await getCollection<Cosplay & { _id: string; sortOrder?: number }>(
    COLLECTIONS.cosplays,
  );
  const doc = await collection.find().sort({ sortOrder: -1 }).limit(1).next();
  const current = doc?.sortOrder;
  return typeof current === "number" ? current + 1 : 0;
}
