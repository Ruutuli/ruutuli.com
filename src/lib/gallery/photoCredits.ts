import { getGoogleDriveFileId } from "@/lib/utils/googleDriveImage";
import { GalleryPhotoCredit } from "@/types/gallery";

/** Credits keyed by Drive file ID and/or full view URL. */
export type GalleryPhotoCreditMap = Record<string, GalleryPhotoCredit>;

export function lookupPhotoCredit(
  url: string,
  credits: GalleryPhotoCreditMap,
): GalleryPhotoCredit | null {
  if (!url.trim()) return null;

  const fileId = getGoogleDriveFileId(url);
  if (fileId && credits[fileId]) return credits[fileId];

  const trimmed = url.trim();
  if (credits[trimmed]) return credits[trimmed];

  if (fileId) {
    for (const [key, credit] of Object.entries(credits)) {
      if (getGoogleDriveFileId(key) === fileId) return credit;
    }
  }

  return null;
}

export function photoCreditLines(credit: GalleryPhotoCredit | null): { where?: string; who?: string } {
  if (!credit) return {};
  return {
    where: credit.convention?.trim() || undefined,
    who: credit.photographer?.trim() || undefined,
  };
}
