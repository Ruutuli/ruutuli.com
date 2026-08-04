import "server-only";

import { listImageFilesInFolder, listFolderContents } from "@/lib/google-drive/galleryDrive";
import { driveFileViewUrl } from "@/lib/gallery/constants";
import { getProxyUrl } from "@/lib/utils/googleDriveImage";

export interface DriveImageEntry {
  id: string;
  name: string;
  mimeType: string;
  folderId: string;
  viewUrl: string;
  proxyUrl: string;
}

export interface DriveFolderBrowseEntry {
  id: string;
  name: string;
}

function toImageEntry(file: { id: string; name: string; mimeType: string | null; folderId: string }): DriveImageEntry {
  const viewUrl = driveFileViewUrl(file.id);
  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType ?? "image/jpeg",
    folderId: file.folderId,
    viewUrl,
    proxyUrl: getProxyUrl(viewUrl),
  };
}

export async function browseDriveFolder(folderId: string): Promise<{
  folders: DriveFolderBrowseEntry[];
  images: DriveImageEntry[];
}> {
  const { folders, images } = await listFolderContents(folderId);
  return {
    folders,
    images: images.map((file) => toImageEntry(file)),
  };
}

export async function listDriveImages(
  folderIds: string[],
  options?: { recursive?: boolean },
): Promise<DriveImageEntry[]> {
  const images: DriveImageEntry[] = [];
  const recursive = options?.recursive !== false;

  for (const folderId of folderIds) {
    const files = recursive
      ? await listImageFilesInFolder(folderId)
      : (await listFolderContents(folderId)).images;
    for (const file of files) {
      images.push(toImageEntry(file));
    }
  }

  images.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return images;
}
