import fs from "fs";
import path from "path";
import type { Readable } from "stream";
import { google } from "googleapis";
import type { drive_v3 } from "googleapis";
import { logger } from "@/lib/logger";

export interface DriveImageFile {
  id: string;
  name: string;
  mimeType: string | null;
  /** Immediate parent folder in Drive. */
  folderId: string;
  folderName: string;
}

export interface DriveFolderEntry {
  id: string;
  name: string;
}

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

function getServiceAccountJsonRaw(): string {
  const filePath =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (filePath) {
    const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    return fs.readFileSync(resolved, "utf8").trim();
  }

  const inlineKey = ["GOOGLE", "SERVICE", "ACCOUNT", "JSON"].join("_");
  const inline = process.env[inlineKey]?.trim();
  if (inline) return inline;

  throw new Error(
    "Set GOOGLE_SERVICE_ACCOUNT_JSON (inline or base64), or GOOGLE_SERVICE_ACCOUNT_JSON_PATH / GOOGLE_APPLICATION_CREDENTIALS pointing at your service account .json file"
  );
}

function tryParseServiceAccountJson(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim().replace(/^\uFEFF/, "");
  const attempts: string[] = [trimmed];

  if (trimmed.startsWith('"')) {
    try {
      const once = JSON.parse(trimmed);
      if (typeof once === "string") attempts.push(once);
    } catch {
      /* ignore */
    }
  }

  let stripped = trimmed;
  if (stripped.startsWith('"') && stripped.endsWith('"') && stripped.length > 2) {
    stripped = stripped.slice(1, -1);
    attempts.push(stripped);
    if (/^\{\\"/.test(stripped)) {
      attempts.push(stripped.replace(/\\"/g, '"'));
    }
  }

  for (const candidate of attempts) {
    try {
      const o = JSON.parse(candidate) as unknown;
      if (o && typeof o === "object" && !Array.isArray(o)) {
        return o as Record<string, unknown>;
      }
    } catch {
      /* try next */
    }
  }

  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf8");
    const o = JSON.parse(decoded) as unknown;
    if (o && typeof o === "object" && !Array.isArray(o)) {
      return o as Record<string, unknown>;
    }
  } catch {
    /* ignore */
  }

  return null;
}

function getServiceAccountFromFlatEnv(): ServiceAccountCredentials | null {
  const client_email =
    process.env.GOOGLE_CLIENT_EMAIL?.trim() || process.env.client_email?.trim();
  const rawKey = process.env.GOOGLE_PRIVATE_KEY?.trim() || process.env.private_key?.trim();
  if (!client_email || !rawKey) return null;
  const private_key = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;
  return { client_email, private_key };
}

function parseServiceAccountCredentials(): ServiceAccountCredentials {
  const flat = getServiceAccountFromFlatEnv();
  if (flat) return flat;

  const raw = getServiceAccountJsonRaw();
  const parsed = tryParseServiceAccountJson(raw);
  if (!parsed) {
    throw new Error("Service account JSON must be valid JSON or base64-encoded JSON");
  }
  const client_email = parsed.client_email;
  const private_key = parsed.private_key;
  if (typeof client_email !== "string" || typeof private_key !== "string") {
    throw new Error("Service account JSON must include client_email and private_key");
  }
  return { client_email, private_key };
}

export function getServiceAccountClientEmail(): string | null {
  try {
    return parseServiceAccountCredentials().client_email;
  } catch {
    return process.env.GOOGLE_CLIENT_EMAIL?.trim() || process.env.client_email?.trim() || null;
  }
}

let galleryDriveSingleton: Promise<drive_v3.Drive> | undefined;

export async function createGalleryDriveClient(): Promise<drive_v3.Drive> {
  if (!galleryDriveSingleton) {
    galleryDriveSingleton = (async () => {
      const { client_email, private_key } = parseServiceAccountCredentials();
      const jwt = new google.auth.JWT({
        email: client_email,
        key: private_key,
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      });
      return google.drive({ version: "v3", auth: jwt });
    })();
  }
  return galleryDriveSingleton;
}

const DEFAULT_IMAGE_PROXY_MAX_BYTES = 8 * 1024 * 1024;
const ABSOLUTE_IMAGE_PROXY_MAX_BYTES = 32 * 1024 * 1024;

export function getImageProxyMaxBytes(): number {
  const raw = process.env.IMAGE_PROXY_MAX_BYTES?.trim();
  if (!raw) return DEFAULT_IMAGE_PROXY_MAX_BYTES;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 256 * 1024) return DEFAULT_IMAGE_PROXY_MAX_BYTES;
  return Math.min(n, ABSOLUTE_IMAGE_PROXY_MAX_BYTES);
}

class DriveMediaTooLargeError extends Error {
  constructor(maxBytes: number) {
    super(`Drive media exceeds maxBytes (${maxBytes})`);
    this.name = "DriveMediaTooLargeError";
  }
}

function collectReadableWithByteLimit(stream: Readable, maxBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    stream.on("data", (chunk: Buffer | string | Uint8Array) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buf.length;
      if (total > maxBytes) {
        stream.destroy();
        reject(new DriveMediaTooLargeError(maxBytes));
        return;
      }
      chunks.push(buf);
    });
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export type DriveFileMediaResult =
  | { status: "ok"; buffer: Buffer; contentTypeHeader: string | null }
  | { status: "too_large" }
  | { status: "error" };

export async function fetchPublicDriveFileWithApiKey(
  fileId: string,
  maxBytes: number
): Promise<{ buffer: Buffer } | null> {
  const apiKey = process.env.GOOGLE_API_KEY?.trim();
  if (!apiKey) return null;

  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) {
      logger.warn("GalleryDrive", "fetchPublicDriveFileWithApiKey HTTP error", {
        fileId,
        status: res.status,
      });
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length <= 100 || buffer.length > maxBytes) return null;
    return { buffer };
  } catch (err) {
    logger.warn("GalleryDrive", "fetchPublicDriveFileWithApiKey failed", {
      fileId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function fetchDriveFileMediaBuffer(
  fileId: string,
  maxBytes: number
): Promise<DriveFileMediaResult> {
  let drive: drive_v3.Drive;
  try {
    drive = await createGalleryDriveClient();
  } catch {
    return { status: "error" };
  }

  try {
    const res = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "stream" }
    );

    const stream = res.data as Readable;
    const rawCt = res.headers["content-type"];
    const contentTypeHeader =
      typeof rawCt === "string" ? rawCt : Array.isArray(rawCt) ? (rawCt[0] ?? null) : null;

    const buffer = await collectReadableWithByteLimit(stream, maxBytes);
    if (buffer.length <= 100) return { status: "error" };
    return { status: "ok", buffer, contentTypeHeader };
  } catch (err) {
    if (err instanceof DriveMediaTooLargeError) {
      return { status: "too_large" };
    }
    logger.warn("GalleryDrive", "fetchDriveFileMediaBuffer failed", {
      fileId,
      error: err instanceof Error ? err.message : String(err),
    });
    return { status: "error" };
  }
}

export async function fetchDriveFileThumbnailBuffer(
  fileId: string,
  maxBytes: number
): Promise<{ buffer: Buffer } | null> {
  let drive: drive_v3.Drive;
  try {
    drive = await createGalleryDriveClient();
  } catch {
    return null;
  }

  try {
    const meta = await drive.files.get({
      fileId,
      fields: "thumbnailLink",
      supportsAllDrives: true,
    });
    const rawLink = meta.data.thumbnailLink;
    if (!rawLink) return null;

    const thumbnailUrl = rawLink.replace(/=s\d+$/i, "=s1920");
    const res = await fetch(thumbnailUrl, { redirect: "follow" });
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length <= 100 || buffer.length > maxBytes) return null;
    return { buffer };
  } catch (err) {
    logger.warn("GalleryDrive", "fetchDriveFileThumbnailBuffer failed", {
      fileId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

const GALLERY_EXCLUDED_EXTENSIONS = new Set(["psd", "clip", "sai", "sai2"]);
const GALLERY_EXCLUDED_MIME_MARKERS = ["photoshop", "x-photoshop", "vnd.adobe.photoshop"] as const;

export function isExcludedGallerySourceFile(name: string, mimeType: string | null): boolean {
  const lowerName = name.toLowerCase();
  const dot = lowerName.lastIndexOf(".");
  if (dot >= 0) {
    const ext = lowerName.slice(dot + 1);
    if (GALLERY_EXCLUDED_EXTENSIONS.has(ext)) return true;
  }
  const mt = (mimeType ?? "").toLowerCase();
  return GALLERY_EXCLUDED_MIME_MARKERS.some((marker) => mt.includes(marker));
}

function isGallerySyncableImage(name: string, mimeType: string | null): boolean {
  const mt = mimeType ?? "";
  if (!mt.includes("image/")) return false;
  return !isExcludedGallerySourceFile(name, mimeType);
}

const GOOGLE_DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";

const driveListSharedOpts = {
  supportsAllDrives: true,
  includeItemsFromAllDrives: true,
  corpora: "allDrives" as const,
};

export async function listImageFilesInFolderTreeWithClient(
  drive: drive_v3.Drive,
  rootFolderId: string,
  rootFolderName = "[COS]",
): Promise<DriveImageFile[]> {
  const images: DriveImageFile[] = [];
  const visited = new Set<string>();
  const queue: DriveFolderEntry[] = [{ id: rootFolderId.trim(), name: rootFolderName }];

  while (queue.length > 0) {
    const folder = queue.shift()!;
    if (visited.has(folder.id)) continue;
    visited.add(folder.id);

    let pageToken: string | undefined;
    do {
      const q = `'${folder.id}' in parents and trashed = false`;
      const apiRes = await drive.files.list({
        q,
        fields: "nextPageToken, files(id, name, mimeType)",
        pageSize: 1000,
        pageToken,
        ...driveListSharedOpts,
      });

      for (const f of apiRes.data.files ?? []) {
        if (!f.id || typeof f.name !== "string") continue;
        const mt = f.mimeType ?? "";
        if (mt === GOOGLE_DRIVE_FOLDER_MIME) {
          queue.push({ id: f.id, name: f.name });
        } else if (isGallerySyncableImage(f.name, mt)) {
          images.push({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType ?? null,
            folderId: folder.id,
            folderName: folder.name,
          });
        }
      }

      pageToken = apiRes.data.nextPageToken ?? undefined;
    } while (pageToken);
  }

  return images;
}

/** List immediate subfolders and images in a folder (no recursion). */
export async function listFolderContents(folderId: string): Promise<{
  folders: DriveFolderEntry[];
  images: DriveImageFile[];
}> {
  const drive = await createGalleryDriveClient();
  const trimmedId = folderId.trim();
  let folderName = "(this folder)";
  try {
    const meta = await drive.files.get({
      fileId: trimmedId,
      fields: "name",
      supportsAllDrives: true,
    });
    if (meta.data.name) folderName = meta.data.name;
  } catch {
    /* keep fallback */
  }

  const folders: DriveFolderEntry[] = [];
  const images: DriveImageFile[] = [];

  let pageToken: string | undefined;
  do {
    const q = `'${trimmedId}' in parents and trashed = false`;
    const apiRes = await drive.files.list({
      q,
      fields: "nextPageToken, files(id, name, mimeType)",
      pageSize: 1000,
      pageToken,
      orderBy: "folder,name",
      ...driveListSharedOpts,
    });

    for (const f of apiRes.data.files ?? []) {
      if (!f.id || typeof f.name !== "string") continue;
      const mt = f.mimeType ?? "";
      if (mt === GOOGLE_DRIVE_FOLDER_MIME) {
        folders.push({ id: f.id, name: f.name });
      } else if (isGallerySyncableImage(f.name, mt)) {
        images.push({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType ?? null,
          folderId: trimmedId,
          folderName,
        });
      }
    }

    pageToken = apiRes.data.nextPageToken ?? undefined;
  } while (pageToken);

  folders.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  images.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  return { folders, images };
}

export async function listImageFilesInFolder(folderId: string): Promise<DriveImageFile[]> {
  const drive = await createGalleryDriveClient();
  let rootName = "[COS]";
  try {
    const rootMeta = await drive.files.get({
      fileId: folderId.trim(),
      fields: "name",
      supportsAllDrives: true,
    });
    if (rootMeta.data.name) rootName = rootMeta.data.name;
  } catch {
    /* use default label */
  }
  return listImageFilesInFolderTreeWithClient(drive, folderId, rootName);
}

export async function getDriveFileMetadata(
  fileId: string,
): Promise<{ id: string; name: string; mimeType: string | null } | null> {
  try {
    const drive = await createGalleryDriveClient();
    const res = await drive.files.get({
      fileId,
      fields: "id, name, mimeType",
      supportsAllDrives: true,
    });
    if (!res.data.id || !res.data.name) return null;
    return { id: res.data.id, name: res.data.name, mimeType: res.data.mimeType ?? null };
  } catch {
    return null;
  }
}
