import { NextRequest, NextResponse } from "next/server";
import { getRootDriveFolderIdFromEnv, parseGalleryDriveFolderIds } from "@/lib/gallery/constants";
import { browseDriveFolder } from "@/lib/google-drive/listDriveImages";
import { requireAdmin } from "@/lib/admin/auth";
import { unauthorized } from "@/lib/admin/api";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/** Browse one level of a Drive folder (subfolders + images in that folder). */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const folderParam = request.nextUrl.searchParams.get("folderId");
  const rootFolderId = getRootDriveFolderIdFromEnv();
  const folderId = folderParam
    ? parseGalleryDriveFolderIds(folderParam)[0]
    : rootFolderId;

  if (!folderId) {
    return NextResponse.json(
      {
        error: "No Drive folder configured",
        hint: "Set GOOGLE_DRIVE_COSPLAY_FOLDER_ID to your main cosplay folder URL in .env",
      },
      { status: 400 },
    );
  }

  try {
    const { folders, images } = await browseDriveFolder(folderId);
    return NextResponse.json({
      folderId,
      rootFolderId: rootFolderId ?? folderId,
      folders,
      images,
    });
  } catch (err) {
    logger.error("AdminDriveBrowse", "Failed to browse folder", {
      folderId,
      error: err instanceof Error ? err.message : String(err),
    });

    return NextResponse.json(
      {
        error: "Failed to browse Drive folder",
        hint: "Share the root folder with your service account email (Viewer access).",
      },
      { status: 500 },
    );
  }
}
