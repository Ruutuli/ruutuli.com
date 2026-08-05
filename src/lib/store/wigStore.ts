import "server-only";

import { Wig } from "@/types/wig";
import { COLLECTIONS, getCollection } from "@/lib/mongodb/db";
import { seedStoreIfNeeded } from "./seed";
import { slugifyId } from "./slug";

function fromDoc(doc: Wig & { _id?: string }): Wig {
  const { _id, ...rest } = doc;
  return rest;
}

function toDoc(wig: Wig) {
  return { _id: wig.id, ...wig };
}

export async function getWigs(): Promise<Wig[]> {
  await seedStoreIfNeeded();
  const collection = await getCollection<Wig & { _id: string }>(COLLECTIONS.wigs);
  const docs = await collection.find().sort({ character: 1, style: 1 }).toArray();
  return docs.map(fromDoc);
}

export async function saveWigs(wigs: Wig[]): Promise<Wig[]> {
  const collection = await getCollection<Wig & { _id: string }>(COLLECTIONS.wigs);
  const ids = wigs.map((w) => w.id);

  if (ids.length > 0) {
    await collection.deleteMany({ _id: { $nin: ids } });
    await collection.bulkWrite(
      wigs.map((wig) => ({
        replaceOne: { filter: { _id: wig.id }, replacement: toDoc(wig), upsert: true },
      })),
    );
  } else {
    await collection.deleteMany({});
  }

  return wigs;
}

export async function createWig(input: Omit<Wig, "id"> & { id?: string }): Promise<Wig> {
  const collection = await getCollection<Wig & { _id: string }>(COLLECTIONS.wigs);
  let id = input.id?.trim() || slugifyId(input.brand, input.style, input.character ?? "wig", input.color);
  const existing = await collection.findOne({ _id: id });
  if (existing) id = `${id}-${Date.now()}`;

  const wig: Wig = { ...input, id };
  await collection.insertOne(toDoc(wig));
  return wig;
}

export async function updateWig(id: string, patch: Partial<Wig>): Promise<Wig | null> {
  const collection = await getCollection<Wig & { _id: string }>(COLLECTIONS.wigs);
  const current = await collection.findOne({ _id: id });
  if (!current) return null;

  const updated = { ...fromDoc(current), ...patch, id };
  await collection.replaceOne({ _id: id }, toDoc(updated));
  return updated;
}

export async function deleteWig(id: string): Promise<boolean> {
  const collection = await getCollection<Wig & { _id: string }>(COLLECTIONS.wigs);
  const result = await collection.deleteOne({ _id: id });
  return result.deletedCount === 1;
}
