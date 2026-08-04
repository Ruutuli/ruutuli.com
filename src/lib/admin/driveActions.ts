"use server";

import { getRootDriveFolderIdFromEnv, parseGalleryDriveFolderIds } from "@/lib/gallery/constants";
import { requireAdmin } from "@/lib/admin/auth";
import { browseDriveFolder, listDriveImages } from "@/lib/google-drive/listDriveImages";

export async function browseDriveFolderAction(folderId?: string) {
  try {
    await requireAdmin();
  } catch {
    return { ok: false as const, error: "Unauthorized", hint: "Sign in again at /admin/login" };
  }

  const rootFolderId = getRootDriveFolderIdFromEnv();
  const resolvedId = folderId
    ? parseGalleryDriveFolderIds(folderId)[0]
    : rootFolderId;

  if (!resolvedId) {
    return {
      ok: false as const,
      error: "No Drive folder configured",
      hint: "Set GOOGLE_DRIVE_COSPLAY_FOLDER_ID to your main cosplay folder URL in .env",
    };
  }

  try {
    const { folders, images } = await browseDriveFolder(resolvedId);
    return {
      ok: true as const,
      folderId: resolvedId,
      rootFolderId: rootFolderId ?? resolvedId,
      folders,
      images,
    };
  } catch (err) {
    return {
      ok: false as const,
      error: "Failed to browse Drive folder",
      hint:
        err instanceof Error
          ? err.message
          : "Share the root folder with your service account email (Viewer access).",
    };
  }
}

export async function searchDriveImagesAction(folderId: string, query: string) {
  try {
    await requireAdmin();
  } catch {
    return { ok: false as const, error: "Unauthorized", images: [] };
  }

  const resolvedId = parseGalleryDriveFolderIds(folderId)[0];
  if (!resolvedId || !query.trim()) {
    return { ok: true as const, images: [] };
  }

  try {
    const images = await listDriveImages([resolvedId], { recursive: true });
    const lower = query.trim().toLowerCase();
    return {
      ok: true as const,
      images: images.filter((img) => img.name.toLowerCase().includes(lower)),
    };
  } catch {
    return { ok: false as const, error: "Search failed", images: [] };
  }
}
