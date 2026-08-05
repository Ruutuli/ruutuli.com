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

/** Stable pseudo-random pick — same cosplay keeps the same photo until a display photo is chosen. */
export function pickStableCosplayPhoto(cosplayId: string, urls: (string | null | undefined)[]): string | null {
  const valid = filterCosplayImages(urls.filter((u): u is string => !!u));
  if (valid.length === 0) return null;
  if (valid.length === 1) return valid[0]!;
  let hash = 0;
  for (let i = 0; i < cosplayId.length; i++) {
    hash = (hash * 31 + cosplayId.charCodeAt(i)) >>> 0;
  }
  return valid[hash % valid.length]!;
}

/** Display / featured roster photo — set image, else a stable gallery pick, else character art. */
export function resolveCosplayDisplayPhoto(
  cosplay: { id: string; image?: string | null; characterArt?: string | null },
  galleryFallbacks: (string | null | undefined)[] = [],
): string | null {
  if (!isCosplayPlaceholderImage(cosplay.image)) return cosplay.image!.trim();
  const fromGallery = pickStableCosplayPhoto(cosplay.id, galleryFallbacks);
  if (fromGallery) return fromGallery;
  return getCosplayDisplayImage(cosplay.characterArt);
}
