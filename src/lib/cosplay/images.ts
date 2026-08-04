/** Default path stored on older builds when no image was assigned. */
export const COSPLAY_PLACEHOLDER_PATH = "/images/box-blank.png";

export function isCosplayPlaceholderImage(url: string | null | undefined): boolean {
  if (!url?.trim()) return true;
  const trimmed = url.trim();
  if (trimmed === COSPLAY_PLACEHOLDER_PATH) return true;
  if (trimmed.includes("box-blank")) return true;
  if (trimmed.toLowerCase().includes("placeholder")) return true;
  return false;
}

/** First real image from the list, or null if none. */
export function getCosplayDisplayImage(...urls: (string | null | undefined)[]): string | null {
  for (const url of urls) {
    if (!isCosplayPlaceholderImage(url)) return url!.trim();
  }
  return null;
}

export function filterCosplayImages(urls: string[]): string[] {
  return urls.filter((u) => !isCosplayPlaceholderImage(u));
}
