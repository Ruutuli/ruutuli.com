/** Extract folder IDs from env text: raw id, or Drive URLs with /folders/{id} or ?id=. */
export function parseGalleryDriveFolderIds(text: string): string[] {
  const lines = text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const ids: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const fromPath = line.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (fromPath) {
      const id = fromPath[1]!;
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
      continue;
    }

    const fromQuery = line.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (fromQuery) {
      const id = fromQuery[1]!;
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
      continue;
    }

    if (!seen.has(line)) {
      seen.add(line);
      ids.push(line);
    }
  }

  return ids;
}

export function driveFileViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/** Read configured Drive folder IDs from environment. */
export function getDriveFolderIdsFromEnv(): string[] {
  const combined = [
    process.env.GOOGLE_DRIVE_FOLDER_IDS,
    process.env.GOOGLE_DRIVE_COSPLAY_FOLDER_ID,
    process.env.GOOGLE_DRIVE_WIP_FOLDER_ID,
  ]
    .filter(Boolean)
    .join("\n");

  return parseGalleryDriveFolderIds(combined);
}

export function getCosplayFolderIdsFromEnv(): string[] {
  const raw = process.env.GOOGLE_DRIVE_COSPLAY_FOLDER_ID?.trim();
  return raw ? parseGalleryDriveFolderIds(raw) : [];
}

export function getWipFolderIdsFromEnv(): string[] {
  const raw = process.env.GOOGLE_DRIVE_WIP_FOLDER_ID?.trim();
  return raw ? parseGalleryDriveFolderIds(raw) : [];
}

/** Folder id for items added manually by Drive link (never removed on folder sync cleanup). */
export const GALLERY_MANUAL_LINK_FOLDER_ID = "__manual_link__";

export const GALLERY_PAGE_SIZES = [24, 48, 96] as const;
export const GALLERY_DEFAULT_PAGE_SIZE = 48;

/** Primary Google Drive root — one folder whose subfolders hold cosplay photos. */
export function getRootDriveFolderIdFromEnv(): string | null {
  const cosplay = getCosplayFolderIdsFromEnv();
  if (cosplay.length) return cosplay[0] ?? null;
  const all = getDriveFolderIdsFromEnv();
  return all[0] ?? null;
}

/** Folder roots used for gallery sync and folder filters — cosplay folder only when set. */
export function getGallerySyncFolderIdsFromEnv(): string[] {
  const cosplay = getCosplayFolderIdsFromEnv();
  if (cosplay.length) return cosplay;
  return getDriveFolderIdsFromEnv();
}
