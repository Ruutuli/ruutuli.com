import { NextRequest, NextResponse } from "next/server";
import {
  getCosplayFolderIdsFromEnv,
  getDriveFolderIdsFromEnv,
  getRootDriveFolderIdFromEnv,
  getWipFolderIdsFromEnv,
  parseGalleryDriveFolderIds,
} from "@/lib/gallery/constants";
import { listDriveImages } from "@/lib/google-drive/listDriveImages";
import { requireAdmin } from "@/lib/admin/auth";
import { unauthorized } from "@/lib/admin/api";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function resolveFolderIds(request: NextRequest): string[] {
  const type = request.nextUrl.searchParams.get("type");
  const folderParam = request.nextUrl.searchParams.get("folderId");

  if (folderParam) {
    return parseGalleryDriveFolderIds(folderParam);
  }

  if (type === "cosplay") return getCosplayFolderIdsFromEnv();
  if (type === "wip") return getWipFolderIdsFromEnv();
  const root = getRootDriveFolderIdFromEnv();
  return root ? [root] : getDriveFolderIdsFromEnv();
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const folderIds = resolveFolderIds(request);
  const type = request.nextUrl.searchParams.get("type");

  if (folderIds.length === 0) {
    if (type === "cosplay" || type === "wip") {
      return NextResponse.json({
        count: 0,
        folderIds: [],
        images: [],
        hint:
          type === "wip"
            ? "Set GOOGLE_DRIVE_WIP_FOLDER_ID in .env"
            : "Set GOOGLE_DRIVE_COSPLAY_FOLDER_ID in .env",
      });
    }

    return NextResponse.json(
      {
        error: "No Drive folder configured",
        hint: "Set GOOGLE_DRIVE_COSPLAY_FOLDER_ID or GOOGLE_DRIVE_WIP_FOLDER_ID in .env",
      },
      { status: 400 },
    );
  }

  try {
    const recursive = request.nextUrl.searchParams.get("recursive") !== "false";
    const images = await listDriveImages(folderIds, { recursive });
    return NextResponse.json({ count: images.length, folderIds, images });
  } catch (err) {
    logger.error("AdminDriveImages", "Failed to list folder images", {
      folderIds,
      error: err instanceof Error ? err.message : String(err),
    });

    return NextResponse.json(
      {
        error: "Failed to list Drive images",
        hint: "Share the folder with your service account email (Viewer access).",
      },
      { status: 500 },
    );
  }
}
