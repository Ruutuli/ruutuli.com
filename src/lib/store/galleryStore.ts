import "server-only";

import {
  driveFileViewUrl,
  getDriveFolderIdsFromEnv,
  GALLERY_MANUAL_LINK_FOLDER_ID,
} from "@/lib/gallery/constants";
import { getDriveFileMetadata, listImageFilesInFolder } from "@/lib/google-drive/galleryDrive";
import { getGoogleDriveFileId } from "@/lib/utils/googleDriveImage";
import { COLLECTIONS, ensureDbIndexes, getCollection } from "@/lib/mongodb/db";
import { parseGalleryFilenameTags } from "@/lib/gallery/parseFilenameTags";
import { isCosplayPlaceholderImage } from "@/lib/cosplay/images";
import { getCosplayById, getCosplays, updateCosplay } from "@/lib/store/cosplayStore";
import { getEvents } from "@/lib/store/eventStore";
import { Cosplay } from "@/types/cosplay";
import { ConEvent } from "@/types/event";
import { GalleryItem, GalleryBannerPhoto, GalleryListFilters, GalleryListResult, GalleryPhotoCredit, GallerySection } from "@/types/gallery";
import { Filter } from "mongodb";

function nowIso() {
  return new Date().toISOString();
}

function fromDoc(doc: GalleryItem & { _id?: string }): GalleryItem {
  const { _id, ...rest } = doc;
  return rest;
}

function toDoc(item: GalleryItem) {
  return { _id: item.id, ...item };
}

function newGalleryItem(
  input: {
    driveFileId: string;
    name: string;
    mimeType: string | null;
    folderId: string;
    folderName?: string;
  },
  meta?: { convention?: string; photographer?: string; eventId?: string },
): GalleryItem {
  const ts = nowIso();
  const viewUrl = driveFileViewUrl(input.driveFileId);
  return {
    id: input.driveFileId,
    driveFileId: input.driveFileId,
    name: input.name,
    mimeType: input.mimeType,
    folderId: input.folderId,
    folderName: input.folderName,
    viewUrl,
    published: false,
    tags: [],
    cosplayIds: [],
    convention: meta?.convention,
    eventId: meta?.eventId,
    photographer: meta?.photographer,
    sortOrder: 0,
    createdAt: ts,
    updatedAt: ts,
  };
}

export function matchEventForConvention(convention: string | undefined, events: ConEvent[]): string | undefined {
  if (!convention?.trim()) return undefined;
  const lower = convention.toLowerCase();
  const exact = events.find((e) => e.title.toLowerCase() === lower);
  if (exact) return exact.id;
  const partial = events.find(
    (e) => lower.includes(e.title.toLowerCase()) || e.title.toLowerCase().includes(lower),
  );
  return partial?.id;
}

async function filenameMetaFor(
  name: string,
  events?: ConEvent[],
): Promise<{
  convention?: string;
  photographer?: string;
  eventId?: string;
}> {
  const eventList = events ?? (await getEvents());
  const parsed = parseGalleryFilenameTags(
    name,
    eventList.map((e) => e.title),
  );
  return {
    ...parsed,
    eventId: matchEventForConvention(parsed.convention, eventList),
  };
}

function applyFilenameMeta(
  item: GalleryItem,
  meta: { convention?: string; photographer?: string; eventId?: string },
  overwrite = false,
): GalleryItem {
  return {
    ...item,
    convention: overwrite || !item.convention ? meta.convention ?? item.convention : item.convention,
    photographer: overwrite || !item.photographer ? meta.photographer ?? item.photographer : item.photographer,
    eventId: overwrite || !item.eventId ? meta.eventId ?? item.eventId : item.eventId,
  };
}

export async function getGalleryExclusions(): Promise<Set<string>> {
  const collection = await getCollection<{ _id: string; driveFileId: string }>(COLLECTIONS.galleryExclusions);
  const docs = await collection.find().toArray();
  return new Set(docs.map((d) => d.driveFileId));
}

