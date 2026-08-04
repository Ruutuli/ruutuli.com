import { NextRequest, NextResponse } from "next/server";
import {
  getCosplayFolderIdsFromEnv,
  getDriveFolderIdsFromEnv,
  getWipFolderIdsFromEnv,
  parseGalleryDriveFolderIds,
} from "@/lib/gallery/constants";
import { listDriveImages } from "@/lib/google-drive/listDriveImages";
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
  return getDriveFolderIdsFromEnv();
}

export async function GET(request: NextRequest) {
  const folderIds = resolveFolderIds(request);

  if (folderIds.length === 0) {
    return NextResponse.json(
      {
        error: "No Drive folder configured",
        hint: "Set GOOGLE_DRIVE_COSPLAY_FOLDER_ID, GOOGLE_DRIVE_WIP_FOLDER_ID, or pass ?folderId=",
      },
      { status: 400 }
    );
  }

  try {
    const images = await listDriveImages(folderIds);

    return NextResponse.json({
      count: images.length,
      folderIds,
      images,
    });
  } catch (err) {
    logger.error("DriveImages", "Failed to list folder images", {
      folderIds,
      error: err instanceof Error ? err.message : String(err),
    });

    return NextResponse.json(
      {
        error: "Failed to list Drive images",
        hint: "Share the folder with your service account email (Viewer access).",
      },
      { status: 500 }
    );
  }
}
