import "server-only";

import { COLLECTIONS, ensureDbIndexes, getCollection } from "@/lib/mongodb/db";
import { getCosplayById } from "@/lib/store/cosplayStore";
import type { CosplayStatus } from "@/types/cosplay";

export type CheerCountDoc = {
  _id?: string;
  cosplayId: string;
  count: number;
};

export type CheerVoteDoc = {
  _id?: string;
  cosplayId: string;
  visitorId: string;
  day: string;
  createdAt: string;
};

const CHEERABLE_STATUSES: CosplayStatus[] = ["planned", "in-progress"];

export function isCheerableStatus(status: CosplayStatus): boolean {
  return CHEERABLE_STATUSES.includes(status);
}

/** UTC calendar day YYYY-MM-DD */
export function cheerDayUtc(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export async function getCheerCounts(ids?: string[]): Promise<Record<string, number>> {
  await ensureDbIndexes();
  const collection = await getCollection<CheerCountDoc>(COLLECTIONS.cosplayCheers);
  const filter = ids?.length ? { cosplayId: { $in: ids } } : {};
  const docs = await collection.find(filter).toArray();
  const counts: Record<string, number> = {};
  for (const doc of docs) {
    counts[doc.cosplayId] = doc.count ?? 0;
  }
  if (ids?.length) {
    for (const id of ids) {
      if (counts[id] == null) counts[id] = 0;
    }
  }
  return counts;
}

export async function getVisitorCheeredToday(
  visitorId: string,
  ids: string[],
  day = cheerDayUtc(),
): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};
  for (const id of ids) result[id] = false;
  if (!visitorId || ids.length === 0) return result;

  await ensureDbIndexes();
  const collection = await getCollection<CheerVoteDoc>(COLLECTIONS.cheerVotes);
  const docs = await collection
    .find({ visitorId, day, cosplayId: { $in: ids } })
    .project({ cosplayId: 1 })
    .toArray();
  for (const doc of docs) {
    result[doc.cosplayId] = true;
  }
  return result;
}

export type AddCheerResult =
  | { ok: true; count: number; alreadyCheeredToday: false }
  | { ok: true; count: number; alreadyCheeredToday: true }
  | { ok: false; error: "not_found" | "not_cheerable" | "invalid" };

export async function addCheer(cosplayId: string, visitorId: string): Promise<AddCheerResult> {
  const id = cosplayId?.trim();
  const vid = visitorId?.trim();
  if (!id || !vid) return { ok: false, error: "invalid" };

  const cosplay = await getCosplayById(id);
  if (!cosplay) return { ok: false, error: "not_found" };
  if (!isCheerableStatus(cosplay.status)) return { ok: false, error: "not_cheerable" };

  await ensureDbIndexes();
  const day = cheerDayUtc();
  const votes = await getCollection<CheerVoteDoc>(COLLECTIONS.cheerVotes);
  const cheers = await getCollection<CheerCountDoc>(COLLECTIONS.cosplayCheers);

  try {
    await votes.insertOne({
      cosplayId: id,
      visitorId: vid,
      day,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? (err as { code?: number }).code : undefined;
    if (code === 11000) {
      const existing = await cheers.findOne({ cosplayId: id });
      return { ok: true, count: existing?.count ?? 0, alreadyCheeredToday: true };
    }
    throw err;
  }

  await cheers.updateOne(
    { cosplayId: id },
    { $inc: { count: 1 }, $setOnInsert: { cosplayId: id } },
    { upsert: true },
  );

  const updated = await cheers.findOne({ cosplayId: id });
  return { ok: true, count: updated?.count ?? 1, alreadyCheeredToday: false };
}