export async function addGalleryExclusion(driveFileId: string): Promise<void> {
  const collection = await getCollection<{ _id: string }>(COLLECTIONS.galleryExclusions);
  await collection.updateOne(
    { _id: driveFileId },
    { $set: { _id: driveFileId, driveFileId, excludedAt: nowIso() } },
    { upsert: true },
  );
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type GalleryDoc = GalleryItem & { _id: string };

function buildGalleryMongoFilter(filters: GalleryListFilters): Filter<GalleryDoc> {
  const conditions: Filter<GalleryDoc>[] = [];

  const q = filters.q?.trim();
  if (q) {
    const regex = { $regex: escapeRegex(q), $options: "i" };
    conditions.push({
      $or: [
        { name: regex },
        { driveFileId: regex },
        { tags: regex },
        { convention: regex },
        { photographer: regex },
        { folderName: regex },
      ],
    });
  }

  if (filters.cosplayId) conditions.push({ cosplayIds: filters.cosplayId });
  if (filters.convention) conditions.push({ convention: filters.convention });
  if (filters.photographer) conditions.push({ photographer: filters.photographer });
  if (filters.folderId) conditions.push({ folderId: filters.folderId });

  if (filters.imageType === "reference") conditions.push({ imageType: "reference" });
  if (filters.imageType === "featured") conditions.push({ imageType: "featured" });
  if (filters.imageType === "unset") {
    conditions.push({ $or: [{ imageType: null }, { imageType: { $exists: false } }] });
  }

  if (filters.gallerySection === "build") conditions.push({ gallerySection: "build" });
  if (filters.gallerySection === "convention") conditions.push({ gallerySection: "convention" });
  if (filters.gallerySection === "unset") {
    conditions.push({ $or: [{ gallerySection: null }, { gallerySection: { $exists: false } }] });
  }

  if (filters.hideLivePhotos) conditions.push({ published: { $ne: true } });
  if (filters.liveOnly) conditions.push({ published: true });

  switch (filters.published) {
    case "published":
      conditions.push({ published: true });
      break;
    case "unpublished":
      conditions.push({ published: false });
      break;
    case "unlinked":
      conditions.push({ published: false, cosplayIds: { $size: 0 } });
      break;
    default:
      break;
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0]!;
  return { $and: conditions };
}

function galleryMongoSort(filters: GalleryListFilters): Record<string, 1 | -1> {
  if (filters.sortBy === "name") return { name: 1 };
  return { folderName: 1, name: 1 };
}

async function getGalleryStats(): Promise<GalleryListResult["stats"]> {
  const collection = await getCollection<GalleryDoc>(COLLECTIONS.galleryItems);
  const [result] = await collection
    .aggregate<{
      total: number;
      published: number;
      unpublished: number;
      unlinked: number;
    }>([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          published: { $sum: { $cond: [{ $eq: ["$published", true] }, 1, 0] } },
          unpublished: { $sum: { $cond: [{ $ne: ["$published", true] }, 1, 0] } },
          unlinked: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$published", true] },
                    { $eq: [{ $size: { $ifNull: ["$cosplayIds", []] } }, 0] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ])
    .toArray();

  return result ?? { total: 0, published: 0, unpublished: 0, unlinked: 0 };
}

async function getGalleryFolderFacets(): Promise<{ id: string; name: string }[]> {
  const collection = await getCollection<GalleryDoc>(COLLECTIONS.galleryItems);
  const docs = await collection
    .aggregate<{ _id: string; name: string }>([
      {
        $match: {
          folderId: { $exists: true, $nin: [null, "", GALLERY_MANUAL_LINK_FOLDER_ID] },
        },
      },
      { $group: { _id: "$folderId", name: { $first: { $ifNull: ["$folderName", "$folderId"] } } } },
      { $sort: { name: 1 } },
    ])
    .toArray();

  return docs.map((doc) => ({ id: doc._id, name: doc.name }));
}

export async function listGalleryItems(filters: GalleryListFilters = {}): Promise<GalleryListResult> {
  await ensureDbIndexes();
  const collection = await getCollection<GalleryDoc>(COLLECTIONS.galleryItems);
  const mongoFilter = buildGalleryMongoFilter(filters);
  const sort = galleryMongoSort(filters);
  const limit = Math.min(Math.max(filters.limit ?? 48, 1), 96);
  const page = Math.max(filters.page ?? 1, 1);
  const start = (page - 1) * limit;

  const [docs, total, stats, vocabulary, folders] = await Promise.all([
    collection.find(mongoFilter).sort(sort).skip(start).limit(limit).toArray(),
    collection.countDocuments(mongoFilter),
    getGalleryStats(),
    getGalleryVocabulary(),
    getGalleryFolderFacets(),
  ]);

  return {
    items: docs.map(fromDoc),
    total,
    page,
    limit,
    stats,
    facets: { conventions: vocabulary.conventions, photographers: vocabulary.photographers, folders },
  };
}

export async function getGalleryItemById(id: string): Promise<GalleryItem | null> {
  const collection = await getCollection<GalleryItem & { _id: string }>(COLLECTIONS.galleryItems);
  const doc = await collection.findOne({ _id: id });
  return doc ? fromDoc(doc) : null;
}

export async function upsertGalleryItem(item: GalleryItem): Promise<GalleryItem> {
  const collection = await getCollection<GalleryItem & { _id: string }>(COLLECTIONS.galleryItems);
  await collection.replaceOne({ _id: item.id }, toDoc(item), { upsert: true });
  return item;
}

export async function updateGalleryItem(id: string, patch: Partial<GalleryItem>): Promise<GalleryItem | null> {
  const current = await getGalleryItemById(id);
  if (!current) return null;

  if (Array.isArray(patch.cosplayIds)) {
    const taggedCharacter = patch.cosplayIds.some((cosplayId) => !current.cosplayIds.includes(cosplayId));
    if (taggedCharacter) {
      patch = { ...patch, published: true };
      const defaultSection = defaultGallerySectionForCharacterTag(current.gallerySection, patch.gallerySection);
      if (defaultSection) {
        patch = { ...patch, gallerySection: defaultSection };
      }
    }
  }

  const updated = { ...current, ...patch, id, updatedAt: nowIso() };
  await upsertGalleryItem(updated);
  await rememberGalleryVocabulary({
    convention: patch.convention !== undefined ? patch.convention : undefined,
    photographer: patch.photographer !== undefined ? patch.photographer : undefined,
  });
  return updated;
}

type GalleryVocabularyType = "convention" | "photographer";

async function rememberGalleryVocabulary(entries: {
  convention?: string;
  photographer?: string;
}): Promise<void> {
  const collection = await getCollection<{ _id: string; type: GalleryVocabularyType; name: string }>(
    COLLECTIONS.galleryVocabulary,
  );
  const ts = nowIso();
  const operations: {
    updateOne: {
      filter: { _id: string };
      update: { $set: { _id: string; type: GalleryVocabularyType; name: string; updatedAt: string } };
      upsert: true;
    };
  }[] = [];

  if (entries.convention?.trim()) {
    const name = entries.convention.trim();
    operations.push({
      updateOne: {
        filter: { _id: `convention:${name.toLowerCase()}` },
        update: { $set: { _id: `convention:${name.toLowerCase()}`, type: "convention", name, updatedAt: ts } },
        upsert: true,
      },
    });
  }

  if (entries.photographer?.trim()) {
    const name = entries.photographer.trim();
    operations.push({
      updateOne: {
        filter: { _id: `photographer:${name.toLowerCase()}` },
        update: { $set: { _id: `photographer:${name.toLowerCase()}`, type: "photographer", name, updatedAt: ts } },
        upsert: true,
      },
    });
  }

  if (operations.length > 0) {
    await collection.bulkWrite(operations);
  }
}

async function getGalleryVocabulary(): Promise<{ conventions: string[]; photographers: string[] }> {
  const collection = await getCollection<{ type: GalleryVocabularyType; name: string }>(
    COLLECTIONS.galleryVocabulary,
  );
  const docs = await collection.find().toArray();
  const conventions: string[] = [];
  const photographers: string[] = [];
  for (const doc of docs) {
    if (doc.type === "convention") conventions.push(doc.name);
    else if (doc.type === "photographer") photographers.push(doc.name);
  }
  const sortNames = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" });
  return {
    conventions: [...new Set(conventions)].sort(sortNames),
    photographers: [...new Set(photographers)].sort(sortNames),
  };
}

export async function removeGalleryItem(id: string): Promise<boolean> {
  const item = await getGalleryItemById(id);
  if (!item) return false;
  const collection = await getCollection<GalleryItem & { _id: string }>(COLLECTIONS.galleryItems);
  await collection.deleteOne({ _id: id });
  await addGalleryExclusion(item.driveFileId);
  return true;
}

/** Remove many gallery photos from the catalog (files stay on Drive; sync won't re-import). */
export async function bulkRemoveGalleryItems(
  itemIds: string[],
): Promise<{ removed: number; skipped: number }> {
  if (itemIds.length === 0) return { removed: 0, skipped: 0 };

  const collection = await getCollection<GalleryItem & { _id: string }>(COLLECTIONS.galleryItems);
  const docs = await collection.find({ _id: { $in: itemIds } }).toArray();
  if (docs.length === 0) return { removed: 0, skipped: itemIds.length };

  const items = docs.map(fromDoc);
  await collection.deleteMany({ _id: { $in: items.map((item) => item.id) } });

  const exclusionCollection = await getCollection<{ _id: string; driveFileId: string }>(
    COLLECTIONS.galleryExclusions,
  );
  const ts = nowIso();
  await exclusionCollection.bulkWrite(
    items.map((item) => ({
      updateOne: {
        filter: { _id: item.driveFileId },
        update: { $set: { _id: item.driveFileId, driveFileId: item.driveFileId, excludedAt: ts } },
        upsert: true,
      },
    })),
  );

  return { removed: items.length, skipped: itemIds.length - items.length };
}

export async function syncGalleryFromDrive(options?: {
  folderIds?: string[];
}): Promise<{
  synced: number;
  skipped: number;
  folderIds: string[];
}> {
  const folderIds =
    options?.folderIds?.length
      ? options.folderIds
      : getDriveFolderIdsFromEnv();
  if (folderIds.length === 0) {
    throw new Error("No Drive folders configured. Set GOOGLE_DRIVE_COSPLAY_FOLDER_ID in .env");
  }

  const exclusions = await getGalleryExclusions();
  const collection = await getCollection<GalleryDoc>(COLLECTIONS.galleryItems);
  const existing = new Map((await collection.find().toArray()).map((d) => [d.driveFileId, fromDoc(d)]));
  const events = await getEvents();
  const eventTitles = events.map((e) => e.title);

  let synced = 0;
  let skipped = 0;
  const pendingWrites: GalleryItem[] = [];

  async function flushPendingWrites() {
    if (pendingWrites.length === 0) return;
    const batch = pendingWrites.splice(0, pendingWrites.length);
    await collection.bulkWrite(
      batch.map((item) => ({
        replaceOne: { filter: { _id: item.id }, replacement: toDoc(item), upsert: true },
      })),
    );
  }

  for (const folderId of folderIds) {
    const files = await listImageFilesInFolder(folderId);
    for (const file of files) {
      if (exclusions.has(file.id)) {
        skipped++;
        continue;
      }

      const prev = existing.get(file.id);
      const ts = nowIso();
      const parsed = parseGalleryFilenameTags(file.name, eventTitles);
      const meta = {
        ...parsed,
        eventId: matchEventForConvention(parsed.convention, events),
      };

      let item: GalleryItem = prev
        ? {
            ...applyFilenameMeta(
              {
                ...prev,
                name: file.name,
                mimeType: file.mimeType,
                folderId: file.folderId,
                folderName: file.folderName,
                viewUrl: driveFileViewUrl(file.id),
                updatedAt: ts,
              },
              meta,
              false,
            ),
          }
        : newGalleryItem(
            {
              driveFileId: file.id,
              name: file.name,
              mimeType: file.mimeType,
              folderId: file.folderId,
              folderName: file.folderName,
            },
            meta,
          );

      pendingWrites.push(item);
      if (pendingWrites.length >= 100) {
        await flushPendingWrites();
      }
      synced++;
    }
  }

  await flushPendingWrites();

  return { synced, skipped, folderIds };
}

export async function addGalleryItemsByLinks(links: string[]): Promise<{ added: number; errors: string[] }> {
  const errors: string[] = [];
  let added = 0;
  const seen = new Set<string>();

  for (const raw of links) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const fileId = getGoogleDriveFileId(trimmed) ?? (/^[a-zA-Z0-9_-]{15,50}$/.test(trimmed) ? trimmed : null);
    if (!fileId) {
      errors.push(`Could not parse Drive link: ${trimmed.slice(0, 60)}`);
      continue;
    }
    if (seen.has(fileId)) continue;
    seen.add(fileId);

    const exclusions = await getGalleryExclusions();
    if (exclusions.has(fileId)) {
      errors.push(`Skipped excluded file: ${fileId}`);
      continue;
    }

    const existing = await getGalleryItemById(fileId);
    if (existing) continue;

    const meta = await getDriveFileMetadata(fileId);
    const name = meta?.name ?? `Drive image ${fileId.slice(0, 8)}`;
    const parsed = await filenameMetaFor(name);
    const item = newGalleryItem(
      {
        driveFileId: fileId,
        name,
        mimeType: meta?.mimeType ?? null,
        folderId: GALLERY_MANUAL_LINK_FOLDER_ID,
      },
      parsed,
    );

    await upsertGalleryItem(item);
    added++;
  }

  return { added, errors };
}

function imageUrlsMatch(a: string, b: string): boolean {
  const idA = getGoogleDriveFileId(a);
  const idB = getGoogleDriveFileId(b);
  if (idA && idB) return idA === idB;
  return a.trim() === b.trim();
}

function isGalleryCosplayPhoto(item: GalleryItem): boolean {
  if (item.imageType === "reference") return false;
  if (item.imageType === "featured") return true;
  // Legacy untagged items — only include when placed in a cosplay gallery section
  return item.gallerySection === "convention" || item.gallerySection === "build";
}

function isCharacterReferencePhoto(item: GalleryItem, cosplays: Cosplay[]): boolean {
  if (item.imageType === "reference") return true;
  return cosplays.some((cosplay) => {
    const art = cosplay.characterArt;
    if (!art || isCosplayPlaceholderImage(art)) return false;
    return imageUrlsMatch(item.viewUrl, art);
  });
}

/** Published gallery photos for the media kit banner (cosplay photos only — no reference art). */
export async function getPublishedGalleryPhotosForBanner(): Promise<GalleryBannerPhoto[]> {
  await ensureDbIndexes();
  const [collection, cosplays] = await Promise.all([
    getCollection<GalleryDoc>(COLLECTIONS.galleryItems),
    getCosplays(),
  ]);
  const docs = await collection
    .find({
      published: true,
      viewUrl: { $exists: true, $gt: "" },
      imageType: { $ne: "reference" },
    })
    .sort({ sortOrder: 1, name: 1 })
    .toArray();

  return docs
    .map(fromDoc)
    .filter((item) => isGalleryCosplayPhoto(item) && !isCharacterReferencePhoto(item, cosplays))
    .map((item) => ({
      src: item.viewUrl,
      alt: item.photographer
        ? `Cosplay photo by ${item.photographer}`
        : item.name?.trim() || "Cosplay gallery photo",
    }));
}

/** First published gallery photo URL for a cosplay — used when roster image is unset. */
export async function getGalleryCoverPhotoForCosplay(cosplayId: string): Promise<string | null> {
  await ensureDbIndexes();
  const collection = await getCollection<GalleryDoc>(COLLECTIONS.galleryItems);
  const doc = await collection.findOne(
    {
      cosplayIds: cosplayId,
      published: true,
      viewUrl: { $exists: true, $gt: "" },
      $or: [{ imageType: { $exists: false } }, { imageType: null }, { imageType: "featured" }],
    },
    { sort: { sortOrder: 1, name: 1 } },
  );
  return doc ? fromDoc(doc).viewUrl : null;
}

/** Resolve photographer / convention credits for a cosplay's public gallery photos. */
export async function getGalleryPhotoCreditsForCosplay(
  cosplayId: string,
): Promise<Record<string, GalleryPhotoCredit>> {
  const collection = await getCollection<GalleryItem & { _id: string }>(COLLECTIONS.galleryItems);
  const items = (await collection.find({ cosplayIds: cosplayId, published: true }).toArray()).map(fromDoc);
  const credits: Record<string, GalleryPhotoCredit> = {};

  for (const item of items) {
    if (!item.convention && !item.photographer) continue;
    const credit: GalleryPhotoCredit = {
      convention: item.convention,
      photographer: item.photographer,
    };
    credits[item.driveFileId] = credit;
    credits[item.viewUrl] = credit;
  }

  return credits;
}

/** Mongo filter for roster gallery tabs — convention includes untagged photos from character-only bulk tag. */
function gallerySectionFilter(section: GallerySection): Filter<GalleryDoc> {
  if (section === "build") {
    return { gallerySection: "build" };
  }
  return {
    $or: [
      { gallerySection: "convention" },
      { gallerySection: null },
      { gallerySection: { $exists: false } },
    ],
  };
}

function defaultGallerySectionForCharacterTag(
  current: GallerySection | null | undefined,
  patchSection: GallerySection | null | undefined,
): GallerySection | undefined {
  if (patchSection !== undefined) return patchSection ?? undefined;
  if (current) return undefined;
  return "convention";
}

/** Published gallery photo URLs for a cosplay page section. */
export async function getGallerySectionPhotosForCosplay(
  cosplayId: string,
  section: GallerySection,
): Promise<string[]> {
  const collection = await getCollection<GalleryDoc>(COLLECTIONS.galleryItems);
  const filter: Filter<GalleryDoc> = {
    $and: [{ cosplayIds: cosplayId, published: true }, gallerySectionFilter(section)],
  };
  const items = (await collection.find(filter).toArray())
    .map(fromDoc)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  const seen = new Set<string>();
  const urls: string[] = [];
  for (const item of items) {
    if (!seen.has(item.viewUrl)) {
      seen.add(item.viewUrl);
      urls.push(item.viewUrl);
    }
  }
  return urls;
}

export type CosplayPhotoRole = "characterArt" | "image";

/** Set a gallery Drive image as a cosplay's roster character art or featured photo. */
export async function setGalleryImageAsCosplayPhoto(
  galleryItemId: string,
  cosplayId: string,
  role: CosplayPhotoRole,
): Promise<{ cosplay: Cosplay; galleryItem: GalleryItem } | null> {
  const item = await getGalleryItemById(galleryItemId);
  if (!item) return null;

  const cosplay = await getCosplayById(cosplayId);
  if (!cosplay) return null;

  const url = item.viewUrl;
  const patch: Partial<Cosplay> = { [role]: url };

  if (role === "image") {
    const gallery = cosplay.gallery ?? [];
    if (!gallery.includes(url)) {
      patch.gallery = [...gallery, url];
    }
  }

  const updatedCosplay = await updateCosplay(cosplayId, patch);
  if (!updatedCosplay) return null;

  const cosplayIds = item.cosplayIds.includes(cosplayId)
    ? item.cosplayIds
    : [...item.cosplayIds, cosplayId];

  const updatedItem = await updateGalleryItem(galleryItemId, {
    cosplayIds,
    published: true,
    imageType: role === "characterArt" ? "reference" : "featured",
  });

  if (!updatedItem) return null;
  return { cosplay: updatedCosplay, galleryItem: updatedItem };
}

/** Clear this gallery image as a cosplay's character art or featured roster photo. */
export async function clearGalleryImageAsCosplayPhoto(
  galleryItemId: string,
  cosplayId: string,
  role: CosplayPhotoRole,
): Promise<{ cosplay: Cosplay; galleryItem: GalleryItem } | null> {
  const item = await getGalleryItemById(galleryItemId);
  if (!item) return null;

  const cosplay = await getCosplayById(cosplayId);
  if (!cosplay) return null;

  const url = item.viewUrl;
  const current = role === "characterArt" ? cosplay.characterArt : cosplay.image;
  if (!imageUrlsMatch(current, url)) return null;

  const patch: Partial<Cosplay> = { [role]: "" };

  if (role === "image") {
    patch.gallery = (cosplay.gallery ?? []).filter((entry) => !imageUrlsMatch(entry, url));
  }

  const updatedCosplay = await updateCosplay(cosplayId, patch);
  if (!updatedCosplay) return null;

  const expectedType = role === "characterArt" ? "reference" : "featured";
  const galleryPatch: Partial<GalleryItem> = {};
  if (item.imageType === expectedType) {
    galleryPatch.imageType = null;
  }

  const updatedItem =
    Object.keys(galleryPatch).length > 0
      ? await updateGalleryItem(galleryItemId, galleryPatch)
      : item;

  if (!updatedItem) return null;
  return { cosplay: updatedCosplay, galleryItem: updatedItem };
}

export type BulkTagMode = "add" | "remove" | "set";

function mergeCosplayIds(existing: string[], cosplayIds: string[], mode: BulkTagMode): string[] {
  switch (mode) {
    case "add":
      return [...new Set([...existing, ...cosplayIds])];
    case "remove":
      return existing.filter((id) => !cosplayIds.includes(id));
    case "set":
      return [...cosplayIds];
  }
}

/** Link many gallery photos to one or more roster builds at once. */
export async function bulkTagGalleryItems(options: {
  itemIds: string[];
  cosplayIds?: string[];
  mode?: BulkTagMode;
  convention?: string;
  photographer?: string;
  gallerySection?: GallerySection | null;
}): Promise<{ updated: number; skipped: number }> {
  const { itemIds, mode = "add", convention, photographer, gallerySection } = options;
  const cosplayIds = options.cosplayIds ?? [];

  if (itemIds.length === 0) {
    return { updated: 0, skipped: 0 };
  }

  const hasCosplayUpdate = cosplayIds.length > 0;
  const hasSectionUpdate = gallerySection !== undefined;
  const hasConventionUpdate = convention !== undefined;
  const hasPhotographerUpdate = photographer !== undefined;

  if (!hasCosplayUpdate && !hasSectionUpdate && !hasConventionUpdate && !hasPhotographerUpdate) {
    return { updated: 0, skipped: itemIds.length };
  }

  for (const cosplayId of cosplayIds) {
    const cosplay = await getCosplayById(cosplayId);
    if (!cosplay) {
      throw new Error(`Cosplay not found: ${cosplayId}`);
    }
  }

  const normalizedConvention = convention !== undefined ? convention.trim() || undefined : undefined;
  const normalizedPhotographer = photographer !== undefined ? photographer.trim() || undefined : undefined;
  let eventId: string | undefined;
  if (convention !== undefined && normalizedConvention) {
    const events = await getEvents();
    eventId = matchEventForConvention(normalizedConvention, events);
  }

  const collection = await getCollection<GalleryItem & { _id: string }>(COLLECTIONS.galleryItems);
  const docs = await collection.find({ _id: { $in: itemIds } }).toArray();
  const ts = nowIso();
  let updated = 0;
  let skipped = 0;

  const operations = docs.map((doc) => {
    const item = fromDoc(doc);
    const nextCosplayIds = hasCosplayUpdate
      ? mergeCosplayIds(item.cosplayIds, cosplayIds, mode)
      : item.cosplayIds;
    const nextConvention = convention !== undefined ? normalizedConvention : item.convention;
    const nextPhotographer = photographer !== undefined ? normalizedPhotographer : item.photographer;
    const nextEventId =
      convention !== undefined ? (normalizedConvention ? eventId : undefined) : item.eventId;
    const nextGallerySection =
      gallerySection !== undefined ? gallerySection ?? undefined : item.gallerySection;

    const cosplayIdsChanged =
      hasCosplayUpdate &&
      (nextCosplayIds.length !== item.cosplayIds.length ||
        !nextCosplayIds.every((id, index) => id === item.cosplayIds[index]));
    const conventionChanged = convention !== undefined && (item.convention ?? "") !== (nextConvention ?? "");
    const photographerChanged =
      photographer !== undefined && (item.photographer ?? "") !== (nextPhotographer ?? "");
    const eventChanged =
      convention !== undefined && (item.eventId ?? "") !== (nextEventId ?? "");
    const sectionChanged =
      gallerySection !== undefined && (item.gallerySection ?? "") !== (nextGallerySection ?? "");

    if (!cosplayIdsChanged && !conventionChanged && !photographerChanged && !eventChanged && !sectionChanged) {
      skipped++;
      return null;
    }

    updated++;
    const $set: Partial<GalleryItem> & { updatedAt: string } = { updatedAt: ts };
    if (cosplayIdsChanged) {
      $set.cosplayIds = nextCosplayIds;
      if (
        mode !== "remove" &&
        nextCosplayIds.some((cosplayId) => !item.cosplayIds.includes(cosplayId))
      ) {
        $set.published = true;
        const defaultSection = defaultGallerySectionForCharacterTag(item.gallerySection, gallerySection);
        if (defaultSection) {
          $set.gallerySection = defaultSection;
        }
      }
    }
    if (conventionChanged || eventChanged) {
      $set.convention = nextConvention;
      $set.eventId = nextEventId;
    }
    if (photographerChanged) $set.photographer = nextPhotographer;
    if (sectionChanged) $set.gallerySection = nextGallerySection ?? null;

    return {
      updateOne: {
        filter: { _id: item.id },
        update: { $set },
      },
    };
  }).filter(Boolean);

  skipped += itemIds.length - docs.length;

  if (operations.length > 0) {
    await collection.bulkWrite(operations as NonNullable<(typeof operations)[number]>[]);
    await rememberGalleryVocabulary({
      convention: convention !== undefined ? normalizedConvention : undefined,
      photographer: photographer !== undefined ? normalizedPhotographer : undefined,
    });
  }

  return { updated, skipped };
}

/** Resolve gallery item IDs that match list filters (ignores pagination). */
export async function listGalleryItemIds(filters: GalleryListFilters = {}): Promise<string[]> {
  await ensureDbIndexes();
  const collection = await getCollection<GalleryDoc>(COLLECTIONS.galleryItems);
  const mongoFilter = buildGalleryMongoFilter(filters);
  const sort = galleryMongoSort(filters);
  const docs = await collection.find(mongoFilter, { projection: { _id: 1 } }).sort(sort).toArray();
  return docs.map((doc) => doc._id);
}

/** Re-parse convention / photographer from the Drive filename. */
export async function parseGalleryItemFilenameTags(
  id: string,
  overwrite = true,
): Promise<GalleryItem | null> {
  const item = await getGalleryItemById(id);
  if (!item) return null;
  const parsed = await filenameMetaFor(item.name);
  const updated = applyFilenameMeta(item, parsed, overwrite);
  await upsertGalleryItem({ ...updated, updatedAt: nowIso() });
  await rememberGalleryVocabulary({
    convention: updated.convention,
    photographer: updated.photographer,
  });
  return getGalleryItemById(id);
}
